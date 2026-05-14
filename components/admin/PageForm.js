"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function PageForm({ page }) {
  const router = useRouter();
  const isEdit = !!page;
  const [form, setForm] = useState({
    slug: page?.slug || "",
    title: page?.title || "",
    body: page?.body || "",
    published: page?.published !== false,
    metaTitle: page?.metaTitle || "",
    metaDescription: page?.metaDescription || "",
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function save(e) {
    e.preventDefault();
    setBusy(true); setErr("");
    const res = await fetch(isEdit ? `/api/admin/pages/${page.slug}` : `/api/admin/pages`, {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setErr(data.error || "Failed"); return; }
    router.push("/admin/pages");
    router.refresh();
  }

  async function del() {
    if (!confirm("Delete this page?")) return;
    await fetch(`/api/admin/pages/${page.slug}`, { method: "DELETE" });
    router.push("/admin/pages");
    router.refresh();
  }

  const field = "w-full border border-gray-300 rounded px-3 py-2 text-sm";
  return (
    <form onSubmit={save} className="space-y-4 max-w-3xl">
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-gray-500">Slug</label><input className={field} value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} disabled={isEdit} required /></div>
        <div><label className="text-xs text-gray-500">Title</label><input className={field} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required /></div>
      </div>
      <div><label className="text-xs text-gray-500">Body (Markdown / HTML)</label><textarea rows={15} className={field + " font-mono text-xs"} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><label className="text-xs text-gray-500">Meta title</label><input className={field} value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} /></div>
        <div><label className="text-xs text-gray-500">Meta description</label><input className={field} value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} /></div>
      </div>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.published} onChange={(e) => setForm({ ...form, published: e.target.checked })} /> Published</label>
      <div className="flex items-center gap-3">
        <button disabled={busy} className="bg-[#1a2b4a] text-white px-5 py-2 rounded text-sm disabled:opacity-50">{busy ? "…" : isEdit ? "Save" : "Create"}</button>
        {isEdit && <button type="button" onClick={del} className="text-red-600 text-sm hover:underline">Delete</button>}
        {isEdit && <a href={`/p/${page.slug}`} target="_blank" rel="noreferrer" className="text-blue-600 text-sm hover:underline">View →</a>}
      </div>
    </form>
  );
}
