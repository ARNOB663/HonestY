"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { HeartIcon, LayersIcon } from "./Icons";
import { formatMoney } from "../lib/format";
import { useWishlist } from "../context/WishlistContext";
import QuickViewModal from "./QuickViewModal";

export default function ProductCard({ product }) {
  const { slug, title, price, compareAtPrice, image, collection, inventory, variants } = product;
  const wishlist = useWishlist();
  const [quickView, setQuickView] = useState(false);
  const wished = wishlist.has(slug);
  const onSale = compareAtPrice && compareAtPrice > price;
  const discountPct = onSale ? Math.round((1 - price / compareAtPrice) * 100) : null;
  const savings = onSale ? compareAtPrice - price : 0;
  const tracked = variants?.length ? true : typeof inventory === "number";
  const stock = variants?.length
    ? variants.reduce((s, v) => s + (Number(v.inventory) || 0), 0)
    : (inventory ?? 0);
  const stockBadge = !tracked
    ? null
    : stock <= 0
    ? { label: "Out of stock", cls: "bg-red-50 text-red-700 border-red-200" }
    : stock <= 5
    ? { label: `Only ${stock} left`, cls: "bg-amber-50 text-amber-800 border-amber-200" }
    : null;

  return (
    <Link href={`/products/${slug}`} className="group block bg-white border border-[#e8e4d8] rounded-lg p-3 hover:shadow-md transition-shadow relative">
      {/* Discount badge */}
      {onSale && (
        <span className="absolute top-3 left-3 bg-[#b8553a] text-white text-[10px] font-bold px-2 py-0.5 rounded z-10 shadow-sm">
          -{discountPct}%
        </span>
      )}

      {/* Action buttons */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
        <button
          type="button"
          className={`transition-colors ${wished ? "text-[#b8553a]" : "text-gray-400 hover:text-[#b8553a]"}`}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); wishlist.toggle(slug); }}
          aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        >
          <HeartIcon size={15} />
        </button>
        <button
          className="text-gray-400 hover:text-[#1a2b4a] transition-colors"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setQuickView(true); }}
          aria-label="Quick view"
          title="Quick view"
        >
          <LayersIcon size={15} />
        </button>
      </div>
      {quickView && (
        <span onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
          <QuickViewModal product={product} onClose={() => setQuickView(false)} />
        </span>
      )}

      {/* Image */}
      <div className="relative h-36 flex items-center justify-center mb-3 bg-gray-50 rounded-md overflow-hidden">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 17vw"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gray-100 flex items-center justify-center text-xs text-gray-400">No image</div>
        )}
      </div>

      {/* Collection */}
      {collection && (
        <p className="text-[#1a2b4a] text-[11px] font-medium mb-1 capitalize">{collection.replace(/-/g, " ")}</p>
      )}

      {/* Title */}
      <h3 className="text-[13px] text-[#1a2b4a] leading-snug mb-2 line-clamp-2">{title}</h3>

      {/* Price */}
      <div className="flex items-baseline gap-1.5 flex-wrap">
        <span className="text-[#b8553a] font-bold text-[14px]">{formatMoney(price)}</span>
        {onSale && (
          <span className="text-[12px] text-gray-400 line-through">{formatMoney(compareAtPrice)}</span>
        )}
      </div>
      {onSale && (
        <p className="text-[10px] font-semibold text-green-700 mt-0.5">Save {formatMoney(savings)}</p>
      )}

      {stockBadge && (
        <div className={`mt-2 inline-block text-[10px] font-bold px-1.5 py-0.5 rounded border ${stockBadge.cls}`}>
          {stockBadge.label}
        </div>
      )}
    </Link>
  );
}
