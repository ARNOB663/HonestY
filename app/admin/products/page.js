import Link from "next/link";
import { dbConnect } from "../../../lib/mongodb";
import Product from "../../../models/Product";
import { formatMoney } from "../../../lib/format";

export const dynamic = "force-dynamic";

export default async function AdminProducts() {
  await dbConnect();
  const products = await Product.find({}).sort({ updatedAt: -1 }).lean();
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Products <span className="text-gray-400 text-base font-normal">({products.length})</span></h1>
        <Link href="/admin/products/new" className="bg-[#1a2b4a] text-white px-4 py-2 rounded text-sm hover:bg-[#0f1c33]">+ New product</Link>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr><th className="px-4 py-2">Title</th><th className="px-4 py-2">Slug</th><th className="px-4 py-2">Collection</th><th className="px-4 py-2 text-right">Price</th><th className="px-4 py-2 text-right">Stock</th><th className="px-4 py-2"></th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {products.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No products yet. Run <code className="bg-gray-100 px-1">npm run seed</code> or add one.</td></tr>
            )}
            {products.map((p) => (
              <tr key={String(p._id)}>
                <td className="px-4 py-2">{p.title}{p.featured && <span className="ml-2 text-[10px] uppercase text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Featured</span>}</td>
                <td className="px-4 py-2 text-gray-500">{p.slug}</td>
                <td className="px-4 py-2 text-gray-500">{p.collection || "—"}</td>
                <td className="px-4 py-2 text-right">{formatMoney(p.price)}</td>
                <td className={`px-4 py-2 text-right ${p.inventory <= 5 ? "text-red-600" : ""}`}>{p.inventory}</td>
                <td className="px-4 py-2 text-right"><Link href={`/admin/products/${String(p._id)}`} className="text-blue-600 hover:underline">Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
