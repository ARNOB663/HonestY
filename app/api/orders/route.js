import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { dbConnect } from "../../../lib/mongodb";
import Order from "../../../models/Order";
import Product from "../../../models/Product";
import Discount from "../../../models/Discount";
import Settings from "../../../models/Settings";

function bad(error, status = 400) {
  return NextResponse.json({ error }, { status });
}

function round(n) {
  return Math.round(n * 100) / 100;
}

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return bad("Unauthorized", 401);

  let body;
  try { body = await req.json(); } catch { return bad("Invalid JSON"); }

  const cartItems = Array.isArray(body.items) ? body.items : [];
  if (cartItems.length === 0) return bad("Cart is empty");
  if (cartItems.length > 100) return bad("Too many items");

  const addr = body.shippingAddress || {};
  if (!addr.name || !addr.line1 || !addr.city || !addr.zip || !addr.country) {
    return bad("Shipping address is incomplete");
  }
  if (addr.phone && !/^[0-9+\-\s]{6,20}$/.test(String(addr.phone))) {
    return bad("Invalid phone number");
  }

  await dbConnect();

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

  const settings = (await Settings.findOne({ key: "store" }).lean()) || {};
  const flatShipping = Number(settings.flatShippingRate) || 0;
  const freeOver = Number(settings.freeShippingThreshold) || 0;

  let subtotal = 0;
  const items = [];
  for (const n of normalized) {
    const p = bySlug[n.slug];
    if (!p) return bad(`"${n.slug}" no longer exists`, 409);
    let price = p.price;
    let title = p.title;
    let variantName;
    if (n.variantId) {
      const v = (p.variants || []).find((x) => x.id === n.variantId);
      if (!v) return bad(`Variant for "${p.title}" no longer exists`, 409);
      price = v.price ?? p.price;
      title = `${p.title} — ${v.name}`;
      variantName = v.name;
    } else if (p.variants?.length > 0) {
      return bad(`Please select an option for "${p.title}"`);
    }
    const line = round(price * n.qty);
    subtotal += line;
    items.push({
      slug: p.slug,
      variantId: n.variantId || undefined,
      variantName,
      title,
      price,
      qty: n.qty,
      image: p.image,
    });
  }
  subtotal = round(subtotal);

  let discountAmount = 0;
  let discountCode;
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
    if (d.type === "percent") {
      discountAmount = round((subtotal * Math.min(Math.max(d.value, 0), 100)) / 100);
    } else {
      discountAmount = round(Math.min(Math.max(d.value, 0), subtotal));
    }
    discountCode = code;
  }

  const afterDiscount = round(Math.max(0, subtotal - discountAmount));
  const shipping = freeOver > 0 && afterDiscount >= freeOver ? 0 : flatShipping;
  const total = round(afterDiscount + shipping);

  const decremented = [];
  try {
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
        for (const back of decremented) {
          if (back.variantId) {
            await Product.updateOne({ slug: back.slug, "variants.id": back.variantId }, { $inc: { "variants.$.inventory": back.qty } });
          } else {
            await Product.updateOne({ slug: back.slug }, { $inc: { inventory: back.qty } });
          }
        }
        return bad(`"${it.title}" is out of stock`, 409);
      }
      decremented.push(it);
    }

    if (discountCode) {
      await Discount.updateOne({ code: discountCode }, { $inc: { usedCount: 1 } });
    }

    const order = await Order.create({
      userEmail: session.user.email,
      items,
      subtotal,
      shipping,
      discountCode,
      discountAmount,
      total,
      shippingAddress: {
        name: addr.name,
        phone: addr.phone,
        line1: addr.line1,
        city: addr.city,
        state: addr.state,
        zip: addr.zip,
        country: addr.country,
      },
      status: "pending",
    });

    return NextResponse.json({ ok: true, id: order._id.toString(), total });
  } catch (e) {
    for (const back of decremented) {
      if (back.variantId) {
        await Product.updateOne({ slug: back.slug, "variants.id": back.variantId }, { $inc: { "variants.$.inventory": back.qty } });
      } else {
        await Product.updateOne({ slug: back.slug }, { $inc: { inventory: back.qty } });
      }
    }
    return bad(e.message || "Order failed", 500);
  }
}
