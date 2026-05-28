import Link from "next/link";
import { dbConnect } from "../../../../lib/mongodb";
import Product from "../../../../models/Product";
import SalesGroupEditor from "../../../../components/admin/SalesGroupEditor";

export const dynamic = "force-dynamic";

export default async function NewSalesGroup() {
  await dbConnect();
  const products = await Product.find({}).select("slug title price compareAtPrice image collection").sort({ updatedAt: -1 }).lean();
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
