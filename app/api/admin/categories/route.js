import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { withAdmin, httpError } from "../../../../lib/withAdmin";
import { prisma } from "../../../../lib/db";
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

  const existing = await prisma.category.findUnique({ where: { slug } });
  if (existing) throw httpError(`Category "${slug}" already exists`, 409);

  const max = await prisma.category.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });
  const sortOrder = (max?.sortOrder ?? -1) + 1;

  const doc = await prisma.category.create({ data: { slug, title, blurb, image, sortOrder } });
  invalidateCategoryCache();
  try { revalidatePath("/"); revalidatePath(`/collections/${slug}`); } catch {}
  return { ok: true, category: { slug: doc.slug, title: doc.title, blurb: doc.blurb, image: doc.image } };
});
