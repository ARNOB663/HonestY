"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["pending", "paid", "fulfilled", "shipped", "delivered", "refunded", "cancelled"];

const QUICK_ACTIONS = {
  pending: [
    { label: "Confirm", target: "paid", style: "bg-blue-600 hover:bg-blue-700" },
    { label: "Cancel", target: "cancelled", style: "bg-red-600 hover:bg-red-700", confirm: "Cancel this order? Items will NOT be restocked automatically." },
  ],
  paid: [
    { label: "Pack", target: "fulfilled", style: "bg-indigo-600 hover:bg-indigo-700" },
    { label: "Cancel", target: "cancelled", style: "bg-red-600 hover:bg-red-700", confirm: "Cancel this confirmed order?" },
  ],
  fulfilled: [
    { label: "Mark shipped", target: "shipped", style: "bg-violet-600 hover:bg-violet-700" },
  ],
  shipped: [
    { label: "Mark delivered", target: "delivered", style: "bg-green-600 hover:bg-green-700" },
  ],
};

export default function OrderStatusForm({ id, status }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);
  const actions = QUICK_ACTIONS[status] || [];

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
