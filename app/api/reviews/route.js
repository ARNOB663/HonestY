import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { dbConnect } from "../../../lib/mongodb";
import Review from "../../../models/Review";
import Order from "../../../models/Order";

export async function POST(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Sign in to leave a review" }, { status: 401 });

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const productSlug = String(body.productSlug || "").trim();
  const rating = Math.floor(Number(body.rating));
  const reviewBody = String(body.body || "").trim().slice(0, 2000);
  const title = String(body.title || "").trim().slice(0, 120);
  if (!productSlug) return NextResponse.json({ error: "productSlug required" }, { status: 400 });
  if (!(rating >= 1 && rating <= 5)) return NextResponse.json({ error: "rating must be 1-5" }, { status: 400 });
  if (!reviewBody || reviewBody.length < 4) return NextResponse.json({ error: "review body too short" }, { status: 400 });

  await dbConnect();

  // Verified buyer if the user has any non-cancelled order containing this slug.
  const verified = !!(await Order.exists({
    userEmail: session.user.email.toLowerCase(),
    status: { $ne: "cancelled" },
    "items.slug": productSlug,
  }));

  await Review.create({
    productSlug,
    userEmail: session.user.email.toLowerCase(),
    name: session.user.name,
    rating,
    title,
    body: reviewBody,
    verified,
    status: "pending",
  });
  return NextResponse.json({ ok: true, pending: true });
}

export async function GET(req) {
  const url = new URL(req.url);
  const slug = (url.searchParams.get("slug") || "").trim();
  if (!slug) return NextResponse.json({ reviews: [], summary: { count: 0, avg: 0 } });
  await dbConnect();
  const reviews = await Review.find({ productSlug: slug, status: "approved" })
    .sort({ createdAt: -1 })
    .limit(50)
    .lean();
  const count = reviews.length;
  const avg = count ? reviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  return NextResponse.json({
    reviews: reviews.map((r) => ({
      _id: String(r._id),
      name: r.name || "Customer",
      rating: r.rating,
      title: r.title,
      body: r.body,
      reply: r.reply,
      verified: r.verified,
      createdAt: r.createdAt,
    })),
    summary: { count, avg: Math.round(avg * 10) / 10 },
  });
}
