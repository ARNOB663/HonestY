import Link from "next/link";
import { notFound } from "next/navigation";
import AddToCartButton from "../../../components/AddToCartButton";
import ProductGallery from "../../../components/ProductGallery";
import { getProductBySlug, getCollection, getFeaturedProducts } from "../../../lib/products";
import ProductCard from "../../../components/ProductCard";
import { formatMoney } from "../../../lib/format";
import ReviewSection from "../../../components/ReviewSection";

export const revalidate = 3600;

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const p = await getProductBySlug(slug);
  return { title: p ? `${p.title} — Honesty` : "Product — Honesty" };
}

export default async function ProductPage({ params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const collection = getCollection(product.collection);
  const related = await getFeaturedProducts();
  const discount = product.compareAtPrice
    ? Math.round((1 - product.price / product.compareAtPrice) * 100)
    : null;

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-[#e5e7eb]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-500 flex-wrap">
          <Link href="/" className="hover:text-[#1a35d4]">Home</Link>
          <span>/</span>
          <Link href="/products" className="hover:text-[#1a35d4]">Products</Link>
          {collection && (
            <>
              <span>/</span>
              <Link href={`/collections/${collection.slug}`} className="hover:text-[#1a35d4]">{collection.title}</Link>
            </>
          )}
          <span>/</span>
          <span className="text-[#1a1a1a] font-medium line-clamp-1">{product.title}</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery */}
          <ProductGallery product={product} />

          {/* Product info */}
          <div>
            {collection && (
              <Link href={`/collections/${collection.slug}`} className="text-[#1a35d4] text-xs font-semibold uppercase tracking-wider hover:underline">
                {collection.title}
              </Link>
            )}

            <h1 className="text-2xl md:text-3xl font-bold text-[#1a1a1a] mt-2 leading-snug">{product.title}</h1>

            {/* Stars */}
            <div className="flex items-center gap-1.5 mt-3">
              <div className="flex">
                {[1,2,3,4,5].map((i) => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= 4 ? "#f5a623" : "#e5e7eb"} className="inline">
                    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                  </svg>
                ))}
              </div>
              <span className="text-sm text-gray-500">(24 reviews)</span>
              <span className="text-xs text-[#16a34a] font-semibold ml-2">In Stock</span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3 mt-4">
              <span className="text-2xl font-bold text-[#e53935]">{formatMoney(product.price)}</span>
              {product.compareAtPrice && (
                <span className="text-gray-400 line-through text-sm">{formatMoney(product.compareAtPrice)}</span>
              )}
              {discount && (
                <span className="bg-[#1a35d4] text-white text-xs font-bold px-2 py-0.5 rounded">-{discount}%</span>
              )}
            </div>

            {/* Viewing count */}
            <div className="flex items-center gap-1.5 mt-3 text-sm text-gray-500">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              <span>18 people viewing this right now</span>
            </div>

            <hr className="my-5 border-[#e5e7eb]" />

            {/* Description */}
            {product.description && (
              <p className="text-sm text-gray-600 leading-relaxed mb-6">{product.description}</p>
            )}

            {/* Add to cart */}
            <AddToCartButton product={product} />

            {/* Delivery info */}
            <div className="mt-6 grid grid-cols-2 gap-3">
              {[
                { icon: "🚚", title: "Free Shipping", sub: "On orders over ৳2,000" },
                { icon: "↩️", title: "7-Day Returns", sub: "Hassle-free policy" },
                { icon: "🛡️", title: "Quality Assured", sub: "From local makers" },
                { icon: "⚡", title: "Fast Delivery", sub: "Dhaka same-day, others 2-3d" },
              ].map((f) => (
                <div key={f.title} className="flex items-start gap-2.5 border border-[#e5e7eb] rounded p-3">
                  <span className="text-xl">{f.icon}</span>
                  <div>
                    <p className="text-xs font-semibold text-[#1a1a1a]">{f.title}</p>
                    <p className="text-[11px] text-gray-400">{f.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Description tab */}
        <div className="mt-12">
          <div className="border-b border-[#e5e7eb] flex gap-0">
            <button className="px-6 py-3 text-sm font-semibold border-b-2 border-[#1a35d4] text-[#1a35d4]">
              Description
            </button>
            <button className="px-6 py-3 text-sm text-gray-500 hover:text-[#1a35d4]">Reviews (24)</button>
            <button className="px-6 py-3 text-sm text-gray-500 hover:text-[#1a35d4]">Shipping Info</button>
          </div>
          <div className="py-6 text-sm text-gray-600 leading-relaxed max-w-3xl">
            {product.description || "No description available for this product."}
          </div>
        </div>

        <ReviewSection slug={product.slug} />

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-10">
            <h2 className="text-xl font-bold text-[#1a1a1a] mb-5">Related Products</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {related.slice(0, 6).map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
