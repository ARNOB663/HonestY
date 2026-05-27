import { NextResponse } from "next/server";
import { dbConnect } from "../../../lib/mongodb";
import { rateLimit, clientIp } from "../../../lib/rateLimit";
import { checkOrigin } from "../../../lib/origin";
import Subscriber from "../../../models/Subscriber";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(req) {
  if (!checkOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });

  const rl = rateLimit({ key: `newsletter:${clientIp(req)}`, limit: 10, windowMs: 60 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts. Try again later." }, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfter) },
    });
  }

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  if (typeof body.website === "string" && body.website.trim() !== "") {
    return NextResponse.json({ ok: true }); // honeypot tripped
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }

  await dbConnect();
  // Idempotent: re-subscribing is a no-op, not an error.
  await Subscriber.updateOne(
    { email },
    { $setOnInsert: { email, source: "newsletter" } },
    { upsert: true }
  );
  return NextResponse.json({ ok: true });
}
