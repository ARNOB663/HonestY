import { withAdmin, httpError } from "../../../../lib/withAdmin";
import { dbConnect } from "../../../../lib/mongodb";
import Media from "../../../../models/Media";

export const GET = withAdmin(async () => {
  await dbConnect();
  const docs = await Media.find({}).sort({ createdAt: -1 }).limit(200).lean();
  return {
    media: docs.map((m) => ({
      _id: String(m._id),
      publicId: m.publicId,
      url: m.url,
      width: m.width,
      height: m.height,
      format: m.format,
      bytes: m.bytes,
      alt: m.alt,
      createdAt: m.createdAt,
    })),
  };
});

// Called after the browser has successfully uploaded via Cloudinary's direct API.
export const POST = withAdmin(async ({ body, session }) => {
  if (!body.publicId || !body.url) throw httpError("publicId and url required");
  await dbConnect();
  await Media.findOneAndUpdate(
    { publicId: body.publicId },
    {
      publicId: body.publicId,
      url: body.url,
      width: body.width,
      height: body.height,
      format: body.format,
      bytes: body.bytes,
      folder: body.folder,
      alt: body.alt || "",
      uploadedBy: session?.user?.email,
    },
    { upsert: true, new: true }
  );
  return { ok: true };
});
