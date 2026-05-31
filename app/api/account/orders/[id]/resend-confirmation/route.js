import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "../../../../../../lib/auth";
import { dbConnect } from "../../../../../../lib/mongodb";
import { checkOrigin } from "../../../../../../lib/origin";
import { rateLimit, clientIp } from "../../../../../../lib/rateLimit";
import Order from "../../../../../../models/Order";
import { sendOrderConfirmation } from "../../../../../../lib/mailer";

// Re-send the order confirmation email for an order the user owns. Rate-limited
// per IP so abuse can't flood the customer's inbox.
export async function POST(req, ctx) {
  if (!checkOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const rl = await rateLimit({ key: `resend:${clientIp(req)}`, limit: 5, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json(
      { error: "Too many requests. Try again shortly." },
      { status: 429, headers: { "Retry-After": String(rl.retryAfter) } }
    );
  }

  const { id } = await ctx.params;
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  await dbConnect();
  const order = await Order.findOne({
    _id: id,
    userEmail: session.user.email.toLowerCase(),
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  try {
    await sendOrderConfirmation(order);
  } catch (e) {
    return NextResponse.json({ error: "Could not send email — please try again later." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
