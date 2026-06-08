import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "../../../lib/db";
import { formatMoney } from "../../../lib/format";

export const dynamic = "force-dynamic";

const cachedCustomers = unstable_cache(
  async () => {
    const [users, agg] = await Promise.all([
      prisma.user.findMany({
        select: { id: true, email: true, name: true, role: true, createdAt: true },
        orderBy: { createdAt: "desc" },
        take: 500,
      }),
      prisma.order.groupBy({
        by: ["userEmail"],
        _count: { _all: true },
        _sum: { total: true },
      }),
    ]);
    const byEmail = Object.fromEntries(agg.map((r) => [r.userEmail, r]));
    return users.map((u) => ({
      _id: String(u.id),
      email: u.email,
      name: u.name || "",
      role: u.role || "user",
      createdAt: u.createdAt,
      orders: byEmail[u.email]?._count?._all || 0,
      spend: byEmail[u.email]?._sum?.total || 0,
    }));
  },
  ["admin-customers-v1"],
  { revalidate: 60, tags: ["admin-customers", "admin-orders"] }
);

export default async function AdminCustomers({ searchParams }) {
  const sp = (await searchParams) || {};
  const q = (sp.q || "").trim().slice(0, 64).toLowerCase();

  const all = await cachedCustomers();
  const users = q
    ? all.filter((u) =>
        (u.email || "").toLowerCase().includes(q) ||
        (u.name || "").toLowerCase().includes(q)
      )
    : all.slice(0, 200);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Customers <span className="text-gray-400 text-base font-normal">({users.length})</span></h1>
        <form className="flex gap-2"><input name="q" defaultValue={sp.q || ""} placeholder="Search name or email…" className="border border-gray-300 rounded px-3 py-1.5 text-sm w-64" /><button className="bg-[#1a2b4a] text-white px-3 py-1.5 rounded text-sm">Search</button></form>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Email</th><th className="px-4 py-2">Role</th><th className="px-4 py-2">Joined</th><th className="px-4 py-2 text-right">Orders</th><th className="px-4 py-2 text-right">Spend</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No customers.</td></tr>}
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-gray-50">
                <td className="px-4 py-2"><Link href={`/admin/customers/${encodeURIComponent(u.email)}`} className="text-blue-600 hover:underline">{u.name || "—"}</Link></td>
                <td className="px-4 py-2"><Link href={`/admin/customers/${encodeURIComponent(u.email)}`} className="hover:underline">{u.email}</Link></td>
                <td className="px-4 py-2"><span className="inline-block px-2 py-0.5 rounded text-xs bg-gray-100">{u.role}</span></td>
                <td className="px-4 py-2 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-right">{u.orders}</td>
                <td className="px-4 py-2 text-right">{formatMoney(u.spend)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
