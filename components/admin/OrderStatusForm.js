"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

// Simplified flow: pending → (admin Confirm) → confirmed/paid → (Mark delivered) →
// delivered. Plus cancelled / refunded as side states. The "fulfilled" and
// "shipped" interim states still exist in the DB enum (for backward compat with
// older orders) but are no longer surfaced in the admin UI.
const STATUSES = ["pending", "confirmed", "paid", "delivered", "refunded", "cancelled"];

function quickActionsFor(status, paymentMethod) {
  // Confirm sends to "confirmed" for COD, "paid" for prepaid. Both fire the
  // "Order confirmed" email via sendStatusUpdate.
  const confirmTarget = paymentMethod === "cod" ? "confirmed" : "paid";
  if (status === "pending") {
    return [
      { label: "Confirm", target: confirmTarget, style: "bg-blue-600 hover:bg-blue-700" },
      { label: "Cancel", target: "cancelled", style: "bg-red-600 hover:bg-red-700", confirm: "Cancel this order? Items will NOT be restocked automatically." },
    ];
  }
  if (status === "confirmed" || status === "paid") {
    return [
      { label: "Mark delivered", target: "delivered", style: "bg-green-600 hover:bg-green-700" },
      { label: "Cancel", target: "cancelled", style: "bg-red-600 hover:bg-red-700", confirm: "Cancel this confirmed order?" },
    ];
  }
  // Legacy orders in "fulfilled" / "shipped" can still be marked delivered.
  if (status === "fulfilled" || status === "shipped") {
    return [{ label: "Mark delivered", target: "delivered", style: "bg-green-600 hover:bg-green-700" }];
  }
  return [];
}

export default function OrderStatusForm({ id, status, paymentMethod }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);
  const actions = quickActionsFor(status, paymentMethod);

  async function setStatus(next, confirmMsg) {
    if (confirmMsg && !confirm(confirmMsg)) return;
    setSaving(true);
    const r = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setSaving(false);
    if (r.ok) {
      setValue(next);
      router.refresh();
    }
  }

  async function saveSelect() {
    if (value === status) return;
    await setStatus(value);
  }

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {actions.map((a) => (
        <button
          key={a.target}
          type="button"
          onClick={() => setStatus(a.target, a.confirm)}
          disabled={saving}
          className={`text-white text-sm font-semibold px-4 py-1.5 rounded disabled:opacity-50 ${a.style}`}
        >
          {a.label}
        </button>
      ))}
      <select value={value} onChange={(e) => setValue(e.target.value)} className="border border-gray-300 rounded px-2 py-1.5 text-sm">
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <button onClick={saveSelect} disabled={saving || value === status} className="bg-[#1a2b4a] text-white px-3 py-1.5 rounded text-sm disabled:opacity-50">
        {saving ? "…" : "Update"}
      </button>
    </div>
  );
}
