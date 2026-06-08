import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "../../../lib/db";
import { rateLimit, clientIp } from "../../../lib/rateLimit";
import { checkOrigin } from "../../../lib/origin";
import { isDisposableEmail } from "../../../lib/disposableEmail";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req) {
  if (!checkOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });
  const rl = await rateLimit({ key: `register:${clientIp(req)}`, limit: 5, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfter) },
    });
  }

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 100) : undefined;

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }
  if (password.length < 8 || password.length > 200) {
    return NextResponse.json({ error: "Password must be 8–200 characters" }, { status: 400 });
  }
  if (isDisposableEmail(email)) {
    return NextResponse.json({ error: "Please use a permanent email address" }, { status: 400 });
  }
  const emailRl = await rateLimit({ key: `register-email:${email}`, limit: 3, windowMs: 24 * 60 * 60 * 1000 });
  if (!emailRl.ok) {
    return NextResponse.json({ error: "Too many attempts for this email" }, {
      status: 429,
      headers: { "Retry-After": String(emailRl.retryAfter) },
    });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "Account already exists" }, { status: 409 });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { email, passwordHash, name } });
  return NextResponse.json({ ok: true });
}
