import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "../../../lib/db";

export const dynamic = "force-dynamic";

const cachedSalesGroups = unstable_cache(
  async () => {
    const groups = await prisma.salesGroup.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    });
    return groups.map((g) => ({
      _id: String(g.id),
      title: g.title,
      subtitle: g.subtitle || "",
      slug: g.slug,
      active: g.active,
      sortOrder: g.sortOrder || 0,
      productSlugs: g.productSlugs || [],
    }));
  },
  ["admin-sales-v1"],
  { revalidate: 60, tags: ["admin-sales"] }
);

export default async function AdminSalesList() {
  const groups = await cachedSalesGroups();
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Sales groups <span className="text-gray-400 text-base font-normal">({groups.length})</span></h1>
        <Link href="/admin/sales/new" className="bg-[#1a2b4a] text-white px-4 py-2 rounded text-sm hover:bg-[#0f1c33]">+ New sales group</Link>
      </div>
      <p className="text-sm text-gray-500 max-w-2xl">
        Each group renders as its own section on the homepage with the products you pick.
        Use these for seasonal sales (e.g. Eid Special, Monsoon Sale, Black Friday).
      </p>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Title</th>
              <th className="px-4 py-2">Slug</th>
              <th className="px-4 py-2 text-right">Products</th>
              <th className="px-4 py-2 text-right">Order</th>
              <th className="px-4 py-2">Status</th>
              <th className="px-4 py-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {groups.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">
                No sales groups yet. Click + New sales group to create one.
              </td></tr>
            )}
            {groups.map((g) => (
              <tr key={g._id}>
                <td className="px-4 py-2">
                  <p className="font-medium">{g.title}</p>
                  {g.subtitle && <p className="text-xs text-gray-500">{g.subtitle}</p>}
                </td>
                <td className="px-4 py-2 text-gray-500 font-mono text-xs">{g.slug}</td>
                <td className="px-4 py-2 text-right">{g.productSlugs?.length || 0}</td>
                <td className="px-4 py-2 text-right text-gray-500">{g.sortOrder}</td>
                <td className="px-4 py-2">
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${g.active ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {g.active ? "Active" : "Off"}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  <Link href={`/admin/sales/${g._id}`} className="text-blue-600 hover:underline text-xs">Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
