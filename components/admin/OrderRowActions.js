"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderRowActions({ id, status }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function setStatus(next, msg) {
    if (msg && !confirm(msg)) return;
    setBusy(true);
    const r = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setBusy(false);
    if (r.ok) router.refresh();
  }

  if (status === "pending") {
    return (
      <div className="inline-flex gap-1">
        <button onClick={() => setStatus("paid")} disabled={busy} className="text-[11px] bg-blue-600 hover:bg-blue-700 text-white font-semibold px-2 py-1 rounded disabled:opacity-50">Confirm</button>
        <button onClick={() => setStatus("cancelled", "Cancel this order?")} disabled={busy} className="text-[11px] bg-red-600 hover:bg-red-700 text-white font-semibold px-2 py-1 rounded disabled:opacity-50">Cancel</button>
      </div>
    );
  }
  if (status === "paid") {
    return (
      <button onClick={() => setStatus("fulfilled")} disabled={busy} className="text-[11px] bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-2 py-1 rounded disabled:opacity-50">Pack</button>
    );
  }
  if (status === "fulfilled") {
    return (
      <button onClick={() => setStatus("shipped")} disabled={busy} className="text-[11px] bg-violet-600 hover:bg-violet-700 text-white font-semibold px-2 py-1 rounded disabled:opacity-50">Ship</button>
    );
  }
  if (status === "shipped") {
    return (
      <button onClick={() => setStatus("delivered")} disabled={busy} className="text-[11px] bg-green-600 hover:bg-green-700 text-white font-semibold px-2 py-1 rounded disabled:opacity-50">Delivered</button>
    );
  }
  return <span className="text-gray-300 text-xs">—</span>;
}
