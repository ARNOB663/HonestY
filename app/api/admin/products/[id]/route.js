import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { withAdmin, httpError } from "../../../../../lib/withAdmin";
import { prisma } from "../../../../../lib/db";
import { nonNegNumber, sanitizeVariants, sanitizeSpecs } from "../../../../../lib/productSanitize";
import { sanitizePageBody } from "../../../../../lib/sanitize";
import { sendBackInStock } from "../../../../../lib/mailer";
import { getBaseUrl } from "../../../../../lib/baseUrl";

function bustStorefrontCaches(slug) {
  try {
    revalidatePath("/");
    revalidatePath("/products");
    if (slug) revalidatePath(`/products/${slug}`);
    revalidateTag("admin-dashboard");
    revalidateTag("admin-products");
  } catch {}
}

function totalStock(p) {
  if (!p) return 0;
  if (Array.isArray(p.variants) && p.variants.length) {
    return p.variants.reduce((s, v) => s + (Number(v.inventory) || 0), 0);
  }
  return Number(p.inventory) || 0;
}

async function notifyRestock(product) {
  try {
    const alerts = await prisma.stockAlert.findMany({
      where: { productSlug: product.slug, notified: false },
    });
    if (alerts.length === 0) return;
    const url = `${getBaseUrl()}/products/${product.slug}`;
    for (const a of alerts) {
      sendBackInStock({ to: a.email, productTitle: product.title, productUrl: url }).catch(() => {});
    }
    await prisma.stockAlert.deleteMany({ where: { productSlug: product.slug } });
  } catch {}
}

export const GET = withAdmin(async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id)) throw httpError("Invalid id", 400);
  const product = await prisma.product.findUnique({
    where: { id },
    include: { variants: true },
  });
  if (!product) throw httpError("Not found", 404);
  return NextResponse.json({
    product: {
      ...product,
      _id: String(product.id),
      variants: product.variants.map((v) => ({
        id: v.variantId,
        name: v.name,
        sku: v.sku,
        price: v.price,
        inventory: v.inventory,
        image: v.image,
        colorHex: v.colorHex,
      })),
    },
  });
});

const MAX_DESC_LEN = 50000;

export const PUT = withAdmin(async ({ body, params }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id)) throw httpError("Invalid id", 400);
  const price = nonNegNumber(body.price);
  if (price === null) throw httpError("price must be ≥ 0");
  const inventory = nonNegNumber(body.inventory);
  if (inventory === null) throw httpError("inventory must be ≥ 0");
  const compareAt = nonNegNumber(body.compareAtPrice);
  if (compareAt === null) throw httpError("compareAtPrice must be ≥ 0");
  const costPrice = nonNegNumber(body.costPrice, 0);
  if (costPrice === null) throw httpError("costPrice must be ≥ 0");
  const rawDesc = typeof body.description === "string" ? body.description.slice(0, MAX_DESC_LEN) : "";

  const before = await prisma.product.findUnique({ where: { id }, include: { variants: true } });
  if (!before) throw httpError("Not found", 404);

  const variantsData = sanitizeVariants(body.variants) || [];

  // Replace variants atomically — delete all, recreate from input.
  const product = await prisma.$transaction(async (tx) => {
    await tx.productVariant.deleteMany({ where: { productId: id } });
    return tx.product.update({
      where: { id },
      data: {
        slug: String(body.slug || "").trim().toLowerCase(),
        title: String(body.title || "").trim(),
        description: sanitizePageBody(rawDesc),
        price,
        compareAtPrice: compareAt ?? null,
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
          create: variantsData.map((v) => ({
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
      include: { variants: true },
    });
  });

  bustStorefrontCaches(product.slug);
  if (before.slug && before.slug !== product.slug) bustStorefrontCaches(before.slug);
  if (totalStock(before) <= 0 && totalStock(product) > 0) {
    notifyRestock(product);
  }
  return { ok: true };
});

export const DELETE = withAdmin(async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id)) throw httpError("Invalid id", 400);
  const doc = await prisma.product.findUnique({ where: { id }, select: { slug: true } });
  await prisma.product.delete({ where: { id } });
  if (doc?.slug) bustStorefrontCaches(doc.slug);
  else bustStorefrontCaches();
  return { ok: true };
});
