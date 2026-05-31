import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { dbConnect } from "../../../lib/mongodb";
import { checkOrigin } from "../../../lib/origin";
import { rateLimit, clientIp } from "../../../lib/rateLimit";
import User from "../../../models/User";

const BD_PHONE = /^01[3-9]\d{8}$/;

function profileOf(u) {
  if (!u) return null;
  return {
    email: u.email,
    name: u.name || "",
    phone: u.phone || "",
    backupPhone: u.backupPhone || "",
    defaultAddress: u.defaultAddress || null,
    role: u.role || "user",
  };
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  await dbConnect();
  const user = await User.findOne({ email: session.user.email.toLowerCase() })
    .select("email name phone backupPhone defaultAddress role")
    .lean();
  return NextResponse.json({ user: profileOf(user) });
}

function cleanString(v, max) {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t.length === 0 ? "" : t.slice(0, max);
}

export async function PATCH(req) {
  if (!checkOrigin(req)) {
    return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  }
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const rl = await rateLimit({ key: `account:${clientIp(req)}`, limit: 20, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many updates. Try again shortly." }, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfter) },
    });
  }

  let body;
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const set = {};

  if (body.name !== undefined) {
    set.name = cleanString(body.name, 100);
  }
  if (body.phone !== undefined) {
    const p = cleanString(body.phone, 20);
    if (p && !BD_PHONE.test(p)) {
      return NextResponse.json({ error: "Phone must be 11 digits starting 013–019" }, { status: 400 });
    }
    set.phone = p;
  }
  if (body.backupPhone !== undefined) {
    const p = cleanString(body.backupPhone, 20);
    if (p && !BD_PHONE.test(p)) {
      return NextResponse.json({ error: "Backup phone must be 11 digits starting 013–019" }, { status: 400 });
    }
    set.backupPhone = p;
  }
  if (body.defaultAddress !== undefined) {
    const a = body.defaultAddress || {};
    set.defaultAddress = a === null ? null : {
      line1: cleanString(a.line1, 200) || "",
      area: cleanString(a.area, 100) || "",
      city: cleanString(a.city, 100) || "",
      state: cleanString(a.state, 60) || "",
      country: cleanString(a.country, 60) || "Bangladesh",
    };
  }

  if (Object.keys(set).length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await dbConnect();
  const updated = await User.findOneAndUpdate(
    { email: session.user.email.toLowerCase() },
    { $set: set },
    { new: true }
  )
    .select("email name phone backupPhone defaultAddress role")
    .lean();

  if (!updated) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }
  return NextResponse.json({ user: profileOf(updated) });
}
