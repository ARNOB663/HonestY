import { dbConnect } from "../../../lib/mongodb";
import Settings from "../../../models/Settings";
import MediaManager from "../../../components/admin/MediaManager";
import HeroBannerManager from "../../../components/admin/HeroBannerManager";

export const dynamic = "force-dynamic";

export default async function AdminMedia() {
  await dbConnect();
  const doc = await Settings.findOne({ key: "store" }).lean();
  const initial = doc
    ? { heroEyebrow: doc.heroEyebrow, heroTitle: doc.heroTitle, heroPriceText: doc.heroPriceText, heroCtaText: doc.heroCtaText, heroCtaHref: doc.heroCtaHref, heroImage: doc.heroImage, miniBanners: doc.miniBanners }
    : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold">Media & Banners</h1>
        <p className="text-sm text-gray-500 mt-1">Upload images and configure the homepage hero & side banners.</p>
      </div>

      <HeroBannerManager initial={initial} />

      <div className="border-t border-gray-200 pt-8">
        <h2 className="text-lg font-semibold mb-1">Media library</h2>
        <p className="text-sm text-gray-500 mb-4">All uploaded images. Use these URLs anywhere a picker isn&apos;t available.</p>
        <MediaManager />
      </div>
    </div>
  );
}
