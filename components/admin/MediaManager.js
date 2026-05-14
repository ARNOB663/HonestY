"use client";
import { useEffect, useState } from "react";

async function uploadFile(file) {
  const signRes = await fetch("/api/admin/media/sign", { method: "POST" });
  if (!signRes.ok) {
    const d = await signRes.json().catch(() => ({}));
    throw new Error(d.error || "Could not get upload signature");
  }
  const sig = await signRes.json();

  const fd = new FormData();
  fd.append("file", file);
  fd.append("api_key", sig.apiKey);
  fd.append("timestamp", String(sig.timestamp));
  fd.append("signature", sig.signature);
  fd.append("folder", sig.folder);

  const url = `https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`;
  const res = await fetch(url, { method: "POST", body: fd });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || "Upload failed");

  await fetch("/api/admin/media", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      publicId: data.public_id,
      url: data.secure_url,
      width: data.width,
      height: data.height,
      format: data.format,
      bytes: data.bytes,
      folder: sig.folder,
    }),
  });
  return data;
}

export default function MediaManager() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function load() {
    const r = await fetch("/api/admin/media");
    if (!r.ok) return;
    const data = await r.json();
    setItems(data.media);
  }
  useEffect(() => { load(); }, []);

  async function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setBusy(true); setErr("");
    try {
      for (const f of files) await uploadFile(f);
      await load();
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); e.target.value = ""; }
  }

  async function copyUrl(url) {
    try { await navigator.clipboard.writeText(url); } catch {}
  }

  async function remove(id) {
    if (!confirm("Delete this image? It will also be removed from Cloudinary.")) return;
    await fetch(`/api/admin/media/${id}`, { method: "DELETE" });
    setItems((arr) => arr.filter((m) => m._id !== id));
  }

  return (
    <div className="space-y-5">
      <div className="bg-white border border-gray-200 rounded-lg p-5">
        <label className="block text-sm font-semibold mb-2">Upload images</label>
        <input type="file" accept="image/*" multiple onChange={handleFiles} disabled={busy} className="text-sm" />
        {busy && <p className="text-xs text-gray-500 mt-2">Uploading…</p>}
        {err && <p className="text-xs text-red-600 mt-2">{err}</p>}
        <p className="text-xs text-gray-400 mt-2">Files upload directly to Cloudinary. URLs are listed below for copy/paste into product images.</p>
      </div>

      {items.length === 0 ? (
        <p className="text-sm text-gray-500">No media yet.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {items.map((m) => (
            <div key={m._id} className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={m.url} alt={m.alt || ""} className="w-full aspect-square object-cover" />
              <div className="p-2 space-y-1">
                <p className="text-[10px] text-gray-500 truncate font-mono">{m.publicId}</p>
                <div className="flex items-center justify-between text-xs">
                  <button onClick={() => copyUrl(m.url)} className="text-blue-600 hover:underline">Copy URL</button>
                  <button onClick={() => remove(m._id)} className="text-red-600 hover:underline">Delete</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
