import Link from "next/link";
import { notFound } from "next/navigation";
import { dbConnect } from "../../../../lib/mongodb";
import Product from "../../../../models/Product";
import ProductForm from "../../../../components/admin/ProductForm";

export const dynamic = "force-dynamic";

export default async function EditProduct({ params }) {
  const { id } = await params;
  await dbConnect();
  const doc = await Product.findById(id).lean();
  if (!doc) notFound();
  const product = { ...doc, _id: String(doc._id) };
  return (
    <div className="space-y-5">
      <Link href="/admin/products" className="text-sm text-gray-500 hover:underline">← Products</Link>
      <h1 className="text-2xl font-semibold">Edit · {product.title}</h1>
      <ProductForm product={product} />
    </div>
  );
}
