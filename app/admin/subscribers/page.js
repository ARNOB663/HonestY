import { dbConnect } from "../../../lib/mongodb";
import Subscriber from "../../../models/Subscriber";

export const dynamic = "force-dynamic";

export default async function AdminSubscribers() {
  await dbConnect();
  const subs = await Subscriber.find({}).sort({ createdAt: -1 }).limit(1000).lean();
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">
          Subscribers <span className="text-gray-400 text-base font-normal">({subs.length})</span>
        </h1>
        <a
          href="/api/admin/subscribers/export"
          className="text-xs font-medium px-3 py-1.5 rounded border border-gray-300 hover:border-[#1a2b4a] hover:bg-gray-50"
        >
          Export CSV
        </a>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr>
              <th className="px-4 py-2">Email</th>
              <th className="px-4 py-2">Source</th>
              <th className="px-4 py-2">Subscribed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {subs.length === 0 && <tr><td colSpan={3} className="px-4 py-10 text-center text-gray-500">No subscribers yet.</td></tr>}
            {subs.map((s) => (
              <tr key={String(s._id)}>
                <td className="px-4 py-2">{s.email}</td>
                <td className="px-4 py-2 text-gray-500">{s.source}</td>
                <td className="px-4 py-2 text-gray-500">{new Date(s.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
