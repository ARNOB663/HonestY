import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const slugs = Array.isArray(body.slugs) ? body.slugs.filter((s) => typeof s === "string").slice(0, 100) : [];
  if (slugs.length === 0) return NextResponse.json({ products: [] });

  const docs = await prisma.product.findMany({
    where: { slug: { in: slugs } },
    select: {
      slug: true, title: true, price: true, image: true, inventory: true,
      variants: { select: { variantId: true, name: true, price: true, inventory: true, image: true } },
    },
  });
  return NextResponse.json({
    products: docs.map((p) => ({
      slug: p.slug,
      title: p.title,
      price: p.price,
      image: p.image,
      inventory: p.inventory,
      variants: (p.variants || []).map((v) => ({ id: v.variantId, name: v.name, price: v.price, inventory: v.inventory, image: v.image })),
    })),
  });
}
