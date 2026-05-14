"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function DiscountsManager({ initial }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [form, setForm] = useState({ code: "", type: "percent", value: 10, minSubtotal: 0, usageLimit: 0, expiresAt: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function create(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    const res = await fetch("/api/admin/discounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(data.error || "Failed"); return; }
    setForm({ code: "", type: "percent", value: 10, minSubtotal: 0, usageLimit: 0, expiresAt: "" });
    router.refresh();
  }

  async function toggle(id, active) {
    await fetch(`/api/admin/discounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active: !active }),
    });
    setItems((arr) => arr.map((d) => (d._id === id ? { ...d, active: !active } : d)));
    router.refresh();
  }

  async function remove(id) {
    if (!confirm("Delete this code?")) return;
    await fetch(`/api/admin/discounts/${id}`, { method: "DELETE" });
    setItems((arr) => arr.filter((d) => d._id !== id));
    router.refresh();
  }

  const field = "w-full border border-gray-300 rounded px-3 py-2 text-sm";

  return (
    <div className="space-y-6">
      <form onSubmit={create} className="bg-white border border-gray-200 rounded-lg p-5 space-y-4 max-w-3xl">
        <h2 className="font-semibold">New code</h2>
        {err && <p className="text-sm text-red-600">{err}</p>}
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-xs text-gray-500">Code</label><input className={field} value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} required /></div>
          <div><label className="text-xs text-gray-500">Type</label>
            <select className={field} value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              <option value="percent">Percent off</option>
              <option value="fixed">Fixed amount</option>
            </select>
          </div>
          <div><label className="text-xs text-gray-500">Value</label><input type="number" step="0.01" className={field} value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} required /></div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div><label className="text-xs text-gray-500">Min subtotal</label><input type="number" step="0.01" className={field} value={form.minSubtotal} onChange={(e) => setForm({ ...form, minSubtotal: e.target.value })} /></div>
          <div><label className="text-xs text-gray-500">Usage limit (0 = unlimited)</label><input type="number" className={field} value={form.usageLimit} onChange={(e) => setForm({ ...form, usageLimit: e.target.value })} /></div>
          <div><label className="text-xs text-gray-500">Expires</label><input type="date" className={field} value={form.expiresAt} onChange={(e) => setForm({ ...form, expiresAt: e.target.value })} /></div>
        </div>
        <button disabled={busy} className="bg-[#1a2b4a] text-white px-4 py-2 rounded text-sm disabled:opacity-50">{busy ? "…" : "Create code"}</button>
      </form>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr><th className="px-4 py-2">Code</th><th className="px-4 py-2">Type</th><th className="px-4 py-2">Value</th><th className="px-4 py-2">Min</th><th className="px-4 py-2">Used</th><th className="px-4 py-2">Expires</th><th className="px-4 py-2">Active</th><th className="px-4 py-2"></th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {items.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500">No discount codes yet.</td></tr>}
            {items.map((d) => (
              <tr key={d._id}>
                <td className="px-4 py-2 font-mono">{d.code}</td>
                <td className="px-4 py-2">{d.type}</td>
                <td className="px-4 py-2">{d.type === "percent" ? `${d.value}%` : `৳${d.value}`}</td>
                <td className="px-4 py-2">{d.minSubtotal ? `৳${d.minSubtotal}` : "—"}</td>
                <td className="px-4 py-2">{d.usedCount}{d.usageLimit ? ` / ${d.usageLimit}` : ""}</td>
                <td className="px-4 py-2 text-gray-500">{d.expiresAt ? new Date(d.expiresAt).toLocaleDateString() : "—"}</td>
                <td className="px-4 py-2"><button onClick={() => toggle(d._id, d.active)} className={`px-2 py-0.5 rounded text-xs ${d.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>{d.active ? "active" : "off"}</button></td>
                <td className="px-4 py-2 text-right"><button onClick={() => remove(d._id)} className="text-red-600 hover:underline text-xs">Delete</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
