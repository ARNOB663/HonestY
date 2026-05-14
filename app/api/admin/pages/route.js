import { withAdmin, httpError } from "../../../../lib/withAdmin";
import { dbConnect } from "../../../../lib/mongodb";
import Page from "../../../../models/Page";

export const POST = withAdmin(async ({ body }) => {
  if (!body.slug || !body.title) throw httpError("slug and title required");
  await dbConnect();
  await Page.create({
    slug: String(body.slug).toLowerCase(),
    title: body.title,
    body: body.body || "",
    published: body.published !== false,
    metaTitle: body.metaTitle,
    metaDescription: body.metaDescription,
  });
  return { ok: true };
});
