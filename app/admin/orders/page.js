import Link from "next/link";
import mongoose from "mongoose";
import { dbConnect } from "../../../lib/mongodb";
import Order from "../../../models/Order";
import { formatMoney } from "../../../lib/format";
import OrderRowActions from "../../../components/admin/OrderRowActions";

export const dynamic = "force-dynamic";

const STATUS_COLOR = {
  pending: "bg-amber-50 text-amber-700",
  paid: "bg-blue-50 text-blue-700",
  fulfilled: "bg-green-50 text-green-700",
  shipped: "bg-indigo-50 text-indigo-700",
  delivered: "bg-emerald-50 text-emerald-700",
  refunded: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-50 text-red-700",
};

function safeRegex(s) {
  return new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

export default async function AdminOrders({ searchParams }) {
  const sp = (await searchParams) || {};
  await dbConnect();

  const filter = {};
  if (sp.status) filter.status = sp.status;
  if (sp.q) {
    const q = String(sp.q).trim();
    const re = safeRegex(q);
    const orClauses = [
      { userEmail: re },
      { "shippingAddress.name": re },
      { "shippingAddress.phone": re },
      { "payment.txnId": safeRegex(q.toUpperCase()) },
    ];
    if (mongoose.isValidObjectId(q)) {
      orClauses.push({ _id: new mongoose.Types.ObjectId(q) });
    } else if (/^[a-f0-9]{6,23}$/i.test(q)) {
      orClauses.push({
        $expr: {
          $regexMatch: { input: { $toString: "$_id" }, regex: q.toLowerCase() + "$", options: "i" },
        },
      });
    }
    filter.$or = orClauses;
  }
  if (sp.from || sp.to) {
    filter.createdAt = {};
    if (sp.from) filter.createdAt.$gte = new Date(sp.from);
    if (sp.to) {
      const d = new Date(sp.to);
      d.setDate(d.getDate() + 1);
      filter.createdAt.$lt = d;
    }
  }

  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200).lean();

  const qParams = new URLSearchParams();
  if (sp.status) qParams.set("status", sp.status);
  if (sp.q) qParams.set("q", sp.q);
  if (sp.from) qParams.set("from", sp.from);
  if (sp.to) qParams.set("to", sp.to);
  const exportHref = `/api/admin/orders/export?${qParams.toString()}`;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orders <span className="text-gray-400 text-base font-normal">({orders.length})</span></h1>
        <a
          href={exportHref}
          className="text-xs font-medium px-3 py-1.5 rounded border border-gray-300 hover:border-[#1a2b4a] hover:bg-gray-50"
        >
          Export CSV
        </a>
      </div>

      <form method="GET" className="flex flex-wrap gap-2 items-end bg-white border border-gray-200 rounded-lg p-3">
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">Search</label>
          <input
            name="q"
            defaultValue={sp.q || ""}
            placeholder="Email, name, phone, TrxID, #order"
            className="border border-gray-300 rounded px-2 py-1.5 text-sm w-64"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">From</label>
          <input type="date" name="from" defaultValue={sp.from || ""} className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">To</label>
          <input type="date" name="to" defaultValue={sp.to || ""} className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
        </div>
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <button className="bg-[#1a2b4a] text-white px-3 py-1.5 rounded text-sm">Apply</button>
        {(sp.q || sp.from || sp.to) && (
          <Link href={sp.status ? `/admin/orders?status=${sp.status}` : "/admin/orders"} className="text-xs text-gray-500 underline self-end pb-1.5">Clear</Link>
        )}
      </form>

      <div className="flex gap-2 text-xs flex-wrap">
        {["all", "pending", "paid", "fulfilled", "shipped", "delivered", "refunded", "cancelled"].map((s) => {
          const next = new URLSearchParams();
          if (sp.q) next.set("q", sp.q);
          if (sp.from) next.set("from", sp.from);
          if (sp.to) next.set("to", sp.to);
          if (s !== "all") next.set("status", s);
          const href = `/admin/orders${next.toString() ? `?${next.toString()}` : ""}`;
          return (
            <Link
              key={s}
              href={href}
              className={`px-3 py-1 rounded border ${(sp.status || "all") === s ? "bg-[#1a2b4a] text-white border-[#1a2b4a]" : "bg-white border-gray-300 text-gray-700 hover:border-gray-500"}`}
            >{s}</Link>
          );
        })}
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Order</th>
              <th className="px-4 py-2">Customer</th>
              <th className="px-4 py-2">Payment</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2 text-right">Total</th>
              <th className="px-4 py-2 text-right">Quick</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">No orders match.</td></tr>}
            {orders.map((o) => (
              <tr key={String(o._id)}>
                <td className="px-4 py-2"><Link href={`/admin/orders/${String(o._id)}`} className="font-mono text-xs hover:underline">#{String(o._id).slice(-6)}</Link></td>
                <td className="px-4 py-2">
                  <p>{o.userEmail}</p>
                  {o.shippingAddress?.phone && <p className="text-[10px] text-gray-500">{o.shippingAddress.phone}</p>}
                </td>
                <td className="px-4 py-2 text-xs">
                  <span className="uppercase font-medium">{o.payment?.method || "—"}</span>
                  {o.payment?.method && o.payment.method !== "cod" && (
                    <span className={`ml-1 inline-block px-1.5 py-0.5 rounded text-[10px] ${o.payment?.verified ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"}`}>
                      {o.payment?.verified ? "verified" : "unverified"}
                    </span>
                  )}
                </td>
                <td className="px-4 py-2 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2"><span className={`inline-block px-2 py-0.5 rounded text-xs ${STATUS_COLOR[o.status] || "bg-gray-100"}`}>{o.status}</span></td>
                <td className="px-4 py-2 text-right">{formatMoney(o.total)}</td>
                <td className="px-4 py-2 text-right"><OrderRowActions id={String(o._id)} status={o.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
