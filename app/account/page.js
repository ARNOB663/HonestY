"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { formatMoney, BD_DIVISIONS, getDistrictsForDivision } from "../../lib/format";

const inputCls = "w-full border border-[#e8e4d8] rounded px-3 py-2.5 text-sm outline-none focus:border-[#1a2b4a] transition-colors bg-white";

const STATUS_STYLE = {
  pending: { label: "Pending", bg: "bg-amber-100", text: "text-amber-900", dot: "bg-amber-500" },
  // "confirmed" (COD) and "paid" (prepaid) both mean the admin has accepted
  // the order — show the same friendly "Confirmed" label to customers.
  confirmed: { label: "Confirmed", bg: "bg-blue-100", text: "text-blue-900", dot: "bg-blue-500" },
  paid: { label: "Confirmed", bg: "bg-blue-100", text: "text-blue-900", dot: "bg-blue-500" },
  fulfilled: { label: "Preparing", bg: "bg-indigo-100", text: "text-indigo-900", dot: "bg-indigo-500" },
  shipped: { label: "Shipped", bg: "bg-violet-100", text: "text-violet-900", dot: "bg-violet-500" },
  delivered: { label: "Delivered", bg: "bg-green-100", text: "text-green-900", dot: "bg-green-500" },
  cancelled: { label: "Cancelled", bg: "bg-gray-200", text: "text-gray-700", dot: "bg-gray-500" },
  refunded: { label: "Refunded", bg: "bg-rose-100", text: "text-rose-900", dot: "bg-rose-500" },
};

// Progress bar uses one combined "confirmed" step that lights up for either
// status. The internal step name is "confirmed" so PROGRESS_STEPS.indexOf
// works after we map status to this canonical list.
const PROGRESS_STEPS = ["pending", "confirmed", "fulfilled", "shipped", "delivered"];
function canonicalStep(status) {
  return status === "paid" ? "confirmed" : status;
}
const CANCELLABLE = new Set(["pending", "confirmed", "paid"]);

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || STATUS_STYLE.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}

function ProgressBar({ status }) {
  if (status === "cancelled" || status === "refunded") return null;
  const currentIdx = PROGRESS_STEPS.indexOf(canonicalStep(status));
  return (
    <div className="flex items-center gap-1 mt-3">
      {PROGRESS_STEPS.map((step, i) => {
        const reached = i <= currentIdx;
        return (
          <div key={step} className="flex-1 flex flex-col items-center gap-1">
            <div className={`h-1 w-full rounded-full ${reached ? "bg-[#1a2b4a]" : "bg-gray-200"}`} />
            <span className={`text-[10px] uppercase tracking-wide ${reached ? "text-[#1a2b4a] font-semibold" : "text-gray-400"}`}>
              {STATUS_STYLE[step]?.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function OrderCard({ order: o, onCancel, cancelling }) {
  return (
    <div className="bg-white border border-[#e8e4d8] rounded-lg p-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-gray-500">Order #{o.id.slice(-6).toUpperCase()}</p>
          <p className="text-xs text-gray-400 mt-0.5">{new Date(o.createdAt).toLocaleString("en-BD")}</p>
        </div>
        <StatusBadge status={o.status} />
      </div>
      <ProgressBar status={o.status} />
      <div className="mt-4 space-y-1 text-sm">
        {o.items.slice(0, 3).map((i, idx) => (
          <div key={idx} className="flex justify-between text-gray-600">
            <span className="truncate pr-3">{i.title} × {i.qty}</span>
            <span className="shrink-0">{formatMoney(i.price * i.qty)}</span>
          </div>
        ))}
        {o.items.length > 3 && <p className="text-xs text-gray-400">+ {o.items.length - 3} more</p>}
      </div>
      <div className="mt-3 pt-3 border-t border-[#e8e4d8] flex items-center justify-between text-sm flex-wrap gap-2">
        <span className="text-gray-500 uppercase text-xs tracking-wide">
          {o.paymentMethod === "cod" ? "Cash on Delivery" : o.paymentMethod === "bkash" ? "bKash" : "Nagad"}
          {o.paymentMethod !== "cod" && (
            <span className={`ml-2 text-[10px] font-semibold ${o.paymentVerified ? "text-green-700" : "text-amber-700"}`}>
              {o.paymentVerified ? "Verified" : "Awaiting verification"}
            </span>
          )}
        </span>
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#b8553a]">{formatMoney(o.total)}</span>
          {CANCELLABLE.has(o.status) && (
            <button
              onClick={() => onCancel(o.id)}
              disabled={cancelling}
              className="text-xs text-red-600 font-semibold hover:underline disabled:opacity-50"
            >
              {cancelling ? "Cancelling…" : "Cancel"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState(null);
  const [tab, setTab] = useState("orders");
  const [form, setForm] = useState({ name: "", phone: "", backupPhone: "", line1: "", area: "", city: "", state: "Dhaka", zip: "", country: "Bangladesh" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [cancellingId, setCancellingId] = useState("");
  const [ordersPage, setOrdersPage] = useState(0);
  const [hasMoreOrders, setHasMoreOrders] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  async function loadMoreOrders() {
    setLoadingMore(true);
    const next = ordersPage + 1;
    const res = await fetch(`/api/account/orders?page=${next}`).then((r) => r.json()).catch(() => null);
    setLoadingMore(false);
    if (res?.orders) {
      setOrders((prev) => [...(prev || []), ...res.orders]);
      setOrdersPage(next);
      setHasMoreOrders(!!res.hasMore);
    }
  }

  async function cancelOrder(id) {
    if (!confirm("Cancel this order? Items will be returned to stock.")) return;
    setCancellingId(id);
    const r = await fetch(`/api/account/orders/${id}/cancel`, { method: "POST" });
    setCancellingId("");
    if (!r.ok) {
      const data = await r.json().catch(() => ({}));
      alert(data.error || "Could not cancel order");
      return;
    }
    setOrders((prev) => prev?.map((o) => (o.id === id ? { ...o, status: "cancelled" } : o)));
  }

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login?callbackUrl=/account");
    }
  }, [status, router]);

  useEffect(() => {
    if (status !== "authenticated") return;
    let cancelled = false;
    (async () => {
      const [pRes, oRes] = await Promise.all([
        fetch("/api/account").then((r) => r.json()).catch(() => null),
        fetch("/api/account/orders").then((r) => r.json()).catch(() => null),
      ]);
      if (cancelled) return;
      if (pRes?.user) {
        setProfile(pRes.user);
        const a = pRes.user.defaultAddress || {};
        setForm({
          name: pRes.user.name || "",
          phone: pRes.user.phone || "",
          backupPhone: pRes.user.backupPhone || "",
          line1: a.line1 || "",
          area: a.area || "",
          city: a.city || "",
          state: a.state || "Dhaka",
          zip: a.zip || "",
          country: a.country || "Bangladesh",
        });
      }
      if (oRes?.orders) {
        setOrders(oRes.orders);
        setHasMoreOrders(!!oRes.hasMore);
        setOrdersPage(0);
      }
    })();
    return () => { cancelled = true; };
  }, [status]);

  if (status === "loading" || (status === "authenticated" && !profile)) {
    return <div className="px-4 max-w-7xl mx-auto py-16 text-center text-gray-400">Loading…</div>;
  }
  if (status !== "authenticated") return null;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setSaving(true); setMsg(""); setErr("");
    const r = await fetch("/api/account", {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        phone: form.phone,
        backupPhone: form.backupPhone,
        defaultAddress: {
          line1: form.line1,
          area: form.area,
          city: form.city,
          state: form.state,
          zip: form.zip,
          country: form.country,
        },
      }),
    });
    setSaving(false);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) { setErr(data.error || "Could not save"); return; }
    setProfile(data.user);
    setMsg("Saved");
    setTimeout(() => setMsg(""), 2500);
  }

  const firstName = (profile?.name || profile?.email || "").split(" ")[0].split("@")[0];

  return (
    <div className="bg-[#fafaf7] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-10">
        <div className="mb-8">
          <p className="text-[#c9a961] text-xs font-semibold tracking-[0.2em] uppercase mb-1">My Account</p>
          <h1 className="font-serif text-3xl text-[#1a2b4a]">Hi, {firstName}</h1>
          <p className="text-sm text-gray-500 mt-1">{profile?.email}</p>
        </div>

        <div className="border-b border-[#e8e4d8] mb-6 flex gap-6">
          {[
            { id: "orders", label: "My Orders" },
            { id: "profile", label: "Profile & Address" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`pb-3 text-sm font-medium tracking-wide transition-colors ${
                tab === t.id ? "text-[#1a2b4a] border-b-2 border-[#1a2b4a]" : "text-gray-500 hover:text-[#1a2b4a]"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === "orders" && (
          <div className="space-y-4">
            {orders === null && <div className="text-center text-gray-400 py-12">Loading orders…</div>}
            {orders && orders.length === 0 && (
              <div className="bg-white border border-[#e8e4d8] rounded-lg p-10 text-center">
                <p className="text-gray-500 mb-4">You haven&apos;t placed any orders yet.</p>
                <Link href="/products" className="inline-block bg-[#1a2b4a] text-white font-bold px-6 py-2.5 rounded text-sm tracking-wide hover:bg-[#0e1a30] transition-colors">
                  START SHOPPING
                </Link>
              </div>
            )}
            {orders && orders.map((o) => (
              <OrderCard key={o.id} order={o} onCancel={cancelOrder} cancelling={cancellingId === o.id} />
            ))}
            {hasMoreOrders && (
              <div className="text-center pt-2">
                <button
                  onClick={loadMoreOrders}
                  disabled={loadingMore}
                  className="border border-[#1a2b4a] text-[#1a2b4a] font-medium px-6 py-2.5 rounded text-sm hover:bg-[#1a2b4a] hover:text-white transition-colors disabled:opacity-50"
                >
                  {loadingMore ? "Loading…" : "Load more orders"}
                </button>
              </div>
            )}
          </div>
        )}

        {tab === "profile" && (
          <form onSubmit={save} className="bg-white border border-[#e8e4d8] rounded-lg p-6 space-y-6 max-w-2xl">
            <div>
              <h2 className="text-sm font-bold text-[#1a2b4a] uppercase tracking-wide mb-3">Personal Info</h2>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#1a2b4a] mb-1">Full name</label>
                  <input className={inputCls} value={form.name} onChange={set("name")} maxLength={100} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#1a2b4a] mb-1">Phone</label>
                    <input
                      className={inputCls}
                      placeholder="01XXXXXXXXX"
                      value={form.phone}
                      onChange={set("phone")}
                      inputMode="tel"
                      pattern="01[3-9][0-9]{8}"
                      maxLength={11}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#1a2b4a] mb-1">Backup phone</label>
                    <input
                      className={inputCls}
                      placeholder="01XXXXXXXXX"
                      value={form.backupPhone}
                      onChange={set("backupPhone")}
                      inputMode="tel"
                      pattern="01[3-9][0-9]{8}"
                      maxLength={11}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-[#1a2b4a] uppercase tracking-wide mb-3">Default Delivery Address</h2>
              <p className="text-xs text-gray-500 mb-3">We&apos;ll pre-fill this on checkout so you don&apos;t have to type it again.</p>
              <div className="space-y-3">
                <input className={inputCls} placeholder="House / Road" value={form.line1} onChange={set("line1")} />
                <input className={inputCls} placeholder="Area / Thana" value={form.area} onChange={set("area")} />
                <div className="grid grid-cols-2 gap-3">
                  <select
                    className={inputCls}
                    value={form.state}
                    onChange={(e) => {
                      const next = e.target.value;
                      setForm((f) => ({
                        ...f,
                        state: next,
                        city: getDistrictsForDivision(next).includes(f.city) ? f.city : "",
                      }));
                    }}
                  >
                    {BD_DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                  <select className={inputCls} value={form.city} onChange={set("city")}>
                    <option value="">Select district…</option>
                    {getDistrictsForDivision(form.state).map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input className={inputCls} placeholder="Post code" value={form.zip} onChange={set("zip")} inputMode="numeric" />
                  <select className={inputCls} value={form.country} onChange={set("country")}>
                    <option value="Bangladesh">Bangladesh</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <div className="text-sm">
                {msg && <span className="text-green-700">{msg}</span>}
                {err && <span className="text-red-600">{err}</span>}
              </div>
              <button
                type="submit"
                disabled={saving}
                className="bg-[#1a2b4a] text-white font-bold px-6 py-2.5 rounded text-sm tracking-wide hover:bg-[#0e1a30] transition-colors disabled:opacity-50"
              >
                {saving ? "SAVING…" : "SAVE CHANGES"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
