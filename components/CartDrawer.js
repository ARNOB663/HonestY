"use client";
import { useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "../context/CartContext";
import { useShipping, computeShipping } from "../lib/useShipping";
import { formatMoney } from "../lib/format";

function lineKey(slug, variantId) {
  return variantId ? `${slug}#${variantId}` : slug;
}

// Slide-in cart drawer. Mounted at root via Providers; only renders DOM when
// open so closed state has zero cost. No animation library — pure CSS.
export default function CartDrawer() {
  const { items, setQty, remove, subtotal, drawerOpen, closeDrawer } = useCart();
  const shippingSettings = useShipping();
  const panelRef = useRef(null);
  const lastFocusRef = useRef(null);

  // Close on ESC, lock body scroll, trap focus inside the drawer panel, and
  // restore focus to the element that opened the drawer.
  useEffect(() => {
    if (!drawerOpen) return;
    lastFocusRef.current = document.activeElement;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function focusables() {
      if (!panelRef.current) return [];
      return Array.from(panelRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      )).filter((el) => el.offsetParent !== null);
    }

    function onKey(e) {
      if (e.key === "Escape") { closeDrawer(); return; }
      if (e.key !== "Tab") return;
      const list = focusables();
      if (list.length === 0) return;
      const first = list[0];
      const last = list[list.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); first.focus();
      }
    }

    document.addEventListener("keydown", onKey);
    // Move focus into the panel on open.
    queueMicrotask(() => {
      const list = focusables();
      if (list[0]) list[0].focus();
    });

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      if (lastFocusRef.current && typeof lastFocusRef.current.focus === "function") {
        lastFocusRef.current.focus();
      }
    };
  }, [drawerOpen, closeDrawer]);

  if (!drawerOpen) return null;

  const shipping = computeShipping(subtotal, shippingSettings);
  const total = subtotal + shipping;
  const freeThreshold = shippingSettings.freeShippingThreshold || 0;
  const amountToFree = freeThreshold > 0 ? Math.max(0, freeThreshold - subtotal) : 0;
  const progressPct = freeThreshold > 0 ? Math.min(100, Math.round((subtotal / freeThreshold) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-[80]" role="dialog" aria-modal="true" aria-labelledby="cart-drawer-title">
      {/* Backdrop */}
      <button
        type="button"
        onClick={closeDrawer}
        aria-label="Close cart"
        className="absolute inset-0 bg-black/40 animate-fade-in"
      />
      {/* Panel */}
      <div ref={panelRef} className="absolute top-0 right-0 h-full w-full sm:w-[420px] bg-white shadow-2xl flex flex-col animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e4d8]">
          <h2 id="cart-drawer-title" className="font-serif text-lg text-[#1a2b4a]">
            Your cart {items.length > 0 && <span className="text-gray-400 text-sm font-sans">· {items.length}</span>}
          </h2>
          <button onClick={closeDrawer} aria-label="Close" className="text-gray-400 hover:text-[#1a2b4a] text-xl leading-none">×</button>
        </div>

        {/* Body */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#c9a961" strokeWidth={1.5}>
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/>
              <path d="M16 10a4 4 0 0 1-8 0"/>
            </svg>
            <p className="font-serif text-lg text-[#1a2b4a] mt-3">Your cart is empty</p>
            <p className="text-sm text-gray-500 mt-1">Add something nice.</p>
            <Link
              href="/products"
              onClick={closeDrawer}
              className="mt-5 bg-[#1a2b4a] text-white font-bold px-6 py-2.5 rounded text-sm tracking-wide hover:bg-[#0e1a30] transition-colors"
            >
              SHOP PRODUCTS
            </Link>
          </div>
        ) : (
          <>
            {/* Free shipping progress */}
            {freeThreshold > 0 && (
              <div className="px-5 py-3 bg-[#fafaf7] border-b border-[#f0eee5]">
                {amountToFree > 0 ? (
                  <>
                    <p className="text-xs text-[#1a2b4a]">
                      Spend <strong className="text-[#b8553a]">{formatMoney(amountToFree)}</strong> more for FREE shipping
                    </p>
                    <div className="mt-1.5 h-1 bg-[#e8e4d8] rounded-full overflow-hidden">
                      <div className="h-full bg-[#c9a961] transition-all" style={{ width: `${progressPct}%` }} />
                    </div>
                  </>
                ) : (
                  <p className="text-xs font-semibold text-green-700">✓ You&apos;ve unlocked FREE shipping!</p>
                )}
              </div>
            )}

            {/* Items */}
            <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
              {items.map((item) => (
                <div key={lineKey(item.slug, item.variantId)} className="flex gap-3 items-start">
                  <Link
                    href={`/products/${item.slug}`}
                    onClick={closeDrawer}
                    className="relative w-16 h-16 rounded-md overflow-hidden bg-gray-50 border border-[#e8e4d8] shrink-0"
                  >
                    {item.image && <Image src={item.image} alt={item.title} fill className="object-cover" sizes="64px" />}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={closeDrawer}
                      className="text-sm font-medium text-[#1a2b4a] line-clamp-2 leading-snug hover:underline block"
                    >
                      {item.title}
                    </Link>
                    {item.variantName && <p className="text-[11px] text-gray-500 mt-0.5">{item.variantName}</p>}
                    <div className="flex items-center justify-between mt-1.5">
                      <div className="flex items-center border border-[#e8e4d8] rounded text-xs">
                        <button onClick={() => setQty(item.slug, item.qty - 1, item.variantId)} className="w-6 h-6 text-[#1a2b4a] hover:bg-gray-50">−</button>
                        <span className="w-6 text-center font-semibold border-x border-[#e8e4d8]">{item.qty}</span>
                        <button onClick={() => setQty(item.slug, item.qty + 1, item.variantId)} className="w-6 h-6 text-[#1a2b4a] hover:bg-gray-50">+</button>
                      </div>
                      <span className="font-bold text-sm text-[#b8553a]">{formatMoney(item.price * item.qty)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => remove(item.slug, item.variantId)}
                    aria-label="Remove item"
                    className="text-gray-300 hover:text-[#b8553a] text-xs px-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="border-t border-[#e8e4d8] px-5 py-4 space-y-2.5 bg-white">
              <div className="flex justify-between text-sm text-gray-500"><span>Subtotal</span><span>{formatMoney(subtotal)}</span></div>
              <div className="flex justify-between text-sm text-gray-500">
                <span>Shipping</span>
                <span>{shipping === 0 ? <span className="text-[#16a34a]">Free</span> : formatMoney(shipping)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-[#e8e4d8] pt-2">
                <span>Total</span>
                <span className="text-[#b8553a]">{formatMoney(total)}</span>
              </div>
              <Link
                href="/checkout"
                onClick={closeDrawer}
                className="block text-center w-full bg-[#1a2b4a] text-white font-bold py-3 rounded text-sm tracking-wide hover:bg-[#0e1a30] transition-colors mt-1"
              >
                CHECKOUT — {formatMoney(total)}
              </Link>
              <Link
                href="/cart"
                onClick={closeDrawer}
                className="block text-center text-xs text-gray-500 hover:text-[#1a2b4a] underline-offset-2 hover:underline"
              >
                View full cart
              </Link>
            </div>
          </>
        )}
      </div>

      <style jsx global>{`
        @keyframes drawer-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes drawer-slide {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        .animate-fade-in { animation: drawer-fade 0.18s ease-out; }
        .animate-slide-in { animation: drawer-slide 0.22s ease-out; }
      `}</style>
    </div>
  );
}
