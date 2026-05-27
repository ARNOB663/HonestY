import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { withAdmin, httpError } from "../../../../../lib/withAdmin";
import { dbConnect } from "../../../../../lib/mongodb";
import Product from "../../../../../models/Product";
import { nonNegNumber, sanitizeVariants } from "../../../../../lib/productSanitize";
import StockAlert from "../../../../../models/StockAlert";
import { sendBackInStock } from "../../../../../lib/mailer";
import { getBaseUrl } from "../../../../../lib/baseUrl";

function bustStorefrontCaches(slug) {
  try {
    revalidatePath("/");
    revalidatePath("/products");
    if (slug) revalidatePath(`/products/${slug}`);
  } catch {}
}

// Total purchasable stock = master inventory + sum of variant inventory.
function totalStock(p) {
  if (!p) return 0;
  if (Array.isArray(p.variants) && p.variants.length) {
    return p.variants.reduce((s, v) => s + (Number(v.inventory) || 0), 0);
  }
  return Number(p.inventory) || 0;
}

// When a product goes from 0 → in stock, email everyone who asked, then clear
// their alerts. Fire-and-forget so it never blocks the admin save.
async function notifyRestock(product) {
  try {
    const alerts = await StockAlert.find({ productSlug: product.slug, notified: false }).lean();
    if (alerts.length === 0) return;
    const url = `${getBaseUrl()}/products/${product.slug}`;
    for (const a of alerts) {
      sendBackInStock({ to: a.email, productTitle: product.title, productUrl: url }).catch(() => {});
    }
    await StockAlert.deleteMany({ productSlug: product.slug });
  } catch {}
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
  const before = await Product.findById(params.id).lean();
  const product = await Product.findByIdAndUpdate(params.id, update, { new: true, runValidators: true });
  if (!product) throw httpError("Not found", 404);
  bustStorefrontCaches(product.slug);
  if (before?.slug && before.slug !== product.slug) bustStorefrontCaches(before.slug);
  // Restock notification: was out of stock, now has stock.
  if (totalStock(before) <= 0 && totalStock(product) > 0) {
    notifyRestock(product);
  }
  return { ok: true };
});

export const DELETE = withAdmin(async ({ params }) => {
  await dbConnect();
  const doc = await Product.findByIdAndDelete(params.id).select("slug").lean();
  if (doc?.slug) bustStorefrontCaches(doc.slug);
  else bustStorefrontCaches();
  return { ok: true };
});
