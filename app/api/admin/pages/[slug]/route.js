import { revalidatePath, revalidateTag } from "next/cache";
import { withAdmin } from "../../../../../lib/withAdmin";
import { prisma } from "../../../../../lib/db";

export const PUT = withAdmin(async ({ body, params }) => {
  await prisma.page.update({
    where: { slug: params.slug },
    data: {
      title: body.title,
      body: body.body,
      published: !!body.published,
      metaTitle: body.metaTitle,
      metaDescription: body.metaDescription,
    },
  });
  try {
    revalidateTag("admin-pages");
    revalidatePath(`/p/${params.slug}`);
  } catch {}
  return { ok: true };
});

export const DELETE = withAdmin(async ({ params }) => {
  await prisma.page.delete({ where: { slug: params.slug } });
  try {
    revalidateTag("admin-pages");
    revalidatePath(`/p/${params.slug}`);
  } catch {}
  return { ok: true };
});
