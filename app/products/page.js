import Link from "next/link";
import ProductsFilter from "../../components/ProductsFilter";
import { getAllProducts } from "../../lib/products";
import { collections } from "../../data/products";

export const metadata = { title: "All Products — Honesty" };
export const revalidate = 3600;

export default async function ProductsPage({ searchParams }) {
  const { q } = await searchParams;
  let products = await getAllProducts();

  if (q) {
    const query = q.toLowerCase();
    products = products.filter(
      (p) =>
        p.title?.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query) ||
        p.collection?.toLowerCase().includes(query)
    );
  }

  return (
    <div className="bg-[#fafaf7] min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-[#e8e4d8] bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-[#1a2b4a]">Home</Link>
          <span>/</span>
          <span className="text-[#1a2b4a] font-medium">{q ? `Search: "${q}"` : "All Products"}</span>
        </div>
      </div>

      {/* Page header */}
      <div className="bg-white border-b border-[#e8e4d8]">
        <div className="max-w-7xl mx-auto px-4 py-10 text-center">
          <p className="text-[#c9a961] text-xs font-semibold tracking-[0.2em] uppercase mb-2">
            {q ? "Search Results" : "Shop"}
          </p>
          <h1 className="font-serif text-3xl md:text-4xl text-[#1a2b4a]">
            {q ? `Results for "${q}"` : "All Products"}
          </h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <ProductsFilter products={products} collections={collections} />
      </div>
    </div>
  );
}
