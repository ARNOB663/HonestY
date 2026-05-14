import { dbConnect } from "../../../lib/mongodb";
import AuditLog from "../../../models/AuditLog";

export const dynamic = "force-dynamic";

const METHOD_COLOR = {
  POST: "bg-green-50 text-green-700",
  PUT: "bg-blue-50 text-blue-700",
  PATCH: "bg-amber-50 text-amber-700",
  DELETE: "bg-red-50 text-red-700",
};

export default async function AdminAudit() {
  await dbConnect();
  const logs = await AuditLog.find({}).sort({ createdAt: -1 }).limit(200).lean();
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Audit log <span className="text-gray-400 text-base font-normal">(last {logs.length})</span></h1>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr><th className="px-4 py-2">When</th><th className="px-4 py-2">Actor</th><th className="px-4 py-2">Method</th><th className="px-4 py-2">Path</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Body</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.length === 0 && <tr><td colSpan={6} className="px-4 py-10 text-center text-gray-500">No log entries yet.</td></tr>}
            {logs.map((l) => (
              <tr key={String(l._id)} className="align-top">
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
