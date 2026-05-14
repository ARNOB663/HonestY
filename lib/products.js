// Reads products from MongoDB if MONGODB_URI is set, otherwise falls back to
// local seed data so the storefront works out of the box (and `next build`
// succeeds without DB access).
import { products as seed, collections } from "../data/products";

const useDb = () => !!process.env.MONGODB_URI;

async function load() {
  try {
    const { dbConnect } = await import("./mongodb");
    const { default: Product } = await import("../models/Product");
    return { dbConnect, Product };
  } catch (e) {
    return null;
  }
}

function strip(doc) {
  const { _id, __v, createdAt, updatedAt, ...rest } = doc;
  return rest;
}

export async function getAllProducts() {
  if (!useDb()) return seed;
  const mod = await load();
  if (!mod) return seed;
  try {
    await mod.dbConnect();
    const docs = await mod.Product.find({}).lean();
    return docs.length ? docs.map(strip) : seed;
  } catch (e) {
    console.warn("[products] getAllProducts fell back to seed:", e.message);
    return seed;
  }
}

export async function getProductBySlug(slug) {
  if (!useDb()) return seed.find((p) => p.slug === slug) || null;
  const mod = await load();
  if (!mod) return seed.find((p) => p.slug === slug) || null;
  try {
    await mod.dbConnect();
    const doc = await mod.Product.findOne({ slug }).lean();
    return doc ? strip(doc) : (seed.find((p) => p.slug === slug) || null);
  } catch {
    return seed.find((p) => p.slug === slug) || null;
  }
}

export async function getProductsByCollection(slug) {
  if (!useDb()) return seed.filter((p) => p.collection === slug);
  const mod = await load();
  if (!mod) return seed.filter((p) => p.collection === slug);
  try {
    await mod.dbConnect();
    const docs = await mod.Product.find({ collection: slug }).lean();
    return docs.length ? docs.map(strip) : seed.filter((p) => p.collection === slug);
  } catch {
    return seed.filter((p) => p.collection === slug);
  }
}

export async function getFeaturedProducts() {
  if (!useDb()) return seed.filter((p) => p.featured).slice(0, 8);
  const mod = await load();
  if (!mod) return seed.filter((p) => p.featured).slice(0, 8);
  try {
    await mod.dbConnect();
    const docs = await mod.Product.find({ featured: true }).limit(8).lean();
    return docs.length ? docs.map(strip) : seed.filter((p) => p.featured).slice(0, 8);
  } catch {
    return seed.filter((p) => p.featured).slice(0, 8);
  }
}

export function getCollection(slug) {
  return collections.find((c) => c.slug === slug) || null;
}

export { collections };
