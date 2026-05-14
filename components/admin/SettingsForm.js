"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SettingsForm({ initial }) {
  const router = useRouter();
  const [form, setForm] = useState({
    storeName: initial?.storeName || "Honesty",
    supportEmail: initial?.supportEmail || "",
    supportPhone: initial?.supportPhone || "",
    currency: initial?.currency || "USD",
    flatShippingRate: initial?.flatShippingRate ?? 0,
    freeShippingThreshold: initial?.freeShippingThreshold ?? 99,
    taxRate: initial?.taxRate ?? 0,
    announcement: initial?.announcement || "",
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function save(e) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    setMsg(res.ok ? "Saved." : "Save failed.");
    if (res.ok) router.refresh();
  }

  const field = "w-full border border-gray-300 rounded px-3 py-2 text-sm";
  const label = "text-xs uppercase tracking-wide text-gray-600";
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  return (
    <form onSubmit={save} className="space-y-6 max-w-3xl">
      {msg && <p className="text-sm text-green-700">{msg}</p>}
      <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <h2 className="font-semibold">Store</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Name</label><input className={field} value={form.storeName} onChange={set("storeName")} /></div>
          <div><label className={label}>Currency</label><input className={field} value={form.currency} onChange={set("currency")} /></div>
          <div><label className={label}>Support email</label><input type="email" className={field} value={form.supportEmail} onChange={set("supportEmail")} /></div>
          <div><label className={label}>Support phone</label><input className={field} value={form.supportPhone} onChange={set("supportPhone")} /></div>
        </div>
        <div><label className={label}>Announcement bar</label><input className={field} value={form.announcement} onChange={set("announcement")} placeholder="Free shipping over $99…" /></div>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <h2 className="font-semibold">Shipping & tax</h2>
        <div className="grid grid-cols-3 gap-3">
          <div><label className={label}>Flat shipping</label><input type="number" step="0.01" className={field} value={form.flatShippingRate} onChange={set("flatShippingRate")} /></div>
          <div><label className={label}>Free over</label><input type="number" step="0.01" className={field} value={form.freeShippingThreshold} onChange={set("freeShippingThreshold")} /></div>
          <div><label className={label}>Tax rate (%)</label><input type="number" step="0.01" className={field} value={form.taxRate} onChange={set("taxRate")} /></div>
        </div>
      </section>

      <button disabled={busy} className="bg-[#1a2b4a] text-white px-5 py-2 rounded text-sm disabled:opacity-50">{busy ? "Saving…" : "Save settings"}</button>
    </form>
  );
}
