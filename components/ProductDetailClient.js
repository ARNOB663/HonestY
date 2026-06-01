"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useRouter } from "next/navigation";
import { formatMoney } from "../lib/format";

const PLACEHOLDER = "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=800&q=80";

// Strip HTML tags and collapse whitespace so the right-column preview is
// always plain text, no matter what the admin pasted into the editor.
function plainText(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function DescriptionPreview({ html }) {
  const text = plainText(html);
  if (!text) return null;
  const snippet = text.length > 280 ? text.slice(0, 280).replace(/\s+\S*$/, "") + "…" : text;
  return (
    <div className="pt-4 border-t border-[#e8e4d8]">
      <p className="text-[11px] uppercase tracking-[0.15em] text-gray-500 mb-2">Description</p>
      <p className="text-sm text-gray-700 leading-relaxed">{snippet}</p>
      {text.length > 280 && (
        <a href="#desc" className="inline-block mt-2 text-xs font-semibold text-[#1a2b4a] hover:text-[#b8553a] underline-offset-2 hover:underline">
          Read more →
        </a>
      )}
    </div>
  );
}

export default function ProductDetailClient({ product }) {
  const { add, openDrawer } = useCart();
  const { toast } = useToast();
  const router = useRouter();
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const hasVariants = variants.length > 0;
  const [variantId, setVariantId] = useState(hasVariants ? variants[0].id : null);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [activeImg, setActiveImg] = useState(0);

  const selectedVariant = hasVariants ? variants.find((v) => v.id === variantId) : null;
  const effectivePrice = selectedVariant?.price ?? product.price;
  const effectiveStock = selectedVariant ? selectedVariant.inventory : product.inventory ?? 100;
  const outOfStock = effectiveStock <= 0;

  // Build the gallery, putting the selected variant's image first when present.
  const gallery = useMemo(() => {
    const base = Array.isArray(product.images) && product.images.length > 0
      ? product.images
      : product.image
        ? [product.image]
        : [PLACEHOLDER];
    if (selectedVariant?.image) {
      // Variant image takes the lead slot; deduplicate.
      return [selectedVariant.image, ...base.filter((u) => u !== selectedVariant.image)];
    }
    return base;
  }, [product.images, product.image, selectedVariant?.image]);

  // When the variant changes, snap the gallery back to the first image (which is
  // the variant's image when set).
  function pickVariant(id) {
    setVariantId(id);
    setActiveImg(0);
  }

  function handleAdd() {
    if (outOfStock) return;
    add(product, qty, selectedVariant);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    toast({
      message: `Added "${selectedVariant ? `${product.title} — ${selectedVariant.name}` : product.title}" to cart`,
      action: { label: "View cart", onClick: openDrawer },
    });
  }

  function handleBuyNow() {
    if (outOfStock) return;
    add(product, qty, selectedVariant);
    router.push("/checkout");
  }

  const hasColorSwatches = variants.some((v) => v.colorHex || v.image);

  // Back-in-stock alert state
  const [alertEmail, setAlertEmail] = useState("");
  const [alertState, setAlertState] = useState("idle"); // idle | sending | done | error
  async function requestAlert(e) {
    e.preventDefault();
    if (!alertEmail.trim()) return;
    setAlertState("sending");
    try {
      const r = await fetch("/api/stock-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: alertEmail.trim(), productSlug: product.slug, variantId: selectedVariant?.id || null }),
      });
      setAlertState(r.ok ? "done" : "error");
    } catch {
      setAlertState("error");
    }
  }

  return (
    <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
      {/* Gallery */}
      <div className="flex flex-col gap-3">
        <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-50 border border-[#e8e4d8]">
          <Image
            src={gallery[activeImg] || PLACEHOLDER}
            alt={product.title}
            fill
            priority
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
        {gallery.length > 1 && (
          <div className="flex gap-2 overflow-x-auto">
            {gallery.map((src, i) => (
              <button
                key={src + i}
                onClick={() => setActiveImg(i)}
                className={`relative w-16 h-16 rounded border-2 overflow-hidden shrink-0 transition-colors ${
                  activeImg === i ? "border-[#1a2b4a]" : "border-[#e8e4d8] hover:border-gray-300"
                }`}
              >
                <Image src={src} alt="" fill className="object-cover" sizes="64px" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info + Add to cart */}
      <div className="space-y-4">
        {/* Variant picker — color swatches (when available) or text buttons */}
        {hasVariants && hasColorSwatches && (
          <div>
            <p className="text-sm font-semibold mb-2.5">
              Color{selectedVariant && <span className="text-gray-500 font-normal"> — {selectedVariant.name}</span>}
            </p>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => {
                const isSelected = variantId === v.id;
                const disabled = v.inventory <= 0;
                return (
                  <button
                    key={v.id}
                    onClick={() => pickVariant(v.id)}
                    disabled={disabled}
                    title={v.name}
                    className={`relative rounded-full border-2 transition-all ${
                      isSelected ? "border-[#1a2b4a]" : "border-transparent hover:border-gray-300"
                    } ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                    style={{ padding: 2 }}
                  >
                    <span
                      className="block w-10 h-10 rounded-full overflow-hidden border border-gray-200"
                      style={v.image ? undefined : { backgroundColor: v.colorHex || "#e8e4d8" }}
                    >
                      {v.image && (
                        <Image src={v.image} alt={v.name} width={40} height={40} className="object-cover w-full h-full" />
                      )}
                    </span>
                    {disabled && <span className="absolute inset-0 flex items-center justify-center text-[10px] text-gray-500">×</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {hasVariants && !hasColorSwatches && (
          <div>
            <p className="text-sm font-semibold mb-2.5">Options</p>
            <div className="flex flex-wrap gap-2">
              {variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => pickVariant(v.id)}
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

        {outOfStock && (
          <div className="border border-[#e8e4d8] rounded p-3 bg-[#fafaf7]">
            {alertState === "done" ? (
              <p className="text-sm text-green-700">✓ We&apos;ll email you when this is back in stock.</p>
            ) : (
              <form onSubmit={requestAlert} className="space-y-2">
                <p className="text-xs font-semibold text-[#1a2b4a]">Notify me when available</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={alertEmail}
                    onChange={(e) => setAlertEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="flex-1 border border-[#e8e4d8] rounded px-3 py-2 text-sm outline-none focus:border-[#1a2b4a]"
                  />
                  <button disabled={alertState === "sending"} className="bg-[#1a2b4a] text-white text-sm font-bold px-4 rounded disabled:opacity-50">
                    {alertState === "sending" ? "…" : "Notify"}
                  </button>
                </div>
                {alertState === "error" && <p className="text-xs text-red-600">Couldn&apos;t save. Try again.</p>}
              </form>
            )}
          </div>
        )}

        <button
          onClick={handleBuyNow}
          disabled={outOfStock}
          className="w-full border border-[#1a2b4a] text-[#1a2b4a] font-bold py-3.5 rounded text-sm tracking-wide hover:bg-[#1a2b4a] hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          BUY NOW {formatMoney(effectivePrice * qty)}
        </button>

        {/* Short description preview — fills the empty right column under
            the CTAs. Full HTML description still renders in the tabs below. */}
        {product.description && (
          <DescriptionPreview html={product.description} />
        )}

        {/* Mobile sticky CTA */}
        <div className="md:hidden fixed inset-x-0 bottom-0 z-40 bg-white border-t border-[#e8e4d8] px-4 py-3 flex items-center gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-gray-500 uppercase tracking-wide">Total</p>
            <p className="text-base font-bold text-[#b8553a] truncate">{formatMoney(effectivePrice * qty)}</p>
          </div>
          <button onClick={handleAdd} disabled={outOfStock} className="flex-1 border border-[#1a2b4a] text-[#1a2b4a] font-bold py-2.5 rounded text-xs tracking-wide disabled:opacity-50">
            {outOfStock ? "OUT" : added ? "✓ ADDED" : "ADD"}
          </button>
          <button onClick={handleBuyNow} disabled={outOfStock} className="flex-1 bg-[#1a2b4a] text-white font-bold py-2.5 rounded text-xs tracking-wide disabled:opacity-50">
            BUY NOW
          </button>
        </div>
        <div className="md:hidden h-16" aria-hidden />
      </div>
    </div>
  );
}
