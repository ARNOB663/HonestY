import Link from "next/link";
import { notFound } from "next/navigation";
import { dbConnect } from "../../../../lib/mongodb";
import Page from "../../../../models/Page";
import PageForm from "../../../../components/admin/PageForm";

export const dynamic = "force-dynamic";

export default async function EditPage({ params }) {
  const { slug } = await params;
  await dbConnect();
  const doc = await Page.findOne({ slug }).lean();
  if (!doc) notFound();
  const page = { ...doc, _id: String(doc._id) };
  return (
    <div className="space-y-5">
      <Link href="/admin/pages" className="text-sm text-gray-500 hover:underline">← Pages</Link>
      <h1 className="text-2xl font-semibold">Edit · {page.title}</h1>
      <PageForm page={page} />
    </div>
  );
}
