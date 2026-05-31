import MediaManager from "../../../components/admin/MediaManager";

export const dynamic = "force-dynamic";

export default async function AdminMedia() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Media library</h1>
        <p className="text-sm text-gray-500 mt-1">All uploaded images. Use these URLs in products, pages, and other content.</p>
      </div>
      <MediaManager />
    </div>
  );
}
