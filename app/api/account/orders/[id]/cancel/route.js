import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../../../lib/auth";
import { prisma } from "../../../../../../lib/db";
import { checkOrigin } from "../../../../../../lib/origin";
import { rateLimit, clientIp } from "../../../../../../lib/rateLimit";
import { sendStatusUpdate } from "../../../../../../lib/mailer";

// User-initiated cancellation. Only allowed while the order is still in an
// early state (not yet packed/shipped).
const CANCELLABLE = new Set(["pending", "confirmed", "paid"]);

export async function POST(req, ctx) {
  if (!checkOrigin(req)) return NextResponse.json({ error: "Bad origin" }, { status: 403 });

  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const rl = await rateLimit({ key: `cancel:${clientIp(req)}`, limit: 10, windowMs: 10 * 60 * 1000 });
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many attempts" }, {
      status: 429,
      headers: { "Retry-After": String(rl.retryAfter) },
    });
  }

  const { id } = await ctx.params;
  // `id` is either the numeric SQL id OR the 6-char `code`. Try numeric first.
  const numId = Number(id);
  const where = Number.isFinite(numId)
    ? { id: numId }
    : { code: String(id).toUpperCase() };

  const email = session.user.email.toLowerCase();

  const cancelled = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirst({
      where: { ...where, userEmail: email },
      include: { items: true },
    });
    if (!order) return { error: "not_found" };
    if (!CANCELLABLE.has(order.status)) {
      return { error: "wrong_status", status: order.status };
    }
    // Mark cancelled.
    await tx.order.update({ where: { id: order.id }, data: { status: "cancelled" } });

    // Restock items.
    for (const item of order.items || []) {
      if (item.variantId) {
        await tx.productVariant.updateMany({
          where: { variantId: item.variantId },
          data: { inventory: { increment: item.qty } },
        });
      } else {
        await tx.product.updateMany({
          where: { slug: item.slug },
          data: { inventory: { increment: item.qty } },
        });
      }
    }

    // Release a discount usage slot if one was claimed.
    if (order.discountCode) {
      await tx.discount.updateMany({
        where: { code: order.discountCode, usedCount: { gt: 0 } },
        data: { usedCount: { decrement: 1 } },
      });
    }

    return { order };
  });

  if (cancelled.error === "not_found") {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }
  if (cancelled.error === "wrong_status") {
    return NextResponse.json(
      { error: `Cannot cancel an order in status "${cancelled.status}". Contact support.` },
      { status: 409 }
    );
  }

  sendStatusUpdate({ ...cancelled.order, status: "cancelled" }, "cancelled").catch(() => {});
  return NextResponse.json({ ok: true });
}
