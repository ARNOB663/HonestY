"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import MediaPickerModal from "./MediaPickerModal";
import { HERO_LAYOUTS, getHeroLayout } from "../../lib/heroLayouts";

const FIELD = "w-full border border-gray-300 rounded px-3 py-2 text-sm";
const LABEL = "block text-xs uppercase tracking-wide text-gray-600 mb-1";

const DEFAULT_MINIS = [
  { eyebrow: "", title: "", href: "/products", image: "", badgeText: "", bgColor: "#ede8f0" },
  { eyebrow: "", title: "", href: "/products", image: "", badgeText: "", bgColor: "#f5e8e0" },
  { eyebrow: "", title: "", href: "/products", image: "", badgeText: "", bgColor: "#dde5d8" },
];

// Tiny svg-ish thumbnail of a layout preset for the picker.
function LayoutThumb({ layout }) {
  return (
    <div className={`${layout.grid} bg-gray-50 rounded p-1`} style={{ height: 60, gap: 3 }}>
      {layout.cells.map((cell, i) => (
        <div key={i} className={`${cell.className} bg-[#1a2b4a]/15 rounded-sm`} />
      ))}
    </div>
  );
}

function BlueprintBox({ className = "", label, sub, image, color }) {
  return (
    <div
      className={`relative rounded-lg overflow-hidden border border-gray-300 flex flex-col items-center justify-center text-center ${className}`}
      style={{ backgroundColor: color || "#f3f4f6" }}
    >
      {image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={image} alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" />
      )}
      <div className="relative z-10 px-1">
        <p className="text-[11px] font-bold text-[#1a2b4a] bg-white/70 rounded px-1.5 py-0.5 inline-block">{label}</p>
        {sub && <p className="text-[9px] text-[#1a2b4a]/80 mt-1 bg-white/60 rounded px-1 inline-block">{sub}</p>}
      </div>
    </div>
  );
}

// Image field with live thumbnail + Upload/Pick button (opens MediaPickerModal).
function ImageField({ label, value, onChange }) {
  const [picking, setPicking] = useState(false);
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <div className="flex items-start gap-3">
        <div className="w-20 h-20 border border-gray-200 rounded overflow-hidden bg-gray-50 shrink-0 flex items-center justify-center">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : <span className="text-[9px] text-gray-400">no image</span>}
        </div>
        <div className="flex-1 space-y-2">
          <input className={FIELD} value={value} onChange={(e) => onChange(e.target.value)} placeholder="Upload or paste an image URL" />
          <div className="flex gap-2">
            <button type="button" onClick={() => setPicking(true)} className="text-xs bg-[#1a2b4a] text-white px-3 py-1.5 rounded">Upload / Pick image</button>
            {value && <button type="button" onClick={() => onChange("")} className="text-xs text-red-600 hover:underline">Remove</button>}
          </div>
        </div>
      </div>
      {picking && (
        <MediaPickerModal onClose={() => setPicking(false)} onPick={(url) => onChange(url)} />
      )}
    </div>
  );
}

export default function HeroBannerManager({ initial }) {
  const router = useRouter();
  const [form, setForm] = useState(() => ({
    heroLayout: initial?.heroLayout || "hero-plus-3",
    heroEyebrow: initial?.heroEyebrow || "",
    heroTitle: initial?.heroTitle || "",
    heroPriceText: initial?.heroPriceText || "",
    heroCtaText: initial?.heroCtaText || "Shop Now",
    heroCtaHref: initial?.heroCtaHref || "/products",
    heroImage: initial?.heroImage || "",
    miniBanners: (initial?.miniBanners?.length ? initial.miniBanners : DEFAULT_MINIS).map((b) => ({
      eyebrow: b.eyebrow || "",
      title: b.title || "",
      href: b.href || "/products",
      image: b.image || "",
      badgeText: b.badgeText || "",
      bgColor: b.bgColor || "#ede8f0",
    })),
  }));
  const layout = getHeroLayout(form.heroLayout);
  const cardLabels = { hero: "Main hero", card1: "Card 1", card2: "Card 2", card3: "Card 3" };
  // How many side cards the chosen layout actually shows.
  const slotsUsed = layout.slots;
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const set = (k) => (v) => setForm((f) => ({ ...f, [k]: v }));
  const updateMini = (i, patch) => setForm((f) => ({ ...f, miniBanners: f.miniBanners.map((b, j) => (j === i ? { ...b, ...patch } : b)) }));

  async function save(e) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const r = await fetch("/api/admin/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    setMsg(r.ok ? "Saved." : "Save failed.");
    setTimeout(() => setMsg(""), 3000);
    if (r.ok) router.refresh();
  }

  const POS = ["Card 1 — top-left small", "Card 2 — top-right small", "Card 3 — wide bottom"];

  return (
    <form onSubmit={save} className="space-y-5">
      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-semibold">Homepage hero & banners</h2>
          <div className="flex items-center gap-3">
            {msg && <span className={`text-sm ${msg === "Saved." ? "text-green-700" : "text-red-700"}`}>{msg}</span>}
            <button disabled={busy} className="bg-[#1a2b4a] text-white px-5 py-2 rounded text-sm disabled:opacity-50">{busy ? "Saving…" : "Save banners"}</button>
          </div>
        </div>

        {/* Layout picker — small visual thumbs for each preset. */}
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Layout</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {HERO_LAYOUTS.map((opt) => {
              const active = form.heroLayout === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => set("heroLayout")(opt.id)}
                  className={`text-left rounded-lg border-2 p-2 transition-all ${
                    active ? "border-[#1a2b4a] bg-[#1a2b4a]/5" : "border-gray-200 hover:border-gray-400"
                  }`}
                >
                  <LayoutThumb layout={opt} />
                  <p className="text-xs font-semibold mt-1.5">{opt.label}</p>
                  <p className="text-[10px] text-gray-500 leading-snug">{opt.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Live blueprint preview — reflects the selected layout + current images. */}
        <div>
          <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Live preview</p>
          <div className={`${layout.grid} max-w-2xl`} style={{ minHeight: 180 }}>
            {layout.cells.map((cell) => {
              const idx = cell.key === "hero" ? -1 : Number(cell.key.replace("card", "")) - 1;
              const data = cell.key === "hero"
                ? { image: form.heroImage, bgColor: "#f5f1e8" }
                : form.miniBanners[idx] || { image: "", bgColor: "#ede8f0" };
              return (
                <BlueprintBox
                  key={cell.key}
                  className={cell.className}
                  label={cardLabels[cell.key]}
                  image={data.image}
                  color={data.bgColor || (cell.key === "hero" ? "#f5f1e8" : "#ede8f0")}
                />
              );
            })}
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <h2 className="font-semibold">Main hero banner</h2>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={LABEL}>Eyebrow</label><input className={FIELD} value={form.heroEyebrow} onChange={(e) => set("heroEyebrow")(e.target.value)} /></div>
          <div><label className={LABEL}>Price line</label><input className={FIELD} value={form.heroPriceText} onChange={(e) => set("heroPriceText")(e.target.value)} placeholder="Starting ৳8,900" /></div>
        </div>
        <div><label className={LABEL}>Title</label><input className={FIELD} value={form.heroTitle} onChange={(e) => set("heroTitle")(e.target.value)} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><label className={LABEL}>Button text</label><input className={FIELD} value={form.heroCtaText} onChange={(e) => set("heroCtaText")(e.target.value)} /></div>
          <div><label className={LABEL}>Button link</label><input className={FIELD} value={form.heroCtaHref} onChange={(e) => set("heroCtaHref")(e.target.value)} placeholder="/products/some-slug" /></div>
        </div>
        <ImageField label="Main hero image" value={form.heroImage} onChange={set("heroImage")} />
      </div>

      {slotsUsed > 0 && (
      <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4">
        <h2 className="font-semibold">Side banner cards ({slotsUsed})</h2>
        <p className="text-xs text-gray-500">Only the cards your selected layout uses are shown. Extra card data is preserved if you switch layouts later.</p>
        {form.miniBanners.slice(0, slotsUsed).map((b, i) => (
          <div key={i} className="border border-gray-200 rounded p-4 space-y-2">
            <p className="text-xs font-semibold text-gray-700">{POS[i] || `Card ${i + 1}`}</p>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LABEL}>Eyebrow</label><input className={FIELD} value={b.eyebrow} onChange={(e) => updateMini(i, { eyebrow: e.target.value })} /></div>
              <div><label className={LABEL}>Badge text (optional)</label><input className={FIELD} value={b.badgeText} onChange={(e) => updateMini(i, { badgeText: e.target.value })} placeholder="Up to 20% off" /></div>
            </div>
            <div><label className={LABEL}>Title</label><input className={FIELD} value={b.title} onChange={(e) => updateMini(i, { title: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-2">
              <div><label className={LABEL}>Link</label><input className={FIELD} value={b.href} onChange={(e) => updateMini(i, { href: e.target.value })} /></div>
              <div><label className={LABEL}>Background color (hex)</label><input className={FIELD} value={b.bgColor} onChange={(e) => updateMini(i, { bgColor: e.target.value })} placeholder="#ede8f0" /></div>
            </div>
            <ImageField label="Card image" value={b.image} onChange={(v) => updateMini(i, { image: v })} />
          </div>
        ))}
      </div>
      )}

      <div className="flex justify-end">
        <button disabled={busy} className="bg-[#1a2b4a] text-white px-5 py-2 rounded text-sm disabled:opacity-50">{busy ? "Saving…" : "Save banners"}</button>
      </div>
    </form>
  );
}
