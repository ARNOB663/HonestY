import Link from "next/link";
import { notFound } from "next/navigation";
import { dbConnect } from "../../../../lib/mongodb";
import Product from "../../../../models/Product";
import SalesGroup from "../../../../models/SalesGroup";
import SalesGroupEditor from "../../../../components/admin/SalesGroupEditor";

export const dynamic = "force-dynamic";

export default async function EditSalesGroup({ params }) {
  const { id } = await params;
  await dbConnect();
  const doc = await SalesGroup.findById(id).lean();
  if (!doc) notFound();
  const products = await Product.find({}).select("slug title price compareAtPrice image collection").sort({ updatedAt: -1 }).lean();
  const productOptions = products.map((p) => ({
    slug: p.slug,
    title: p.title,
    price: p.price,
    compareAtPrice: p.compareAtPrice || null,
    image: p.image || "",
    collection: p.collection || "",
  }));
  const group = { ...doc, _id: String(doc._id) };
  return (
    <div className="space-y-5">
      <Link href="/admin/sales" className="text-sm text-gray-500 hover:underline">← Sales groups</Link>
      <h1 className="text-2xl font-semibold">Edit · {group.title}</h1>
      <SalesGroupEditor group={group} productOptions={productOptions} />
    </div>
  );
}
