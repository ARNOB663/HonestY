import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { withAdmin, httpError } from "../../../../lib/withAdmin";
import { prisma } from "../../../../lib/db";

function bustHome() {
  try { revalidatePath("/"); revalidateTag("admin-sales"); } catch {}
}

function makeSlug(title) {
  return String(title || "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60) || `sale-${Math.random().toString(36).slice(2, 6)}`;
}

export const GET = withAdmin(async () => {
  const groups = await prisma.salesGroup.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({
    groups: groups.map((g) => ({ ...g, _id: String(g.id) })),
  });
});

export const POST = withAdmin(async ({ body }) => {
  const title = String(body.title || "").trim();
  if (!title) throw httpError("Title is required");

  let slug = body.slug ? makeSlug(body.slug) : makeSlug(title);
  let i = 2;
  while (await prisma.salesGroup.findUnique({ where: { slug } })) {
    slug = `${makeSlug(title)}-${i++}`;
  }

  const group = await prisma.salesGroup.create({
    data: {
      title: title.slice(0, 120),
      subtitle: String(body.subtitle || "").slice(0, 200),
      eyebrow: String(body.eyebrow || "Limited Time").slice(0, 60),
      slug,
      active: body.active !== false,
      sortOrder: Number(body.sortOrder) || 0,
      productSlugs: Array.isArray(body.productSlugs) ? body.productSlugs.filter((s) => typeof s === "string").slice(0, 50) : [],
    },
  });
  bustHome();
  return { ok: true, id: String(group.id), slug: group.slug };
});
