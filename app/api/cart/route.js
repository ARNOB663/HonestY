import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { dbConnect } from "../../../lib/mongodb";
import { checkOrigin } from "../../../lib/origin";
import { rateLimit, clientIp } from "../../../lib/rateLimit";
import User from "../../../models/User";

function cleanItems(input) {
  if (!Array.isArray(input)) return [];
  const out = [];
  for (const it of input.slice(0, 100)) {
    const slug = typeof it?.slug === "string" ? it.slug.trim().slice(0, 120) : "";
    const qty = Math.max(1, Math.min(99, Math.floor(Number(it?.qty) || 1)));
    if (!slug) continue;
    out.push({
      slug,
      variantId: it.variantId ? String(it.variantId).slice(0, 80) : null,
      variantName: it.variantName ? String(it.variantName).slice(0, 80) : null,
      title: typeof it.title === "string" ? it.title.slice(0, 200) : "",
      price: Number(it.price) || 0,
      image: typeof it.image === "string" ? it.image.slice(0, 500) : "",
      qty,
    });
  }
  return out;
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ items: [] });
  await dbConnect();
  const user = await User.findOne({ email: session.user.email.toLowerCase() }).select("cart").lean();
  return NextResponse.json({ items: user?.cart || [] });
}

export async function PUT(req) {
  if (!checkOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const rl = await rateLimit({ key: `cart:${clientIp(req)}`, limit: 120, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many updates" }, { status: 429, headers: { "Retry-After": String(rl.retryAfter) } });
  }

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const items = cleanItems(body.items);
  await dbConnect();
  await User.updateOne({ email: session.user.email.toLowerCase() }, { $set: { cart: items } });
  return NextResponse.json({ ok: true });
}
