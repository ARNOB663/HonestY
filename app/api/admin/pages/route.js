import { revalidateTag } from "next/cache";
import { withAdmin, httpError } from "../../../../lib/withAdmin";
import { prisma } from "../../../../lib/db";

export const POST = withAdmin(async ({ body }) => {
  if (!body.slug || !body.title) throw httpError("slug and title required");
  await prisma.page.create({
    data: {
      slug: String(body.slug).toLowerCase(),
      title: body.title,
      body: body.body || "",
      published: body.published !== false,
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription,
    },
  });
  try { revalidateTag("admin-pages"); } catch {}
  return { ok: true };
});
