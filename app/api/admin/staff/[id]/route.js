import { revalidateTag } from "next/cache";
import { withAdmin, httpError } from "../../../../../lib/withAdmin";
import { prisma } from "../../../../../lib/db";

export const PATCH = withAdmin(async ({ body, params }) => {
  if (body.role && !["admin", "user"].includes(body.role)) throw httpError("invalid role");
  const id = Number(params.id);
  if (!Number.isFinite(id)) throw httpError("Invalid id", 400);
  if (body.role === "user") {
    const [admins, target] = await Promise.all([
      prisma.user.count({ where: { role: "admin" } }),
      prisma.user.findUnique({ where: { id } }),
    ]);
    if (target?.role === "admin" && admins <= 1) throw httpError("Cannot demote the last admin");
  }
  await prisma.user.update({
    where: { id },
    data: { role: body.role, tokenVersion: { increment: 1 } },
  });
  try { revalidateTag("admin-staff"); } catch {}
  return { ok: true };
});
