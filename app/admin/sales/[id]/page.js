import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "../../../../lib/db";
import SalesGroupEditor from "../../../../components/admin/SalesGroupEditor";

export const dynamic = "force-dynamic";

export default async function EditSalesGroup({ params }) {
  const { id } = await params;
  const numId = Number(id);
  if (!Number.isFinite(numId)) notFound();
  const doc = await prisma.salesGroup.findUnique({ where: { id: numId } });
  if (!doc) notFound();
  const products = await prisma.product.findMany({
    select: { slug: true, title: true, price: true, compareAtPrice: true, image: true, collection: true },
    orderBy: { updatedAt: "desc" },
  });
  const productOptions = products.map((p) => ({
    slug: p.slug,
    title: p.title,
    price: p.price,
    compareAtPrice: p.compareAtPrice || null,
    image: p.image || "",
    collection: p.collection || "",
  }));
  const group = { ...doc, _id: String(doc.id) };
  return (
    <div className="space-y-5">
      <Link href="/admin/sales" className="text-sm text-gray-500 hover:underline">← Sales groups</Link>
      <h1 className="text-2xl font-semibold">Edit · {group.title}</h1>
      <SalesGroupEditor group={group} productOptions={productOptions} />
    </div>
  );
}
