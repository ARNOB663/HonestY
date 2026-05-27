"use client";
import { useState } from "react";

export default function OrderNotesForm({ id, initial }) {
  const [val, setVal] = useState(initial || "");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");

  async function save(e) {
    e.preventDefault();
    setSaving(true); setMsg("");
    const r = await fetch(`/api/admin/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adminNotes: val }),
    });
    setSaving(false);
    setMsg(r.ok ? "Saved." : "Save failed.");
    setTimeout(() => setMsg(""), 2500);
  }

  return (
    <form onSubmit={save} className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-semibold text-sm">Internal notes</h2>
        <span className="text-xs text-gray-500">Only visible to admins.</span>
      </div>
      <textarea
        rows={4}
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Add a note about this order…"
        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
        maxLength={2000}
      />
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-500">{val.length} / 2000</span>
        <div className="flex items-center gap-2">
          {msg && <span className={`text-xs ${msg === "Saved." ? "text-green-700" : "text-red-700"}`}>{msg}</span>}
          <button disabled={saving} className="bg-[#1a2b4a] text-white text-sm px-4 py-1.5 rounded disabled:opacity-50">
            {saving ? "Saving…" : "Save notes"}
          </button>
        </div>
      </div>
    </form>
  );
}
