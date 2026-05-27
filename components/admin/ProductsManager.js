"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatMoney } from "../../lib/format";

const PAGE_SIZE_LIST = 25;
const PAGE_SIZE_GRID = 24;

export default function ProductsManager({ initial }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [q, setQ] = useState("");
  const [collection, setCollection] = useState("");
  const [stockFilter, setStockFilter] = useState(""); // "low" | "out" | ""
  const [saleOnly, setSaleOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [page, setPage] = useState(0);
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState("list"); // "list" | "grid"

  const collections = useMemo(() => {
    const set = new Set(items.map((p) => p.collection).filter(Boolean));
    return Array.from(set).sort();
  }, [items]);

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return items.filter((p) => {
      if (term && !(p.title.toLowerCase().includes(term) || p.slug.toLowerCase().includes(term))) return false;
      if (collection && p.collection !== collection) return false;
      if (stockFilter === "out" && p.inventory > 0) return false;
      if (stockFilter === "low" && (p.inventory <= 0 || p.inventory > 5)) return false;
      if (saleOnly && !(p.compareAtPrice && p.compareAtPrice > p.price)) return false;
      if (featuredOnly && !p.featured) return false;
      return true;
    });
  }, [items, q, collection, stockFilter, saleOnly, featuredOnly]);

  const pageSize = view === "grid" ? PAGE_SIZE_GRID : PAGE_SIZE_LIST;
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const visible = filtered.slice(page * pageSize, (page + 1) * pageSize);

  function toggleSel(id) {
    setSelected((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }
  function toggleAllVisible() {
    setSelected((s) => {
      const next = new Set(s);
      const visibleIds = visible.map((p) => p._id);
      const allSelected = visibleIds.every((id) => next.has(id));
      if (allSelected) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  }
  function clearSel() { setSelected(new Set()); }

  async function bulkUpdate(patch, label) {
    if (selected.size === 0) return;
    if (!confirm(`${label} ${selected.size} product${selected.size > 1 ? "s" : ""}?`)) return;
    setBusy(true);
    const ids = [...selected];
    for (const id of ids) {
      const p = items.find((x) => x._id === id);
      if (!p) continue;
      // PUT requires the full product payload — fetch + patch + save.
      const r = await fetch(`/api/admin/products/${id}`);
      if (!r.ok) continue;
      const { product } = await r.json();
      await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...product, ...patch }),
      });
    }
    setItems((arr) => arr.map((p) => (selected.has(p._id) ? { ...p, ...patch } : p)));
    clearSel();
    setBusy(false);
    router.refresh();
  }

  async function bulkPriceAdjust() {
    if (selected.size === 0) return;
    const input = prompt(
      "Adjust price for selected products.\n• \"-10%\" or \"+15%\" for a percentage\n• \"-200\" or \"+200\" for a flat ৳ amount\n• \"=999\" to set an exact price",
      "-10%"
    );
    if (!input) return;
    const raw = input.trim();
    let mode, value;
    if (raw.startsWith("=")) { mode = "set"; value = Number(raw.slice(1)); }
    else if (raw.endsWith("%")) { mode = "pct"; value = Number(raw.replace("%", "")); }
    else { mode = "flat"; value = Number(raw); }
    if (!Number.isFinite(value)) { alert("Invalid value."); return; }

    setBusy(true);
    for (const id of selected) {
      const r = await fetch(`/api/admin/products/${id}`);
      if (!r.ok) continue;
      const { product } = await r.json();
      let next = product.price;
      if (mode === "set") next = value;
      else if (mode === "pct") next = product.price * (1 + value / 100);
      else next = product.price + value;
      next = Math.max(0, Math.round(next));
      await fetch(`/api/admin/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...product, price: next }),
      });
    }
    // Reflect new prices locally without a full reload.
    setItems((arr) => arr.map((p) => {
      if (!selected.has(p._id)) return p;
      let next = p.price;
      if (mode === "set") next = value;
      else if (mode === "pct") next = p.price * (1 + value / 100);
      else next = p.price + value;
      return { ...p, price: Math.max(0, Math.round(next)) };
    }));
    clearSel();
    setBusy(false);
    router.refresh();
  }

  async function bulkDelete() {
    if (selected.size === 0) return;
    if (!confirm(`DELETE ${selected.size} product${selected.size > 1 ? "s" : ""}? This cannot be undone.`)) return;
    setBusy(true);
    for (const id of selected) {
      await fetch(`/api/admin/products/${id}`, { method: "DELETE" });
    }
    setItems((arr) => arr.filter((p) => !selected.has(p._id)));
    clearSel();
    setBusy(false);
    router.refresh();
  }

  async function duplicate(id) {
    const p = items.find((x) => x._id === id);
    if (!p) return;
    const r = await fetch(`/api/admin/products/${id}`);
    if (!r.ok) return;
    const { product } = await r.json();
    const dup = { ...product };
    delete dup._id;
    dup.slug = `${product.slug}-copy-${Math.random().toString(36).slice(2, 5)}`;
    dup.title = `${product.title} (copy)`;
    dup.featured = false;
    const created = await fetch(`/api/admin/products`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dup),
    });
    if (created.ok) {
      const { id: newId } = await created.json();
      router.push(`/admin/products/${newId}`);
    }
  }

  const allVisibleSelected = visible.length > 0 && visible.every((p) => selected.has(p._id));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-semibold">
          Products <span className="text-gray-400 text-base font-normal">({filtered.length}{filtered.length !== items.length ? ` of ${items.length}` : ""})</span>
        </h1>
        <div className="flex items-center gap-2">
          <div className="inline-flex border border-gray-300 rounded overflow-hidden">
            <button onClick={() => { setView("list"); setPage(0); }} className={`text-xs px-3 py-1.5 ${view === "list" ? "bg-[#1a2b4a] text-white" : "bg-white text-gray-700"}`}>List</button>
            <button onClick={() => { setView("grid"); setPage(0); }} className={`text-xs px-3 py-1.5 ${view === "grid" ? "bg-[#1a2b4a] text-white" : "bg-white text-gray-700"}`}>Grid</button>
          </div>
          <Link href="/admin/products/new" className="bg-[#1a2b4a] text-white px-4 py-2 rounded text-sm hover:bg-[#0f1c33]">+ New product</Link>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-wrap gap-2 items-end">
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">Search</label>
          <input
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(0); }}
            placeholder="Title or slug"
            className="border border-gray-300 rounded px-2 py-1.5 text-sm w-56"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">Collection</label>
          <select value={collection} onChange={(e) => { setCollection(e.target.value); setPage(0); }} className="border border-gray-300 rounded px-2 py-1.5 text-sm">
            <option value="">All</option>
            {collections.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">Stock</label>
          <select value={stockFilter} onChange={(e) => { setStockFilter(e.target.value); setPage(0); }} className="border border-gray-300 rounded px-2 py-1.5 text-sm">
            <option value="">Any</option>
            <option value="low">Low (≤5)</option>
            <option value="out">Out of stock</option>
          </select>
        </div>
        <label className="flex items-center gap-1.5 text-sm ml-2">
          <input type="checkbox" checked={saleOnly} onChange={(e) => { setSaleOnly(e.target.checked); setPage(0); }} />
          On sale
        </label>
        <label className="flex items-center gap-1.5 text-sm">
          <input type="checkbox" checked={featuredOnly} onChange={(e) => { setFeaturedOnly(e.target.checked); setPage(0); }} />
          Featured
        </label>
        {(q || collection || stockFilter || saleOnly || featuredOnly) && (
          <button onClick={() => { setQ(""); setCollection(""); setStockFilter(""); setSaleOnly(false); setFeaturedOnly(false); setPage(0); }} className="text-xs text-gray-500 underline ml-auto">Clear filters</button>
        )}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="sticky top-0 z-10 bg-[#1a2b4a] text-white rounded-lg px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <button onClick={() => bulkUpdate({ featured: true }, "Feature")} disabled={busy} className="text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded disabled:opacity-50">Feature</button>
          <button onClick={() => bulkUpdate({ featured: false }, "Un-feature")} disabled={busy} className="text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded disabled:opacity-50">Un-feature</button>
          <button onClick={bulkPriceAdjust} disabled={busy} className="text-xs bg-white/15 hover:bg-white/25 px-3 py-1.5 rounded disabled:opacity-50">Adjust price</button>
          <button onClick={bulkDelete} disabled={busy} className="text-xs bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded disabled:opacity-50 ml-auto">Delete</button>
          <button onClick={clearSel} className="text-xs underline">Clear</button>
        </div>
      )}

      {view === "list" ? (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-3 py-2 w-8"><input type="checkbox" checked={allVisibleSelected} onChange={toggleAllVisible} aria-label="Select all" /></th>
                <th className="px-4 py-2 w-12"></th>
                <th className="px-4 py-2">Title</th>
                <th className="px-4 py-2">Slug</th>
                <th className="px-4 py-2">Collection</th>
                <th className="px-4 py-2 text-right">Price</th>
                <th className="px-4 py-2 text-right">Stock</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visible.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500">
                  {items.length === 0 ? "No products yet. Click + New product to add one." : "No products match these filters."}
                </td></tr>
              )}
              {visible.map((p) => {
                const onSale = p.compareAtPrice && p.compareAtPrice > p.price;
                return (
                  <tr key={p._id} className={selected.has(p._id) ? "bg-blue-50/40" : ""}>
                    <td className="px-3 py-2"><input type="checkbox" checked={selected.has(p._id)} onChange={() => toggleSel(p._id)} /></td>
                    <td className="px-4 py-2">
                      {p.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.image} alt="" className="w-9 h-9 rounded object-cover border border-gray-200" />
                      ) : <div className="w-9 h-9 rounded bg-gray-100" />}
                    </td>
                    <td className="px-4 py-2">
                      <Link href={`/admin/products/${p._id}`} className="hover:underline">{p.title}</Link>
                      {p.featured && <span className="ml-2 text-[10px] uppercase text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Featured</span>}
                      {onSale && <span className="ml-2 text-[10px] uppercase text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">Sale</span>}
                      {p.variantsCount > 0 && <span className="ml-2 text-[10px] uppercase text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">{p.variantsCount} variants</span>}
                    </td>
                    <td className="px-4 py-2 text-gray-500 font-mono text-xs">{p.slug}</td>
                    <td className="px-4 py-2 text-gray-500">{p.collection || "—"}</td>
                    <td className="px-4 py-2 text-right">{formatMoney(p.price)}</td>
                    <td className={`px-4 py-2 text-right ${p.inventory <= 0 ? "text-red-600" : p.inventory <= 5 ? "text-amber-700" : ""}`}>{p.inventory}</td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <button onClick={() => duplicate(p._id)} className="text-gray-500 hover:underline text-xs mr-3" title="Duplicate">Duplicate</button>
                      <Link href={`/admin/products/${p._id}`} className="text-blue-600 hover:underline text-xs">Edit</Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div>
          {visible.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-lg p-10 text-center text-gray-500">
              {items.length === 0 ? "No products yet. Click + New product to add one." : "No products match these filters."}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {visible.map((p) => {
                const onSale = p.compareAtPrice && p.compareAtPrice > p.price;
                const sel = selected.has(p._id);
                return (
                  <div key={p._id} className={`relative bg-white border rounded-lg overflow-hidden ${sel ? "border-[#1a2b4a] ring-1 ring-[#1a2b4a]" : "border-gray-200"}`}>
                    <input
                      type="checkbox"
                      checked={sel}
                      onChange={() => toggleSel(p._id)}
                      className="absolute top-2 left-2 z-10 w-4 h-4"
                    />
                    {p.featured && <span className="absolute top-2 right-2 z-10 text-[9px] uppercase font-bold bg-amber-500 text-white px-1.5 py-0.5 rounded">Featured</span>}
                    {onSale && <span className="absolute top-2 right-2 z-10 text-[9px] uppercase font-bold bg-rose-600 text-white px-1.5 py-0.5 rounded">Sale</span>}
                    <Link href={`/admin/products/${p._id}`} className="block">
                      <div className="aspect-square bg-gray-50 relative">
                        {p.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">No image</div>
                        )}
                        {p.inventory <= 0 && (
                          <span className="absolute bottom-2 left-2 text-[10px] uppercase font-bold bg-red-600 text-white px-1.5 py-0.5 rounded">Out</span>
                        )}
                      </div>
                      <div className="p-3 space-y-1">
                        <p className="text-sm font-medium text-[#1a2b4a] line-clamp-2 leading-snug">{p.title}</p>
                        <p className="text-[11px] text-gray-500 capitalize">{p.collection || "uncategorized"}</p>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-sm font-bold text-[#b8553a]">{formatMoney(p.price)}</span>
                          <span className={`text-xs ${p.inventory <= 0 ? "text-red-600" : p.inventory <= 5 ? "text-amber-700" : "text-gray-500"}`}>{p.inventory} stock</span>
                        </div>
                      </div>
                    </Link>
                    <div className="px-3 pb-3 flex items-center justify-between border-t border-gray-100 pt-2">
                      <button onClick={() => duplicate(p._id)} className="text-[11px] text-gray-500 hover:underline">Duplicate</button>
                      <Link href={`/admin/products/${p._id}`} className="text-[11px] text-blue-600 hover:underline">Edit →</Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-gray-500">Page {page + 1} of {totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0} className="border border-gray-300 rounded px-3 py-1.5 disabled:opacity-50">← Prev</button>
            <button onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="border border-gray-300 rounded px-3 py-1.5 disabled:opacity-50">Next →</button>
          </div>
        </div>
      )}
    </div>
  );
}
