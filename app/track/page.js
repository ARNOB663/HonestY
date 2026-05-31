"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { formatMoney } from "../../lib/format";

const inputCls = "w-full border border-[#e8e4d8] rounded px-3 py-2.5 text-sm outline-none focus:border-[#1a2b4a] transition-colors bg-white";

function STATUS_COPY(s) {
  return {
    pending: { label: "Pending confirmation", color: "bg-amber-100 text-amber-800" },
    confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800" },
    paid: { label: "Confirmed", color: "bg-blue-100 text-blue-800" },
    fulfilled: { label: "Ready to ship", color: "bg-indigo-100 text-indigo-800" },
    shipped: { label: "Shipped", color: "bg-purple-100 text-purple-800" },
    delivered: { label: "Delivered", color: "bg-green-100 text-green-800" },
    refunded: { label: "Refunded", color: "bg-gray-100 text-gray-700" },
    cancelled: { label: "Cancelled", color: "bg-red-100 text-red-700" },
  }[s] || { label: s, color: "bg-gray-100 text-gray-700" };
}

function TrackInner() {
  const params = useSearchParams();
  const initialId = params.get("id") || "";
  const initialEmail = params.get("email") || "";
  const [id, setId] = useState(initialId);
  const [email, setEmail] = useState(initialEmail);
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");

  async function lookup(e) {
    e?.preventDefault?.();
    if (!id || !email) return;
    setLoading(true); setError(""); setOrder(null);
    try {
      const r = await fetch(`/api/orders/track?id=${encodeURIComponent(id)}&email=${encodeURIComponent(email)}`);
      const data = await r.json();
      if (!r.ok) setError(data.error || "Order not found");
      else setOrder(data.order);
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  }

  // Auto-lookup when arriving from an email link that includes both params.
  // The customer never has to type anything — they land directly on their order.
  useEffect(() => {
    if (initialId && initialEmail) {
      lookup();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="bg-white min-h-screen">
      <div className="border-b border-[#e8e4d8]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-2 text-sm text-gray-500">
          <Link href="/" className="hover:text-[#1a2b4a]">Home</Link>
          <span>/</span>
          <span className="text-[#1a2b4a] font-medium">Track Order</span>
        </div>
      </div>

      <div className="max-w-xl mx-auto px-4 py-12">
        <h1 className="font-serif text-3xl text-[#1a2b4a] mb-2">Track your order</h1>
        <p className="text-sm text-gray-500 mb-6">Enter your order number and the email you used at checkout.</p>

        <form onSubmit={lookup} className="space-y-3">
          <input className={inputCls} placeholder="Order number" value={id} onChange={(e) => setId(e.target.value)} required />
          <input className={inputCls} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <button disabled={loading} className="w-full bg-[#1a2b4a] text-white font-bold py-3 rounded text-sm hover:bg-[#0e1a30] disabled:opacity-50">
            {loading ? "Looking up…" : "TRACK ORDER"}
          </button>
        </form>

        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

        {order && (
          <div className="mt-8 border border-[#e8e4d8] rounded-lg p-5 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs text-gray-500">Order</p>
                <p className="font-mono">#{String(order._id).slice(-6)}</p>
                <p className="text-xs text-gray-500 mt-2">Placed</p>
                <p className="text-sm">{new Date(order.createdAt).toLocaleString()}</p>
              </div>
              <span className={`px-3 py-1 rounded text-xs font-semibold ${STATUS_COPY(order.status).color}`}>
                {STATUS_COPY(order.status).label}
              </span>
            </div>

            <div className="border-t border-[#e8e4d8] pt-3">
              <p className="text-xs text-gray-500 mb-2">Items</p>
              <ul className="space-y-1.5 text-sm">
                {order.items.map((it, i) => (
                  <li key={i} className="flex justify-between">
                    <span>{it.title} × {it.qty}</span>
                    <span className="text-gray-600">{formatMoney(it.price * it.qty)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border-t border-[#e8e4d8] pt-3 space-y-1 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span>{formatMoney(order.subtotal)}</span></div>
              {order.discountAmount > 0 && <div className="flex justify-between text-green-700"><span>Discount ({order.discountCode})</span><span>−{formatMoney(order.discountAmount)}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Shipping</span><span>{order.shipping === 0 ? "Free" : formatMoney(order.shipping)}</span></div>
              <div className="flex justify-between font-bold border-t border-[#e8e4d8] pt-2 mt-2"><span>Total</span><span className="text-[#b8553a]">{formatMoney(order.total)}</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-gray-400">Loading…</div>}>
      <TrackInner />
    </Suspense>
  );
}
