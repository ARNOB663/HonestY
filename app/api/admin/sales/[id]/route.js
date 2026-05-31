import { NextResponse } from "next/server";
import { revalidatePath, revalidateTag } from "next/cache";
import { withAdmin, httpError } from "../../../../../lib/withAdmin";
import { dbConnect } from "../../../../../lib/mongodb";
import SalesGroup from "../../../../../models/SalesGroup";

function bustHome() {
  try { revalidatePath("/"); revalidateTag("admin-sales"); } catch {}
}

export const GET = withAdmin(async ({ params }) => {
  await dbConnect();
  const group = await SalesGroup.findById(params.id).lean();
  if (!group) throw httpError("Not found", 404);
  return NextResponse.json({ group: { ...group, _id: String(group._id) } });
});

export const PUT = withAdmin(async ({ body, params }) => {
  const title = String(body.title || "").trim();
  if (!title) throw httpError("Title is required");

  await dbConnect();
  const update = {
    title: title.slice(0, 120),
    subtitle: String(body.subtitle || "").slice(0, 200),
    eyebrow: String(body.eyebrow || "Limited Time").slice(0, 60),
    active: body.active !== false,
    sortOrder: Number(body.sortOrder) || 0,
    productSlugs: Array.isArray(body.productSlugs)
      ? body.productSlugs.filter((s) => typeof s === "string").slice(0, 50)
      : [],
  };
  const group = await SalesGroup.findByIdAndUpdate(params.id, update, { new: true, runValidators: true });
  if (!group) throw httpError("Not found", 404);
  bustHome();
  return { ok: true };
});

export const DELETE = withAdmin(async ({ params }) => {
  await dbConnect();
  await SalesGroup.findByIdAndDelete(params.id);
  bustHome();
  return { ok: true };
});
