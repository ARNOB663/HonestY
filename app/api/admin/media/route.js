import { withAdmin, httpError } from "../../../../lib/withAdmin";
import { prisma } from "../../../../lib/db";

export const GET = withAdmin(async () => {
  const docs = await prisma.media.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return {
    media: docs.map((m) => ({
      _id: String(m.id),
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
  await prisma.media.upsert({
    where: { publicId: body.publicId },
    create: {
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
    update: {
      url: body.url,
      width: body.width,
      height: body.height,
      format: body.format,
      bytes: body.bytes,
      folder: body.folder,
      alt: body.alt || "",
      uploadedBy: session?.user?.email,
    },
  });
  return { ok: true };
});
