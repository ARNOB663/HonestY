"use client";
import { useState } from "react";
import { formatMoney } from "../../lib/format";

export default function OrderRefundForm({ id, total, initialAmount, initialReason }) {
  const [amount, setAmount] = useState(initialAmount || 0);
  const [reason, setReason] = useState(initialReason || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function save(e) {
    e.preventDefault();
    setSaving(true); setMsg("");
    const r = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        refundAmount: Number(amount) || 0,
        refundReason: reason,
        status: Number(amount) > 0 ? "refunded" : undefined,
      }),
    });
    setSaving(false);
    setMsg(r.ok ? "Saved." : "Save failed.");
    setTimeout(() => setMsg(""), 2500);
  }

  return (
    <form onSubmit={save} className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="font-semibold text-sm">Refund</h2>
        <span className="text-xs text-gray-500">Order total: {formatMoney(total)}</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs uppercase text-gray-500 mb-1">Amount (৳)</label>
          <input
            type="number"
            min="0"
            max={total}
            step="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs uppercase text-gray-500 mb-1">Reason</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. damaged on arrival"
            maxLength={500}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
          />
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-xs text-gray-500">Setting an amount &gt; 0 also moves the order to status &ldquo;refunded&rdquo;.</p>
        <div className="flex items-center gap-2">
          {msg && <span className={`text-xs ${msg === "Saved." ? "text-green-700" : "text-red-700"}`}>{msg}</span>}
          <button disabled={saving} className="bg-rose-600 text-white text-sm px-4 py-1.5 rounded disabled:opacity-50">
            {saving ? "Saving…" : "Save refund"}
          </button>
        </div>
      </div>
    </form>
  );
}
