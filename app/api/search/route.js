import { NextResponse } from "next/server";
import { prisma } from "../../../lib/db";
import { rateLimit, clientIp } from "../../../lib/rateLimit";

export async function GET(req) {
  const rl = await rateLimit({ key: `search:${clientIp(req)}`, limit: 60, windowMs: 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { results: [], error: "Too many search requests" },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const url = new URL(req.url);
  const q = (url.searchParams.get("q") || "").trim();
  const limit = Math.min(10, Math.max(1, Number(url.searchParams.get("limit")) || 8));
  if (!q || q.length < 2 || q.length > 80) return NextResponse.json({ results: [] });

  // MySQL fulltext via Prisma's `search` would require Postgres or a TS schema
  // marker; for portability we fall back to `contains` (case-insensitive).
  const results = await prisma.product.findMany({
    where: {
      OR: [
        { title: { contains: q } },
        { collection: { contains: q } },
      ],
    },
    take: limit,
    select: {
      slug: true, title: true, price: true, image: true, collection: true, inventory: true,
      variants: { select: { inventory: true } },
    },
  });
  return NextResponse.json({
    results: results.map((p) => {
      const variantStock = (p.variants || []).reduce((s, v) => s + (v.inventory || 0), 0);
      const stock = p.variants?.length ? variantStock : (p.inventory ?? 0);
      return {
        slug: p.slug,
        title: p.title,
        price: p.price,
        image: p.image,
        collection: p.collection,
        inStock: stock > 0,
      };
    }),
  });
}
