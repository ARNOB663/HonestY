import Link from "next/link";
import { dbConnect } from "../../../lib/mongodb";
import Page from "../../../models/Page";

export const dynamic = "force-dynamic";

export default async function AdminPages() {
  await dbConnect();
  const pages = await Page.find({}).sort({ updatedAt: -1 }).lean();
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Pages</h1>
        <Link href="/admin/pages/new" className="bg-[#1a2b4a] text-white px-4 py-2 rounded text-sm">+ New page</Link>
      </div>
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr><th className="px-4 py-2">Title</th><th className="px-4 py-2">Slug</th><th className="px-4 py-2">Published</th><th className="px-4 py-2">Updated</th><th className="px-4 py-2"></th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pages.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-500">No pages yet.</td></tr>}
            {pages.map((p) => (
              <tr key={String(p._id)}>
                <td className="px-4 py-2">{p.title}</td>
                <td className="px-4 py-2 text-gray-500">/p/{p.slug}</td>
                <td className="px-4 py-2">{p.published ? <span className="text-green-700 text-xs">yes</span> : <span className="text-gray-500 text-xs">draft</span>}</td>
                <td className="px-4 py-2 text-gray-500">{new Date(p.updatedAt).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-right"><Link href={`/admin/pages/${p.slug}`} className="text-blue-600 hover:underline">Edit</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
