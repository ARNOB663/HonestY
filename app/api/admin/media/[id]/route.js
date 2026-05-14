import { withAdmin, httpError } from "../../../../../lib/withAdmin";
import { dbConnect } from "../../../../../lib/mongodb";
import Media from "../../../../../models/Media";
import { getCloudinary, isConfigured } from "../../../../../lib/cloudinary";

export const DELETE = withAdmin(async ({ params }) => {
  await dbConnect();
  const doc = await Media.findById(params.id);
  if (!doc) throw httpError("Not found", 404);
  if (isConfigured()) {
    try {
      await getCloudinary().uploader.destroy(doc.publicId);
    } catch {
      // continue: keep DB cleanup even if remote delete fails
    }
  }
  await doc.deleteOne();
  return { ok: true };
});

export const PATCH = withAdmin(async ({ body, params }) => {
  await dbConnect();
  const update = {};
  if ("alt" in body) update.alt = String(body.alt || "").slice(0, 200);
  await Media.findByIdAndUpdate(params.id, update);
  return { ok: true };
});
