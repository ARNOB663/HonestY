"use client";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "../../context/CartContext";
import { formatMoney } from "../../lib/format";

export default function CartPage() {
  const { items, setQty, remove, subtotal, hydrated, clear } = useCart();

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
        <div className="max-w-7xl mx-auto px-4 py-20 text-center">
          <svg className="mx-auto mb-4 text-gray-300" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
          <h1 className="text-2xl font-bold text-[#1a2b4a]">Your cart is empty</h1>
          <p className="mt-2 text-gray-500 text-sm">Looks like you haven&apos;t added anything yet.</p>
          <Link href="/products" className="inline-block mt-6 bg-[#1a2b4a] text-white font-bold px-8 py-3 rounded text-sm tracking-wide hover:bg-[#0e1a30] transition-colors">
            SHOP PRODUCTS
          </Link>
        </div>
      </div>
    );
  }

  const shipping = subtotal >= 2000 ? 0 : 80;
  const total = subtotal + shipping;

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
              <div key={item.slug} className="grid grid-cols-12 gap-4 items-center border border-[#e8e4d8] rounded-lg p-4">
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
                    <button onClick={() => remove(item.slug)} className="text-xs text-gray-400 hover:text-[#b8553a] mt-1 transition-colors">
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
                      onClick={() => setQty(item.slug, item.qty - 1)}
                      className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-50 text-[#1a2b4a]"
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-sm font-semibold border-x border-[#e8e4d8]">{item.qty}</span>
                    <button
                      onClick={() => setQty(item.slug, item.qty + 1)}
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
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-medium">{formatMoney(subtotal)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span className="font-medium">{shipping === 0 ? <span className="text-[#16a34a]">Free</span> : formatMoney(shipping)}</span>
              </div>
              {shipping > 0 && (
                <p className="text-xs text-gray-400">Free shipping on orders over {formatMoney(2000)}</p>
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
