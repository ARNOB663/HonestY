import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/db";
import PageForm from "../../../../components/admin/PageForm";

export const dynamic = "force-dynamic";

export default async function EditPage({ params }) {
  const { slug } = await params;
  const doc = await prisma.page.findUnique({ where: { slug } });
  if (!doc) notFound();
  const page = { ...doc, _id: String(doc.id) };
  return (
    <div className="space-y-5">
      <Link href="/admin/pages" className="text-sm text-gray-500 hover:underline">← Pages</Link>
      <h1 className="text-2xl font-semibold">Edit · {page.title}</h1>
      <PageForm page={page} />
    </div>
  );
}
