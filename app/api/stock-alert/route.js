import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/mongodb";
import { rateLimit, clientIp } from "../../../lib/rateLimit";
import { checkOrigin } from "../../../lib/origin";
import StockAlert from "../../../models/StockAlert";
import Product from "../../../models/Product";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req) {
  if (!checkOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });

  const rl = rateLimit({ key: `stockalert:${clientIp(req)}`, limit: 20, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true }); // honeypot
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const productSlug = typeof body.productSlug === "string" ? body.productSlug.trim().slice(0, 120) : "";
  const variantId = body.variantId ? String(body.variantId).slice(0, 80) : null;
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  if (!productSlug) return NextResponse.json({ error: "Missing product" }, { status: 400 });

  await dbConnect();
  // Only accept alerts for products that actually exist.
  const exists = await Product.exists({ slug: productSlug });
  if (!exists) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  await StockAlert.updateOne(
    { productSlug, variantId, email },
    { $setOnInsert: { productSlug, variantId, email, notified: false } },
    { upsert: true }
  );
  return NextResponse.json({ ok: true });
}
