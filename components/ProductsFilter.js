"use client";
import { useState, useMemo } from "react";
import ProductCard from "./ProductCard";

const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "name", label: "Name: A–Z" },
];

const PRICE_RANGES = [
  { label: "Under $50", min: 0, max: 50 },
  { label: "$50 – $100", min: 50, max: 100 },
  { label: "$100 – $200", min: 100, max: 200 },
  { label: "$200 – $500", min: 200, max: 500 },
  { label: "$500+", min: 500, max: Infinity },
];

export default function ProductsFilter({ products, collections }) {
  const [selectedCats, setSelectedCats] = useState([]);
  const [selectedRanges, setSelectedRanges] = useState([]);
  const [onSaleOnly, setOnSaleOnly] = useState(false);
  const [sort, setSort] = useState("featured");
  const [mobileOpen, setMobileOpen] = useState(false);

  const filtered = useMemo(() => {
    let out = [...products];
    if (selectedCats.length > 0) {
      out = out.filter((p) => selectedCats.includes(p.collection));
    }
    if (selectedRanges.length > 0) {
      out = out.filter((p) =>
        selectedRanges.some((idx) => {
          const r = PRICE_RANGES[idx];
          return p.price >= r.min && p.price < r.max;
        })
      );
    }
    if (onSaleOnly) {
      out = out.filter((p) => p.compareAtPrice);
    }
    if (sort === "price-asc") out.sort((a, b) => a.price - b.price);
    else if (sort === "price-desc") out.sort((a, b) => b.price - a.price);
    else if (sort === "name") out.sort((a, b) => a.title.localeCompare(b.title));
    else out.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    return out;
  }, [products, selectedCats, selectedRanges, onSaleOnly, sort]);

  const toggleCat = (slug) =>
    setSelectedCats((prev) => (prev.includes(slug) ? prev.filter((c) => c !== slug) : [...prev, slug]));
  const toggleRange = (idx) =>
    setSelectedRanges((prev) => (prev.includes(idx) ? prev.filter((r) => r !== idx) : [...prev, idx]));
  const clearAll = () => {
    setSelectedCats([]);
    setSelectedRanges([]);
    setOnSaleOnly(false);
  };

  const Sidebar = (
    <aside className="space-y-7 text-sm">
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold tracking-[0.15em] uppercase text-xs text-[#1a2b4a]">Filter</h3>
          {(selectedCats.length || selectedRanges.length || onSaleOnly) > 0 && (
            <button onClick={clearAll} className="text-xs text-[#c9a961] hover:underline">Clear all</button>
          )}
        </div>
      </div>

      <div>
        <p className="font-medium text-[#1a2b4a] mb-3">Category</p>
        <ul className="space-y-2">
          {collections.map((c) => (
            <li key={c.slug}>
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedCats.includes(c.slug)}
                  onChange={() => toggleCat(c.slug)}
                  className="w-4 h-4 accent-[#1a2b4a]"
                />
                <span className="text-gray-600 group-hover:text-[#1a2b4a] transition-colors">{c.title}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <p className="font-medium text-[#1a2b4a] mb-3">Price</p>
        <ul className="space-y-2">
          {PRICE_RANGES.map((r, i) => (
            <li key={r.label}>
              <label className="flex items-center gap-2.5 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={selectedRanges.includes(i)}
                  onChange={() => toggleRange(i)}
                  className="w-4 h-4 accent-[#1a2b4a]"
                />
                <span className="text-gray-600 group-hover:text-[#1a2b4a] transition-colors">{r.label}</span>
              </label>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <label className="flex items-center gap-2.5 cursor-pointer group">
          <input
            type="checkbox"
            checked={onSaleOnly}
            onChange={(e) => setOnSaleOnly(e.target.checked)}
            className="w-4 h-4 accent-[#1a2b4a]"
          />
          <span className="font-medium text-[#1a2b4a]">On Sale only</span>
        </label>
      </div>
    </aside>
  );

  return (
    <div className="grid lg:grid-cols-[240px_1fr] gap-10">
      {/* Desktop sidebar */}
      <div className="hidden lg:block">{Sidebar}</div>

      {/* Mobile filter toggle */}
      <div className="lg:hidden flex items-center justify-between gap-3 mb-4">
        <button
          onClick={() => setMobileOpen(true)}
          className="flex items-center gap-2 text-sm border border-[#e8e4d8] rounded px-4 py-2 text-[#1a2b4a]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <line x1="4" y1="6" x2="20" y2="6" /><line x1="4" y1="12" x2="14" y2="12" /><line x1="4" y1="18" x2="10" y2="18" />
          </svg>
          Filter
        </button>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border border-[#e8e4d8] rounded px-3 py-2 text-sm bg-white outline-none focus:border-[#1a2b4a]"
        >
          {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
      </div>

      {/* Mobile slide-over */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-80 bg-white p-6 overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-semibold text-[#1a2b4a]">Filters</h3>
              <button onClick={() => setMobileOpen(false)} className="text-gray-400">✕</button>
            </div>
            {Sidebar}
            <button
              onClick={() => setMobileOpen(false)}
              className="w-full mt-8 bg-[#1a2b4a] text-white py-3 rounded text-sm tracking-[0.15em] uppercase"
            >
              Show {filtered.length} results
            </button>
          </div>
        </div>
      )}

      <div>
        <div className="hidden lg:flex items-center justify-between mb-5">
          <p className="text-sm text-gray-500">{filtered.length} products</p>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Sort by:</span>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border border-[#e8e4d8] rounded px-3 py-1.5 text-sm bg-white outline-none focus:border-[#1a2b4a]"
            >
              {SORT_OPTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg">No products match your filters.</p>
            <button onClick={clearAll} className="inline-block mt-4 text-[#c9a961] font-medium hover:underline">
              Clear filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filtered.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
