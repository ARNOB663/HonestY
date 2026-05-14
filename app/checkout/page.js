"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useCart } from "../../context/CartContext";
import { formatMoney, BD_DIVISIONS } from "../../lib/format";

const inputCls = "w-full border border-[#e8e4d8] rounded px-3 py-2.5 text-sm outline-none focus:border-[#1a2b4a] transition-colors bg-white";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, subtotal, hydrated, clear, notice, dismissNotice } = useCart();
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [form, setForm] = useState({ name: "", phone: "", line1: "", area: "", city: "", state: "Dhaka", zip: "", country: "Bangladesh" });

  // Discount code
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(null); // { code, type, value, discountAmount }
  const [codeMsg, setCodeMsg] = useState("");
  const [checkingCode, setCheckingCode] = useState(false);

  if (!hydrated || status === "loading") {
    return <div className="px-4 max-w-7xl mx-auto py-16 text-center text-gray-400">Loading…</div>;
  }

  if (!session?.user) {
    return (
      <div className="bg-white min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1a2b4a]">Sign in to check out</h1>
          <p className="mt-2 text-gray-500 text-sm">You&apos;ll need an account to place an order.</p>
          <Link href="/login?callbackUrl=/checkout" className="inline-block mt-6 bg-[#1a2b4a] text-white font-bold px-8 py-3 rounded text-sm tracking-wide hover:bg-[#0e1a30] transition-colors">
            SIGN IN
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0 && !done) {
    return (
      <div className="bg-white min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[#1a2b4a]">Nothing to check out</h1>
          <Link href="/products" className="inline-block mt-6 bg-[#1a2b4a] text-white font-bold px-8 py-3 rounded text-sm tracking-wide hover:bg-[#0e1a30] transition-colors">
            SHOP PRODUCTS
          </Link>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className="bg-white min-h-[60vh] flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-[#f0fdf4] rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2.5}><polyline points="20 6 9 17 4 12"/></svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1a2b4a]">Order Placed!</h1>
          <p className="mt-2 text-gray-500 text-sm">
            Thanks, {session.user.name || session.user.email}. We&apos;ll contact you shortly to confirm.
          </p>
          {orderId && <p className="mt-1 text-xs text-gray-400">Order #{orderId.slice(-6)}</p>}
          <div className="flex items-center justify-center gap-2 mt-6">
            <Link href={`/track?id=${orderId}`} className="border border-[#1a2b4a] text-[#1a2b4a] font-bold px-6 py-2.5 rounded text-sm hover:bg-[#1a2b4a] hover:text-white transition-colors">
              TRACK ORDER
            </Link>
            <button
              onClick={() => router.push("/")}
              className="bg-[#1a2b4a] text-white font-bold px-6 py-2.5 rounded text-sm tracking-wide hover:bg-[#0e1a30] transition-colors"
            >
              KEEP SHOPPING
            </button>
          </div>
        </div>
      </div>
    );
  }

  const shipping = subtotal >= 2000 ? 0 : 80;
  const discountAmount = applied?.discountAmount || 0;
  const total = Math.max(0, subtotal - discountAmount) + shipping;
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function applyCode() {
    if (!code.trim()) return;
    setCheckingCode(true); setCodeMsg("");
    try {
      const r = await fetch("/api/discounts/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim(), subtotal }),
      });
      const data = await r.json();
      if (!r.ok) { setApplied(null); setCodeMsg(data.error || "Invalid code"); }
      else { setApplied(data); setCodeMsg(`Applied: −${formatMoney(data.discountAmount)}`); }
    } finally { setCheckingCode(false); }
  }

  function removeCode() {
    setApplied(null); setCode(""); setCodeMsg("");
  }

  async function placeOrder(e) {
    e.preventDefault();
    setPlacing(true);
    const shippingAddress = {
      name: form.name,
      line1: [form.line1, form.area].filter(Boolean).join(", "),
      city: form.city,
      state: form.state,
      zip: form.zip,
      country: form.country,
      phone: form.phone,
    };
    const r = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ slug: i.slug, qty: i.qty })),
        shippingAddress,
        discountCode: applied?.code,
      }),
    });
    setPlacing(false);
    if (r.ok) {
      const data = await r.json();
      setOrderId(data.id || "");
      clear();
      setDone(true);
      return;
    }
    let msg = "Failed to place order";
    try { const data = await r.json(); if (data?.error) msg = data.error; } catch {}
    alert(msg);
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="border-b border-[#e8e4d8]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-[#1a2b4a]">Home</Link>
          <span>/</span>
          <Link href="/cart" className="hover:text-[#1a2b4a]">Cart</Link>
          <span>/</span>
          <span className="text-[#1a2b4a] font-medium">Checkout</span>
        </div>
      </div>

      {notice && (
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-2.5 rounded flex items-start justify-between gap-3">
            <span>Cart updated: {notice}</span>
            <button onClick={dismissNotice} className="text-amber-700 hover:text-amber-900 text-xs">Dismiss</button>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 grid lg:grid-cols-3 gap-8">
        <form onSubmit={placeOrder} className="lg:col-span-2 space-y-6">
          <h1 className="text-xl font-bold text-[#1a2b4a]">Checkout</h1>

          <div className="border border-[#e8e4d8] rounded-lg p-6">
            <h2 className="text-sm font-bold text-[#1a2b4a] uppercase tracking-wide mb-4">Contact</h2>
            <div className="space-y-3">
              <label htmlFor="co-name" className="sr-only">Full name</label>
              <input id="co-name" className={inputCls} placeholder="Full name" value={form.name} onChange={set("name")} required autoComplete="name" />
              <label htmlFor="co-phone" className="sr-only">Mobile number</label>
              <input id="co-phone" className={inputCls} placeholder="Mobile (e.g. 01XXXXXXXXX)" value={form.phone} onChange={set("phone")} required autoComplete="tel" inputMode="tel" />
            </div>
          </div>

          <div className="border border-[#e8e4d8] rounded-lg p-6">
            <h2 className="text-sm font-bold text-[#1a2b4a] uppercase tracking-wide mb-4">Delivery Address</h2>
            <div className="space-y-3">
              <label htmlFor="co-line1" className="sr-only">House / Road</label>
              <input id="co-line1" className={inputCls} placeholder="House / Road" value={form.line1} onChange={set("line1")} required autoComplete="address-line1" />
              <label htmlFor="co-area" className="sr-only">Area / Thana</label>
              <input id="co-area" className={inputCls} placeholder="Area / Thana" value={form.area} onChange={set("area")} autoComplete="address-line2" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="co-city" className="sr-only">City / District</label>
                  <input id="co-city" className={inputCls} placeholder="City / District" value={form.city} onChange={set("city")} required autoComplete="address-level2" />
                </div>
                <div>
                  <label htmlFor="co-state" className="sr-only">Division</label>
                  <select id="co-state" className={inputCls} value={form.state} onChange={set("state")} required>
                    {BD_DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="co-zip" className="sr-only">Post code</label>
                  <input id="co-zip" className={inputCls} placeholder="Post code" value={form.zip} onChange={set("zip")} required inputMode="numeric" autoComplete="postal-code" />
                </div>
                <div>
                  <label htmlFor="co-country" className="sr-only">Country</label>
                  <select id="co-country" className={inputCls} value={form.country} onChange={set("country")} required>
                    <option value="Bangladesh">Bangladesh</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="border border-[#e8e4d8] rounded-lg p-6">
            <h2 className="text-sm font-bold text-[#1a2b4a] uppercase tracking-wide mb-4">Payment</h2>
            <div className="flex flex-wrap gap-1.5 mb-4">
              {["bKash","Nagad","Rocket","Cash on Delivery","Visa","Mastercard"].map((p) => (
                <span key={p} className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-1 rounded">{p}</span>
              ))}
            </div>
            <p className="text-xs text-gray-400 bg-[#eff6ff] border border-[#dbeafe] rounded p-3">
              Payments are stubbed in this demo — clicking Place Order saves the order without charging. The team will contact you on the mobile number above to confirm.
            </p>
          </div>

          <button
            disabled={placing}
            className="w-full bg-[#1a2b4a] text-white font-bold py-3.5 rounded text-sm tracking-wide hover:bg-[#0e1a30] transition-colors disabled:opacity-50"
          >
            {placing ? "Placing Order…" : `PLACE ORDER — ${formatMoney(total)}`}
          </button>
        </form>

        <aside className="lg:col-span-1">
          <div className="border border-[#e8e4d8] rounded-lg p-6 sticky top-24">
            <h2 className="text-base font-bold text-[#1a2b4a] mb-4">Order Summary</h2>
            <div className="space-y-2.5 text-sm max-h-52 overflow-y-auto mb-4">
              {items.map((i) => (
                <div key={i.slug} className="flex justify-between gap-2">
                  <span className="text-gray-600 truncate">{i.title} × {i.qty}</span>
                  <span className="shrink-0 font-medium">{formatMoney(i.price * i.qty)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-[#e8e4d8] pt-3 mb-3">
              {applied ? (
                <div className="flex items-center justify-between text-xs bg-green-50 border border-green-200 rounded px-2 py-1.5">
                  <span className="text-green-700">Code <strong className="font-mono">{applied.code}</strong> applied</span>
                  <button type="button" onClick={removeCode} className="text-green-700 hover:underline">Remove</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    className="flex-1 border border-[#e8e4d8] rounded px-2 py-1.5 text-sm uppercase outline-none focus:border-[#1a2b4a]"
                    placeholder="Discount code"
                    value={code}
                    onChange={(e) => setCode(e.target.value.toUpperCase())}
                  />
                  <button type="button" onClick={applyCode} disabled={checkingCode || !code.trim()} className="bg-[#1a2b4a] text-white text-xs font-bold px-3 rounded disabled:opacity-50">
                    {checkingCode ? "…" : "APPLY"}
                  </button>
                </div>
              )}
              {codeMsg && !applied && <p className="text-xs text-red-600 mt-1">{codeMsg}</p>}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatMoney(subtotal)}</span></div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-700"><span>Discount</span><span>−{formatMoney(discountAmount)}</span></div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Shipping</span>
                <span>{shipping === 0 ? <span className="text-[#16a34a]">Free</span> : formatMoney(shipping)}</span>
              </div>
              <div className="flex justify-between font-bold text-base border-t border-[#e8e4d8] pt-2 mt-1">
                <span>Total</span>
                <span className="text-[#b8553a]">{formatMoney(total)}</span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
