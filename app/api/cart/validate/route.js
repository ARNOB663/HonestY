import { NextResponse } from "next/server";
import { dbConnect } from "../../../../lib/mongodb";
import Product from "../../../../models/Product";

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }
  const slugs = Array.isArray(body.slugs) ? body.slugs.filter((s) => typeof s === "string").slice(0, 100) : [];
  if (slugs.length === 0) return NextResponse.json({ products: [] });

  await dbConnect();
  const docs = await Product.find({ slug: { $in: slugs } }).select("slug title price image inventory variants").lean();
  return NextResponse.json({
    products: docs.map((p) => ({
      slug: p.slug,
      title: p.title,
      price: p.price,
      image: p.image,
      inventory: p.inventory,
      variants: (p.variants || []).map((v) => ({ id: v.id, name: v.name, price: v.price, inventory: v.inventory, image: v.image })),
    })),
  });
}
