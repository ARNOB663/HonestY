"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUSES = ["pending", "approved", "hidden", "spam"];

export default function ReviewsManager({ initial }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [editing, setEditing] = useState({});

  async function setStatus(id, status) {
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setItems((arr) => arr.map((r) => (r._id === id ? { ...r, status } : r)));
    router.refresh();
  }

  async function saveReply(id) {
    const reply = editing[id] || "";
    await fetch(`/api/admin/reviews/${id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply }),
    });
    setItems((arr) => arr.map((r) => (r._id === id ? { ...r, reply } : r)));
    setEditing((e) => ({ ...e, [id]: undefined }));
    router.refresh();
  }

  async function remove(id) {
    if (!confirm("Delete this review?")) return;
    await fetch(`/api/admin/reviews/${id}`, { method: "DELETE" });
    setItems((arr) => arr.filter((r) => r._id !== id));
  }

  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="text-sm text-gray-500">No reviews.</p>}
      {items.map((r) => (
        <div key={r._id} className="bg-white border border-gray-200 rounded-lg p-4">
          <div className="flex items-start justify-between gap-3 mb-2">
            <div>
              <p className="text-sm font-semibold">{r.name || "Customer"} <span className="text-gray-400 font-normal">· {r.userEmail}</span></p>
              <p className="text-xs text-gray-500">{r.productSlug} · {new Date(r.createdAt).toLocaleString()}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
              {r.verified && <span className="text-[10px] font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">Verified</span>}
              <select value={r.status} onChange={(e) => setStatus(r._id, e.target.value)} className="text-xs border border-gray-300 rounded px-1 py-0.5">
                {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          {r.title && <p className="text-sm font-semibold">{r.title}</p>}
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{r.body}</p>

          <div className="mt-3 pl-3 border-l-2 border-[#c9a961]">
            {editing[r._id] !== undefined ? (
              <div className="space-y-2">
                <textarea
                  className="w-full border border-gray-300 rounded p-2 text-sm"
                  rows={2}
                  value={editing[r._id]}
                  onChange={(e) => setEditing((s) => ({ ...s, [r._id]: e.target.value }))}
                  placeholder="Public reply…"
                />
                <div className="flex gap-2">
                  <button onClick={() => saveReply(r._id)} className="text-xs bg-[#1a2b4a] text-white px-3 py-1 rounded">Save</button>
                  <button onClick={() => setEditing((s) => ({ ...s, [r._id]: undefined }))} className="text-xs text-gray-500">Cancel</button>
                </div>
              </div>
            ) : r.reply ? (
              <>
                <p className="text-xs text-gray-700 whitespace-pre-wrap">{r.reply}</p>
                <button onClick={() => setEditing((s) => ({ ...s, [r._id]: r.reply }))} className="text-xs text-blue-600 hover:underline mt-1">Edit reply</button>
              </>
            ) : (
              <button onClick={() => setEditing((s) => ({ ...s, [r._id]: "" }))} className="text-xs text-blue-600 hover:underline">Reply publicly</button>
            )}
          </div>

          <button onClick={() => remove(r._id)} className="mt-3 text-xs text-red-600 hover:underline">Delete</button>
        </div>
      ))}
    </div>
  );
}
