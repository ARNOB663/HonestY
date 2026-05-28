"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatMoney } from "../../lib/format";

// productOptions: [{ slug, title, price, compareAtPrice, image, collection }]
export default function SalesGroupEditor({ group, productOptions }) {
  const router = useRouter();
  const isEdit = !!group?._id;

  const [form, setForm] = useState({
    title: group?.title || "",
    subtitle: group?.subtitle || "",
    eyebrow: group?.eyebrow || "Limited Time",
    active: group?.active !== false,
    sortOrder: group?.sortOrder ?? 0,
    productSlugs: Array.isArray(group?.productSlugs) ? group.productSlugs : [],
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // Map slug → product data for quick lookup.
  const bySlug = useMemo(() => {
    const m = new Map();
    for (const p of productOptions) m.set(p.slug, p);
    return m;
  }, [productOptions]);

  // The currently picked products in admin-set order.
  const picked = form.productSlugs.map((s) => bySlug.get(s)).filter(Boolean);

  // Filter the pool by search.
  const pool = useMemo(() => {
    const q = search.trim().toLowerCase();
    return productOptions
      .filter((p) => !form.productSlugs.includes(p.slug))
      .filter((p) => !q || p.title.toLowerCase().includes(q) || p.slug.toLowerCase().includes(q))
      .slice(0, 40);
  }, [productOptions, form.productSlugs, search]);

  function addProduct(slug) {
    if (form.productSlugs.includes(slug)) return;
    setForm((f) => ({ ...f, productSlugs: [...f.productSlugs, slug] }));
  }
  function removeProduct(slug) {
    setForm((f) => ({ ...f, productSlugs: f.productSlugs.filter((s) => s !== slug) }));
  }
  function move(i, delta) {
    setForm((f) => {
      const arr = [...f.productSlugs];
      const j = i + delta;
      if (j < 0 || j >= arr.length) return f;
      [arr[i], arr[j]] = [arr[j], arr[i]];
      return { ...f, productSlugs: arr };
    });
  }

  // Per-product discount editor: applies a discount % to the actual product,
  // i.e. sets price = oldPrice * (1 - pct/100) and compareAtPrice = oldPrice
  // so the storefront shows the sale badge AND the discount applies at
  // checkout. This is the "real" way to discount.
  async function applyDiscount(slug, pct) {
    const p = bySlug.get(slug);
    if (!p) return;
    const factor = 1 - (Number(pct) || 0) / 100;
    if (!Number.isFinite(factor) || factor < 0 || factor > 1) {
      alert("Discount must be between 0 and 100.");
      return;
    }
    // Anchor: keep original full price as compareAtPrice. If one already
    // exists and is higher than the current price, use that; otherwise use
    // current price as the new compare-at.
    const originalFull = Math.max(Number(p.compareAtPrice) || 0, Number(p.price) || 0);
    const newPrice = Math.round(originalFull * factor);

    // Fetch full product, send back with adjusted price/compareAtPrice.
    const r = await fetch(`/api/admin/products/${(await findIdBySlug(slug)) || ""}`);
    if (!r.ok) { alert("Could not fetch product to update."); return; }
    const data = await r.json();
    const product = data.product;
    if (!product) { alert("Product not found."); return; }

    const updated = await fetch(`/api/admin/products/${product._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...product, price: newPrice, compareAtPrice: originalFull }),
    });
    if (!updated.ok) {
      const e = await updated.json().catch(() => ({}));
      alert(e.error || "Could not save discount.");
      return;
    }
    // Reflect the change locally so the UI updates without a full reload.
    p.price = newPrice;
    p.compareAtPrice = originalFull;
    setForm((f) => ({ ...f })); // trigger re-render
  }

  // We don't have product _id in props (lighter payload). Look it up via API.
  async function findIdBySlug(slug) {
    const r = await fetch("/api/admin/products");
    if (!r.ok) return null;
    const data = await r.json();
    return data.products?.find((p) => p.slug === slug)?._id || null;
  }

  async function save(e) {
    e.preventDefault();
    setSaving(true); setError("");
    const url = isEdit ? `/api/admin/sales/${group._id}` : `/api/admin/sales`;
    const res = await fetch(url, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error || "Save failed"); return; }
    router.push("/admin/sales");
    router.refresh();
  }

  async function del() {
    if (!isEdit) return;
    if (!confirm("Delete this sales group? (Products are not affected.)")) return;
    await fetch(`/api/admin/sales/${group._id}`, { method: "DELETE" });
    router.push("/admin/sales");
    router.refresh();
  }

  const field = "w-full border border-gray-300 rounded px-3 py-2 text-sm";
  const label = "block text-xs uppercase tracking-wide text-gray-600 mb-1";

  return (
    <form onSubmit={save} className="space-y-5 max-w-5xl">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded text-sm">{error}</div>}

      <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <h2 className="font-semibold text-sm">Group settings</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={label}>Eyebrow (small label above title)</label><input className={field} value={form.eyebrow} onChange={(e) => setForm((f) => ({ ...f, eyebrow: e.target.value }))} placeholder="Limited Time" /></div>
          <div><label className={label}>Sort order (lower = higher on page)</label><input type="number" className={field} value={form.sortOrder} onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))} /></div>
        </div>
        <div><label className={label}>Title</label><input className={field} value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="e.g. Eid Special 2026" required /></div>
        <div><label className={label}>Subtitle</label><input className={field} value={form.subtitle} onChange={(e) => setForm((f) => ({ ...f, subtitle: e.target.value }))} placeholder="e.g. Up to 30% off — while stocks last" /></div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
          Active (show on homepage)
        </label>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-sm">Products in this group <span className="text-gray-400 font-normal">({picked.length})</span></h2>
        </div>

        {picked.length === 0 ? (
          <p className="text-sm text-gray-500">No products picked yet. Add some from the pool below.</p>
        ) : (
          <div className="space-y-2">
            {picked.map((p, i) => (
              <ProductRow
                key={p.slug}
                product={p}
                onRemove={() => removeProduct(p.slug)}
                onMoveUp={() => move(i, -1)}
                onMoveDown={() => move(i, 1)}
                canUp={i > 0}
                canDown={i < picked.length - 1}
                onApplyDiscount={(pct) => applyDiscount(p.slug, pct)}
              />
            ))}
          </div>
        )}
      </section>

      <section className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <h2 className="font-semibold text-sm">Add products</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products…"
            className="border border-gray-300 rounded px-3 py-1.5 text-sm w-56"
          />
        </div>
        {pool.length === 0 ? (
          <p className="text-sm text-gray-500">No products match.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {pool.map((p) => (
              <button
                type="button"
                key={p.slug}
                onClick={() => addProduct(p.slug)}
                className="text-left border border-gray-200 rounded-lg p-2 hover:border-[#1a2b4a] transition-colors"
              >
                <div className="aspect-square bg-gray-50 rounded mb-2 overflow-hidden">
                  {p.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.image} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-400">No image</div>
                  )}
                </div>
                <p className="text-xs font-medium text-[#1a2b4a] line-clamp-2 leading-snug">{p.title}</p>
                <p className="text-[11px] text-[#b8553a] font-bold mt-1">{formatMoney(p.price)}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      <div className="flex items-center gap-3 pt-2">
        <button type="submit" disabled={saving} className="bg-[#1a2b4a] text-white px-5 py-2 rounded text-sm hover:bg-[#0f1c33] disabled:opacity-50">
          {saving ? "Saving…" : isEdit ? "Save changes" : "Create sales group"}
        </button>
        {isEdit && <button type="button" onClick={del} className="text-red-600 text-sm hover:underline">Delete group</button>}
      </div>
    </form>
  );
}

function ProductRow({ product, onRemove, onMoveUp, onMoveDown, canUp, canDown, onApplyDiscount }) {
  const [pct, setPct] = useState("");
  const [busy, setBusy] = useState(false);
  const onSale = product.compareAtPrice && product.compareAtPrice > product.price;
  const currentPct = onSale ? Math.round((1 - product.price / product.compareAtPrice) * 100) : 0;

  async function apply() {
    if (pct === "" || isNaN(Number(pct))) return;
    setBusy(true);
    await onApplyDiscount(pct);
    setBusy(false);
    setPct("");
  }

  return (
    <div className="border border-gray-200 rounded-lg p-3 flex items-center gap-3">
      <div className="flex flex-col gap-0.5 shrink-0">
        <button type="button" onClick={onMoveUp} disabled={!canUp} className="text-xs px-1.5 py-0.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-30">↑</button>
        <button type="button" onClick={onMoveDown} disabled={!canDown} className="text-xs px-1.5 py-0.5 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-30">↓</button>
      </div>
      <div className="w-14 h-14 rounded bg-gray-50 border border-gray-200 overflow-hidden shrink-0">
        {product.image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt="" className="w-full h-full object-cover" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1a2b4a] truncate">{product.title}</p>
        <div className="flex items-baseline gap-2 mt-0.5">
          <span className="text-sm font-bold text-[#b8553a]">{formatMoney(product.price)}</span>
          {onSale && (
            <>
              <span className="text-xs text-gray-400 line-through">{formatMoney(product.compareAtPrice)}</span>
              <span className="text-[10px] uppercase font-bold bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">−{currentPct}%</span>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <input
          type="number"
          min="0"
          max="100"
          value={pct}
          onChange={(e) => setPct(e.target.value)}
          placeholder="%"
          className="w-14 border border-gray-300 rounded px-2 py-1 text-sm"
        />
        <button
          type="button"
          onClick={apply}
          disabled={busy || pct === ""}
          className="text-xs bg-[#1a2b4a] text-white px-2.5 py-1 rounded disabled:opacity-50"
          title="Apply this discount to the product's actual price"
        >
          {busy ? "…" : "Discount"}
        </button>
        <button type="button" onClick={onRemove} className="text-xs text-red-600 hover:underline ml-1">Remove</button>
      </div>
    </div>
  );
}
