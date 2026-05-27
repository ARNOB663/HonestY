"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PaymentVerifyForm({ id, verified }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [current, setCurrent] = useState(!!verified);

  async function toggle(next) {
    setSaving(true);
    const r = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentVerified: next, status: next ? "paid" : undefined }),
    });
    setSaving(false);
    if (r.ok) {
      setCurrent(next);
      router.refresh();
    }
  }

  return (
    <div className="flex items-center gap-2">
      <span className={`text-xs px-2 py-0.5 rounded ${current ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
        {current ? "Verified" : "Unverified"}
      </span>
      <button
        onClick={() => toggle(!current)}
        disabled={saving}
        className="text-xs px-2 py-1 rounded border border-gray-300 hover:border-[#1a2b4a] disabled:opacity-50"
      >
        {saving ? "…" : current ? "Mark unverified" : "Mark verified & paid"}
      </button>
    </div>
  );
}
