// Product data access layer. Reads from Prisma/MySQL; falls back to the
// hardcoded `seed`/`collections` from data/products.js when DATABASE_URL is
// not configured (preview builds, very early dev).

import { products as seed, collections } from "../data/products";
import { prisma } from "./db";

function useDb() {
  return !!process.env.DATABASE_URL;
}

// Flatten a Prisma Product (with variants) into the shape the storefront
// already expects — same as Mongoose's `.lean()` output used to be.
function toPublic(p) {
  if (!p) return null;
  return {
    slug: p.slug,
    title: p.title,
    description: p.description || "",
    price: p.price,
    compareAtPrice: p.compareAtPrice,
    costPrice: p.costPrice,
    image: p.image || "",
    images: p.images || [],
    tags: p.tags || [],
    specs: p.specs || [],
    collection: p.collection || "",
    inventory: p.inventory ?? 0,
    featured: p.featured,
    warranty: p.warranty || "",
    variants: (p.variants || []).map((v) => ({
      id: v.variantId,
      name: v.name,
      sku: v.sku,
      price: v.price,
      inventory: v.inventory,
      image: v.image,
      colorHex: v.colorHex,
    })),
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  };
}

export async function getAllProducts({ limit } = {}) {
  if (!useDb()) return limit ? seed.slice(0, limit) : seed;
  try {
    const docs = await prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
      include: { variants: true },
    });
    return docs.map(toPublic);
  } catch {
    return [];
  }
}

export async function getProductBySlug(slug) {
  if (!useDb()) return seed.find((p) => p.slug === slug) || null;
  try {
    const doc = await prisma.product.findUnique({
      where: { slug },
      include: { variants: true },
    });
    return toPublic(doc);
  } catch {
    return null;
  }
}

export async function getProductsByCollection(slug) {
  if (!useDb()) return seed.filter((p) => p.collection === slug);
  try {
    const docs = await prisma.product.findMany({
      where: { collection: slug },
      orderBy: { createdAt: "desc" },
      include: { variants: true },
    });
    return docs.map(toPublic);
  } catch {
    return [];
  }
}

export async function getOnSaleProducts({ limit = 12 } = {}) {
  const isOnSale = (p) => p.compareAtPrice && p.compareAtPrice > p.price;
  if (!useDb()) return seed.filter(isOnSale).slice(0, limit);
  try {
    const docs = await prisma.product.findMany({
      where: { compareAtPrice: { not: null } },
      orderBy: { createdAt: "desc" },
      include: { variants: true },
    });
    return docs.map(toPublic).filter(isOnSale).slice(0, limit);
  } catch {
    return [];
  }
}

export async function getFeaturedProducts() {
  if (!useDb()) return seed.filter((p) => p.featured).slice(0, 8);
  try {
    const docs = await prisma.product.findMany({
      where: { featured: true },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { variants: true },
    });
    return docs.map(toPublic);
  } catch {
    return [];
  }
}

// Sales groups — pull the active groups + their products by slug.
export async function getActiveSalesGroups() {
  if (!useDb()) return [];
  try {
    const groups = await prisma.salesGroup.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
    if (groups.length === 0) return [];
    const allSlugs = [...new Set(groups.flatMap((g) => g.productSlugs || []))];
    const products = await prisma.product.findMany({
      where: { slug: { in: allSlugs } },
      include: { variants: true },
    });
    const bySlug = Object.fromEntries(products.map((p) => [p.slug, toPublic(p)]));
    return groups.map((g) => ({
      slug: g.slug,
      title: g.title,
      subtitle: g.subtitle || "",
      eyebrow: g.eyebrow || "",
      products: (g.productSlugs || []).map((s) => bySlug[s]).filter(Boolean),
    }));
  } catch {
    return [];
  }
}

// Sync lookup against the hardcoded list. Kept for backward compat with
// callers that can't await.
export function getCollection(slug) {
  return collections.find((c) => c.slug === slug) || null;
}

// Async lookup — Mongo categories take precedence, hardcoded list is fallback.
let _categoryCache = null;
let _categoryCacheAt = 0;
const CATEGORY_TTL_MS = 60 * 1000;

export async function getAllCategories() {
  if (_categoryCache && Date.now() - _categoryCacheAt < CATEGORY_TTL_MS) {
    return _categoryCache;
  }
  if (!useDb()) return collections;
  try {
    let docs = await prisma.category.findMany({
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
    });
    if (docs.length === 0) {
      // Seed from data/products.js on first read.
      const seedData = collections.map((c, i) => ({
        slug: c.slug,
        title: c.title,
        blurb: c.blurb || "",
        sortOrder: i,
      }));
      await prisma.category.createMany({ data: seedData, skipDuplicates: true });
      docs = await prisma.category.findMany({
        orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      });
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

// Related products: same collection, sorted to feature anything still in stock.
export async function getRelatedProducts(product, n = 6) {
  if (!product?.collection) return [];
  const sameCollection = (await getProductsByCollection(product.collection)).filter(
    (p) => p.slug !== product.slug
  );
  return sameCollection.slice(0, n);
}

export { collections };
