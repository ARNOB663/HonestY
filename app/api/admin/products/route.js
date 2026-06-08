import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { withAdmin, httpError } from "../../../../lib/withAdmin";
import { prisma } from "../../../../lib/db";
import { nonNegNumber, sanitizeVariants, sanitizeSpecs } from "../../../../lib/productSanitize";
import { sanitizePageBody } from "../../../../lib/sanitize";

function bustStorefrontCaches(slug) {
  try {
    revalidatePath("/");
    revalidatePath("/products");
    if (slug) revalidatePath(`/products/${slug}`);
    revalidateTag("admin-dashboard");
    revalidateTag("admin-products");
  } catch {}
}

export const GET = withAdmin(async () => {
  const products = await prisma.product.findMany({
    orderBy: { updatedAt: "desc" },
    include: { variants: true },
  });
  return NextResponse.json({ products });
});

const MAX_DESC_LEN = 50000;

export const POST = withAdmin(async ({ body }) => {
  if (!body.slug || !body.title) throw httpError("slug and title required");
  const price = nonNegNumber(body.price);
  if (price === null) throw httpError("price must be ≥ 0");
  const inventory = nonNegNumber(body.inventory, 100);
  if (inventory === null) throw httpError("inventory must be ≥ 0");
  const compareAt = nonNegNumber(body.compareAtPrice);
  if (compareAt === null) throw httpError("compareAtPrice must be ≥ 0");
  const costPrice = nonNegNumber(body.costPrice, 0);
  if (costPrice === null) throw httpError("costPrice must be ≥ 0");
  const rawDesc = typeof body.description === "string" ? body.description.slice(0, MAX_DESC_LEN) : "";

  const variantsData = sanitizeVariants(body.variants);

  const product = await prisma.product.create({
    data: {
      slug: String(body.slug).trim().toLowerCase(),
      title: String(body.title).trim(),
      description: sanitizePageBody(rawDesc),
      price,
      compareAtPrice: compareAt,
      costPrice: costPrice ?? 0,
      image: body.image,
      images: Array.isArray(body.images) ? body.images : [],
      collection: body.collection,
      tags: Array.isArray(body.tags) ? body.tags : [],
      inventory,
      featured: !!body.featured,
      specs: sanitizeSpecs(body.specs),
      warranty: typeof body.warranty === "string" ? body.warranty.slice(0, 5000) : "",
      variants: {
        create: (variantsData || []).map((v) => ({
          variantId: v.id,
          name: v.name,
          sku: v.sku,
          price: v.price,
          inventory: v.inventory,
          image: v.image,
          colorHex: v.colorHex,
        })),
      },
    },
  });
  bustStorefrontCaches(product.slug);
  return { ok: true, id: String(product.id) };
});
