import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { dbConnect } from "../../../lib/mongodb";
import User from "../../../models/User";
import { rateLimit, clientIp } from "../../../lib/rateLimit";
import { checkOrigin } from "../../../lib/origin";

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

  // Honeypot: real users never fill this hidden field. Pretend success so bots
  // don't learn they were filtered.
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

  await dbConnect();
  const existing = await User.findOne({ email });
  if (existing) {
    return NextResponse.json({ error: "Account already exists" }, { status: 409 });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  // Explicit destructure — do NOT spread `body`, to avoid role/tokenVersion mass-assignment.
  await User.create({ email, passwordHash, name });
  return NextResponse.json({ ok: true });
}
