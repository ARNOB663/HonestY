import { NextResponse } from "next/server";
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

// Decrement inventory with a single conditional write per item.
// Returns the slug+qty of every successful decrement so a failure can roll back.
async function reserveStock(items) {
  const decremented = [];
  for (const it of items) {
    let ok;
    if (it.variantId) {
      ok = await Product.findOneAndUpdate(
        { slug: it.slug, "variants.id": it.variantId, "variants.inventory": { $gte: it.qty } },
        { $inc: { "variants.$.inventory": -it.qty } },
        { new: true }
      ).lean();
    } else {
      ok = await Product.findOneAndUpdate(
        { slug: it.slug, inventory: { $gte: it.qty } },
        { $inc: { inventory: -it.qty } },
        { new: true }
      ).lean();
    }
    if (!ok) {
      return { failed: it, decremented };
    }
    decremented.push(it);
  }
  return { decremented };
}

export async function POST(req) {
  if (!checkOrigin(req)) return bad("Bad origin", 403);

  const ip = clientIp(req);
  const rl = rateLimit({ key: `orders:${ip}`, limit: 10, windowMs: 10 * 60 * 1000 });
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
  if (!addr.name || !addr.line1 || !addr.city || !addr.zip || !addr.country) {
    return bad("Shipping address is incomplete");
  }
  if (!addr.phone || !/^01[3-9]\d{8}$/.test(String(addr.phone).trim())) {
    return bad("Enter a valid 11-digit Bangladeshi mobile number (e.g. 01XXXXXXXXX)");
  }

  // Guest checkout: when not signed in we require an email on the body so the
  // customer can later find the order via /track.
  const sessionEmail = session?.user?.email?.toLowerCase();
  const guestEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const userEmail = sessionEmail || guestEmail;
  if (!userEmail || !EMAIL_RE.test(userEmail) || userEmail.length > 254) {
    return bad("Enter a valid email address to receive order updates");
  }

  await dbConnect();

  const settingsDoc = (await Settings.findOne({ key: "store" }).lean()) || {};
  const pay = body.payment || {};
  const method = ["bkash", "nagad", "cod"].includes(pay.method) ? pay.method : null;
  if (!method) return bad("Select a payment method");
  // Reject methods the admin has disabled.
  if (method === "bkash" && settingsDoc.enableBkash === false) return bad("bKash is currently disabled");
  if (method === "nagad" && settingsDoc.enableNagad === false) return bad("Nagad is currently disabled");
  if (method === "cod" && settingsDoc.enableCod === false) return bad("Cash on Delivery is currently disabled");
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

  // Reserve stock with per-item check-and-decrement. If any line fails,
  // roll back what we already took and surface a clear out-of-stock error.
  const { failed, decremented } = await reserveStock(items);
  if (failed) {
    await rollback(decremented);
    return bad(`"${failed.title || failed.slug}" is out of stock`, 409);
  }

  // Atomically claim a discount slot. If the cap was hit between our earlier
  // read and now, this returns null and we abort.
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
      return bad("Discount code is no longer available", 409);
    }
    claimedDiscount = true;
  }

  try {
    const order = await Order.create({
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
        zip: addr.zip,
        country: addr.country,
      },
      payment: {
        method,
        payerNumber: payerNumber || undefined,
        txnId: txnId || undefined,
        verified: false,
      },
      status: "pending",
    });

    sendOrderConfirmation(order).catch(() => {});

    return NextResponse.json({ ok: true, id: order._id.toString(), total });
  } catch (e) {
    await rollback(decremented);
    if (claimedDiscount) {
      await Discount.updateOne({ code: discountCode }, { $inc: { usedCount: -1 } });
    }
    if (e?.code === 11000 && e?.keyPattern && "payment.txnId" in e.keyPattern) {
      return bad("This Transaction ID has already been used for another order. Please double-check your TrxID.", 409);
    }
    return bad(e.message || "Order failed", 500);
  }
}
