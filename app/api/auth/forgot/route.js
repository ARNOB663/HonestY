import { NextResponse } from "next/server";
import crypto from "crypto";
import { dbConnect } from "../../../../lib/mongodb";
import { rateLimit, clientIp } from "../../../../lib/rateLimit";
import { checkOrigin } from "../../../../lib/origin";
import { sendPasswordReset } from "../../../../lib/mailer";
import { getBaseUrl } from "../../../../lib/baseUrl";
import User from "../../../../models/User";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOKEN_TTL_MS = 60 * 60 * 1000;

export async function POST(req) {
  if (!checkOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });

  const rl = await rateLimit({ key: `forgot:${clientIp(req)}`, limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts" }, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfter) },
    });
  }

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) {
    // Don't reveal whether the address is valid format vs unknown — uniform response.
    return NextResponse.json({ ok: true });
  }

  // Per-email rate limit: stops attackers from email-bombing one victim by
  // rotating IPs. 3 reset emails per day per address is enough for any real user.
  const emailRl = await rateLimit({ key: `forgot-email:${email}`, limit: 3, windowMs: 24 * 60 * 60 * 1000 });
  if (!emailRl.ok) {
    // Silent success — don't leak whether the address is tracked.
    return NextResponse.json({ ok: true });
  }

  await dbConnect();
  const user = await User.findOne({ email });
  // Only send to credential users (Google users don't have a password to reset).
  if (user && user.passwordHash) {
    const token = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    user.resetTokenHash = hash;
    user.resetTokenExpiresAt = new Date(Date.now() + TOKEN_TTL_MS);
    await user.save();

    const resetUrl = `${getBaseUrl()}/reset?token=${token}`;
    sendPasswordReset({ to: email, resetUrl }).catch(() => {});
  }

  // Always return ok to prevent account enumeration.
  return NextResponse.json({ ok: true });
}
