import Link from "next/link";
import { notFound } from "next/navigation";
import { dbConnect } from "../../../../lib/mongodb";
import User from "../../../../models/User";
import Order from "../../../../models/Order";
import { formatMoney } from "../../../../lib/format";

export const dynamic = "force-dynamic";

const STATUS_COLOR = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-blue-50 text-blue-700",
  paid: "bg-blue-50 text-blue-700",
  fulfilled: "bg-green-50 text-green-700",
  shipped: "bg-indigo-50 text-indigo-700",
  delivered: "bg-emerald-50 text-emerald-700",
  refunded: "bg-gray-100 text-gray-600",
  cancelled: "bg-red-50 text-red-700",
};

export default async function CustomerDetail({ params }) {
  const { email: rawEmail } = await params;
  const email = decodeURIComponent(rawEmail).toLowerCase();
  await dbConnect();

  const [user, orders, totals] = await Promise.all([
    User.findOne({ email }).select("email name phone backupPhone defaultAddress createdAt role").lean(),
    Order.find({ userEmail: email }).sort({ createdAt: -1 }).limit(100).lean(),
    Order.aggregate([
      { $match: { userEmail: email, status: { $ne: "cancelled" } } },
      { $group: { _id: null, count: { $sum: 1 }, total: { $sum: "$total" }, avg: { $avg: "$total" } } },
    ]),
  ]);

  if (!user && orders.length === 0) notFound();

  const stats = totals[0] || { count: 0, total: 0, avg: 0 };
  const addr = user?.defaultAddress || orders[0]?.shippingAddress || null;
  const firstOrder = orders.length > 0 ? orders[orders.length - 1].createdAt : null;
  const lastOrder = orders.length > 0 ? orders[0].createdAt : null;

  return (
    <div className="space-y-6 max-w-5xl">
      <Link href="/admin/customers" className="text-sm text-gray-500 hover:underline">← Customers</Link>

      <header className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold">{user?.name || email}</h1>
          <p className="text-sm text-gray-500 mt-1">{email}</p>
          {user?.role === "admin" && <span className="inline-block mt-1 text-[10px] font-semibold bg-amber-50 text-amber-800 px-2 py-0.5 rounded">Admin</span>}
          {!user && <p className="text-xs text-amber-700 mt-1">Guest checkout customer — no account.</p>}
        </div>
        <a
          href={`mailto:${email}`}
          className="bg-[#1a2b4a] text-white px-4 py-2 rounded text-sm hover:bg-[#0f1c33]"
        >
          Email customer
        </a>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPI label="Total spend" value={formatMoney(stats.total)} />
        <KPI label="Orders" value={stats.count} />
        <KPI label="Avg order" value={formatMoney(Math.round(stats.avg || 0))} />
        <KPI label="Joined" value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"} sub={firstOrder ? `First order ${new Date(firstOrder).toLocaleDateString()}` : ""} />
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold text-sm mb-3">Contact</h2>
          <dl className="text-sm grid grid-cols-[120px_1fr] gap-y-1.5">
            <dt className="text-gray-500">Email</dt><dd>{email}</dd>
            {user?.phone && <><dt className="text-gray-500">Phone</dt><dd>{user.phone}</dd></>}
            {user?.backupPhone && <><dt className="text-gray-500">Backup</dt><dd>{user.backupPhone}</dd></>}
            {lastOrder && <><dt className="text-gray-500">Last order</dt><dd>{new Date(lastOrder).toLocaleDateString()}</dd></>}
          </dl>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold text-sm mb-3">Default address</h2>
          {addr ? (
            <div className="text-sm leading-relaxed text-gray-700">
              <p>{addr.name || user?.name || ""}</p>
              <p>{[addr.line1, addr.area].filter(Boolean).join(", ")}</p>
              <p>{addr.city}, {addr.state} {addr.zip}</p>
              <p>{addr.country}</p>
              {addr.phone && <p className="mt-1 text-gray-500">{addr.phone}</p>}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No address on file.</p>
          )}
        </div>
      </section>

      <section className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-5 py-3 border-b border-gray-200">
          <h2 className="font-semibold text-sm">Order history ({orders.length})</h2>
        </div>
        {orders.length === 0 ? (
          <p className="p-5 text-sm text-gray-500">No orders yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-5 py-2">Order</th>
                <th className="px-5 py-2">Date</th>
                <th className="px-5 py-2">Items</th>
                <th className="px-5 py-2">Status</th>
                <th className="px-5 py-2 text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((o) => {
                const titles = (o.items || []).map((i) => `${i.title}${i.qty > 1 ? ` ×${i.qty}` : ""}`);
                const titlesShort = titles.slice(0, 2).join(", ") + (titles.length > 2 ? `, +${titles.length - 2} more` : "");
                return (
                  <tr key={String(o._id)}>
                    <td className="px-5 py-2 align-top">
                      <Link href={`/admin/orders/${String(o._id)}`} className="font-mono text-xs hover:underline block">#{String(o._id).slice(-6)}</Link>
                      <p className="text-[11px] text-gray-600 mt-0.5 max-w-[280px]" title={titles.join(", ")}>{titlesShort || "—"}</p>
                    </td>
                    <td className="px-5 py-2 text-gray-500 align-top whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-2 text-gray-500 align-top">{(o.items || []).reduce((s, i) => s + i.qty, 0)}</td>
                    <td className="px-5 py-2 align-top"><span className={`inline-block px-2 py-0.5 rounded text-xs ${STATUS_COLOR[o.status] || "bg-gray-100"}`}>{o.status}</span></td>
                    <td className="px-5 py-2 text-right align-top">{formatMoney(o.total)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}

function KPI({ label, value, sub }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      <p className="text-xs uppercase tracking-wide text-gray-500">{label}</p>
      <p className="text-xl font-semibold mt-1">{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </div>
  );
}
