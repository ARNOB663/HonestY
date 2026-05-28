"use client";
import { useEffect, useRef, useState } from "react";

// Reusable media chooser with built-in Cloudinary upload.
// Props:
//   onPick(url | url[])  — called with chosen url(s)
//   onClose()
//   multi (bool)         — allow selecting multiple existing images
export default function MediaPickerModal({ onPick, onClose, multi = false }) {
  const [items, setItems] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState("");
  const fileRef = useRef(null);

  async function load() {
    const r = await fetch("/api/admin/media");
    const d = r.ok ? await r.json() : { media: [] };
    setItems(d.media || []);
  }
  useEffect(() => { load(); }, []);

  async function uploadFiles(files) {
    setUploading(true); setErr("");
    try {
      for (const file of files) {
        const signRes = await fetch("/api/admin/media/sign", { method: "POST" });
        if (!signRes.ok) {
          const e = await signRes.json().catch(() => ({}));
          throw new Error(e.error || `Signing failed (HTTP ${signRes.status}). Check CLOUDINARY_* env vars.`);
        }
        const sig = await signRes.json();
        if (!sig.cloudName) throw new Error("CLOUDINARY_CLOUD_NAME is missing on the server.");

        const fd = new FormData();
        fd.append("file", file);
        fd.append("api_key", sig.apiKey);
        fd.append("timestamp", String(sig.timestamp));
        fd.append("signature", sig.signature);
        fd.append("folder", sig.folder);
        const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, { method: "POST", body: fd });
        const data = await up.json().catch(() => ({}));
        if (!up.ok) throw new Error(data.error?.message || `Cloudinary returned HTTP ${up.status}`);

        await fetch("/api/admin/media", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            publicId: data.public_id, url: data.secure_url, width: data.width, height: data.height, format: data.format, bytes: data.bytes, folder: sig.folder,
          }),
        });
      }
      await load();
    } catch (e) {
      setErr(e.message || "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleFiles(e) {
    const files = Array.from(e.target.files || []);
    if (files.length) uploadFiles(files);
    e.target.value = "";
  }

  function toggleSel(url) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(url)) next.delete(url); else next.add(url);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200">
          <h3 className="font-semibold">{multi ? "Choose images" : "Choose an image"}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700">✕</button>
        </div>
        <div className="px-5 py-3 border-b border-gray-200 space-y-2">
          <div className="flex items-center gap-3">
            <input ref={fileRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="text-xs bg-[#1a2b4a] text-white px-3 py-1.5 rounded disabled:opacity-50">
              {uploading ? "Uploading…" : "+ Upload new"}
            </button>
            <p className="text-xs text-gray-500">Pick an existing image below, or upload a new one.</p>
          </div>
          {err && <p className="text-xs text-red-600">⚠ {err}</p>}
        </div>
        <div className="overflow-auto p-4 flex-1">
          {items === null && <p className="text-sm text-gray-500">Loading…</p>}
          {items?.length === 0 && <p className="text-sm text-gray-500">No images yet — use Upload new above.</p>}
          {items?.length > 0 && (
            <div className="grid grid-cols-3 md:grid-cols-5 gap-2">
              {items.map((m) => {
                const sel = selected.has(m.url);
                return (
                  <button
                    key={m._id}
                    type="button"
                    onClick={() => multi ? toggleSel(m.url) : (onPick(m.url), onClose())}
                    className={`relative border-2 rounded overflow-hidden transition-colors ${sel ? "border-[#1a2b4a]" : "border-gray-200 hover:border-gray-400"}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={m.url} alt="" className="w-full aspect-square object-cover" />
                    {sel && <span className="absolute top-1 right-1 bg-[#1a2b4a] text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">✓</span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {multi && (
          <div className="px-5 py-3 border-t border-gray-200 flex items-center justify-between">
            <span className="text-xs text-gray-500">{selected.size} selected</span>
            <button
              type="button"
              disabled={selected.size === 0}
              onClick={() => { onPick([...selected]); onClose(); }}
              className="bg-[#1a2b4a] text-white text-sm px-4 py-1.5 rounded disabled:opacity-50"
            >
              Add {selected.size > 0 ? `${selected.size} ` : ""}image{selected.size !== 1 ? "s" : ""}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
