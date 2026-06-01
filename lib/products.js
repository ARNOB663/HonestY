// Reads products from MongoDB if MONGODB_URI is set, otherwise falls back to
// local seed data so the storefront works out of the box (and `next build`
// succeeds without DB access).
//
// Important: when MONGODB_URI IS set, we trust the DB result even when it's
// empty. Otherwise admins who delete all products would still see seed
// products on the storefront ("ghost products").
import { products as seed, collections } from "../data/products";
import { dbConnect } from "./mongodb";
import Product from "../models/Product";
import SalesGroup from "../models/SalesGroup";

const useDb = () => !!process.env.MONGODB_URI;

function strip(doc) {
  const { _id, __v, createdAt, updatedAt, ...rest } = doc;
  return rest;
}

export async function getAllProducts({ limit } = {}) {
  if (!useDb()) return limit ? seed.slice(0, limit) : seed;
  try {
    await dbConnect();
    let q = Product.find({}).sort({ updatedAt: -1 });
    if (limit) q = q.limit(limit);
    const docs = await q.lean();
    return docs.map(strip);
  } catch (e) {
    console.warn("[products] getAllProducts failed:", e.message);
    return [];
  }
}

export async function getProductBySlug(slug) {
  if (!useDb()) return seed.find((p) => p.slug === slug) || null;
  try {
    await dbConnect();
    const doc = await Product.findOne({ slug }).lean();
    return doc ? strip(doc) : null;
  } catch {
    return null;
  }
}

export async function getProductsByCollection(slug) {
  if (!useDb()) return seed.filter((p) => p.collection === slug);
  try {
    await dbConnect();
    const docs = await Product.find({ collection: slug }).lean();
    return docs.map(strip);
  } catch {
    return [];
  }
}

export async function getOnSaleProducts({ limit = 8 } = {}) {
  const isOnSale = (p) => p.compareAtPrice && p.compareAtPrice > p.price;
  if (!useDb()) return seed.filter(isOnSale).slice(0, limit);
  try {
    await dbConnect();
    const docs = await Product.find({
      $expr: { $and: [
        { $gt: ["$compareAtPrice", 0] },
        { $gt: ["$compareAtPrice", "$price"] },
      ] },
    })
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();
    return docs.map(strip);
  } catch {
    return [];
  }
}

export async function getFeaturedProducts() {
  if (!useDb()) return seed.filter((p) => p.featured).slice(0, 8);
  try {
    await dbConnect();
    const docs = await Product.find({ featured: true }).limit(8).lean();
    return docs.map(strip);
  } catch {
    return [];
  }
}

// Related products: prefer same-collection items, fall back to featured to
// fill the row. Excludes the current product.
export async function getRelatedProducts(product, limit = 6) {
  if (!product) return [];
  const exclude = product.slug;
  let sameCollection = [];
  if (product.collection) {
    sameCollection = (await getProductsByCollection(product.collection)).filter((p) => p.slug !== exclude);
  }
  if (sameCollection.length >= limit) return sameCollection.slice(0, limit);
  // Top up with featured products not already included.
  const featured = (await getFeaturedProducts()).filter(
    (p) => p.slug !== exclude && !sameCollection.some((s) => s.slug === p.slug)
  );
  return [...sameCollection, ...featured].slice(0, limit);
}

// Active sales groups (in admin sort order) with their products populated.
// Each returned group has its productSlugs resolved into product objects so
// the homepage can render them with ProductCard directly.
export async function getActiveSalesGroups() {
  if (!useDb()) return [];
  try {
    await dbConnect();
    const groups = await SalesGroup.find({ active: true }).sort({ sortOrder: 1, createdAt: -1 }).lean();
    if (groups.length === 0) return [];

    // Single query for every product referenced by any group, then map back.
    const allSlugs = [...new Set(groups.flatMap((g) => g.productSlugs || []))];
    if (allSlugs.length === 0) return groups.map((g) => ({ ...g, products: [] }));
    const products = await Product.find({ slug: { $in: allSlugs } }).lean();
    const bySlug = Object.fromEntries(products.map((p) => [p.slug, strip(p)]));
    return groups.map((g) => ({
      title: g.title,
      subtitle: g.subtitle || "",
      eyebrow: g.eyebrow || "Limited Time",
      slug: g.slug,
      products: (g.productSlugs || []).map((s) => bySlug[s]).filter(Boolean),
    }));
  } catch {
    return [];
  }
}

// Synchronous lookup against the hardcoded list. Kept for backward compat with
// callers that can't await (e.g. getCollection in metadata generators where
// async is fine but not preferred).
export function getCollection(slug) {
  return collections.find((c) => c.slug === slug) || null;
}

// Async lookup that consults both Mongo categories and the hardcoded fallback.
// Mongo wins if a slug exists in both. Used by /collections/[slug] so admins
// can override the hardcoded titles and blurbs.
let _categoryCache = null;
let _categoryCacheAt = 0;
const CATEGORY_TTL_MS = 60 * 1000;

export async function getAllCategories() {
  // Per-request cache so multiple lookups in one render share one DB read.
  if (_categoryCache && Date.now() - _categoryCacheAt < CATEGORY_TTL_MS) {
    return _categoryCache;
  }
  try {
    const { default: Category } = await import("../models/Category");
    await dbConnect();
    let docs = await Category.find({}).sort({ sortOrder: 1, title: 1 }).lean();
    if (docs.length === 0) {
      // Seed from data/products.js on first read.
      const seed = collections.map((c, i) => ({ ...c, sortOrder: i }));
      try { await Category.insertMany(seed, { ordered: false }); } catch {}
      docs = await Category.find({}).sort({ sortOrder: 1, title: 1 }).lean();
    }
    const merged = [
      ...docs.map((d) => ({ slug: d.slug, title: d.title, blurb: d.blurb || "", image: d.image || "" })),
      ...collections.filter((c) => !docs.find((d) => d.slug === c.slug)),
    ];
    _categoryCache = merged;
    _categoryCacheAt = Date.now();
    return merged;
  } catch {
    return collections;
  }
}

export function invalidateCategoryCache() {
  _categoryCache = null;
  _categoryCacheAt = 0;
}

export async function getCollectionAsync(slug) {
  const all = await getAllCategories();
  return all.find((c) => c.slug === slug) || null;
}

export { collections };
