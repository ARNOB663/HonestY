import { revalidateTag } from "next/cache";
import { withAdmin, httpError } from "../../../../../lib/withAdmin";
import { prisma } from "../../../../../lib/db";

const ALLOWED = ["active", "value", "minSubtotal", "usageLimit", "expiresAt"];

export const PATCH = withAdmin(async ({ body, params }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id)) throw httpError("Invalid id", 400);
  const existing = await prisma.discount.findUnique({ where: { id } });
  if (!existing) throw httpError("Not found", 404);

  const update = {};
  for (const key of ALLOWED) {
    if (!(key in body)) continue;
    if (key === "active") update.active = !!body.active;
    else if (key === "expiresAt") update.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    else {
      const n = Number(body[key]);
      if (!Number.isFinite(n) || n < 0) throw httpError(`${key} must be a non-negative number`);
      if (key === "value" && existing.type === "percent" && n > 100) {
        throw httpError("percent value must be ≤ 100");
      }
      update[key] = key === "usageLimit" ? Math.floor(n) : n;
    }
  }

  await prisma.discount.update({ where: { id }, data: update });
  try { revalidateTag("admin-discounts"); } catch {}
  return { ok: true };
});

export const DELETE = withAdmin(async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id)) throw httpError("Invalid id", 400);
  await prisma.discount.delete({ where: { id } });
  try { revalidateTag("admin-discounts"); } catch {}
  return { ok: true };
});
