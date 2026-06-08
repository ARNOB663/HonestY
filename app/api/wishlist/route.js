import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/db";
import { checkOrigin } from "../../../lib/origin";
import { rateLimit, clientIp } from "../../../lib/rateLimit";

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
  const user = await prisma.user.findUnique({
    where: { email: session.user.email.toLowerCase() },
    select: { wishlist: true },
  });
  return NextResponse.json({ slugs: Array.isArray(user?.wishlist) ? user.wishlist : [] });
}

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
  const updated = await prisma.user.update({
    where: { email: session.user.email.toLowerCase() },
    data: { wishlist: slugs },
    select: { wishlist: true },
  });
  return NextResponse.json({ slugs: Array.isArray(updated?.wishlist) ? updated.wishlist : [] });
}
