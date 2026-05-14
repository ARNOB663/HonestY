"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["pending", "paid", "fulfilled", "shipped", "delivered", "refunded", "cancelled"];

export default function OrderStatusForm({ id, status }) {
  const router = useRouter();
  const [value, setValue] = useState(status);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: value }),
    });
    setSaving(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      <select value={value} onChange={(e) => setValue(e.target.value)} className="border border-gray-300 rounded px-2 py-1 text-sm">
        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
      </select>
      <button onClick={save} disabled={saving || value === status} className="bg-[#1a2b4a] text-white px-3 py-1 rounded text-sm disabled:opacity-50">{saving ? "…" : "Update"}</button>
    </div>
  );
}
