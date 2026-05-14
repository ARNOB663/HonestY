import Link from "next/link";
import ProductForm from "../../../../components/admin/ProductForm";

export default function NewProductPage() {
  return (
    <div className="space-y-5">
      <Link href="/admin/products" className="text-sm text-gray-500 hover:underline">← Products</Link>
      <h1 className="text-2xl font-semibold">New product</h1>
      <ProductForm />
    </div>
  );
}
