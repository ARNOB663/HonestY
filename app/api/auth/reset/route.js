import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { dbConnect } from "../../../../lib/mongodb";
import { rateLimit, clientIp } from "../../../../lib/rateLimit";
import { checkOrigin } from "../../../../lib/origin";
import User from "../../../../models/User";

export async function POST(req) {
  if (!checkOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });

  const rl = rateLimit({ key: `reset:${clientIp(req)}`, limit: 10, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts" }, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfter) },
    });
  }

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const token = typeof body.token === "string" ? body.token.trim() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!token || token.length < 32 || token.length > 128) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
  }
  if (password.length < 8 || password.length > 200) {
    return NextResponse.json({ error: "Password must be 8–200 characters" }, { status: 400 });
  }

  const hash = crypto.createHash("sha256").update(token).digest("hex");

  await dbConnect();
  const user = await User.findOne({
    resetTokenHash: hash,
    resetTokenExpiresAt: { $gt: new Date() },
  });
  if (!user) {
    return NextResponse.json({ error: "Invalid or expired link" }, { status: 400 });
  }

  user.passwordHash = await bcrypt.hash(password, 12);
  user.resetTokenHash = undefined;
  user.resetTokenExpiresAt = undefined;
  // Bump tokenVersion to invalidate any active sessions on other devices.
  user.tokenVersion = (user.tokenVersion || 0) + 1;
  await user.save();

  return NextResponse.json({ ok: true });
}
