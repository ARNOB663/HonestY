import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { withAdmin, httpError } from "../../../../../lib/withAdmin";
import { prisma } from "../../../../../lib/db";

function bustHome() {
  try { revalidatePath("/"); revalidateTag("admin-sales"); } catch {}
}

export const GET = withAdmin(async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id)) throw httpError("Invalid id", 400);
  const group = await prisma.salesGroup.findUnique({ where: { id } });
  if (!group) throw httpError("Not found", 404);
  return NextResponse.json({ group: { ...group, _id: String(group.id) } });
});

export const PUT = withAdmin(async ({ body, params }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id)) throw httpError("Invalid id", 400);
  const title = String(body.title || "").trim();
  if (!title) throw httpError("Title is required");

  await prisma.salesGroup.update({
    where: { id },
    data: {
      title: title.slice(0, 120),
      subtitle: String(body.subtitle || "").slice(0, 200),
      eyebrow: String(body.eyebrow || "Limited Time").slice(0, 60),
      active: body.active !== false,
      sortOrder: Number(body.sortOrder) || 0,
      productSlugs: Array.isArray(body.productSlugs)
        ? body.productSlugs.filter((s) => typeof s === "string").slice(0, 50)
        : [],
    },
  });
  bustHome();
  return { ok: true };
});

export const DELETE = withAdmin(async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id)) throw httpError("Invalid id", 400);
  await prisma.salesGroup.delete({ where: { id } });
  bustHome();
  return { ok: true };
});
