import { withAdmin, httpError } from "../../../../../lib/withAdmin";
import { prisma } from "../../../../../lib/db";
import { getCloudinary, isConfigured } from "../../../../../lib/cloudinary";

export const DELETE = withAdmin(async ({ params }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id)) throw httpError("Invalid id", 400);
  const doc = await prisma.media.findUnique({ where: { id } });
  if (!doc) throw httpError("Not found", 404);
  if (isConfigured()) {
    try {
      await getCloudinary().uploader.destroy(doc.publicId);
    } catch {
      // continue: keep DB cleanup even if remote delete fails
    }
  }
  await prisma.media.delete({ where: { id } });
  return { ok: true };
});

export const PATCH = withAdmin(async ({ body, params }) => {
  const id = Number(params.id);
  if (!Number.isFinite(id)) throw httpError("Invalid id", 400);
  const update = {};
  if ("alt" in body) update.alt = String(body.alt || "").slice(0, 200);
  await prisma.media.update({ where: { id }, data: update });
  return { ok: true };
});
