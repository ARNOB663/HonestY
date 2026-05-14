"use client";
import Link from "next/link";
import Image from "next/image";
import { HeartIcon, LayersIcon, StarIcon } from "./Icons";
import { formatMoney } from "../lib/format";

export default function ProductCard({ product }) {
  const { slug, title, price, compareAtPrice, image, collection } = product;
  const discount = compareAtPrice ? `-${Math.round((1 - price / compareAtPrice) * 100)}%` : null;

  return (
    <Link href={`/products/${slug}`} className="group block bg-white border border-[#e8e4d8] rounded-lg p-3 hover:shadow-md transition-shadow relative">
      {/* Discount badge */}
      {discount && (
        <span className="absolute top-3 left-3 bg-[#1a2b4a] text-white text-[10px] font-bold px-1.5 py-0.5 rounded z-10">
          {discount}
        </span>
      )}

      {/* Action buttons */}
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
        <button className="text-gray-400 hover:text-[#b8553a] transition-colors" onClick={(e) => e.preventDefault()} aria-label="Wishlist">
          <HeartIcon size={15} />
        </button>
        <button className="text-gray-400 hover:text-[#1a2b4a] transition-colors" onClick={(e) => e.preventDefault()} aria-label="Compare">
          <LayersIcon size={15} />
        </button>
      </div>

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

      {/* Brand */}
      <p className="text-[#1a2b4a] text-[11px] font-medium mb-1 capitalize">{collection || "Electronics"}</p>

      {/* Title */}
      <h3 className="text-[13px] text-[#1a2b4a] leading-snug mb-2 line-clamp-2">{title}</h3>

      {/* Stars */}
      <div className="flex items-center gap-0.5 mb-2">
        {[1,2,3,4,5].map((i) => (
          <StarIcon key={i} size={11} className="text-gray-300" />
        ))}
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-1.5">
        {compareAtPrice && (
          <span className="text-[12px] text-gray-400 line-through">{formatMoney(compareAtPrice)}</span>
        )}
        <span className="text-[#b8553a] font-bold text-[14px]">{formatMoney(price)}</span>
      </div>
    </Link>
  );
}
