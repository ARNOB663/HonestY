"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { useCart } from "../../context/CartContext";
import { formatMoney, BD_DIVISIONS, getDistrictsForDivision, getThanasForDistrict } from "../../lib/format";
import { useShipping, computeShipping } from "../../lib/useShipping";

const inputCls = "w-full border border-[#e8e4d8] rounded px-3 py-2.5 text-sm outline-none focus:border-[#1a2b4a] transition-colors bg-white";

// Area / thana select that falls back to free-text input for villages /
// sub-areas not in BD_THANAS. Mirrors the AreaPicker on /account.
function CheckoutAreaPicker({ district, value, onChange, inputCls }) {
  const list = getThanasForDistrict(district);
  const inList = list.includes(value);
  const isOther = !!value && !inList;
  if (list.length === 0) {
    return (
      <input
        id="co-area"
        className={inputCls}
        placeholder="Area / Thana / Village"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="address-line2"
      />
    );
  }
  return (
    <div className="space-y-2">
      <select
        id="co-area"
        className={inputCls}
        value={isOther ? "__other__" : value}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "__other__") onChange(" ");
          else onChange(v);
        }}
        autoComplete="address-line2"
      >
        <option value="">Select area / thana…</option>
        {list.map((t) => <option key={t} value={t}>{t}</option>)}
        <option value="__other__">Other (type below)</option>
      </select>
      {isOther && (
        <input
          className={inputCls}
          placeholder="Type your area / thana / village"
          value={value.trim() ? value : ""}
          onChange={(e) => onChange(e.target.value || " ")}
          autoFocus
        />
      )}
    </div>
  );
}

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { items, subtotal, hydrated, clear, notice, dismissNotice } = useCart();
  const shippingSettings = useShipping();
  const [placing, setPlacing] = useState(false);
  const [done, setDone] = useState(false);
  const [orderId, setOrderId] = useState("");
  const [form, setForm] = useState({ name: "", email: "", phone: "", line1: "", area: "", city: "", state: "Dhaka", country: "Bangladesh" });
  const [payMethod, setPayMethod] = useState("cod");
  const [payerNumber, setPayerNumber] = useState("");
  const [txnId, setTxnId] = useState("");

  // A merchant number is "configured" only if it's a real BD mobile number —
  // not blank and not the 01XXXXXXXXX placeholder. This prevents customers
  // from sending money to a fake number if the admin forgot to set it.
  const isRealNumber = (n) => /^01[3-9]\d{8}$/.test(String(n || "").trim());
  const BKASH_NUMBER = shippingSettings.bkashNumber || "";
  const NAGAD_NUMBER = shippingSettings.nagadNumber || "";
  // bKash/Nagad only appear when enabled AND a valid number is set. COD always
  // works when enabled.
  const PAYMENT_METHODS = [
    shippingSettings.enableBkash !== false && isRealNumber(BKASH_NUMBER) && { id: "bkash", label: "bKash", color: "#e2136e" },
    shippingSettings.enableNagad !== false && isRealNumber(NAGAD_NUMBER) && { id: "nagad", label: "Nagad", color: "#f47b20" },
    shippingSettings.enableCod !== false && { id: "cod", label: "Cash on Delivery", color: "#1a2b4a" },
  ].filter(Boolean);

  // If the currently selected payment method becomes disabled by admin,
  // jump to the first enabled one so the customer can still pay.
  useEffect(() => {
    if (PAYMENT_METHODS.length === 0) return;
    if (!PAYMENT_METHODS.find((m) => m.id === payMethod)) {
      setPayMethod(PAYMENT_METHODS[0].id);
    }
  }, [PAYMENT_METHODS, payMethod]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    fetch("/api/account")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data?.user) return;
        const u = data.user;
        const a = u.defaultAddress || {};
        setForm((f) => ({
          ...f,
          name: f.name || u.name || "",
          email: f.email || u.email || session?.user?.email || "",
          phone: f.phone || u.phone || "",
          line1: f.line1 || a.line1 || "",
          area: f.area || a.area || "",
          city: f.city || a.city || "",
          state: f.state && f.state !== "Dhaka" ? f.state : (a.state || "Dhaka"),
          country: f.country || a.country || "Bangladesh",
        }));
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [status]);

  // Discount code
  const [code, setCode] = useState("");
  const [applied, setApplied] = useState(null); // { code, type, value, discountAmount }
  const [codeMsg, setCodeMsg] = useState("");
  const [checkingCode, setCheckingCode] = useState(false);

  if (!hydrated || status === "loading") {
    return <div className="px-4 max-w-7xl mx-auto py-16 text-center text-gray-400">Loading…</div>;
  }

  const isGuest = !session?.user;

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
            Thanks, {session?.user?.name || session?.user?.email || form.name || form.email}. We&apos;ll contact you shortly to confirm.
          </p>
          {orderId && <p className="mt-1 text-xs text-gray-400">Order #{orderId.slice(-6)}</p>}
          <p className="mt-3 text-xs text-gray-500">
            {form.email
              ? `A confirmation email is on its way to ${form.email}.`
              : "We'll contact you on your mobile number to confirm."}
          </p>
          <div className="flex items-center justify-center gap-2 mt-6">
            {session?.user ? (
              <Link href="/account" className="border border-[#1a2b4a] text-[#1a2b4a] font-bold px-6 py-2.5 rounded text-sm hover:bg-[#1a2b4a] hover:text-white transition-colors">
                MY ORDERS
              </Link>
            ) : null}
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

  const shipping = computeShipping(subtotal, shippingSettings, form.state);
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
        body: JSON.stringify({ code: code.trim(), subtotal, items: items.map((i) => ({ slug: i.slug, qty: i.qty, price: i.price })) }),
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
      country: form.country,
      phone: form.phone,
    };
    const r = await fetch("/api/orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({ slug: i.slug, qty: i.qty })),
        shippingAddress,
        // Always send the form email (logged-in users may have edited it for
        // this order; guests may leave it blank).
        email: form.email.trim().toLowerCase() || undefined,
        discountCode: applied?.code,
        payment: {
          method: payMethod,
          payerNumber: payMethod === "cod" ? undefined : payerNumber.trim(),
          txnId: payMethod === "cod" ? undefined : txnId.trim(),
        },
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
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-[#1a2b4a] uppercase tracking-wide">Contact</h2>
              {isGuest && (
                <Link href="/login?callbackUrl=/checkout" className="text-xs text-[#1a2b4a] hover:underline">
                  Have an account? Sign in
                </Link>
              )}
            </div>
            <div className="space-y-3">
              <label htmlFor="co-name" className="sr-only">Full name</label>
              <input id="co-name" className={inputCls} placeholder="Full name" value={form.name} onChange={set("name")} required autoComplete="name" />
              <div>
                <label htmlFor="co-email" className="sr-only">Email</label>
                <input
                  id="co-email"
                  className={inputCls}
                  type="email"
                  placeholder={isGuest ? "Email (optional, for order updates)" : "Email"}
                  value={form.email}
                  onChange={set("email")}
                  autoComplete="email"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  {isGuest
                    ? "Optional — provide one to get order confirmation and updates by email."
                    : "We'll send order updates here. You can change it for this order only."}
                </p>
              </div>
              <label htmlFor="co-phone" className="sr-only">Mobile number</label>
              <input
                id="co-phone"
                className={inputCls}
                placeholder="Mobile (e.g. 01XXXXXXXXX)"
                value={form.phone}
                onChange={set("phone")}
                required
                autoComplete="tel"
                inputMode="tel"
                pattern="01[3-9][0-9]{8}"
                maxLength={11}
                title="11-digit Bangladeshi mobile number starting with 013–019"
              />
            </div>
          </div>

          <div className="border border-[#e8e4d8] rounded-lg p-6">
            <h2 className="text-sm font-bold text-[#1a2b4a] uppercase tracking-wide mb-4">Delivery Address</h2>
            <div className="space-y-3">
              <label htmlFor="co-line1" className="sr-only">House / Road</label>
              <input id="co-line1" className={inputCls} placeholder="House / Road" value={form.line1} onChange={set("line1")} required autoComplete="address-line1" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="co-state" className="sr-only">Division</label>
                  <select
                    id="co-state"
                    className={inputCls}
                    value={form.state}
                    onChange={(e) => {
                      const next = e.target.value;
                      setForm((f) => ({
                        ...f,
                        state: next,
                        // When division changes, reset city + area if no longer valid.
                        city: getDistrictsForDivision(next).includes(f.city) ? f.city : "",
                        area: "",
                      }));
                    }}
                    required
                  >
                    {BD_DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label htmlFor="co-city" className="sr-only">District</label>
                  <select
                    id="co-city"
                    className={inputCls}
                    value={form.city}
                    onChange={(e) => setForm((f) => ({ ...f, city: e.target.value, area: "" }))}
                    required
                    autoComplete="address-level2"
                  >
                    <option value="">Select district…</option>
                    {getDistrictsForDivision(form.state).map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <label htmlFor="co-area" className="sr-only">Area / Thana</label>
              <CheckoutAreaPicker
                district={form.city}
                value={form.area}
                onChange={(v) => setForm((f) => ({ ...f, area: v }))}
                inputCls={inputCls}
              />
              <label htmlFor="co-country" className="sr-only">Country</label>
              <select id="co-country" className={inputCls} value={form.country} onChange={set("country")} required>
                <option value="Bangladesh">Bangladesh</option>
              </select>
            </div>
          </div>

          <div className="border border-[#e8e4d8] rounded-lg p-6">
            <h2 className="text-sm font-bold text-[#1a2b4a] uppercase tracking-wide mb-4">Payment</h2>
            {PAYMENT_METHODS.length === 0 ? (
              <p className="text-sm text-red-600 mb-4">No payment methods are currently enabled. Please contact support.</p>
            ) : (
              <div className={`grid gap-2 mb-4`} style={{ gridTemplateColumns: `repeat(${PAYMENT_METHODS.length}, minmax(0, 1fr))` }}>
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setPayMethod(m.id)}
                    className={`border rounded px-3 py-3 text-sm font-bold transition-colors ${
                      payMethod === m.id ? "border-[#1a2b4a] bg-[#1a2b4a] text-white" : "border-[#e8e4d8] text-gray-600 hover:border-[#1a2b4a]"
                    }`}
                    style={payMethod === m.id ? { backgroundColor: m.color, borderColor: m.color } : undefined}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            )}

            {payMethod !== "cod" && (
              <div className="space-y-3">
                <div className="bg-amber-50 border border-amber-200 rounded p-3 text-sm">
                  <p className="text-amber-900">
                    Send <strong>{formatMoney(total)}</strong> via{" "}
                    <strong>{payMethod === "bkash" ? "bKash" : "Nagad"} → Send Money</strong> to:
                  </p>
                  <p className="mt-1 text-lg font-bold tracking-wide text-[#1a2b4a]">
                    {payMethod === "bkash" ? BKASH_NUMBER : NAGAD_NUMBER}
                  </p>
                  <p className="mt-1 text-xs text-amber-800">
                    After sending, enter the number you sent from and the Transaction ID (TrxID) below.
                  </p>
                </div>
                <div>
                  <label htmlFor="pay-from" className="block text-xs font-medium text-[#1a2b4a] mb-1">Number you sent from</label>
                  <input
                    id="pay-from"
                    className={inputCls}
                    placeholder="01XXXXXXXXX"
                    value={payerNumber}
                    onChange={(e) => setPayerNumber(e.target.value)}
                    required
                    inputMode="tel"
                    pattern="01[3-9][0-9]{8}"
                    maxLength={11}
                  />
                </div>
                <div>
                  <label htmlFor="pay-txn" className="block text-xs font-medium text-[#1a2b4a] mb-1">Transaction ID (TrxID)</label>
                  <input
                    id="pay-txn"
                    className={inputCls}
                    placeholder="e.g. 9A7B2C4D5E"
                    value={txnId}
                    onChange={(e) => setTxnId(e.target.value.toUpperCase())}
                    required
                    minLength={6}
                    maxLength={40}
                  />
                </div>
              </div>
            )}

            {payMethod === "cod" && (
              <p className="text-xs text-gray-500 bg-[#eff6ff] border border-[#dbeafe] rounded p-3">
                Pay <strong>{formatMoney(total)}</strong> in cash when your order is delivered. Our team will call to confirm.
              </p>
            )}
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
