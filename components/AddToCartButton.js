"use client";
import { useState } from "react";
import { useCart } from "../context/CartContext";
import { useRouter } from "next/navigation";
import { formatMoney } from "../lib/format";

export default function AddToCartButton({ product }) {
  const { add } = useCart();
  const router = useRouter();
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const hasVariants = variants.length > 0;
  const [variantId, setVariantId] = useState(hasVariants ? variants[0].id : null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const selectedVariant = hasVariants ? variants.find((v) => v.id === variantId) : null;
  const effectivePrice = selectedVariant?.price ?? product.price;
  const effectiveStock = selectedVariant ? selectedVariant.inventory : product.inventory ?? 100;
  const outOfStock = effectiveStock <= 0;

  function handleAdd() {
    if (outOfStock) return;
    add(product, qty, selectedVariant);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }

  function handleBuyNow() {
    if (outOfStock) return;
    add(product, qty, selectedVariant);
    router.push("/checkout");
  }

  return (
    <div className="space-y-4">
      {hasVariants && (
        <div>
          <p className="text-sm font-semibold mb-2.5">Options</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((v) => (
              <button
                key={v.id}
                onClick={() => setVariantId(v.id)}
                disabled={v.inventory <= 0}
                className={`px-3 py-2 rounded border text-sm transition-colors ${
                  variantId === v.id
                    ? "border-[#1a2b4a] bg-[#1a2b4a] text-white"
                    : v.inventory <= 0
                      ? "border-gray-200 text-gray-400 line-through cursor-not-allowed"
                      : "border-[#e8e4d8] text-[#1a2b4a] hover:border-[#1a2b4a]"
                }`}
              >
                {v.name}
                {v.price != null && v.price !== product.price && (
                  <span className="ml-1 text-xs opacity-80">({formatMoney(v.price)})</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity */}
      <div>
        <p className="text-sm font-semibold mb-2.5">Quantity</p>
        <div className="flex items-center border border-[#e8e4d8] rounded w-fit">
          <button
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            className="w-10 h-11 text-xl text-[#1a2b4a] hover:bg-gray-50 flex items-center justify-center"
            aria-label="Decrease"
          >−</button>
          <span className="w-12 text-center font-semibold border-x border-[#e8e4d8] h-11 flex items-center justify-center">{qty}</span>
          <button
            onClick={() => setQty((q) => Math.min(effectiveStock || 99, q + 1))}
            className="w-10 h-11 text-xl text-[#1a2b4a] hover:bg-gray-50 flex items-center justify-center"
            aria-label="Increase"
          >+</button>
        </div>
        {effectiveStock > 0 && effectiveStock <= 5 && (
          <p className="text-xs text-amber-700 mt-1">Only {effectiveStock} left</p>
        )}
      </div>

      <button
        onClick={handleAdd}
        disabled={outOfStock}
        className="w-full bg-[#1a2b4a] text-white font-bold py-3.5 rounded text-sm tracking-wide hover:bg-[#0e1a30] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        style={added ? { backgroundColor: "#16a34a" } : {}}
      >
        {outOfStock ? "OUT OF STOCK" : added ? "✓ ADDED TO CART" : "ADD TO CART"}
      </button>

      <button
        onClick={handleBuyNow}
        disabled={outOfStock}
        className="w-full border border-[#1a2b4a] text-[#1a2b4a] font-bold py-3.5 rounded text-sm tracking-wide hover:bg-[#1a2b4a] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        BUY NOW — {formatMoney(effectivePrice * qty)}
      </button>
    </div>
  );
}
