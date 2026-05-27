import { getAllProducts, collections } from "../lib/products";

export default async function sitemap() {
  const base = (process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/$/, "");
  const now = new Date();

  const staticRoutes = [
    { url: `${base}/`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${base}/products`, lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    { url: `${base}/register`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];

  const collectionRoutes = collections.map((c) => ({
    url: `${base}/collections/${c.slug}`,
    lastModified: now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  let productRoutes = [];
  try {
    const products = await getAllProducts();
    productRoutes = products.map((p) => ({
      url: `${base}/products/${p.slug}`,
      lastModified: p.updatedAt ? new Date(p.updatedAt) : now,
      changeFrequency: "weekly",
      priority: 0.8,
    }));
  } catch {
    productRoutes = [];
  }

  return [...staticRoutes, ...collectionRoutes, ...productRoutes];
}
