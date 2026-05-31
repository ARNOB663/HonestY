import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "../../../lib/auth";
import { dbConnect } from "../../../lib/mongodb";
import { rateLimit, clientIp } from "../../../lib/rateLimit";
import { checkOrigin } from "../../../lib/origin";
import Order from "../../../models/Order";
import Product from "../../../models/Product";
import Discount from "../../../models/Discount";
import Settings from "../../../models/Settings";
import { sendOrderConfirmation } from "../../../lib/mailer";
import { computeShippingByZone } from "../../../lib/settings";
import { discountAmountFor, eligibleBase } from "../../../lib/discount";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function bad(error, status = 400) {
  return NextResponse.json({ error }, { status });
}

function round(n) {
  return Math.round(n * 100) / 100;
}

async function rollback(decremented) {
  for (const back of decremented) {
    if (back.variantId) {
      await Product.updateOne(
        { slug: back.slug, "variants.id": back.variantId },
        { $inc: { "variants.$.inventory": back.qty } }
      );
    } else {
      await Product.updateOne({ slug: back.slug }, { $inc: { inventory: back.qty } });
    }
  }
}

// Decrement inventory with a single conditional write per item. Pass a mongo
// session to participate in a transaction; without one each write is its own
// best-effort op and the caller is responsible for rollback.
async function reserveStock(items, opts = {}) {
  const { session } = opts;
  const decremented = [];
  for (const it of items) {
    let ok;
    if (it.variantId) {
      ok = await Product.findOneAndUpdate(
        { slug: it.slug, "variants.id": it.variantId, "variants.inventory": { $gte: it.qty } },
        { $inc: { "variants.$.inventory": -it.qty } },
        { new: true, session }
      ).lean();
    } else {
      ok = await Product.findOneAndUpdate(
        { slug: it.slug, inventory: { $gte: it.qty } },
        { $inc: { inventory: -it.qty } },
        { new: true, session }
      ).lean();
    }
    if (!ok) return { failed: it, decremented };
    decremented.push(it);
  }
  return { decremented };
}

// Mongo error codes that mean transactions aren't available on this cluster
// (standalone mongod, very old server, etc). We surface these to the fallback
// non-transactional path so local devs without a replica set still work.
const NO_TXN_CODES = new Set([20, 251, 263]);
function isNoTxnError(e) {
  return NO_TXN_CODES.has(e?.code) || /Transaction numbers are only allowed|replica set/i.test(String(e?.message || ""));
}

export async function POST(req) {
  if (!checkOrigin(req)) return bad("Bad origin", 403);

  const ip = clientIp(req);
  const rl = await rateLimit({ key: `orders:${ip}`, limit: 10, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many order attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const session = await getServerSession(authOptions);

  let body;
  try { body = await req.json(); } catch { return bad("Invalid JSON"); }

  const cartItems = Array.isArray(body.items) ? body.items : [];
  if (cartItems.length === 0) return bad("Cart is empty");
  if (cartItems.length > 100) return bad("Too many items");

  const addr = body.shippingAddress || {};
  if (!addr.name || !addr.line1 || !addr.city || !addr.country) {
    return bad("Shipping address is incomplete");
  }
  if (!addr.phone || !/^01[3-9]\d{8}$/.test(String(addr.phone).trim())) {
    return bad("Enter a valid 11-digit Bangladeshi mobile number (e.g. 01XXXXXXXXX)");
  }

  // Email is OPTIONAL for guests (they can still place a COD order without one,
  // but will get no email confirmation and can't use /track without it).
  // For logged-in users we default to their session email but let them override
  // for this order (e.g. work address). If a form email is provided in any case,
  // it must be a valid format and within length.
  const sessionEmail = session?.user?.email?.toLowerCase();
  const formEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const userEmail = formEmail || sessionEmail || "";
  if (userEmail) {
    if (!EMAIL_RE.test(userEmail) || userEmail.length > 254) {
      return bad("Enter a valid email address");
    }
  }
  // No email at all? Only allowed for COD guest orders — prepaid (bKash/Nagad)
  // still needs an email so we can confirm the payment by reply.
  // (We do that check after we know `method` below.)

  await dbConnect();

  const settingsDoc = (await Settings.findOne({ key: "store" }).lean()) || {};
  const pay = body.payment || {};
  const method = ["bkash", "nagad", "cod"].includes(pay.method) ? pay.method : null;
  if (!method) return bad("Select a payment method");
  // Reject methods the admin has disabled.
  if (method === "bkash" && settingsDoc.enableBkash === false) return bad("bKash is currently disabled");
  if (method === "nagad" && settingsDoc.enableNagad === false) return bad("Nagad is currently disabled");
  if (method === "cod" && settingsDoc.enableCod === false) return bad("Cash on Delivery is currently disabled");
  // For prepaid orders we need an email so the admin can confirm the payment.
  if (method !== "cod" && !userEmail) {
    return bad("Email is required for bKash / Nagad orders");
  }
  let payerNumber, txnId;
  if (method !== "cod") {
    payerNumber = String(pay.payerNumber || "").trim();
    txnId = String(pay.txnId || "").trim();
    if (!/^01[3-9]\d{8}$/.test(payerNumber)) return bad("Enter the 11-digit number you sent from");
    if (txnId.length < 6 || txnId.length > 40) return bad("Enter the transaction ID");
    txnId = txnId.toUpperCase();
  }

  if (method !== "cod") {
    const dupe = await Order.findOne({ "payment.method": method, "payment.txnId": txnId })
      .select("_id")
      .lean();
    if (dupe) {
      return bad("This Transaction ID has already been used for another order. Please double-check your TrxID.", 409);
    }
  }

  const normalized = [];
  const seen = new Set();
  for (const it of cartItems) {
    const slug = typeof it.slug === "string" ? it.slug.trim() : "";
    const variantId = it.variantId ? String(it.variantId) : null;
    const qty = Math.floor(Number(it.qty));
    if (!slug || !Number.isFinite(qty) || qty < 1 || qty > 99) return bad("Invalid cart item");
    const key = variantId ? `${slug}#${variantId}` : slug;
    if (seen.has(key)) return bad("Duplicate cart item");
    seen.add(key);
    normalized.push({ slug, variantId, qty });
  }

  const slugs = [...new Set(normalized.map((n) => n.slug))];
  const products = await Product.find({ slug: { $in: slugs } }).lean();
  const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]));

  const settings = settingsDoc;

  let subtotal = 0;
  const items = [];
  const lines = []; // { price, qty, collection } for discount scoping
  for (const n of normalized) {
    const p = bySlug[n.slug];
    if (!p) return bad(`"${n.slug}" no longer exists`, 409);
    let price = p.price;
    let title = p.title;
    let variantName;
    let image = p.image;
    if (n.variantId) {
      const v = (p.variants || []).find((x) => x.id === n.variantId);
      if (!v) return bad(`Variant for "${p.title}" no longer exists`, 409);
      price = v.price ?? p.price;
      title = `${p.title} — ${v.name}`;
      variantName = v.name;
      image = v.image || p.image;
    } else if (p.variants?.length > 0) {
      return bad(`Please select an option for "${p.title}"`);
    }
    const line = round(price * n.qty);
    subtotal += line;
    lines.push({ price, qty: n.qty, collection: p.collection });
    items.push({
      slug: p.slug,
      variantId: n.variantId || undefined,
      variantName,
      title,
      price,
      qty: n.qty,
      image,
    });
  }
  subtotal = round(subtotal);

  // Validate discount BEFORE reserving stock (so price calculation is right).
  // We do the cap check non-atomically here for the user-facing error; the
  // atomic claim below is what actually prevents over-redemption under load.
  let discountAmount = 0;
  let discountCode;
  let discountDoc;
  if (body.discountCode) {
    const code = String(body.discountCode).trim().toUpperCase();
    const d = await Discount.findOne({ code }).lean();
    const now = new Date();
    const valid =
      d &&
      d.active &&
      (!d.expiresAt || new Date(d.expiresAt) > now) &&
      (!d.usageLimit || d.usedCount < d.usageLimit) &&
      subtotal >= (d.minSubtotal || 0);
    if (!valid) return bad("Invalid or expired discount code");
    const base = eligibleBase(d, subtotal, lines);
    if (base <= 0) return bad(`This code applies only to ${d.collectionSlug} items`);
    discountAmount = discountAmountFor(d, base);
    discountCode = code;
    discountDoc = d;
  }

  const afterDiscount = round(Math.max(0, subtotal - discountAmount));
  const shipping = computeShippingByZone(afterDiscount, settings, addr.state);
  const total = round(afterDiscount + shipping);

  const orderDoc = {
    userEmail,
    items,
    subtotal,
    shipping,
    discountCode,
    discountAmount,
    total,
    shippingAddress: {
      name: addr.name,
      phone: String(addr.phone).trim(),
      line1: addr.line1,
      city: addr.city,
      state: addr.state,
      country: addr.country,
    },
    payment: {
      method,
      payerNumber: payerNumber || undefined,
      txnId: txnId || undefined,
      verified: false,
    },
    status: "pending",
  };

  // Strongly-typed expected failures from inside the transaction. Anything
  // else is treated as an unexpected error → 500.
  const E_OUT_OF_STOCK = "OUT_OF_STOCK";
  const E_DISCOUNT_GONE = "DISCOUNT_GONE";

  async function placeOrderTxn() {
    const mongoSession = await mongoose.startSession();
    try {
      let created;
      await mongoSession.withTransaction(async () => {
        const { failed } = await reserveStock(items, { session: mongoSession });
        if (failed) {
          const err = new Error(`${E_OUT_OF_STOCK}:${failed.title || failed.slug}`);
          err.expected = E_OUT_OF_STOCK;
          throw err;
        }
        if (discountCode) {
          const claim = await Discount.findOneAndUpdate(
            {
              code: discountCode,
              active: true,
              $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
              $expr: {
                $or: [
                  { $eq: [{ $ifNull: ["$usageLimit", 0] }, 0] },
                  { $lt: [{ $ifNull: ["$usedCount", 0] }, "$usageLimit"] },
                ],
              },
            },
            { $inc: { usedCount: 1 } },
            { new: true, session: mongoSession }
          ).lean();
          if (!claim) {
            const err = new Error(E_DISCOUNT_GONE);
            err.expected = E_DISCOUNT_GONE;
            throw err;
          }
        }
        const docs = await Order.create([orderDoc], { session: mongoSession });
        created = docs[0];
      });
      return { order: created };
    } finally {
      await mongoSession.endSession().catch(() => {});
    }
  }

  // Pre-transaction fallback path (used when the cluster doesn't support
  // multi-document transactions, e.g. local standalone mongod). Same semantics,
  // best-effort rollback on failure.
  async function placeOrderFallback() {
    const { failed, decremented } = await reserveStock(items);
    if (failed) {
      await rollback(decremented);
      return { expected: E_OUT_OF_STOCK, message: failed.title || failed.slug };
    }
    let claimedDiscount = false;
    if (discountCode) {
      const claim = await Discount.findOneAndUpdate(
        {
          code: discountCode,
          active: true,
          $or: [{ expiresAt: { $exists: false } }, { expiresAt: { $gt: new Date() } }],
          $expr: {
            $or: [
              { $eq: [{ $ifNull: ["$usageLimit", 0] }, 0] },
              { $lt: [{ $ifNull: ["$usedCount", 0] }, "$usageLimit"] },
            ],
          },
        },
        { $inc: { usedCount: 1 } },
        { new: true }
      ).lean();
      if (!claim) {
        await rollback(decremented);
        return { expected: E_DISCOUNT_GONE };
      }
      claimedDiscount = true;
    }
    try {
      const order = await Order.create(orderDoc);
      return { order };
    } catch (e) {
      await rollback(decremented);
      if (claimedDiscount) {
        await Discount.updateOne({ code: discountCode }, { $inc: { usedCount: -1 } }).catch(() => {});
      }
      throw e;
    }
  }

  let result;
  try {
    result = await placeOrderTxn();
  } catch (e) {
    if (e.expected === E_OUT_OF_STOCK) {
      const what = e.message.replace(`${E_OUT_OF_STOCK}:`, "");
      return bad(`"${what}" is out of stock`, 409);
    }
    if (e.expected === E_DISCOUNT_GONE) {
      return bad("Discount code is no longer available", 409);
    }
    if (e?.code === 11000 && e?.keyPattern && "payment.txnId" in e.keyPattern) {
      return bad("This Transaction ID has already been used for another order. Please double-check your TrxID.", 409);
    }
    if (isNoTxnError(e)) {
      // Cluster doesn't support transactions — fall back to best-effort path.
      try {
        result = await placeOrderFallback();
      } catch (fe) {
        if (fe?.code === 11000 && fe?.keyPattern && "payment.txnId" in fe.keyPattern) {
          return bad("This Transaction ID has already been used for another order. Please double-check your TrxID.", 409);
        }
        return bad(fe.message || "Order failed", 500);
      }
    } else {
      return bad(e.message || "Order failed", 500);
    }
  }

  if (result?.expected === E_OUT_OF_STOCK) {
    return bad(`"${result.message}" is out of stock`, 409);
  }
  if (result?.expected === E_DISCOUNT_GONE) {
    return bad("Discount code is no longer available", 409);
  }

  const order = result.order;
  sendOrderConfirmation(order).catch(() => {});
  try { revalidateTag("admin-dashboard"); revalidateTag("admin-orders"); revalidateTag("admin-customers"); } catch {}

  return NextResponse.json({ ok: true, id: order._id.toString(), total });
}
