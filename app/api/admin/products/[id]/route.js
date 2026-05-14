import { NextResponse } from "next/server";
import { withAdmin, httpError } from "../../../../../lib/withAdmin";
import { dbConnect } from "../../../../../lib/mongodb";
import Product from "../../../../../models/Product";

function nonNegNumber(v, fallback) {
  if (v === "" || v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function sanitizeVariants(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  return raw
    .filter((v) => v && typeof v.name === "string" && v.name.trim())
    .map((v) => {
      const id = String(v.id || v.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60) || `v-${Math.random().toString(36).slice(2, 8)}`;
      if (seen.has(id)) return null;
      seen.add(id);
      const price = v.price === "" || v.price == null ? undefined : Math.max(0, Number(v.price)) || 0;
      const inventory = Math.max(0, Math.floor(Number(v.inventory) || 0));
      return { id, name: String(v.name).trim().slice(0, 80), sku: v.sku ? String(v.sku).trim().slice(0, 80) : undefined, price, inventory };
    })
    .filter(Boolean);
}

export const GET = withAdmin(async ({ params }) => {
  await dbConnect();
  const product = await Product.findById(params.id).lean();
  if (!product) throw httpError("Not found", 404);
  return NextResponse.json({ product: { ...product, _id: String(product._id) } });
});

export const PUT = withAdmin(async ({ body, params }) => {
  const price = nonNegNumber(body.price);
  if (price === null) throw httpError("price must be ≥ 0");
  const inventory = nonNegNumber(body.inventory);
  if (inventory === null) throw httpError("inventory must be ≥ 0");
  const compareAt = nonNegNumber(body.compareAtPrice);
  if (compareAt === null) throw httpError("compareAtPrice must be ≥ 0");

  await dbConnect();
  const update = {
    slug: String(body.slug || "").trim().toLowerCase(),
    title: String(body.title || "").trim(),
    description: body.description,
    price,
    compareAtPrice: compareAt ?? null,
    image: body.image,
    images: Array.isArray(body.images) ? body.images : [],
    collection: body.collection,
    tags: Array.isArray(body.tags) ? body.tags : [],
    inventory,
    featured: !!body.featured,
    variants: sanitizeVariants(body.variants),
  };
  const product = await Product.findByIdAndUpdate(params.id, update, { new: true, runValidators: true });
  if (!product) throw httpError("Not found", 404);
  return { ok: true };
});

export const DELETE = withAdmin(async ({ params }) => {
  await dbConnect();
  await Product.findByIdAndDelete(params.id);
  return { ok: true };
});
