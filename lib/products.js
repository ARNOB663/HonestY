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

export function getCollection(slug) {
  return collections.find((c) => c.slug === slug) || null;
}

export { collections };
