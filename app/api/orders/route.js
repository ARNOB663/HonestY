import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/db";
import { rateLimit, clientIp } from "../../../lib/rateLimit";
import { checkOrigin } from "../../../lib/origin";
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

// Public-facing 6-char order code, stable across migrations from Mongo.
function newOrderCode() {
  return crypto.randomBytes(3).toString("hex").toUpperCase();
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

  const sessionEmail = session?.user?.email?.toLowerCase();
  const formEmail = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const userEmail = formEmail || sessionEmail || "";
  if (userEmail) {
    if (!EMAIL_RE.test(userEmail) || userEmail.length > 254) {
      return bad("Enter a valid email address");
    }
  }

  const settingsDoc = (await prisma.settings.findUnique({ where: { storeKey: "store" } })) || {};
  const pay = body.payment || {};
  const method = ["bkash", "nagad", "cod"].includes(pay.method) ? pay.method : null;
  if (!method) return bad("Select a payment method");
  if (method === "bkash" && settingsDoc.enableBkash === false) return bad("bKash is currently disabled");
  if (method === "nagad" && settingsDoc.enableNagad === false) return bad("Nagad is currently disabled");
  if (method === "cod" && settingsDoc.enableCod === false) return bad("Cash on Delivery is currently disabled");
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
    const dupe = await prisma.order.findFirst({
      where: { paymentMethod: method, paymentTxnId: txnId },
      select: { id: true },
    });
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
  const products = await prisma.product.findMany({
    where: { slug: { in: slugs } },
    include: { variants: true },
  });
  const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]));

  let subtotal = 0;
  const items = [];
  const lines = [];
  for (const n of normalized) {
    const p = bySlug[n.slug];
    if (!p) return bad(`"${n.slug}" no longer exists`, 409);
    let price = p.price;
    let title = p.title;
    let variantName;
    let image = p.image;
    if (n.variantId) {
      const v = (p.variants || []).find((x) => x.variantId === n.variantId);
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
      costPrice: Number(p.costPrice) || 0,
      qty: n.qty,
      image,
    });
  }
  subtotal = round(subtotal);

  // Validate discount BEFORE the transaction (cheaper to fail fast).
  let discountAmount = 0;
  let discountCode;
  if (body.discountCode) {
    const code = String(body.discountCode).trim().toUpperCase();
    const d = await prisma.discount.findUnique({ where: { code } });
    const now = new Date();
    const valid =
      d &&
      d.active &&
      (!d.expiresAt || d.expiresAt > now) &&
      (!d.usageLimit || d.usedCount < d.usageLimit) &&
      subtotal >= (d.minSubtotal || 0);
    if (!valid) return bad("Invalid or expired discount code");
    const base = eligibleBase(d, subtotal, lines);
    if (base <= 0) return bad(`This code applies only to ${d.collectionSlug} items`);
    discountAmount = discountAmountFor(d, base);
    discountCode = code;
  }

  const afterDiscount = round(Math.max(0, subtotal - discountAmount));
  const shipping = computeShippingByZone(afterDiscount, settingsDoc, addr.state);
  const total = round(afterDiscount + shipping);

  const code = newOrderCode();

  // Place the order in a single MySQL transaction. Stock is atomically
  // decremented (with check) and items + order rows are created together;
  // any failure rolls back everything automatically.
  const E_OUT_OF_STOCK = "OUT_OF_STOCK";
  const E_DISCOUNT_GONE = "DISCOUNT_GONE";

  let order;
  try {
    order = await prisma.$transaction(async (tx) => {
      // Decrement stock per item with check.
      for (const it of items) {
        if (it.variantId) {
          // Update variant inventory; abort if not enough stock.
          const result = await tx.productVariant.updateMany({
            where: { variantId: it.variantId, inventory: { gte: it.qty } },
            data: { inventory: { decrement: it.qty } },
          });
          if (result.count === 0) {
            const err = new Error(`${E_OUT_OF_STOCK}:${it.title || it.slug}`);
            err.expected = E_OUT_OF_STOCK;
            throw err;
          }
        } else {
          const result = await tx.product.updateMany({
            where: { slug: it.slug, inventory: { gte: it.qty } },
            data: { inventory: { decrement: it.qty } },
          });
          if (result.count === 0) {
            const err = new Error(`${E_OUT_OF_STOCK}:${it.title || it.slug}`);
            err.expected = E_OUT_OF_STOCK;
            throw err;
          }
        }
      }
      // Atomically claim discount slot.
      if (discountCode) {
        const claim = await tx.discount.updateMany({
          where: {
            code: discountCode,
            active: true,
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          },
          data: { usedCount: { increment: 1 } },
        });
        if (claim.count === 0) {
          const err = new Error(E_DISCOUNT_GONE);
          err.expected = E_DISCOUNT_GONE;
          throw err;
        }
      }
      // Create the order + items in one go.
      return tx.order.create({
        data: {
          code,
          userEmail,
          subtotal,
          shipping,
          discountCode: discountCode || null,
          discountAmount,
          total,
          status: "pending",
          paymentMethod: method,
          paymentPayer: payerNumber || null,
          paymentTxnId: txnId || null,
          paymentVerified: false,
          shipName: addr.name,
          shipPhone: String(addr.phone).trim(),
          shipLine1: addr.line1,
          shipCity: addr.city,
          shipState: addr.state,
          shipCountry: addr.country,
          items: {
            create: items.map((i) => ({
              slug: i.slug,
              variantId: i.variantId || null,
              variantName: i.variantName,
              title: i.title,
              price: i.price,
              costPrice: i.costPrice || 0,
              qty: i.qty,
              image: i.image,
            })),
          },
        },
        include: { items: true },
      });
    });
  } catch (e) {
    if (e.expected === E_OUT_OF_STOCK) {
      const what = e.message.replace(`${E_OUT_OF_STOCK}:`, "");
      return bad(`"${what}" is out of stock`, 409);
    }
    if (e.expected === E_DISCOUNT_GONE) {
      return bad("Discount code is no longer available", 409);
    }
    // Unique constraint on (paymentMethod, paymentTxnId) — duplicate TrxID.
    if (e?.code === "P2002") {
      return bad("This Transaction ID has already been used for another order. Please double-check your TrxID.", 409);
    }
    return bad(e.message || "Order failed", 500);
  }

  sendOrderConfirmation(order).catch(() => {});
  try { revalidateTag("admin-dashboard"); revalidateTag("admin-orders"); revalidateTag("admin-customers"); } catch {}

  return NextResponse.json({ ok: true, id: order.code, total });
}
