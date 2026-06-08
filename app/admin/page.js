import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "../../lib/db";
import { formatMoney } from "../../lib/format";
import { BarChart, Donut } from "../../components/admin/Charts";

const cachedStats = unstable_cache(
  () => loadStatsImpl(),
  ["admin-dashboard-v1"],
  { revalidate: 60, tags: ["admin-dashboard"] }
);

async function loadStats() {
  return cachedStats();
}

async function loadStatsImpl() {
  try {
    const now = new Date();
    const startOfToday = new Date(now);
    startOfToday.setHours(0, 0, 0, 0);
    const since30 = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    const prev30Start = new Date(now.getTime() - 60 * 24 * 3600 * 1000);
    const since7 = new Date(now.getTime() - 7 * 24 * 3600 * 1000);

    // Helper: sum + count for a date window, excluding cancelled.
    async function aggBetween(from, to) {
      const where = {
        createdAt: { gte: from, ...(to ? { lt: to } : {}) },
        NOT: { status: "cancelled" },
      };
      const agg = await prisma.order.aggregate({
        where,
        _sum: { total: true },
        _count: { _all: true },
      });
      return { total: agg._sum.total || 0, count: agg._count._all || 0 };
    }

    // Revenue by day for the last 14 days. Raw MySQL for date grouping.
    const DAILY_DAYS = 14;
    const dailyStart = new Date(now.getTime() - DAILY_DAYS * 24 * 3600 * 1000);
    const dailyRev = await prisma.$queryRaw`
      SELECT DATE(createdAt) AS day, SUM(total) AS revenue
      FROM \`Order\`
      WHERE createdAt >= ${dailyStart} AND status != 'cancelled'
      GROUP BY DATE(createdAt)
      ORDER BY day ASC
    `;

    // Sales by category (last 30d) — join OrderItem → Product.
    const byCategoryRows = await prisma.$queryRaw`
      SELECT COALESCE(p.collection, 'uncategorized') AS label,
             SUM(oi.price * oi.qty) AS revenue
      FROM OrderItem oi
      JOIN \`Order\` o ON o.id = oi.orderId
      LEFT JOIN Product p ON p.slug = oi.slug
      WHERE o.createdAt >= ${since30} AND o.status != 'cancelled'
      GROUP BY label
      ORDER BY revenue DESC
    `;

    // Top products (last 30d)
    const topProductsRows = await prisma.$queryRaw`
      SELECT oi.slug AS slug,
             MIN(oi.title) AS title,
             SUM(oi.qty) AS qty,
             SUM(oi.price * oi.qty) AS revenue
      FROM OrderItem oi
      JOIN \`Order\` o ON o.id = oi.orderId
      WHERE o.createdAt >= ${since30} AND o.status != 'cancelled'
      GROUP BY oi.slug
      ORDER BY qty DESC
      LIMIT 5
    `;

    // Profit (last 30d) — only counts DELIVERED orders. Pending/confirmed/paid
    // orders aren't realized yet (could still be cancelled, refunded, lost).
    // `gross` is the basis for the margin %, so it also filters to delivered.
    const profitRows = await prisma.$queryRaw`
      SELECT
        SUM((oi.price - COALESCE(oi.costPrice, 0)) * oi.qty) AS profit,
        SUM(COALESCE(oi.costPrice, 0) * oi.qty) AS cost,
        SUM(oi.price * oi.qty) AS gross
      FROM OrderItem oi
      JOIN \`Order\` o ON o.id = oi.orderId
      WHERE o.createdAt >= ${since30} AND o.status = 'delivered'
    `;

    const [aggToday, agg7, agg30, aggPrev30, totalOrders, totalProducts, totalUsers, recent, unfulfilled, lowStock, unverifiedPayments, statusCounts] = await Promise.all([
      aggBetween(startOfToday),
      aggBetween(since7),
      aggBetween(since30),
      aggBetween(prev30Start, since30),
      prisma.order.count(),
      prisma.product.count(),
      prisma.user.count({ where: { NOT: { role: "admin" } } }),
      prisma.order.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: { id: true, code: true, userEmail: true, total: true, status: true, createdAt: true },
      }),
      prisma.order.findMany({
        where: { status: { in: ["pending", "confirmed", "paid"] } },
        orderBy: { createdAt: "asc" },
        take: 5,
        select: { id: true, code: true, userEmail: true, total: true, createdAt: true },
      }),
      prisma.product.findMany({
        where: { inventory: { lte: 5 } },
        select: { slug: true, title: true, inventory: true },
        take: 5,
      }),
      prisma.order.count({
        where: {
          paymentMethod: { in: ["bkash", "nagad"] },
          paymentVerified: false,
          NOT: { status: { in: ["cancelled", "refunded"] } },
        },
      }),
      prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    ]);

    const profit30 = Number(profitRows[0]?.profit || 0);
    const gross30 = Number(profitRows[0]?.gross || 0);
    const margin30 = gross30 > 0 ? Math.round((profit30 / gross30) * 100) : 0;

    // Fill in any days that had zero orders.
    const dailyMap = new Map(
      (dailyRev || []).map((d) => {
        const dt = new Date(d.day);
        const key = `${dt.getFullYear()}-${dt.getMonth() + 1}-${dt.getDate()}`;
        return [key, Number(d.revenue)];
      })
    );
    const last14 = [];
    for (let i = DAILY_DAYS - 1; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
      const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
      last14.push({ label: d.toLocaleDateString("en-BD", { day: "numeric", month: "short" }), value: dailyMap.get(key) || 0 });
    }

    const revenueDelta = aggPrev30.total > 0 ? Math.round(((agg30.total - aggPrev30.total) / aggPrev30.total) * 100) : (agg30.total > 0 ? 100 : 0);
    const orderDelta = aggPrev30.count > 0 ? Math.round(((agg30.count - aggPrev30.count) / aggPrev30.count) * 100) : (agg30.count > 0 ? 100 : 0);

    const statusMap = Object.fromEntries(statusCounts.map((s) => [s.status, s._count._all]));

    return {
      todayRevenue: aggToday.total,
      todayOrders: aggToday.count,
      revenue7: agg7.total,
      orderCount7: agg7.count,
      revenue30: agg30.total,
      orderCount30: agg30.count,
      profit30,
      margin30,
      revenueDelta,
      orderDelta,
      totalOrders,
      totalProducts,
      totalUsers,
      unverifiedPayments,
      pendingCount: statusMap.pending || 0,
      paidCount: (statusMap.paid || 0) + (statusMap.confirmed || 0),
      shippedCount: statusMap.shipped || 0,
      deliveredCount: statusMap.delivered || 0,
      recent: recent.map((o) => ({ id: o.code || String(o.id), userEmail: o.userEmail, total: o.total, status: o.status, createdAt: o.createdAt })),
      unfulfilled: unfulfilled.map((o) => ({ id: o.code || String(o.id), userEmail: o.userEmail, total: o.total, createdAt: o.createdAt })),
      lowStock,
      topProducts: topProductsRows.map((r) => ({ _id: r.slug, title: r.title, qty: Number(r.qty), revenue: Number(r.revenue) })),
      dailyRevenue: last14,
      byCategory: byCategoryRows.map((c) => ({ label: c.label, value: Number(c.revenue) })),
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
  const cls = accent
    ? "bg-gradient-to-br from-[#1a2b4a] to-[#0e1a30] text-white border-transparent shadow-md"
    : "bg-white text-[#1a1a1a] border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-px";
  return (
    <div className={`rounded-xl border p-5 transition-all duration-200 ${cls}`}>
      <div className="flex items-start justify-between">
        <p className={`text-[11px] uppercase tracking-[0.1em] font-medium ${accent ? "text-white/70" : "text-gray-500"}`}>{label}</p>
        {delta !== undefined && <Delta pct={delta} />}
      </div>
      <p className="text-2xl font-semibold mt-2 tracking-tight">{value}</p>
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

      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <KPI label="Today" value={money(s.todayRevenue)} sub={`${s.todayOrders} order${s.todayOrders !== 1 ? "s" : ""}`} accent />
        <KPI label="Revenue (30d)" value={money(s.revenue30)} sub={`vs prev 30d`} delta={s.revenueDelta} />
        <KPI label="Profit (30d)" value={money(s.profit30)} sub={`${s.margin30}% margin`} />
        <KPI label="Orders (30d)" value={s.orderCount30} sub={`vs prev 30d`} delta={s.orderDelta} />
        <KPI label="Customers" value={s.totalUsers} sub={`${s.totalProducts} products`} />
      </section>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { href: "/admin/orders?status=pending", label: "Awaiting confirmation", count: s.pendingCount, dot: "bg-amber-500", text: "text-amber-700" },
          { href: "/admin/orders?status=paid", label: "To pack", count: s.paidCount, dot: "bg-blue-500", text: "text-blue-700" },
          { href: "/admin/orders?status=shipped", label: "In transit", count: s.shippedCount, dot: "bg-violet-500", text: "text-violet-700" },
          { href: "/admin/orders?status=delivered", label: "Delivered", count: s.deliveredCount, dot: "bg-green-500", text: "text-green-700" },
        ].map((t) => (
          <Link
            key={t.href}
            href={t.href}
            className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md hover:-translate-y-px hover:border-gray-300 transition-all duration-200"
          >
            <p className="text-[11px] uppercase tracking-[0.1em] text-gray-500 flex items-center gap-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${t.dot}`} />
              {t.label}
            </p>
            <p className={`text-2xl font-semibold mt-2 ${t.text}`}>{t.count}</p>
          </Link>
        ))}
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-semibold text-sm">Revenue (last 14 days)</h2>
              <p className="text-xs text-gray-500">Daily total, cancelled orders excluded</p>
            </div>
          </div>
          <BarChart data={s.dailyRevenue} format={money} />
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
          <h2 className="font-semibold text-sm mb-4">Sales by category (30d)</h2>
          <Donut segments={s.byCategory} />
        </div>
      </section>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-3 border-b border-gray-100">
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

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
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

      <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
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
                  <td className="px-5 py-2"><Link href={`/admin/orders/${o.id}`} className="font-mono text-xs hover:underline">#{o.id}</Link></td>
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
