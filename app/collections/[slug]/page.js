import { notFound } from "next/navigation";
import Link from "next/link";
import ProductCard from "../../../components/ProductCard";
import { getProductsByCollection, getCollection } from "../../../lib/products";

export const revalidate = 3600;

import { getBaseUrl } from "../../../lib/baseUrl";

function siteUrl() {
  return getBaseUrl();
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const c = getCollection(slug);
  if (!c) return { title: "Collection — Honesty" };
  const desc = (c.blurb || `Shop ${c.title} at Honesty — honestly made, honestly priced.`).slice(0, 160);
  const url = `${siteUrl()}/collections/${c.slug}`;
  return {
    title: `${c.title} — Honesty`,
    description: desc,
    alternates: { canonical: url },
    openGraph: { title: `${c.title} — Honesty`, description: desc, url, type: "website" },
    twitter: { card: "summary", title: `${c.title} — Honesty`, description: desc },
  };
}

export default async function CollectionPage({ params }) {
  const { slug } = await params;
  const collection = getCollection(slug);
  if (!collection) notFound();
  const products = await getProductsByCollection(slug);

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-[#1a35d4]">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-[#1a35d4]">Products</Link>
          <span>/</span>
          <span className="text-[#1a1a1a] font-medium">{collection.title}</span>
        </div>
      </div>

      {/* Collection banner */}
      <div className="bg-[#eff6ff] border-b border-[#e5e7eb] py-8">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-2xl font-bold text-[#1a1a1a]">{collection.title}</h1>
          <p className="text-gray-500 text-sm mt-1">{collection.blurb}</p>
          <p className="text-[#1a35d4] text-sm font-medium mt-1">{products.length} products</p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No products yet in this collection.</p>
            <Link href="/products" className="inline-block mt-4 text-[#1a35d4] font-medium hover:underline">
              View all products
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {products.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
