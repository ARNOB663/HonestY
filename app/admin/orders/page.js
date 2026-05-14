import Link from "next/link";
import { dbConnect } from "../../../lib/mongodb";
import Order from "../../../models/Order";
import { formatMoney } from "../../../lib/format";

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

export default async function AdminOrders({ searchParams }) {
  const sp = (await searchParams) || {};
  await dbConnect();
  const filter = sp.status ? { status: sp.status } : {};
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(200).lean();

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Orders <span className="text-gray-400 text-base font-normal">({orders.length})</span></h1>
      <div className="flex gap-2 text-xs">
        {["all", "pending", "paid", "fulfilled", "shipped", "delivered", "refunded", "cancelled"].map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin/orders" : `/admin/orders?status=${s}`}
            className={`px-3 py-1 rounded border ${(sp.status || "all") === s ? "bg-[#1a2b4a] text-white border-[#1a2b4a]" : "bg-white border-gray-300 text-gray-700 hover:border-gray-500"}`}
          >{s}</Link>
        ))}
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr><th className="px-4 py-2">Order</th><th className="px-4 py-2">Customer</th><th className="px-4 py-2">Date</th><th className="px-4 py-2">Status</th><th className="px-4 py-2 text-right">Total</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {orders.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">No orders.</td></tr>}
            {orders.map((o) => (
              <tr key={String(o._id)}>
                <td className="px-4 py-2"><Link href={`/admin/orders/${String(o._id)}`} className="font-mono text-xs hover:underline">#{String(o._id).slice(-6)}</Link></td>
                <td className="px-4 py-2">{o.userEmail}</td>
                <td className="px-4 py-2 text-gray-500">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2"><span className={`inline-block px-2 py-0.5 rounded text-xs ${STATUS_COLOR[o.status] || "bg-gray-100"}`}>{o.status}</span></td>
                <td className="px-4 py-2 text-right">{formatMoney(o.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
