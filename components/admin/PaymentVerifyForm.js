"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// For prepaid (bKash/Nagad): verifying = "we checked the TrxID, money is in".
//   → Toggles paymentVerified + sets status to "paid"
// For COD: verifying = "courier brought us the cash".
//   → Toggles paymentVerified only. Status stays at whatever ("delivered"
//     by then, usually). No status change because for COD "paid" simply
//     means "we got the cash".
export default function PaymentVerifyForm({ id, verified, paymentMethod }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState(!!verified);
  const isCod = paymentMethod === "cod";

  async function toggle(next) {
    setSaving(true);
    const body = { paymentVerified: next };
    // Only prepaid jumps to "paid" when verified.
    if (next && !isCod) body.status = "paid";
    const r = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);
    if (r.ok) {
      setCurrent(next);
      router.refresh();
    }
  }

  const label = isCod
    ? (current ? "Mark cash NOT received" : "Mark cash received")
    : (current ? "Mark unverified" : "Mark verified & paid");

  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs px-2 py-0.5 rounded ${current ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
        {current ? (isCod ? "Cash received" : "Verified") : (isCod ? "Cash pending" : "Unverified")}
      </span>
      <button
        onClick={() => toggle(!current)}
        disabled={saving}
        className="text-xs px-2 py-1 rounded border border-gray-300 hover:border-[#1a2b4a] disabled:opacity-50"
      >
        {saving ? "…" : label}
      </button>
    </div>
  );
}
