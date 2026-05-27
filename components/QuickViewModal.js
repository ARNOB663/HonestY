"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useCart } from "../context/CartContext";
import { formatMoney } from "../lib/format";

export default function QuickViewModal({ product, onClose }) {
  const { add } = useCart();
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const hasVariants = variants.length > 0;
  const [variantId, setVariantId] = useState(hasVariants ? variants[0].id : null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const selectedVariant = hasVariants ? variants.find((v) => v.id === variantId) : null;
  const price = selectedVariant?.price ?? product.price;
  const stock = selectedVariant ? selectedVariant.inventory : (product.inventory ?? 100);
  const outOfStock = stock <= 0;
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const img = selectedVariant?.image || product.image;

  function handleAdd() {
    if (outOfStock) return;
    add(product, qty, selectedVariant);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[85vh] overflow-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-end p-2">
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1" aria-label="Close">✕</button>
        </div>
        <div className="grid sm:grid-cols-2 gap-5 px-5 pb-5">
          <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-50 border border-[#e8e4d8]">
            {img && <Image src={img} alt={product.title} fill className="object-cover" sizes="(max-width:640px) 100vw, 320px" />}
          </div>
          <div>
            {product.collection && <p className="text-[#1a35d4] text-xs font-semibold uppercase tracking-wider">{product.collection}</p>}
            <h2 className="text-xl font-bold text-[#1a1a1a] mt-1 leading-snug">{product.title}</h2>
            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-xl font-bold text-[#b8553a]">{formatMoney(price)}</span>
              {onSale && <span className="text-sm text-gray-400 line-through">{formatMoney(product.compareAtPrice)}</span>}
            </div>
            <p className={`text-xs font-semibold mt-2 ${outOfStock ? "text-red-600" : "text-[#16a34a]"}`}>
              {outOfStock ? "Out of Stock" : "In Stock"}
            </p>

            {hasVariants && (
              <div className="mt-4">
                <p className="text-xs font-semibold mb-1.5">Options</p>
                <div className="flex flex-wrap gap-1.5">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => setVariantId(v.id)}
                      disabled={v.inventory <= 0}
                      className={`px-2.5 py-1.5 rounded border text-xs ${
                        variantId === v.id ? "border-[#1a2b4a] bg-[#1a2b4a] text-white"
                        : v.inventory <= 0 ? "border-gray-200 text-gray-400 line-through"
                        : "border-[#e8e4d8] text-[#1a2b4a] hover:border-[#1a2b4a]"
                      }`}
                    >
                      {v.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3 mt-4">
              <div className="flex items-center border border-[#e8e4d8] rounded">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-8 h-9 text-lg text-[#1a2b4a]">−</button>
                <span className="w-8 text-center text-sm font-semibold border-x border-[#e8e4d8] h-9 flex items-center justify-center">{qty}</span>
                <button onClick={() => setQty((q) => Math.min(stock || 99, q + 1))} className="w-8 h-9 text-lg text-[#1a2b4a]">+</button>
              </div>
            </div>

            <button
              onClick={handleAdd}
              disabled={outOfStock}
              className="w-full mt-4 bg-[#1a2b4a] text-white font-bold py-2.5 rounded text-sm tracking-wide hover:bg-[#0e1a30] disabled:opacity-50"
              style={added ? { backgroundColor: "#16a34a" } : {}}
            >
              {outOfStock ? "OUT OF STOCK" : added ? "✓ ADDED" : "ADD TO CART"}
            </button>
            <Link
              href={`/products/${product.slug}`}
              className="block text-center mt-2 text-xs text-[#1a2b4a] hover:underline"
            >
              View full details →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
