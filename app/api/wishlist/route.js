import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { dbConnect } from "../../../lib/mongodb";
import { checkOrigin } from "../../../lib/origin";
import { rateLimit, clientIp } from "../../../lib/rateLimit";
import User from "../../../models/User";

function cleanSlugs(input) {
  if (!Array.isArray(input)) return [];
  const seen = new Set();
  const out = [];
  for (const s of input) {
    if (typeof s !== "string") continue;
    const t = s.trim().slice(0, 120);
    if (!t || seen.has(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= 200) break;
  }
  return out;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ slugs: [] });
  await dbConnect();
  const user = await User.findOne({ email: session.user.email.toLowerCase() }).select("wishlist").lean();
  return NextResponse.json({ slugs: user?.wishlist || [] });
}

// PUT replaces the entire list (used for sync). Body: { slugs: [...] }.
export async function PUT(req) {
  if (!checkOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const rl = await rateLimit({ key: `wishlist:${clientIp(req)}`, limit: 60, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many updates" }, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfter) },
    });
  }

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const slugs = cleanSlugs(body.slugs);
  await dbConnect();
  const updated = await User.findOneAndUpdate(
    { email: session.user.email.toLowerCase() },
    { $set: { wishlist: slugs } },
    { new: true }
  ).select("wishlist").lean();
  return NextResponse.json({ slugs: updated?.wishlist || [] });
}
