import { NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "../../../../lib/db";
import { rateLimit, clientIp } from "../../../../lib/rateLimit";
import { checkOrigin } from "../../../../lib/origin";
import { sendPasswordReset } from "../../../../lib/mailer";
import { getBaseUrl } from "../../../../lib/baseUrl";

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
    return NextResponse.json({ ok: true });
  }

  const emailRl = await rateLimit({ key: `forgot-email:${email}`, limit: 3, windowMs: 24 * 60 * 60 * 1000 });
  if (!emailRl.ok) {
    return NextResponse.json({ ok: true });
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (user && user.passwordHash) {
    const token = crypto.randomBytes(32).toString("hex");
    const hash = crypto.createHash("sha256").update(token).digest("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: hash,
        resetTokenExpiresAt: new Date(Date.now() + TOKEN_TTL_MS),
      },
    });
    const resetUrl = `${getBaseUrl()}/reset?token=${token}`;
    sendPasswordReset({ to: email, resetUrl }).catch(() => {});
  }

  return NextResponse.json({ ok: true });
}
