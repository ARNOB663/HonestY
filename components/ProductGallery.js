"use client";
import { useState } from "react";
import Image from "next/image";

const PLACEHOLDER = "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80";

export default function ProductGallery({ product }) {
  const gallery = Array.isArray(product.images) && product.images.length > 0
    ? product.images
    : product.image
      ? [product.image]
      : [PLACEHOLDER];

  const [active, setActive] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-50 border border-[#e8e4d8]">
        <Image
          src={gallery[active]}
          alt={product.title}
          fill
          priority
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 50vw"
        />
      </div>
      {gallery.length > 1 && (
        <div className="flex gap-2">
          {gallery.map((src, i) => (
            <button
              key={i}
              onClick={() => setActive(i)}
              className={`relative w-16 h-16 rounded border-2 overflow-hidden shrink-0 transition-colors ${
                active === i ? "border-[#1a2b4a]" : "border-[#e8e4d8] hover:border-gray-300"
              }`}
            >
              <Image src={src} alt="" fill className="object-cover" sizes="64px" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
