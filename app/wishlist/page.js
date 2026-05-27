"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useWishlist } from "../../context/WishlistContext";
import { useCart } from "../../context/CartContext";
import { formatMoney } from "../../lib/format";

export default function WishlistPage() {
  const { slugs, hydrated, remove, clear } = useWishlist();
  const { add } = useCart();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return;
    if (slugs.length === 0) { setProducts([]); setLoading(false); return; }
    setLoading(true);
    fetch("/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs }),
    })
      .then((r) => r.ok ? r.json() : { products: [] })
      .then((data) => setProducts(data.products || []))
      .finally(() => setLoading(false));
  }, [slugs, hydrated]);

  if (!hydrated || loading) {
    return <div className="px-4 max-w-7xl mx-auto py-16 text-center text-gray-400">Loading…</div>;
  }

  return (
    <div className="bg-[#fafaf7] min-h-screen">
      <div className="border-b border-[#e8e4d8] bg-white">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-[#1a2b4a]">Home</Link>
          <span>/</span>
          <span className="text-[#1a2b4a] font-medium">Wishlist</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-serif text-3xl text-[#1a2b4a]">My Wishlist</h1>
          {products.length > 0 && (
            <button onClick={clear} className="text-sm text-gray-500 hover:text-[#1a2b4a] underline">
              Clear all
            </button>
          )}
        </div>

        {products.length === 0 ? (
          <div className="bg-white border border-[#e8e4d8] rounded-lg p-12 text-center">
            <p className="text-gray-500 text-sm">Your wishlist is empty.</p>
            <Link href="/products" className="inline-block mt-4 bg-[#1a2b4a] text-white font-bold px-8 py-3 rounded text-sm tracking-wide hover:bg-[#0e1a30] transition-colors">
              BROWSE PRODUCTS
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => {
              const stock = p.variants?.length
                ? p.variants.reduce((s, v) => s + (v.inventory || 0), 0)
                : (p.inventory ?? 0);
              const hasVariants = p.variants?.length > 0;
              return (
                <div key={p.slug} className="bg-white border border-[#e8e4d8] rounded-lg p-3 relative">
                  <button
                    onClick={() => remove(p.slug)}
                    className="absolute top-2 right-2 text-gray-400 hover:text-red-600 text-lg z-10"
                    aria-label="Remove from wishlist"
                  >
                    ×
                  </button>
                  <Link href={`/products/${p.slug}`} className="block">
                    <div className="relative h-36 bg-gray-50 rounded-md overflow-hidden mb-3">
                      {p.image && <Image src={p.image} alt={p.title} fill sizes="(max-width:640px) 50vw, 25vw" className="object-cover" />}
                    </div>
                    <p className="text-[11px] text-[#1a2b4a] font-medium capitalize">{p.collection}</p>
                    <h3 className="text-[13px] text-[#1a2b4a] leading-snug line-clamp-2 mt-1">{p.title}</h3>
                    <p className="text-[#b8553a] font-bold text-[14px] mt-1.5">{formatMoney(p.price)}</p>
                  </Link>
                  <button
                    onClick={() => add(p, 1)}
                    disabled={stock <= 0 || hasVariants}
                    className="w-full mt-3 bg-[#1a2b4a] text-white text-xs font-bold py-2 rounded disabled:opacity-50 hover:bg-[#0e1a30] transition-colors"
                  >
                    {stock <= 0 ? "OUT OF STOCK" : hasVariants ? "SELECT OPTIONS" : "ADD TO CART"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
