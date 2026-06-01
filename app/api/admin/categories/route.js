import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { withAdmin, httpError } from "../../../../lib/withAdmin";
import { dbConnect } from "../../../../lib/mongodb";
import Category from "../../../../models/Category";
import { invalidateCategoryCache, getAllCategories } from "../../../../lib/products";

function slugify(s) {
  return String(s || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

export const GET = withAdmin(async () => {
  // Always go through getAllCategories so the seed-on-empty path runs and the
  // hardcoded fallback is folded in.
  const list = await getAllCategories();
  return NextResponse.json({ categories: list });
});

export const POST = withAdmin(async ({ body }) => {
  const title = String(body.title || "").trim().slice(0, 80);
  if (!title) throw httpError("Title is required");
  const slug = slugify(body.slug || title);
  if (!slug) throw httpError("Slug is invalid");
  const blurb = String(body.blurb || "").trim().slice(0, 300);
  const image = String(body.image || "").trim().slice(0, 500);

  await dbConnect();
  const existing = await Category.findOne({ slug }).lean();
  if (existing) throw httpError(`Category "${slug}" already exists`, 409);

  // Place new categories at the end.
  const max = await Category.findOne({}).sort({ sortOrder: -1 }).select("sortOrder").lean();
  const sortOrder = (max?.sortOrder ?? -1) + 1;

  const doc = await Category.create({ slug, title, blurb, image, sortOrder });
  invalidateCategoryCache();
  try { revalidatePath("/"); revalidatePath(`/collections/${slug}`); } catch {}
  return { ok: true, category: { slug: doc.slug, title: doc.title, blurb: doc.blurb, image: doc.image } };
});
