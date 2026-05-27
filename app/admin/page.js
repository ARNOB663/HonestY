import Link from "next/link";
import { dbConnect } from "../../lib/mongodb";
import Order from "../../models/Order";
import Product from "../../models/Product";
import User from "../../models/User";
import { formatMoney } from "../../lib/format";
import { BarChart, Donut } from "../../components/admin/Charts";

export const dynamic = "force-dynamic";

async function loadStats() {
  try {
    await dbConnect();
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const since30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const prev30Start = new Date(now.getTime() - 60 * 24 * 3600 * 1000);
    const since7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

    const ALIVE = { $nin: ["cancelled"] };

    const aggBetween = (from, to) =>
      Order.aggregate([
        { $match: { createdAt: { $gte: from, ...(to ? { $lt: to } : {}) }, status: ALIVE } },
        { $group: { _id: null, total: { $sum: "$total" }, count: { $sum: 1 } } },
      ]);

    // Revenue by day for the last 14 days (for the bar chart).
    const DAILY_DAYS = 14;
    const dailyAgg = Order.aggregate([
      { $match: { createdAt: { $gte: new Date(now.getTime() - DAILY_DAYS * 24 * 3600 * 1000) }, status: ALIVE } },
      { $group: {
        _id: { y: { $year: "$createdAt" }, m: { $month: "$createdAt" }, d: { $dayOfMonth: "$createdAt" } },
        revenue: { $sum: "$total" },
      } },
      { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
    ]);

    // Sales by category — joins items.slug to products.collection
    const categoryAgg = Order.aggregate([
      { $match: { createdAt: { $gte: since30 }, status: ALIVE } },
      { $unwind: "$items" },
      { $lookup: { from: "products", localField: "items.slug", foreignField: "slug", as: "p" } },
      { $unwind: { path: "$p", preserveNullAndEmptyArrays: true } },
      { $group: { _id: { $ifNull: ["$p.collection", "uncategorized"] }, revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } } } },
      { $sort: { revenue: -1 } },
    ]);

    const topProductsAgg = Order.aggregate([
      { $match: { createdAt: { $gte: since30 }, status: ALIVE } },
      { $unwind: "$items" },
      { $group: { _id: "$items.slug", title: { $first: "$items.title" }, qty: { $sum: "$items.qty" }, revenue: { $sum: { $multiply: ["$items.price", "$items.qty"] } } } },
      { $sort: { qty: -1 } },
      { $limit: 5 },
    ]);

    const [aggToday, agg7, agg30, aggPrev30, totalOrders, totalProducts, totalUsers, recent, unfulfilled, lowStock, topProducts, unverifiedPayments, dailyRev, byCategory, statusCounts] = await Promise.all([
      aggBetween(startOfToday),
      aggBetween(since7),
      aggBetween(since30),
      aggBetween(prev30Start, since30),
      Order.countDocuments({}),
      Product.countDocuments({}),
      User.countDocuments({ role: { $ne: "admin" } }),
      Order.find({}).sort({ createdAt: -1 }).limit(5).select("userEmail total status createdAt").lean(),
      Order.find({ status: { $in: ["pending", "paid"] } }).sort({ createdAt: 1 }).limit(5).select("userEmail total createdAt").lean(),
      Product.find({ inventory: { $lte: 5 } }).select("title slug inventory").limit(5).lean(),
      topProductsAgg,
      Order.countDocuments({ "payment.method": { $in: ["bkash", "nagad"] }, "payment.verified": false, status: { $nin: ["cancelled", "refunded"] } }),
      dailyAgg,
      categoryAgg,
      Order.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    ]);

    // Build the window even when some days have no orders.
    const dailyMap = new Map(dailyRev.map((d) => [`${d._id.y}-${d._id.m}-${d._id.d}`, d.revenue]));
    const last14 = [];
    for (let i = DAILY_DAYS - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      last14.push({ label: d.toLocaleDateString("en-BD", { day: "numeric", month: "short" }), value: dailyMap.get(key) || 0 });
    }

    const t30 = agg30[0]?.total || 0;
    const tPrev = aggPrev30[0]?.total || 0;
    const revenueDelta = tPrev > 0 ? Math.round(((t30 - tPrev) / tPrev) * 100) : (t30 > 0 ? 100 : 0);

    const c30 = agg30[0]?.count || 0;
    const cPrev = aggPrev30[0]?.count || 0;
    const orderDelta = cPrev > 0 ? Math.round(((c30 - cPrev) / cPrev) * 100) : (c30 > 0 ? 100 : 0);

    const statusMap = Object.fromEntries(statusCounts.map((s) => [s._id, s.count]));

    return {
      todayRevenue: aggToday[0]?.total || 0,
      todayOrders: aggToday[0]?.count || 0,
      revenue7: agg7[0]?.total || 0,
      orderCount7: agg7[0]?.count || 0,
      revenue30: t30,
      orderCount30: c30,
      revenueDelta,
      orderDelta,
      totalOrders,
      totalProducts,
      totalUsers,
      unverifiedPayments,
      pendingCount: statusMap.pending || 0,
      paidCount: statusMap.paid || 0,
      shippedCount: statusMap.shipped || 0,
      deliveredCount: statusMap.delivered || 0,
      recent: recent.map((o) => ({ id: String(o._id), userEmail: o.userEmail, total: o.total, status: o.status, createdAt: o.createdAt })),
      unfulfilled: unfulfilled.map((o) => ({ id: String(o._id), userEmail: o.userEmail, total: o.total, createdAt: o.createdAt })),
      lowStock,
      topProducts,
      dailyRevenue: last14,
      byCategory: byCategory.map((c) => ({ label: c._id, value: c.revenue })),
    };
  } catch (e) {
    return { error: e.message };
  }
}

function Delta({ pct }) {
  if (pct === 0) return <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">0%</span>;
  const up = pct > 0;
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${up ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
      {up ? "↑" : "↓"} {Math.abs(pct)}%
    </span>
  );
}

function KPI({ label, value, sub, delta, accent }) {
  // Two-class strategy avoids the bg-white/bg-[#1a2b4a] cascade fight that
  // was rendering the accent tile white-on-white.
  const cls = accent
    ? "bg-[#1a2b4a] text-white border-[#1a2b4a]"
    : "bg-white text-[#1a1a1a] border-gray-200";
  return (
    <div className={`rounded-lg border p-5 ${cls}`}>
      <div className="flex items-start justify-between">
        <p className={`text-xs uppercase tracking-wide ${accent ? "text-white/70" : "text-gray-500"}`}>{label}</p>
        {delta !== undefined && <Delta pct={delta} />}
      </div>
      <p className="text-2xl font-semibold mt-1">{value}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? "text-white/60" : "text-gray-500"}`}>{sub}</p>}
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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Snapshot of your store</p>
      </div>

      {s.unverifiedPayments > 0 && (
        <Link href="/admin/orders?status=pending" className="block bg-amber-50 border border-amber-200 text-amber-900 rounded-lg p-4 text-sm hover:bg-amber-100">
          <span className="font-semibold">{s.unverifiedPayments} payment{s.unverifiedPayments > 1 ? "s" : ""} awaiting verification.</span> Click to review →
        </Link>
      )}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Today" value={money(s.todayRevenue)} sub={`${s.todayOrders} order${s.todayOrders !== 1 ? "s" : ""}`} accent />
        <KPI label="Revenue (30d)" value={money(s.revenue30)} sub={`vs prev 30d`} delta={s.revenueDelta} />
        <KPI label="Orders (30d)" value={s.orderCount30} sub={`vs prev 30d`} delta={s.orderDelta} />
        <KPI label="Customers" value={s.totalUsers} sub={`${s.totalProducts} products`} />
      </section>

      {/* Action queue tiles */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link href="/admin/orders?status=pending" className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#1a2b4a] transition-colors">
          <p className="text-xs uppercase tracking-wide text-gray-500">Awaiting confirmation</p>
          <p className="text-2xl font-semibold mt-1 text-amber-700">{s.pendingCount}</p>
        </Link>
        <Link href="/admin/orders?status=paid" className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#1a2b4a] transition-colors">
          <p className="text-xs uppercase tracking-wide text-gray-500">To pack</p>
          <p className="text-2xl font-semibold mt-1 text-blue-700">{s.paidCount}</p>
        </Link>
        <Link href="/admin/orders?status=shipped" className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#1a2b4a] transition-colors">
          <p className="text-xs uppercase tracking-wide text-gray-500">In transit</p>
          <p className="text-2xl font-semibold mt-1 text-violet-700">{s.shippedCount}</p>
        </Link>
        <Link href="/admin/orders?status=delivered" className="bg-white border border-gray-200 rounded-lg p-4 hover:border-[#1a2b4a] transition-colors">
          <p className="text-xs uppercase tracking-wide text-gray-500">Delivered</p>
          <p className="text-2xl font-semibold mt-1 text-green-700">{s.deliveredCount}</p>
        </Link>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-sm">Revenue (last 14 days)</h2>
              <p className="text-xs text-gray-500">Daily total, cancelled orders excluded</p>
            </div>
          </div>
          <BarChart data={s.dailyRevenue} format={money} />
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <h2 className="font-semibold text-sm mb-4">Sales by category (30d)</h2>
          <Donut segments={s.byCategory} />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-200">
            <h2 className="font-semibold text-sm">Top products (30d)</h2>
          </div>
          {s.topProducts.length === 0 ? (
            <p className="p-5 text-sm text-gray-500">No sales in the last 30 days.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {s.topProducts.map((p, i) => (
                <li key={p._id} className="px-5 py-3 flex items-center justify-between text-sm">
                  <span className="flex items-center gap-3 min-w-0">
                    <span className="text-xs text-gray-400 font-mono w-4 shrink-0">{i + 1}</span>
                    <span className="truncate">{p.title}</span>
                  </span>
                  <span className="text-xs text-gray-500 shrink-0">{p.qty} sold · {money(p.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200">
          <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
            <h2 className="font-semibold text-sm">Low stock</h2>
            <Link href="/admin/products?stock=low" className="text-xs text-blue-600 hover:underline">All →</Link>
          </div>
          {s.lowStock.length === 0 ? (
            <p className="p-5 text-sm text-gray-500">All products well-stocked.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {s.lowStock.map((p) => (
                <li key={p.slug} className="px-5 py-3 flex items-center justify-between text-sm">
                  <span className="truncate">{p.title}</span>
                  <span className={`text-xs shrink-0 ${p.inventory <= 0 ? "text-red-600 font-semibold" : "text-amber-700"}`}>{p.inventory} left</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="bg-white rounded-lg border border-gray-200">
        <div className="px-5 py-3 border-b border-gray-200 flex items-center justify-between">
          <h2 className="font-semibold text-sm">Recent orders</h2>
          <Link href="/admin/orders" className="text-xs text-blue-600 hover:underline">All →</Link>
        </div>
        {s.recent.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-100">
              {s.recent.map((o) => (
                <tr key={o.id}>
                  <td className="px-5 py-2"><Link href={`/admin/orders/${o.id}`} className="font-mono text-xs hover:underline">#{o.id.slice(-6)}</Link></td>
                  <td className="px-5 py-2 truncate max-w-[220px]">{o.userEmail}</td>
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
