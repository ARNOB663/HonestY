import MediaManager from "../../../components/admin/MediaManager";

export const dynamic = "force-dynamic";

export default function AdminMedia() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Media library</h1>
      <p className="text-sm text-gray-500">Upload images to Cloudinary. Copy any URL and paste into a product&apos;s image field.</p>
      <MediaManager />
    </div>
  );
}
