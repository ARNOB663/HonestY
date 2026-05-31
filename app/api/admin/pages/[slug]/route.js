import { revalidatePath, revalidateTag } from "next/cache";
import { withAdmin } from "../../../../../lib/withAdmin";
import { dbConnect } from "../../../../../lib/mongodb";
import Page from "../../../../../models/Page";

export const PUT = withAdmin(async ({ body, params }) => {
  await dbConnect();
  await Page.findOneAndUpdate({ slug: params.slug }, {
    title: body.title,
    body: body.body,
    published: !!body.published,
    metaTitle: body.metaTitle,
    metaDescription: body.metaDescription,
  });
  try {
    revalidateTag("admin-pages");
    revalidatePath(`/p/${params.slug}`);
  } catch {}
  return { ok: true };
});

export const DELETE = withAdmin(async ({ params }) => {
  await dbConnect();
  await Page.findOneAndDelete({ slug: params.slug });
  try {
    revalidateTag("admin-pages");
    revalidatePath(`/p/${params.slug}`);
  } catch {}
  return { ok: true };
});
