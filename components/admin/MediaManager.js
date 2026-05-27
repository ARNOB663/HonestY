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
  const [check, setCheck] = useState(null);

  async function runCheck() {
    setCheck({ loading: true });
    try {
      const r = await fetch("/api/admin/media/check", { method: "POST" });
      const data = await r.json().catch(() => ({ ok: false, error: "No response" }));
      setCheck(data);
    } catch (e) {
      setCheck({ ok: false, error: e.message });
    }
  }

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
      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <label className="block text-sm font-semibold">Upload images</label>
          <button type="button" onClick={runCheck} className="text-xs border border-gray-300 rounded px-2 py-1 hover:border-gray-500">
            Test Cloudinary connection
          </button>
        </div>
        <input type="file" accept="image/*" multiple onChange={handleFiles} disabled={busy} className="text-sm" />
        {busy && <p className="text-xs text-gray-500">Uploading…</p>}
        {err && (
          <div className="text-xs bg-red-50 border border-red-200 text-red-700 rounded p-2">
            <p className="font-semibold">Upload failed</p>
            <p className="mt-1">{err}</p>
            <p className="mt-1 text-red-600/80">Click &ldquo;Test Cloudinary connection&rdquo; above to diagnose.</p>
          </div>
        )}
        {check && (
          <div className={`text-xs rounded p-2 border ${check.ok ? "bg-green-50 border-green-200 text-green-800" : "bg-amber-50 border-amber-200 text-amber-900"}`}>
            {check.loading ? (
              <p>Checking…</p>
            ) : check.ok ? (
              <p className="font-semibold">✓ Connected. Cloud: <span className="font-mono">{check.env?.cloudName}</span></p>
            ) : (
              <>
                <p className="font-semibold">⚠ {check.error}</p>
                {check.hint && <p className="mt-1">{check.hint}</p>}
                {check.env && (
                  <p className="mt-1 text-amber-800/80">
                    cloud=<span className="font-mono">{check.env.cloudName || "(empty)"}</span>{" "}
                    apiKey=<span className="font-mono">{check.env.apiKey ? `${check.env.apiKey.slice(0, 4)}…` : "(empty)"}</span>{" "}
                    secret={check.env.hasSecret ? "set" : "(empty)"}
                  </p>
                )}
                <p className="mt-1 text-amber-800/80">Fix in <code>.env.local</code> then restart <code>npm run dev</code>.</p>
              </>
            )}
          </div>
        )}
        <p className="text-xs text-gray-400">Files upload directly to Cloudinary. URLs are listed below for copy/paste into product images.</p>
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
