import Link from "next/link";
import { prisma } from "../../../../lib/db";
import SalesGroupEditor from "../../../../components/admin/SalesGroupEditor";

export const dynamic = "force-dynamic";

export default async function NewSalesGroup() {
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
  return (
    <div className="space-y-5">
      <Link href="/admin/sales" className="text-sm text-gray-500 hover:underline">← Sales groups</Link>
      <h1 className="text-2xl font-semibold">New sales group</h1>
      <SalesGroupEditor productOptions={productOptions} />
    </div>
  );
}
