import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { withAdmin, httpError } from "../../../../lib/withAdmin";
import { dbConnect } from "../../../../lib/mongodb";
import Product from "../../../../models/Product";
import { nonNegNumber, sanitizeVariants, sanitizeSpecs } from "../../../../lib/productSanitize";
import { sanitizePageBody } from "../../../../lib/sanitize";

// Invalidate storefront caches whenever the catalog changes. Without this,
// homepage / collections / product pages stay stale for up to `revalidate`
// seconds (homepage = 1 hour).
function bustStorefrontCaches(slug) {
  try {
    revalidatePath("/");
    revalidatePath("/products");
    if (slug) revalidatePath(`/products/${slug}`);
    revalidateTag("admin-dashboard");
  } catch {}
}

export const GET = withAdmin(async () => {
  await dbConnect();
  const products = await Product.find({}).sort({ updatedAt: -1 }).lean();
  return NextResponse.json({ products });
});

export const POST = withAdmin(async ({ body }) => {
  if (!body.slug || !body.title) throw httpError("slug and title required");
  const price = nonNegNumber(body.price);
  if (price === null) throw httpError("price must be ≥ 0");
  const inventory = nonNegNumber(body.inventory, 100);
  if (inventory === null) throw httpError("inventory must be ≥ 0");
  const compareAt = nonNegNumber(body.compareAtPrice);
  if (compareAt === null) throw httpError("compareAtPrice must be ≥ 0");

  await dbConnect();
  const product = await Product.create({
    slug: String(body.slug).trim().toLowerCase(),
    title: String(body.title).trim(),
    description: sanitizePageBody(body.description),
    price,
    compareAtPrice: compareAt,
    image: body.image,
    images: Array.isArray(body.images) ? body.images : [],
    collection: body.collection,
    tags: Array.isArray(body.tags) ? body.tags : [],
    inventory,
    featured: !!body.featured,
    variants: sanitizeVariants(body.variants),
    specs: sanitizeSpecs(body.specs),
    warranty: typeof body.warranty === "string" ? body.warranty.slice(0, 5000) : "",
  });
  bustStorefrontCaches(product.slug);
  return { ok: true, id: String(product._id) };
});
