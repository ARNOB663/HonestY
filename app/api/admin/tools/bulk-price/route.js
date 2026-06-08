// Apply a percent change to product prices in bulk. Supports filtering by
// collection slug or "all". Optionally rounds to the nearest ৳50 / ৳100 so
// the resulting prices stay clean.
//
// Body: { changePercent: 10, collection?: "fashion", round?: 50 }
// Returns: { ok, updated, sample: [{ slug, before, after }, ...5] }
import { revalidatePath, revalidateTag } from "next/cache";
import { withAdmin, httpError } from "../../../../../lib/withAdmin";
import { prisma } from "../../../../../lib/db";

function roundToNearest(value, step) {
  if (!step || step < 1) return Math.round(value * 100) / 100;
  return Math.round(value / step) * step;
}

export const POST = withAdmin(async ({ body }) => {
  const pct = Number(body.changePercent);
  if (!Number.isFinite(pct) || pct < -90 || pct > 500) {
    throw httpError("changePercent must be between -90 and 500");
  }
  const collection = body.collection && body.collection !== "all" ? String(body.collection) : null;
  const step = Number(body.round) || 0;

  const where = collection ? { collection } : {};
  const products = await prisma.product.findMany({ where });

  const multiplier = 1 + pct / 100;
  const sample = [];
  for (const p of products) {
    const newPrice = roundToNearest(p.price * multiplier, step);
    if (newPrice === p.price) continue;
    await prisma.product.update({ where: { id: p.id }, data: { price: newPrice } });
    if (sample.length < 5) sample.push({ slug: p.slug, before: p.price, after: newPrice });
  }
  try {
    revalidatePath("/");
    revalidatePath("/products");
    revalidateTag("admin-dashboard");
    revalidateTag("admin-products");
  } catch {}
  return { ok: true, scanned: products.length, updated: sample.length, sample };
});
