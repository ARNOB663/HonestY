"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import MediaPickerModal from "./MediaPickerModal";

const FIELD = "w-full border border-gray-300 rounded px-3 py-2 text-sm";
const LABEL = "block text-xs uppercase tracking-wide text-gray-600 mb-1";
const SECTION = "bg-white border border-gray-200 rounded-lg p-5 space-y-4";

const ICON_OPTIONS = ["shipping", "returns", "secure", "support", "leaf", "phone", "shield", "star"];

// Image field with live thumbnail + Upload/Pick button. Pasting a URL still
// works; the picker is the alternative for non-developers.
function ImagePicker({ label = "Image", value, onChange }) {
  const [picking, setPicking] = useState(false);
  return (
    <div>
      <label className={LABEL}>{label}</label>
      <div className="flex items-start gap-3">
        <div className="w-16 h-16 border border-gray-200 rounded overflow-hidden bg-gray-50 shrink-0 flex items-center justify-center">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[9px] text-gray-400">no image</span>
          )}
        </div>
        <div className="flex-1 space-y-1.5">
          <input
            className={FIELD}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Paste URL or upload"
          />
          <div className="flex gap-2">
            <button type="button" onClick={() => setPicking(true)} className="text-xs bg-[#1a2b4a] text-white px-3 py-1 rounded">
              Upload / Pick
            </button>
            {value && (
              <button type="button" onClick={() => onChange("")} className="text-xs text-red-600 hover:underline">
                Remove
              </button>
            )}
          </div>
        </div>
      </div>
      {picking && (
        <MediaPickerModal onClose={() => setPicking(false)} onPick={(url) => onChange(url)} />
      )}
    </div>
  );
}

export default function SettingsForm({ initial }) {
  const router = useRouter();
  const [tab, setTab] = useState("store");
  const [form, setForm] = useState(() => ({
    storeName: initial?.storeName || "Honesty",
    supportEmail: initial?.supportEmail || "",
    supportPhone: initial?.supportPhone || "",
    currency: initial?.currency || "BDT",
    taxRate: initial?.taxRate ?? 0,
    announcement: initial?.announcement || "",

    flatShippingRate: initial?.flatShippingRate ?? 80,
    freeShippingThreshold: initial?.freeShippingThreshold ?? 2000,
    dhakaShippingRate: initial?.dhakaShippingRate ?? 60,
    outsideShippingRate: initial?.outsideShippingRate ?? 120,

    bkashNumber: initial?.bkashNumber || "",
    nagadNumber: initial?.nagadNumber || "",
    enableBkash: initial?.enableBkash !== false,
    enableNagad: initial?.enableNagad !== false,
    enableCod: initial?.enableCod !== false,

    // Hero & mini banners are managed in /admin/media (Media & Banners page),
    // not here. They're intentionally NOT in this form's state.

    saleTitle: initial?.saleTitle || "On sale now",
    saleSubtitle: initial?.saleSubtitle || "",
    bestSellersEyebrow: initial?.bestSellersEyebrow || "Best Sellers",
    bestSellersTitle: initial?.bestSellersTitle || "Most loved this season",
    favouritesEyebrow: initial?.favouritesEyebrow || "Editor's Picks",
    favouritesTitle: initial?.favouritesTitle || "This week's favourites",

    navLinks: (initial?.navLinks?.length ? initial.navLinks : [
      { label: "Home", href: "/" },
      { label: "Shop All", href: "/products" },
      { label: "Fashion", href: "/collections/fashion" },
      { label: "Home & Living", href: "/collections/home-living" },
      { label: "Beauty", href: "/collections/beauty" },
      { label: "Wellness", href: "/collections/wellness" },
    ]).map((n) => ({ label: n.label || "", href: n.href || "" })),

    trustBadges: (initial?.trustBadges?.length ? initial.trustBadges : [
      { title: "Free shipping", sub: "On every order over ৳2,000", icon: "shipping" },
      { title: "7-day returns", sub: "Easy, no-questions-asked", icon: "returns" },
      { title: "Secure payments", sub: "Encrypted at every step", icon: "secure" },
      { title: "Honest support", sub: "Real humans, 7 days a week", icon: "support" },
    ]).map((b) => ({ title: b.title || "", sub: b.sub || "", icon: b.icon || "shipping" })),

    categoriesTitle: initial?.categoriesTitle || "Explore our collections",
    categoriesEyebrow: initial?.categoriesEyebrow || "Shop by Category",
    homeCategories: (initial?.homeCategories || []).map((c) => ({
      slug: c.slug || "",
      title: c.title || "",
      image: c.image || "",
    })),

    brandStoryEyebrow: initial?.brandStoryEyebrow || "Our story",
    brandStoryTitle: initial?.brandStoryTitle || "",
    brandStoryBody: initial?.brandStoryBody || "",
    brandStoryCtaText: initial?.brandStoryCtaText || "Discover the Range",
    brandStoryCtaHref: initial?.brandStoryCtaHref || "/products",
    brandStoryImage: initial?.brandStoryImage || "",

    journalTitle: initial?.journalTitle || "Stories & guides",
    journalEyebrow: initial?.journalEyebrow || "From the Journal",
    journalPosts: (initial?.journalPosts || []).map((p) => ({
      title: p.title || "",
      date: p.date || "",
      category: p.category || "",
      image: p.image || "",
      href: p.href || "",
    })),

    testimonials: (initial?.testimonials || []).map((t) => ({
      name: t.name || "",
      role: t.role || "",
      quote: t.quote || "",
    })),

    footerTagline: initial?.footerTagline || "",
    footerInstagram: initial?.footerInstagram || "",
    footerFacebook: initial?.footerFacebook || "",
    footerWhatsapp: initial?.footerWhatsapp || "",
    footerColumns: (initial?.footerColumns || []).map((c) => ({
      title: c.title || "",
      links: (c.links || []).map((l) => ({ label: l.label || "", href: l.href || "" })),
    })),
  }));
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function save(e) {
    e?.preventDefault?.();
    setBusy(true); setMsg("");
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setBusy(false);
    setMsg(res.ok ? "Saved." : "Save failed.");
    setTimeout(() => setMsg(""), 3000);
    if (res.ok) router.refresh();
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setNum = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setBool = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.checked }));

  function updateItem(listKey, idx, patch) {
    setForm((f) => ({ ...f, [listKey]: f[listKey].map((it, i) => (i === idx ? { ...it, ...patch } : it)) }));
  }
  function addItem(listKey, template) {
    setForm((f) => ({ ...f, [listKey]: [...f[listKey], { ...template }] }));
  }
  function removeItem(listKey, idx) {
    setForm((f) => ({ ...f, [listKey]: f[listKey].filter((_, i) => i !== idx) }));
  }

  const TABS = [
    { id: "store", label: "Store" },
    { id: "shipping", label: "Shipping & Tax" },
    { id: "payment", label: "Payment" },
    { id: "sections", label: "Section titles" },
    { id: "nav", label: "Header nav" },
    { id: "trust", label: "Trust badges" },
    { id: "categories", label: "Categories" },
    { id: "story", label: "Brand story" },
    { id: "journal", label: "Journal" },
    { id: "testimonials", label: "Testimonials" },
    { id: "footer", label: "Footer" },
  ];

  return (
    <form onSubmit={save} className="space-y-5">
      {/* Sticky save bar */}
      <div className="sticky top-0 z-10 -mx-8 px-8 py-3 bg-gray-50/95 backdrop-blur border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`text-xs px-3 py-1.5 rounded transition-colors ${
                tab === t.id ? "bg-[#1a2b4a] text-white" : "bg-white border border-gray-300 text-gray-700 hover:border-gray-500"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className={`text-sm ${msg === "Saved." ? "text-green-700" : "text-red-700"}`}>{msg}</span>}
          <button disabled={busy} className="bg-[#1a2b4a] text-white px-5 py-2 rounded text-sm disabled:opacity-50">
            {busy ? "Saving…" : "Save settings"}
          </button>
        </div>
      </div>

      {tab === "store" && (
        <section className={SECTION}>
          <h2 className="font-semibold">Store basics</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LABEL}>Name</label><input className={FIELD} value={form.storeName} onChange={set("storeName")} /></div>
            <div><label className={LABEL}>Currency</label><input className={FIELD} value={form.currency} onChange={set("currency")} /></div>
            <div><label className={LABEL}>Support email</label><input type="email" className={FIELD} value={form.supportEmail} onChange={set("supportEmail")} /></div>
            <div><label className={LABEL}>Support phone</label><input className={FIELD} value={form.supportPhone} onChange={set("supportPhone")} /></div>
          </div>
          <div>
            <label className={LABEL}>Announcement bar text</label>
            <input className={FIELD} value={form.announcement} onChange={set("announcement")} />
            <p className="text-[11px] text-gray-500 mt-1">Top thin bar on every desktop page.</p>
          </div>
        </section>
      )}

      {tab === "shipping" && (
        <section className={SECTION}>
          <h2 className="font-semibold">Shipping & tax</h2>
          <p className="text-xs text-gray-500">
            Zone rates take precedence at checkout. Customers in Dhaka division pay the Dhaka rate; everyone else pays the Outside rate.
            The legacy flat rate is used only when zones aren&apos;t set up.
          </p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={LABEL}>Dhaka shipping rate (৳)</label>
              <input type="number" step="1" className={FIELD} value={form.dhakaShippingRate} onChange={setNum("dhakaShippingRate")} />
            </div>
            <div>
              <label className={LABEL}>Outside Dhaka shipping rate (৳)</label>
              <input type="number" step="1" className={FIELD} value={form.outsideShippingRate} onChange={setNum("outsideShippingRate")} />
            </div>
            <div>
              <label className={LABEL}>Free shipping over (৳)</label>
              <input type="number" step="1" className={FIELD} value={form.freeShippingThreshold} onChange={setNum("freeShippingThreshold")} />
              <p className="text-[11px] text-gray-500 mt-1">Set to 0 to disable free shipping.</p>
            </div>
            <div>
              <label className={LABEL}>Legacy flat shipping (fallback)</label>
              <input type="number" step="1" className={FIELD} value={form.flatShippingRate} onChange={setNum("flatShippingRate")} />
            </div>
            <div>
              <label className={LABEL}>Tax rate (%)</label>
              <input type="number" step="0.01" className={FIELD} value={form.taxRate} onChange={setNum("taxRate")} />
            </div>
          </div>
        </section>
      )}

      {tab === "payment" && (
        <section className={SECTION}>
          <h2 className="font-semibold">Payment methods</h2>
          <p className="text-xs text-gray-500">Toggle which payment options customers see at checkout. The number is shown so the customer knows where to send money.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-gray-200 rounded p-4 space-y-2">
              <label className="flex items-center gap-2 font-semibold text-sm">
                <input type="checkbox" checked={form.enableBkash} onChange={setBool("enableBkash")} />
                Enable bKash
              </label>
              <div>
                <label className={LABEL}>bKash number</label>
                <input className={FIELD} placeholder="01XXXXXXXXX" value={form.bkashNumber} onChange={set("bkashNumber")} maxLength={11} />
                {form.enableBkash && !/^01[3-9]\d{8}$/.test(String(form.bkashNumber).trim()) && (
                  <p className="text-[11px] text-amber-700 mt-1">⚠ Enter a valid 11-digit number, or bKash stays hidden at checkout.</p>
                )}
              </div>
            </div>
            <div className="border border-gray-200 rounded p-4 space-y-2">
              <label className="flex items-center gap-2 font-semibold text-sm">
                <input type="checkbox" checked={form.enableNagad} onChange={setBool("enableNagad")} />
                Enable Nagad
              </label>
              <div>
                <label className={LABEL}>Nagad number</label>
                <input className={FIELD} placeholder="01XXXXXXXXX" value={form.nagadNumber} onChange={set("nagadNumber")} maxLength={11} />
                {form.enableNagad && !/^01[3-9]\d{8}$/.test(String(form.nagadNumber).trim()) && (
                  <p className="text-[11px] text-amber-700 mt-1">⚠ Enter a valid 11-digit number, or Nagad stays hidden at checkout.</p>
                )}
              </div>
            </div>
            <div className="border border-gray-200 rounded p-4 space-y-2">
              <label className="flex items-center gap-2 font-semibold text-sm">
                <input type="checkbox" checked={form.enableCod} onChange={setBool("enableCod")} />
                Enable Cash on Delivery
              </label>
              <p className="text-xs text-gray-500">No setup needed — customers pay the courier in cash.</p>
            </div>
          </div>
        </section>
      )}

      {tab === "sections" && (
        <section className={SECTION}>
          <h2 className="font-semibold">Homepage section titles</h2>
          <p className="text-xs text-gray-500">
            Products on sale = any product with a Compare-at price higher than its actual price.
            Featured = products with the &ldquo;Featured&rdquo; checkbox on.
          </p>
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">Sale section</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={LABEL}>Title</label><input className={FIELD} value={form.saleTitle} onChange={set("saleTitle")} /></div>
              <div><label className={LABEL}>Subtitle</label><input className={FIELD} value={form.saleSubtitle} onChange={set("saleSubtitle")} /></div>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">Best sellers</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={LABEL}>Eyebrow</label><input className={FIELD} value={form.bestSellersEyebrow} onChange={set("bestSellersEyebrow")} /></div>
              <div><label className={LABEL}>Title</label><input className={FIELD} value={form.bestSellersTitle} onChange={set("bestSellersTitle")} /></div>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-3">
            <p className="text-xs font-semibold text-gray-700 mb-2">Editor&apos;s picks / favourites</p>
            <div className="grid grid-cols-2 gap-3">
              <div><label className={LABEL}>Eyebrow</label><input className={FIELD} value={form.favouritesEyebrow} onChange={set("favouritesEyebrow")} /></div>
              <div><label className={LABEL}>Title</label><input className={FIELD} value={form.favouritesTitle} onChange={set("favouritesTitle")} /></div>
            </div>
          </div>
        </section>
      )}

      {tab === "nav" && (
        <section className={SECTION}>
          <h2 className="font-semibold">Header navigation</h2>
          <p className="text-xs text-gray-500">Links that appear in the top header (desktop + mobile menu). Drag-free reordering — to move, edit the order by adding/removing.</p>
          {form.navLinks.map((n, i) => (
            <div key={i} className="border border-gray-200 rounded p-4 grid grid-cols-1 md:grid-cols-2 gap-2 items-start">
              <div><label className={LABEL}>Label</label><input className={FIELD} value={n.label} onChange={(e) => updateItem("navLinks", i, { label: e.target.value })} placeholder="Fashion" /></div>
              <div><label className={LABEL}>Link (URL or path)</label><input className={FIELD} value={n.href} onChange={(e) => updateItem("navLinks", i, { href: e.target.value })} placeholder="/collections/fashion" /></div>
              <div className="md:col-span-2 flex items-center gap-3">
                <button type="button" onClick={() => removeItem("navLinks", i)} className="text-xs text-red-600 hover:underline">Remove</button>
                {i > 0 && (
                  <button type="button" onClick={() => setForm((f) => { const a = [...f.navLinks]; [a[i-1], a[i]] = [a[i], a[i-1]]; return { ...f, navLinks: a }; })} className="text-xs text-gray-600 hover:underline">↑ Move up</button>
                )}
                {i < form.navLinks.length - 1 && (
                  <button type="button" onClick={() => setForm((f) => { const a = [...f.navLinks]; [a[i], a[i+1]] = [a[i+1], a[i]]; return { ...f, navLinks: a }; })} className="text-xs text-gray-600 hover:underline">↓ Move down</button>
                )}
              </div>
            </div>
          ))}
          <button type="button" onClick={() => addItem("navLinks", { label: "", href: "/" })} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded">+ Add nav link</button>
        </section>
      )}

      {tab === "trust" && (
        <section className={SECTION}>
          <h2 className="font-semibold">Trust badges</h2>
          <p className="text-xs text-gray-500">The row of 4 icons + reasons-to-buy shown right under the hero.</p>
          {form.trustBadges.map((b, i) => (
            <div key={i} className="border border-gray-200 rounded p-4 grid grid-cols-1 md:grid-cols-3 gap-2 items-start">
              <div><label className={LABEL}>Title</label><input className={FIELD} value={b.title} onChange={(e) => updateItem("trustBadges", i, { title: e.target.value })} /></div>
              <div><label className={LABEL}>Subtitle</label><input className={FIELD} value={b.sub} onChange={(e) => updateItem("trustBadges", i, { sub: e.target.value })} /></div>
              <div>
                <label className={LABEL}>Icon</label>
                <select className={FIELD} value={b.icon} onChange={(e) => updateItem("trustBadges", i, { icon: e.target.value })}>
                  {ICON_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <button type="button" onClick={() => removeItem("trustBadges", i)} className="text-xs text-red-600 hover:underline justify-self-start">Remove</button>
            </div>
          ))}
          <button type="button" onClick={() => addItem("trustBadges", { title: "", sub: "", icon: "shipping" })} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded">+ Add badge</button>
        </section>
      )}

      {tab === "categories" && (
        <section className={SECTION}>
          <h2 className="font-semibold">Shop by Category</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LABEL}>Eyebrow</label><input className={FIELD} value={form.categoriesEyebrow} onChange={set("categoriesEyebrow")} /></div>
            <div><label className={LABEL}>Title</label><input className={FIELD} value={form.categoriesTitle} onChange={set("categoriesTitle")} /></div>
          </div>
          {form.homeCategories.map((c, i) => (
            <div key={i} className="border border-gray-200 rounded p-4 grid grid-cols-1 md:grid-cols-3 gap-2 items-start">
              <div><label className={LABEL}>Slug (collection)</label><input className={FIELD} value={c.slug} onChange={(e) => updateItem("homeCategories", i, { slug: e.target.value })} placeholder="fashion" /></div>
              <div><label className={LABEL}>Title</label><input className={FIELD} value={c.title} onChange={(e) => updateItem("homeCategories", i, { title: e.target.value })} /></div>
              <div className="md:col-span-1">
                <ImagePicker label="Image" value={c.image} onChange={(v) => updateItem("homeCategories", i, { image: v })} />
              </div>
              <button type="button" onClick={() => removeItem("homeCategories", i)} className="text-xs text-red-600 hover:underline justify-self-start col-span-1">Remove</button>
            </div>
          ))}
          <button type="button" onClick={() => addItem("homeCategories", { slug: "", title: "", image: "" })} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded">+ Add category card</button>
        </section>
      )}

      {tab === "story" && (
        <section className={SECTION}>
          <h2 className="font-semibold">Brand story</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LABEL}>Eyebrow</label><input className={FIELD} value={form.brandStoryEyebrow} onChange={set("brandStoryEyebrow")} /></div>
            <ImagePicker label="Image" value={form.brandStoryImage} onChange={(v) => setForm((f) => ({ ...f, brandStoryImage: v }))} />
          </div>
          <div><label className={LABEL}>Title (use \n for line break)</label><input className={FIELD} value={form.brandStoryTitle} onChange={set("brandStoryTitle")} /></div>
          <div><label className={LABEL}>Body</label><textarea rows={6} className={FIELD} value={form.brandStoryBody} onChange={set("brandStoryBody")} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LABEL}>Button text</label><input className={FIELD} value={form.brandStoryCtaText} onChange={set("brandStoryCtaText")} /></div>
            <div><label className={LABEL}>Button link</label><input className={FIELD} value={form.brandStoryCtaHref} onChange={set("brandStoryCtaHref")} /></div>
          </div>
        </section>
      )}

      {tab === "journal" && (
        <section className={SECTION}>
          <h2 className="font-semibold">Journal posts</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={LABEL}>Eyebrow</label><input className={FIELD} value={form.journalEyebrow} onChange={set("journalEyebrow")} /></div>
            <div><label className={LABEL}>Title</label><input className={FIELD} value={form.journalTitle} onChange={set("journalTitle")} /></div>
          </div>
          {form.journalPosts.map((p, i) => (
            <div key={i} className="border border-gray-200 rounded p-4 space-y-2">
              <div className="grid grid-cols-3 gap-2">
                <div><label className={LABEL}>Category</label><input className={FIELD} value={p.category} onChange={(e) => updateItem("journalPosts", i, { category: e.target.value })} /></div>
                <div><label className={LABEL}>Date</label><input className={FIELD} value={p.date} onChange={(e) => updateItem("journalPosts", i, { date: e.target.value })} placeholder="May 2026" /></div>
                <div><label className={LABEL}>Link (optional)</label><input className={FIELD} value={p.href} onChange={(e) => updateItem("journalPosts", i, { href: e.target.value })} /></div>
              </div>
              <div><label className={LABEL}>Title</label><input className={FIELD} value={p.title} onChange={(e) => updateItem("journalPosts", i, { title: e.target.value })} /></div>
              <ImagePicker label="Image" value={p.image} onChange={(v) => updateItem("journalPosts", i, { image: v })} />
              <button type="button" onClick={() => removeItem("journalPosts", i)} className="text-xs text-red-600 hover:underline">Remove</button>
            </div>
          ))}
          <button type="button" onClick={() => addItem("journalPosts", { title: "", date: "", category: "", image: "", href: "" })} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded">+ Add post</button>
        </section>
      )}

      {tab === "testimonials" && (
        <section className={SECTION}>
          <h2 className="font-semibold">Testimonials</h2>
          {form.testimonials.map((t, i) => (
            <div key={i} className="border border-gray-200 rounded p-4 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div><label className={LABEL}>Name</label><input className={FIELD} value={t.name} onChange={(e) => updateItem("testimonials", i, { name: e.target.value })} /></div>
                <div><label className={LABEL}>Role / location</label><input className={FIELD} value={t.role} onChange={(e) => updateItem("testimonials", i, { role: e.target.value })} placeholder="Dhaka" /></div>
              </div>
              <div><label className={LABEL}>Quote</label><textarea rows={3} className={FIELD} value={t.quote} onChange={(e) => updateItem("testimonials", i, { quote: e.target.value })} /></div>
              <button type="button" onClick={() => removeItem("testimonials", i)} className="text-xs text-red-600 hover:underline">Remove</button>
            </div>
          ))}
          <button type="button" onClick={() => addItem("testimonials", { name: "", role: "", quote: "" })} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded">+ Add testimonial</button>
        </section>
      )}

      {tab === "footer" && (
        <section className={SECTION}>
          <h2 className="font-semibold">Footer</h2>
          <div><label className={LABEL}>Tagline</label><input className={FIELD} value={form.footerTagline} onChange={set("footerTagline")} /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className={LABEL}>Instagram URL</label><input className={FIELD} value={form.footerInstagram} onChange={set("footerInstagram")} placeholder="https://instagram.com/…" /></div>
            <div><label className={LABEL}>Facebook URL</label><input className={FIELD} value={form.footerFacebook} onChange={set("footerFacebook")} /></div>
            <div><label className={LABEL}>WhatsApp number</label><input className={FIELD} value={form.footerWhatsapp} onChange={set("footerWhatsapp")} placeholder="01XXXXXXXXX" /></div>
          </div>
          <div className="space-y-3 mt-3">
            <p className="text-xs font-semibold text-gray-700">Link columns</p>
            {form.footerColumns.map((col, ci) => (
              <div key={ci} className="border border-gray-200 rounded p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <input className={FIELD + " max-w-xs"} value={col.title} onChange={(e) => updateItem("footerColumns", ci, { title: e.target.value })} placeholder="Column title" />
                  <button type="button" onClick={() => removeItem("footerColumns", ci)} className="text-xs text-red-600 hover:underline">Remove column</button>
                </div>
                {col.links.map((l, li) => (
                  <div key={li} className="grid grid-cols-12 gap-2 items-center">
                    <input className={"col-span-4 " + FIELD} placeholder="Label" value={l.label} onChange={(e) => updateItem("footerColumns", ci, { links: col.links.map((x, j) => j === li ? { ...x, label: e.target.value } : x) })} />
                    <input className={"col-span-6 " + FIELD} placeholder="/p/contact" value={l.href} onChange={(e) => updateItem("footerColumns", ci, { links: col.links.map((x, j) => j === li ? { ...x, href: e.target.value } : x) })} />
                    <button type="button" onClick={() => updateItem("footerColumns", ci, { links: col.links.filter((_, j) => j !== li) })} className="col-span-2 text-xs text-red-600 hover:underline">Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => updateItem("footerColumns", ci, { links: [...col.links, { label: "", href: "" }] })} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded">+ Add link</button>
              </div>
            ))}
            <button type="button" onClick={() => addItem("footerColumns", { title: "", links: [] })} className="text-xs bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded">+ Add column</button>
          </div>
        </section>
      )}
    </form>
  );
}
