"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ProductForm({ product }) {
  const router = useRouter();
  const [form, setForm] = useState({
    slug: product?.slug || "",
    title: product?.title || "",
    description: product?.description || "",
    price: product?.price ?? "",
    compareAtPrice: product?.compareAtPrice ?? "",
    image: product?.image || "",
    images: (product?.images || []).join("\n"),
    collection: product?.collection || "",
    tags: (product?.tags || []).join(", "),
    inventory: product?.inventory ?? 100,
    featured: !!product?.featured,
  });
  const [variants, setVariants] = useState(product?.variants || []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = !!product?._id;

  function set(k, v) { setForm((f) => ({ ...f, [k]: v })); }

  async function submit(e) {
    e.preventDefault();
    setSaving(true); setError("");
    const payload = {
      ...form,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice === "" ? null : Number(form.compareAtPrice),
      inventory: Number(form.inventory),
      images: form.images.split("\n").map((s) => s.trim()).filter(Boolean),
      tags: form.tags.split(",").map((s) => s.trim()).filter(Boolean),
      variants: variants
        .filter((v) => v.name?.trim())
        .map((v) => ({
          id: v.id || (v.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40) + "-" + Math.random().toString(36).slice(2, 6)),
          name: v.name.trim(),
          sku: v.sku?.trim() || undefined,
          price: v.price === "" || v.price == null ? undefined : Number(v.price),
          inventory: Number(v.inventory) || 0,
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

  const field = "w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:border-gray-500";
  const label = "block text-xs uppercase tracking-wide text-gray-600 mb-1";

  return (
    <form onSubmit={submit} className="space-y-5 max-w-3xl">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>}
      <div className="grid grid-cols-2 gap-4">
        <div><label className={label}>Title</label><input className={field} value={form.title} onChange={(e) => set("title", e.target.value)} required /></div>
        <div><label className={label}>Slug</label><input className={field} value={form.slug} onChange={(e) => set("slug", e.target.value)} required /></div>
      </div>
      <div><label className={label}>Description</label><textarea className={field} rows={5} value={form.description} onChange={(e) => set("description", e.target.value)} /></div>
      <div className="grid grid-cols-3 gap-4">
        <div><label className={label}>Price</label><input className={field} type="number" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} required /></div>
        <div><label className={label}>Compare-at</label><input className={field} type="number" step="0.01" value={form.compareAtPrice} onChange={(e) => set("compareAtPrice", e.target.value)} /></div>
        <div><label className={label}>Inventory</label><input className={field} type="number" value={form.inventory} onChange={(e) => set("inventory", e.target.value)} /></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className={label}>Collection slug</label><input className={field} value={form.collection} onChange={(e) => set("collection", e.target.value)} placeholder="fashion / home-living / beauty / wellness" /></div>
        <div><label className={label}>Tags (comma-separated)</label><input className={field} value={form.tags} onChange={(e) => set("tags", e.target.value)} /></div>
      </div>
      <div><label className={label}>Primary image URL</label><input className={field} value={form.image} onChange={(e) => set("image", e.target.value)} /></div>
      <div><label className={label}>Additional images (one URL per line)</label><textarea className={field} rows={3} value={form.images} onChange={(e) => set("images", e.target.value)} /></div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.featured} onChange={(e) => set("featured", e.target.checked)} /> Featured</label>

      <div className="border-t border-gray-200 pt-5">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-semibold text-sm">Variants</h2>
            <p className="text-xs text-gray-500">Optional. When present, customers must pick one before adding to cart, and variant inventory replaces the master stock.</p>
          </div>
          <button
            type="button"
            onClick={() => setVariants((v) => [...v, { id: "", name: "", sku: "", price: "", inventory: 0 }])}
            className="text-xs bg-[#1a2b4a] text-white px-3 py-1.5 rounded"
          >+ Add variant</button>
        </div>
        {variants.length > 0 && (
          <div className="space-y-2">
            {variants.map((v, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-center">
                <input className="col-span-3 border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="Name (e.g. Large / Red)" value={v.name} onChange={(e) => setVariants((arr) => arr.map((x, j) => (j === i ? { ...x, name: e.target.value } : x)))} />
                <input className="col-span-3 border border-gray-300 rounded px-2 py-1.5 text-sm" placeholder="SKU (optional)" value={v.sku || ""} onChange={(e) => setVariants((arr) => arr.map((x, j) => (j === i ? { ...x, sku: e.target.value } : x)))} />
                <input className="col-span-2 border border-gray-300 rounded px-2 py-1.5 text-sm" type="number" step="0.01" placeholder="Price (or blank)" value={v.price ?? ""} onChange={(e) => setVariants((arr) => arr.map((x, j) => (j === i ? { ...x, price: e.target.value } : x)))} />
                <input className="col-span-2 border border-gray-300 rounded px-2 py-1.5 text-sm" type="number" placeholder="Stock" value={v.inventory ?? 0} onChange={(e) => setVariants((arr) => arr.map((x, j) => (j === i ? { ...x, inventory: e.target.value } : x)))} />
                <button type="button" onClick={() => setVariants((arr) => arr.filter((_, j) => j !== i))} className="col-span-2 text-xs text-red-600 hover:underline">Remove</button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={saving} className="bg-[#1a2b4a] text-white px-5 py-2 rounded text-sm hover:bg-[#0f1c33] disabled:opacity-50">{saving ? "Saving…" : isEdit ? "Save changes" : "Create product"}</button>
        {isEdit && <button type="button" onClick={del} className="text-red-600 text-sm hover:underline">Delete</button>}
      </div>
    </form>
  );
}
