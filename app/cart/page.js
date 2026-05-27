"use client";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "../../context/CartContext";
import { formatMoney } from "../../lib/format";
import { useShipping, computeShipping } from "../../lib/useShipping";

function lineKey(slug, variantId) {
  return variantId ? `${slug}#${variantId}` : slug;
}

export default function CartPage() {
  const { items, setQty, remove, subtotal, hydrated, clear } = useCart();
  const shippingSettings = useShipping();

  if (!hydrated) {
    return <div className="px-4 max-w-7xl mx-auto py-16 text-center text-gray-400">Loading…</div>;
  }

  if (items.length === 0) {
    return (
      <div className="bg-white min-h-screen">
        <div className="border-b border-[#e8e4d8]">
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
            <Link href="/" className="hover:text-[#1a2b4a]">Home</Link>
            <span>/</span>
            <span className="text-[#1a2b4a] font-medium">Cart</span>
          </div>
        </div>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center">
          <svg className="mx-auto mb-5 text-[#c9a961]" width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <h1 className="font-serif text-3xl text-[#1a2b4a]">Your cart is empty</h1>
          <p className="mt-2 text-gray-500 text-sm">Start with our editor&apos;s picks or browse by category.</p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
            <Link href="/products" className="bg-[#1a2b4a] text-white font-bold px-7 py-3 rounded text-sm tracking-wide hover:bg-[#0e1a30] transition-colors">
              SHOP ALL PRODUCTS
            </Link>
            <Link href="/wishlist" className="border border-[#1a2b4a] text-[#1a2b4a] font-bold px-7 py-3 rounded text-sm tracking-wide hover:bg-[#1a2b4a] hover:text-white transition-colors">
              VIEW WISHLIST
            </Link>
          </div>
          <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-xl mx-auto">
            {[
              { slug: "fashion", label: "Fashion" },
              { slug: "home-living", label: "Home & Living" },
              { slug: "beauty", label: "Beauty" },
              { slug: "wellness", label: "Wellness" },
            ].map((c) => (
              <Link key={c.slug} href={`/collections/${c.slug}`} className="text-xs uppercase tracking-wide border border-[#e8e4d8] rounded py-2.5 hover:border-[#1a2b4a] hover:bg-white transition-colors text-[#1a2b4a] font-medium">
                {c.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const shipping = computeShipping(subtotal, shippingSettings);
  const total = subtotal + shipping;
  const freeThreshold = shippingSettings.freeShippingThreshold || 0;
  const amountToFree = freeThreshold > 0 ? Math.max(0, freeThreshold - subtotal) : 0;
  const progressPct = freeThreshold > 0 ? Math.min(100, Math.round((subtotal / freeThreshold) * 100)) : 0;

  return (
    <div className="bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="border-b border-[#e8e4d8]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-[#1a2b4a]">Home</Link>
          <span>/</span>
          <span className="text-[#1a2b4a] font-medium">Cart</span>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-5">
            <h1 className="text-xl font-bold text-[#1a2b4a]">Shopping Cart ({items.length})</h1>
            <button onClick={clear} className="text-sm text-gray-400 hover:text-[#b8553a] transition-colors">
              Clear Cart
            </button>
          </div>

          {/* Header row (desktop) */}
          <div className="hidden sm:grid grid-cols-12 gap-4 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-[#e8e4d8] pb-3 mb-3">
            <div className="col-span-6">Product</div>
            <div className="col-span-2 text-center">Price</div>
            <div className="col-span-2 text-center">Qty</div>
            <div className="col-span-2 text-right">Total</div>
          </div>

          <div className="space-y-4">
            {items.map((item) => (
              <div key={lineKey(item.slug, item.variantId)} className="grid grid-cols-12 gap-4 items-center border border-[#e8e4d8] rounded-lg p-4">
                {/* Image + title */}
                <div className="col-span-12 sm:col-span-6 flex items-center gap-3">
                  <div className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-50 border border-[#e8e4d8] shrink-0">
                    {item.image && (
                      <Image src={item.image} alt={item.title} fill className="object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <Link href={`/products/${item.slug}`} className="text-sm font-medium text-[#1a2b4a] hover:text-[#1a2b4a] line-clamp-2 block">
                      {item.title}
                    </Link>
                    {item.variantName && (
                      <p className="text-xs text-gray-500 mt-0.5">Option: {item.variantName}</p>
                    )}
                    <button onClick={() => remove(item.slug, item.variantId)} className="text-xs text-gray-400 hover:text-[#b8553a] mt-1 transition-colors">
                      Remove
                    </button>
                  </div>
                </div>

                {/* Price */}
                <div className="col-span-4 sm:col-span-2 text-center text-sm text-[#b8553a] font-semibold">
                  {formatMoney(item.price)}
                </div>

                {/* Qty */}
                <div className="col-span-4 sm:col-span-2 flex items-center justify-center">
                  <div className="flex items-center border border-[#e8e4d8] rounded">
                    <button
                      onClick={() => setQty(item.slug, item.qty - 1, item.variantId)}
                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-50 text-[#1a2b4a]"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-semibold border-x border-[#e8e4d8]">{item.qty}</span>
                    <button
                      onClick={() => setQty(item.slug, item.qty + 1, item.variantId)}
                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-50 text-[#1a2b4a]"
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Total */}
                <div className="col-span-4 sm:col-span-2 text-right font-bold text-sm text-[#1a2b4a]">
                  {formatMoney(item.price * item.qty)}
                </div>
              </div>
            ))}
          </div>

          {/* Continue shopping */}
          <div className="mt-6">
            <Link href="/products" className="inline-flex items-center gap-2 text-sm text-[#1a2b4a] font-medium hover:underline">
              ← Continue Shopping
            </Link>
          </div>
        </div>

        {/* Order summary */}
        <aside className="lg:col-span-1">
          <div className="border border-[#e8e4d8] rounded-lg p-6 sticky top-24">
            <h2 className="text-base font-bold text-[#1a2b4a] mb-4">Order Summary</h2>

            {freeThreshold > 0 && (
              <div className="mb-4 p-3 rounded border border-[#e8e4d8] bg-[#fafaf7]">
                {amountToFree > 0 ? (
                  <>
                    <p className="text-xs text-[#1a2b4a]">
                      Spend <strong className="text-[#b8553a]">{formatMoney(amountToFree)}</strong> more for <strong>FREE shipping</strong>
                    </p>
                    <div className="mt-2 h-1.5 bg-[#e8e4d8] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#c9a961] transition-all"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </>
                ) : (
                  <p className="text-xs font-semibold text-green-700 flex items-center gap-1.5">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
                    You&apos;ve unlocked FREE shipping!
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className="font-medium">{shipping === 0 ? <span className="text-[#16a34a]">Free</span> : formatMoney(shipping)}</span>
              </div>
              {shipping > 0 && shippingSettings.freeShippingThreshold > 0 && (
                <p className="text-xs text-gray-400">Free shipping on orders over {formatMoney(shippingSettings.freeShippingThreshold)}</p>
              )}
              <div className="border-t border-[#e8e4d8] pt-3 flex justify-between font-bold text-base">
                <span>Total</span>
                <span className="text-[#b8553a]">{formatMoney(total)}</span>
              </div>
            </div>
            <Link
              href="/checkout"
              className="block text-center bg-[#1a2b4a] text-white font-bold py-3 rounded text-sm tracking-wide hover:bg-[#0e1a30] transition-colors mt-5"
            >
              PROCEED TO CHECKOUT
            </Link>
            <div className="mt-4 flex flex-wrap gap-1 justify-center">
              {["bKash","Nagad","Rocket","Visa","Mastercard","COD"].map((p) => (
                <span key={p} className="bg-gray-100 text-gray-500 text-[10px] font-bold px-2 py-0.5 rounded">{p}</span>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
