import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../../lib/auth";
import { prisma } from "../../../../../../lib/db";
import { checkOrigin } from "../../../../../../lib/origin";
import { rateLimit, clientIp } from "../../../../../../lib/rateLimit";
import { sendOrderConfirmation } from "../../../../../../lib/mailer";

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
  const numId = Number(id);
  const where = Number.isFinite(numId)
    ? { id: numId }
    : { code: String(id).toUpperCase() };

  const order = await prisma.order.findFirst({
    where: { ...where, userEmail: session.user.email.toLowerCase() },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  try {
    await sendOrderConfirmation(order);
  } catch (e) {
    return NextResponse.json({ error: "Could not send email — please try again later." }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}
