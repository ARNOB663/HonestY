import Link from "next/link";
import { dbConnect } from "../../lib/mongodb";
import Order from "../../models/Order";
import Product from "../../models/Product";
import User from "../../models/User";
import { formatMoney } from "../../lib/format";

export const dynamic = "force-dynamic";

async function loadStats() {
  try {
    await dbConnect();
    const now = new Date();
    const since30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const since7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

    const aggSince = (since) =>
      Order.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]);

    const [agg30, agg7, totalOrders, totalProducts, totalUsers, recent, unfulfilled, lowStock] = await Promise.all([
      aggSince(since30),
      aggSince(since7),
      Order.countDocuments({}),
      Product.countDocuments({}),
      User.countDocuments({ role: { $ne: "admin" } }),
      Order.find({}).sort({ createdAt: -1 }).limit(5).select("userEmail total status createdAt").lean(),
      Order.find({ status: { $in: ["pending", "paid"] } }).sort({ createdAt: 1 }).limit(5).select("userEmail total createdAt").lean(),
      Product.find({ inventory: { $lte: 5 } }).select("title slug inventory").limit(5).lean(),
    ]);

    const a30 = agg30[0] || { total: 0, count: 0 };
    const a7 = agg7[0] || { total: 0, count: 0 };
    return {
      revenue30: a30.total,
      revenue7: a7.total,
      orderCount30: a30.count,
      orderCount7: a7.count,
      totalOrders,
      totalProducts,
      totalUsers,
      recent: recent.map((o) => ({ id: String(o._id), userEmail: o.userEmail, total: o.total, status: o.status, createdAt: o.createdAt })),
      unfulfilled: unfulfilled.map((o) => ({ id: String(o._id), userEmail: o.userEmail, total: o.total, createdAt: o.createdAt })),
      lowStock,
    };
  } catch (e) {
    return { error: e.message };
  }
}

function KPI({ label, value, sub }) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-2xl font-semibold mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}

export default async function AdminDashboard() {
  const s = await loadStats();
  if (s.error) {
    return <div className="text-red-600">Could not load stats: {s.error}</div>;
  }
  const money = (n) => formatMoney(n);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Snapshot of your store</p>
      </div>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Revenue (7d)" value={money(s.revenue7)} sub={`${s.orderCount7} orders`} />
        <KPI label="Revenue (30d)" value={money(s.revenue30)} sub={`${s.orderCount30} orders`} />
        <KPI label="Total orders" value={s.totalOrders} />
        <KPI label="Customers" value={s.totalUsers} sub={`${s.totalProducts} products`} />
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-sm">Unfulfilled orders</h2>
            <Link href="/admin/orders" className="text-xs text-blue-600 hover:underline">All →</Link>
          </div>
          {s.unfulfilled.length === 0 ? (
            <p className="p-5 text-sm text-gray-500">Nothing waiting. 🎉</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {s.unfulfilled.map((o) => (
                <li key={o.id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <Link href={`/admin/orders/${o.id}`} className="hover:underline">
                    <span className="font-mono text-xs text-gray-500">#{o.id.slice(-6)}</span> · {o.userEmail}
                  </Link>
                  <span className="text-gray-700">{money(o.total)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-sm">Low stock</h2>
            <Link href="/admin/products" className="text-xs text-blue-600 hover:underline">All →</Link>
          </div>
          {s.lowStock.length === 0 ? (
            <p className="p-5 text-sm text-gray-500">All products well-stocked.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {s.lowStock.map((p) => (
                <li key={p.slug} className="px-5 py-3 flex items-center justify-between text-sm">
                  <Link href={`/admin/products`} className="hover:underline">{p.title}</Link>
                  <span className="text-xs text-gray-500">{p.inventory} left</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="bg-white rounded-lg border border-gray-200">
        <div className="px-5 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-sm">Recent orders</h2>
        </div>
        {s.recent.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-gray-500 bg-gray-50">
              <tr><th className="px-5 py-2">Order</th><th className="px-5 py-2">Customer</th><th className="px-5 py-2">Status</th><th className="px-5 py-2 text-right">Total</th></tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {s.recent.map((o) => (
                <tr key={o.id}>
                  <td className="px-5 py-2"><Link href={`/admin/orders/${o.id}`} className="font-mono text-xs hover:underline">#{o.id.slice(-6)}</Link></td>
                  <td className="px-5 py-2">{o.userEmail}</td>
                  <td className="px-5 py-2"><span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100">{o.status}</span></td>
                  <td className="px-5 py-2 text-right">{money(o.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
