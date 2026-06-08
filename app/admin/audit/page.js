import Link from "next/link";
import { unstable_cache } from "next/cache";
import { prisma } from "../../../lib/db";

export const dynamic = "force-dynamic";

const cachedRecentAudit = unstable_cache(
  async () => prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 500 }),
  ["admin-audit-recent-v1"],
  { revalidate: 30 }
);

const METHOD_COLOR = {
  POST: "bg-green-50 text-green-700",
  PUT: "bg-blue-50 text-blue-700",
  PATCH: "bg-amber-50 text-amber-700",
  DELETE: "bg-red-50 text-red-700",
};

export default async function AdminAudit({ searchParams }) {
  const sp = (await searchParams) || {};

  const hasOldDate = !!sp.from && (Date.now() - new Date(sp.from).getTime()) > 1000 * 60 * 60 * 24 * 7;

  let logs;
  if (hasOldDate) {
    const where = {};
    if (sp.actor) where.actorEmail = { contains: sp.actor };
    if (sp.path) where.path = { contains: sp.path };
    if (sp.method) where.method = sp.method;
    where.createdAt = {};
    if (sp.from) where.createdAt.gte = new Date(sp.from);
    if (sp.to) {
      const d = new Date(sp.to);
      d.setDate(d.getDate() + 1);
      where.createdAt.lt = d;
    }
    logs = await prisma.auditLog.findMany({ where, orderBy: { createdAt: "desc" }, take: 200 });
  } else {
    const all = await cachedRecentAudit();
    const actor = sp.actor ? String(sp.actor).toLowerCase() : "";
    const path = sp.path ? String(sp.path).toLowerCase() : "";
    const fromTs = sp.from ? new Date(sp.from).getTime() : null;
    const toTs = sp.to ? new Date(sp.to).getTime() + 1000 * 60 * 60 * 24 : null;
    logs = all
      .filter((l) => {
        if (actor && !(l.actorEmail || "").toLowerCase().includes(actor)) return false;
        if (path && !(l.path || "").toLowerCase().includes(path)) return false;
        if (sp.method && l.method !== sp.method) return false;
        const t = new Date(l.createdAt).getTime();
        if (fromTs && t < fromTs) return false;
        if (toTs && t >= toTs) return false;
        return true;
      })
      .slice(0, 200);
  }
  const hasFilter = sp.actor || sp.path || sp.method || sp.from || sp.to;

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Audit log <span className="text-gray-400 text-base font-normal">({logs.length})</span></h1>

      <form method="GET" className="flex flex-wrap gap-2 items-end bg-white border border-gray-200 rounded-lg p-3">
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">Actor (email)</label>
          <input name="actor" defaultValue={sp.actor || ""} placeholder="admin@…" className="border border-gray-300 rounded px-2 py-1.5 text-sm w-56" />
        </div>
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">Path contains</label>
          <input name="path" defaultValue={sp.path || ""} placeholder="/api/admin/products" className="border border-gray-300 rounded px-2 py-1.5 text-sm w-64" />
        </div>
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">Method</label>
          <select name="method" defaultValue={sp.method || ""} className="border border-gray-300 rounded px-2 py-1.5 text-sm">
            <option value="">Any</option>
            {["POST", "PUT", "PATCH", "DELETE"].map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">From</label>
          <input type="date" name="from" defaultValue={sp.from || ""} className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-[10px] uppercase text-gray-500 mb-1">To</label>
          <input type="date" name="to" defaultValue={sp.to || ""} className="border border-gray-300 rounded px-2 py-1.5 text-sm" />
        </div>
        <button className="bg-[#1a2b4a] text-white px-3 py-1.5 rounded text-sm">Filter</button>
        {hasFilter && <Link href="/admin/audit" className="text-xs text-gray-500 underline self-end pb-1.5">Clear</Link>}
      </form>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr><th className="px-4 py-2">When</th><th className="px-4 py-2">Actor</th><th className="px-4 py-2">Method</th><th className="px-4 py-2">Path</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Body</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No log entries match.</td></tr>}
            {logs.map((l) => (
              <tr key={l.id} className="align-top">
                <td className="px-4 py-2 text-gray-500 whitespace-nowrap">{new Date(l.createdAt).toLocaleString()}</td>
                <td className="px-4 py-2">{l.actorEmail || "—"}</td>
                <td className="px-4 py-2"><span className={`inline-block px-2 py-0.5 rounded text-xs font-mono ${METHOD_COLOR[l.method] || "bg-gray-100"}`}>{l.method}</span></td>
                <td className="px-4 py-2 font-mono text-xs">{l.path}</td>
                <td className="px-4 py-2"><span className={`text-xs ${l.status >= 400 ? "text-red-600" : "text-gray-700"}`}>{l.status}</span></td>
                <td className="px-4 py-2 text-xs text-gray-500 max-w-md">
                  {l.body ? <pre className="whitespace-pre-wrap break-words font-mono text-[10px] bg-gray-50 p-2 rounded">{JSON.stringify(l.body, null, 0).slice(0, 240)}</pre> : "—"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
