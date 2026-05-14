import Link from "next/link";
import { dbConnect } from "../../../lib/mongodb";
import Review from "../../../models/Review";
import ReviewsManager from "../../../components/admin/ReviewsManager";

export const dynamic = "force-dynamic";

export default async function AdminReviews({ searchParams }) {
  const sp = (await searchParams) || {};
  const status = sp.status || "pending";
  await dbConnect();
  const docs = await Review.find(status === "all" ? {} : { status }).sort({ createdAt: -1 }).limit(200).lean();
  const initial = docs.map((r) => ({
    _id: String(r._id),
    productSlug: r.productSlug,
    userEmail: r.userEmail,
    name: r.name,
    rating: r.rating,
    title: r.title,
    body: r.body,
    reply: r.reply,
    verified: r.verified,
    status: r.status,
    createdAt: r.createdAt,
  }));

  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Reviews</h1>
      <div className="flex gap-2 text-xs">
        {["pending", "approved", "hidden", "spam", "all"].map((s) => (
          <Link key={s} href={`/admin/reviews?status=${s}`}
            className={`px-3 py-1 rounded border ${status === s ? "bg-[#1a2b4a] text-white border-[#1a2b4a]" : "bg-white border-gray-300 text-gray-700 hover:border-gray-500"}`}>
            {s}
          </Link>
        ))}
      </div>
      <ReviewsManager initial={initial} />
    </div>
  );
}
