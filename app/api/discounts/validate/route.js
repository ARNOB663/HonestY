import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";
import { rateLimit, clientIp } from "../../../../lib/rateLimit";
import { checkOrigin } from "../../../../lib/origin";
import { discountAmountFor, eligibleBase } from "../../../../lib/discount";

export async function POST(req) {
  if (!checkOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });

  const rl = await rateLimit({ key: `discount:${clientIp(req)}`, limit: 20, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many attempts. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const code = String(body.code || "").trim().toUpperCase();
  const subtotal = Number(body.subtotal) || 0;
  if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });
  if (code.length > 40) return NextResponse.json({ error: "Invalid code" }, { status: 400 });

  const d = await prisma.discount.findUnique({ where: { code } });
  const now = new Date();
  if (!d || !d.active) return NextResponse.json({ error: "Invalid code" }, { status: 404 });
  if (d.expiresAt && d.expiresAt < now) return NextResponse.json({ error: "Code expired" }, { status: 410 });
  if (d.usageLimit && d.usedCount >= d.usageLimit) return NextResponse.json({ error: "Code fully redeemed" }, { status: 410 });
  if (subtotal < (d.minSubtotal || 0)) return NextResponse.json({ error: `Minimum subtotal ৳${d.minSubtotal}` }, { status: 400 });

  let base = subtotal;
  if (d.appliesTo === "collection" && d.collectionSlug) {
    const items = Array.isArray(body.items) ? body.items : [];
    const slugs = [...new Set(items.map((i) => String(i.slug || "")).filter(Boolean))].slice(0, 100);
    const products = slugs.length
      ? await prisma.product.findMany({
          where: { slug: { in: slugs } },
          select: { slug: true, price: true, collection: true },
        })
      : [];
    const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]));
    const lines = items.map((i) => {
      const p = bySlug[i.slug];
      return { price: p?.price || Number(i.price) || 0, qty: Number(i.qty) || 0, collection: p?.collection };
    });
    base = eligibleBase(d, subtotal, lines);
    if (base <= 0) {
      return NextResponse.json({ error: `Code applies only to ${d.collectionSlug} items` }, { status: 400 });
    }
  }

  const discountAmount = discountAmountFor(d, base);
  return NextResponse.json({
    code: d.code,
    type: d.type,
    value: d.value,
    discountAmount,
    appliesTo: d.appliesTo,
    collectionSlug: d.collectionSlug,
  });
}
