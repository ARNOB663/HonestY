"use client";
import { useState, useRef } from "react";
import ProductCard from "./ProductCard";
import { ChevronLeft, ChevronRight } from "./Icons";

const TABS = [
  { label: "All", slug: null },
  { label: "Fashion", slug: "fashion" },
  { label: "Home & Living", slug: "home-living" },
  { label: "Beauty", slug: "beauty" },
  { label: "Wellness", slug: "wellness" },
  { label: "Electronics", slug: "electronics" },
];

export default function CategoryTabs({ products }) {
  const [activeTab, setActiveTab] = useState("All");
  const scrollRef = useRef(null);

  const activeSlug = TABS.find((t) => t.label === activeTab)?.slug;
  const filtered = !activeSlug ? products : products.filter((p) => p.collection === activeSlug);

  function scroll(dir) {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: dir * 300, behavior: "smooth" });
    }
  }

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[#e8e4d8] mb-6 overflow-x-auto no-scrollbar">
        {TABS.map((tab) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(tab.label)}
            className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.label
                ? "border-[#1a2b4a] text-[#1a2b4a]"
                : "border-transparent text-[#555] hover:text-[#1a2b4a]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Product grid with scroll arrows */}
      <div className="relative">
        <button
          onClick={() => scroll(-1)}
          className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white border border-[#e8e4d8] rounded-full w-9 h-9 flex items-center justify-center shadow hover:bg-gray-50 hidden md:flex"
          aria-label="Previous"
        >
          <ChevronLeft size={16} />
        </button>

        <div
          ref={scrollRef}
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3"
        >
          {filtered.slice(0, 12).map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
          {filtered.length === 0 && (
            <p className="col-span-full text-center text-gray-400 py-8">No products found.</p>
          )}
        </div>

        <button
          onClick={() => scroll(1)}
          className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white border border-[#e8e4d8] rounded-full w-9 h-9 flex items-center justify-center shadow hover:bg-gray-50 hidden md:flex"
          aria-label="Next"
        >
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
