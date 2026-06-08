"use client";
// Renders a small row of the user's recently-viewed products.
// Use on product pages (excludes the product being viewed) and on the cart
// page. Returns null until hydrated to avoid SSR/CSR mismatches.

import { useEffect, useState } from "react";
import { useRecentlyViewed } from "../lib/useRecentlyViewed";
import ProductCard from "./ProductCard";

export default function RecentlyViewed({ excludeSlug, title = "Recently viewed", limit = 6 }) {
  const { slugs, hydrated, track, clear } = useRecentlyViewed();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // Track the page's slug so it climbs the recent list on every visit.
  useEffect(() => {
    if (excludeSlug) track(excludeSlug);
  }, [excludeSlug, track]);

  useEffect(() => {
    if (!hydrated) return;
    const wanted = slugs.filter((s) => s !== excludeSlug).slice(0, limit);
    if (wanted.length === 0) { setProducts([]); return; }
    setLoading(true);
    fetch("/api/cart/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slugs: wanted }),
    })
      .then((r) => (r.ok ? r.json() : { products: [] }))
      .then((data) => {
        // Preserve user's visit order, drop missing products.
        const bySlug = Object.fromEntries((data.products || []).map((p) => [p.slug, p]));
        setProducts(wanted.map((s) => bySlug[s]).filter(Boolean));
      })
      .finally(() => setLoading(false));
  }, [hydrated, slugs, excludeSlug, limit]);

  if (!hydrated || products.length === 0) return null;

  return (
    <section className="max-w-7xl mx-auto px-4 py-10">
      <div className="flex items-end justify-between mb-5">
        <h2 className="font-serif text-2xl text-[#1a2b4a]">{title}</h2>
        <button
          onClick={clear}
          className="text-xs text-gray-500 hover:text-[#b8553a] underline-offset-2 hover:underline"
        >
          Clear history
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}
