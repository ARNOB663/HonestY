import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { rateLimit, clientIp } from "../../../lib/rateLimit";
import { checkOrigin } from "../../../lib/origin";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req) {
  if (!checkOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });

  const rl = await rateLimit({ key: `stockalert:${clientIp(req)}`, limit: 20, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const productSlug = typeof body.productSlug === "string" ? body.productSlug.trim().slice(0, 120) : "";
  const variantId = body.variantId ? String(body.variantId).slice(0, 80) : null;
  if (!EMAIL_RE.test(email)) return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  if (!productSlug) return NextResponse.json({ error: "Missing product" }, { status: 400 });

  const exists = await prisma.product.findUnique({ where: { slug: productSlug }, select: { id: true } });
  if (!exists) return NextResponse.json({ error: "Product not found" }, { status: 404 });

  // MySQL composite unique keys treat NULL as non-equal, so upsert with a
  // nullable variantId can either spuriously fail or duplicate. Do a
  // findFirst + create dance and treat duplicates as success.
  const existing = await prisma.stockAlert.findFirst({
    where: { productSlug, variantId, email },
    select: { id: true },
  });
  if (!existing) {
    await prisma.stockAlert.create({
      data: { productSlug, variantId, email, notified: false },
    });
  }
  return NextResponse.json({ ok: true });
}
