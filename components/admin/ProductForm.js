"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { collections as CATEGORIES } from "../../data/products";

function MediaPickerModal({ onPick, onClose, multi = false }) {
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
        // 1. Get a signed upload payload from our server.
        const signRes = await fetch("/api/admin/media/sign", { method: "POST" });
        if (!signRes.ok) {
          const e = await signRes.json().catch(() => ({}));
          throw new Error(e.error || `Signing failed (HTTP ${signRes.status}). Check CLOUDINARY_* env vars.`);
        }
        const sig = await signRes.json();
        if (!sig.cloudName) throw new Error("CLOUDINARY_CLOUD_NAME is missing on the server.");

        // 2. Direct-upload to Cloudinary.
        const fd = new FormData();
        fd.append("file", file);
        fd.append("api_key", sig.apiKey);
        fd.append("timestamp", String(sig.timestamp));
        fd.append("signature", sig.signature);
        fd.append("folder", sig.folder);
        const up = await fetch(`https://api.cloudinary.com/v1_1/${sig.cloudName}/auto/upload`, { method: "POST", body: fd });
        const data = await up.json().catch(() => ({}));
        if (!up.ok) {
          throw new Error(data.error?.message || `Cloudinary returned HTTP ${up.status}`);
        }

        // 3. Record in our DB so the library lists it.
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
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
            <p className="text-xs text-gray-500">Files go to Cloudinary and appear instantly below.</p>
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

export default function ProductForm({ product }) {
  const router = useRouter();
  const [form, setForm] = useState({
    slug: product?.slug || "",
    title: product?.title || "",
    description: product?.description || "",
    price: product?.price ?? "",
    compareAtPrice: product?.compareAtPrice ?? "",
    image: product?.image || "",
    collection: product?.collection || "",
    tags: (product?.tags || []).join(", "),
    inventory: product?.inventory ?? 100,
    featured: !!product?.featured,
  });
  const [gallery, setGallery] = useState(product?.images || []);
  const [variants, setVariants] = useState(product?.variants || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [picking, setPicking] = useState(null); // { kind: "primary"|"gallery"|"variant", variantIdx? }
  const isEdit = !!product?._id;

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }
  function updateVariant(i, patch) {
    setVariants((arr) => arr.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  }

  async function submit(e) {
    e.preventDefault();
    setSaving(true); setError("");
    const payload = {
      ...form,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice === "" ? null : Number(form.compareAtPrice),
      inventory: Number(form.inventory),
      images: gallery,
      tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
      variants: variants
        .filter((v) => v.name?.trim())
        .map((v) => ({
          id: v.id || (v.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) + "-" + Math.random().toString(36).slice(2, 6)),
          name: v.name.trim(),
          sku: v.sku?.trim() || undefined,
          price: v.price === "" || v.price == null ? undefined : Number(v.price),
          inventory: Number(v.inventory) || 0,
          image: v.image || undefined,
          colorHex: v.colorHex || undefined,
        })),
    };
    const res = await fetch(isEdit ? `/api/admin/products/${product._id}` : `/api/admin/products`, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "Save failed"); return; }
    router.push("/admin/products");
    router.refresh();
  }

  async function del() {
    if (!isEdit) return;
    if (!confirm("Delete this product?")) return;
    await fetch(`/api/admin/products/${product._id}`, { method: "DELETE" });
    router.push("/admin/products");
    router.refresh();
  }

  function onPick(urlOrUrls) {
    if (!picking) return;
    if (picking.kind === "primary") set("image", urlOrUrls);
    else if (picking.kind === "gallery") {
      const urls = Array.isArray(urlOrUrls) ? urlOrUrls : [urlOrUrls];
      setGallery((g) => [...g, ...urls.filter((u) => !g.includes(u))]);
    } else if (picking.kind === "variant") {
      updateVariant(picking.variantIdx, { image: urlOrUrls });
    }
  }

  function removeFromGallery(i) {
    setGallery((g) => g.filter((_, j) => j !== i));
  }
  function moveInGallery(i, delta) {
    setGallery((g) => {
      const next = [...g];
      const j = i + delta;
      if (j < 0 || j >= next.length) return next;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  const field = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500";
  const label = "block text-xs uppercase tracking-wide text-gray-600 mb-1";

  return (
    <form onSubmit={submit} className="space-y-5 max-w-4xl">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>}

      <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-sm">Basics</h2>
        <div className="grid grid-cols-2 gap-4">
          <div><label className={label}>Title</label><input className={field} value={form.title} onChange={(e) => set("title", e.target.value)} required /></div>
          <div><label className={label}>Slug</label><input className={field} value={form.slug} onChange={(e) => set("slug", e.target.value)} required /></div>
        </div>
        <div><label className={label}>Description</label><textarea className={field} rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className={label}>Price (৳)</label><input className={field} type="number" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} required /></div>
          <div><label className={label}>Compare-at (৳) <span className="text-gray-400 normal-case">— for sale badge</span></label><input className={field} type="number" step="0.01" value={form.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} /></div>
          <div><label className={label}>Inventory</label><input className={field} type="number" value={form.inventory} onChange={(e) => set("inventory", e.target.value)} /></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={label}>Category</label>
            <select
              className={field}
              value={form.collection}
              onChange={(e) => set("collection", e.target.value)}
            >
              <option value="">— Uncategorised —</option>
              {CATEGORIES.map((c) => (
                <option key={c.slug} value={c.slug}>{c.title}</option>
              ))}
            </select>
            <p className="text-[11px] text-gray-500 mt-1">Pick a category. This drives the &ldquo;Shop by Category&rdquo; tabs and the /collections pages.</p>
          </div>
          <div>
            <label className={label}>Tags (comma-separated)</label>
            <input className={field} value={form.tags} onChange={(e) => set("tags", e.target.value)} placeholder="linen, summer, gift" />
            <p className="text-[11px] text-gray-500 mt-1">Free-form keywords used by search and filters.</p>
          </div>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} />
          Featured (shows in &ldquo;This week&apos;s favourites&rdquo; on the homepage)
        </label>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-sm">Images</h2>

        <div>
          <label className={label}>Primary image (first one customers see)</label>
          <div className="flex items-start gap-3">
            <div className="w-32 h-32 border border-gray-200 rounded overflow-hidden bg-gray-50 flex items-center justify-center shrink-0">
              {form.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image} alt="" className="w-full h-full object-cover" />
              ) : <span className="text-[10px] text-gray-400">No image</span>}
            </div>
            <div className="flex-1 space-y-2">
              <input className={field} value={form.image} onChange={(e) => set("image", e.target.value)} placeholder="https://… or pick from library" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setPicking({ kind: "primary" })} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded">Pick / Upload</button>
                {form.image && <button type="button" onClick={() => set("image", "")} className="text-xs text-red-600 hover:underline">Remove</button>}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className={label}>Gallery (additional images)</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {gallery.map((url, i) => (
              <div key={url + i} className="relative group border border-gray-200 rounded overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="" className="w-full aspect-square object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                  <button type="button" onClick={() => moveInGallery(i, -1)} disabled={i === 0} className="text-[10px] bg-white/95 px-1.5 py-0.5 rounded disabled:opacity-40">←</button>
                  <button type="button" onClick={() => moveInGallery(i, 1)} disabled={i === gallery.length - 1} className="text-[10px] bg-white/95 px-1.5 py-0.5 rounded disabled:opacity-40">→</button>
                  <button type="button" onClick={() => removeFromGallery(i)} className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded">✕</button>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={() => setPicking({ kind: "gallery" })}
              className="border-2 border-dashed border-gray-300 rounded aspect-square flex flex-col items-center justify-center text-xs text-gray-500 hover:border-[#1a2b4a] hover:text-[#1a2b4a]"
            >
              <span className="text-2xl mb-1">+</span>
              Add images
            </button>
          </div>
          <p className="text-[11px] text-gray-500 mt-2">You can select multiple at once. Drag the corner buttons to reorder.</p>
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-sm">Variants (color / size)</h2>
            <p className="text-xs text-gray-500">Optional. When present, customers must pick one. Variant stock replaces the master inventory.</p>
          </div>
          <button
            type="button"
            onClick={() => setVariants((v) => [...v, { id: "", name: "", sku: "", price: "", inventory: 0, image: "", colorHex: "" }])}
            className="text-xs bg-[#1a2b4a] text-white px-3 py-1.5 rounded"
          >+ Add variant</button>
        </div>
        {variants.length > 0 && (
          <div className="space-y-3">
            {variants.map((v, i) => (
              <div key={i} className="border border-gray-200 rounded p-3 grid grid-cols-12 gap-2 items-center">
                <div className="col-span-12 md:col-span-1">
                  <div className="w-14 h-14 border border-gray-200 rounded overflow-hidden bg-gray-50 flex items-center justify-center">
                    {v.image ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={v.image} alt="" className="w-full h-full object-cover" />
                    ) : v.colorHex ? (
                      <span className="w-8 h-8 rounded-full border border-gray-300" style={{ backgroundColor: v.colorHex }} />
                    ) : <span className="text-[9px] text-gray-400">No img</span>}
                  </div>
                  <button type="button" onClick={() => setPicking({ kind: "variant", variantIdx: i })} className="text-[10px] text-blue-600 hover:underline mt-1">Pick image</button>
                  {v.image && <button type="button" onClick={() => updateVariant(i, { image: "" })} className="text-[10px] text-red-600 hover:underline ml-2">Clear</button>}
                </div>
                <input className="col-span-6 md:col-span-3 border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Name (e.g. Red / Large)" value={v.name} onChange={(e) => updateVariant(i, { name: e.target.value })} />
                <input className="col-span-6 md:col-span-1 border border-gray-300 rounded px-2 py-1.5 text-sm" type="color" title="Color swatch" value={v.colorHex || "#000000"} onChange={(e) => updateVariant(i, { colorHex: e.target.value })} />
                <input className="col-span-6 md:col-span-2 border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="SKU" value={v.sku || ""} onChange={(e) => updateVariant(i, { sku: e.target.value })} />
                <input className="col-span-3 md:col-span-2 border border-gray-300 rounded px-2 py-1.5 text-sm" type="number" step="0.01" placeholder="Price" value={v.price ?? ""} onChange={(e) => updateVariant(i, { price: e.target.value })} />
                <input className="col-span-3 md:col-span-2 border border-gray-300 rounded px-2 py-1.5 text-sm" type="number" placeholder="Stock" value={v.inventory ?? 0} onChange={(e) => updateVariant(i, { inventory: e.target.value })} />
                <button type="button" onClick={() => setVariants((arr) => arr.filter((_, j) => j !== i))} className="col-span-12 md:col-span-1 text-xs text-red-600 hover:underline">Remove</button>
              </div>
            ))}
          </div>
        )}
      </section>

      {picking && (
        <MediaPickerModal
          onClose={() => setPicking(null)}
          onPick={onPick}
          multi={picking.kind === "gallery"}
        />
      )}

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={saving} className="bg-[#1a2b4a] text-white px-5 py-2 rounded text-sm hover:bg-[#0f1c33] disabled:opacity-50">{saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}</button>
        {isEdit && <button type="button" onClick={del} className="text-red-600 text-sm hover:underline">Delete</button>}
      </div>
    </form>
  );
}
