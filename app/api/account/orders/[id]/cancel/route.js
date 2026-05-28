import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import { authOptions } from "../../../../../../lib/auth";
import { dbConnect } from "../../../../../../lib/mongodb";
import { checkOrigin } from "../../../../../../lib/origin";
import { rateLimit, clientIp } from "../../../../../../lib/rateLimit";
import Order from "../../../../../../models/Order";
import Product from "../../../../../../models/Product";
import Discount from "../../../../../../models/Discount";
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
  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  await dbConnect();

  // Atomically move from cancellable status to "cancelled". Returns null if
  // somebody else (admin) already changed status or the order isn't yours.
  const cancelled = await Order.findOneAndUpdate(
    { _id: id, userEmail: session.user.email.toLowerCase(), status: { $in: [...CANCELLABLE] } },
    { $set: { status: "cancelled" } },
    { new: true }
  );

  if (!cancelled) {
    const exists = await Order.findOne({ _id: id, userEmail: session.user.email.toLowerCase() })
      .select("status")
      .lean();
    if (!exists) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    return NextResponse.json({ error: `Cannot cancel an order in status "${exists.status}". Contact support.` }, { status: 409 });
  }

  // Restock items.
  for (const item of cancelled.items || []) {
    if (item.variantId) {
      await Product.updateOne(
        { slug: item.slug, "variants.id": item.variantId },
        { $inc: { "variants.$.inventory": item.qty } }
      );
    } else {
      await Product.updateOne({ slug: item.slug }, { $inc: { inventory: item.qty } });
    }
  }

  // Release a discount usage slot if one was claimed.
  if (cancelled.discountCode) {
    await Discount.updateOne(
      { code: cancelled.discountCode, usedCount: { $gt: 0 } },
      { $inc: { usedCount: -1 } }
    );
  }

  sendStatusUpdate(cancelled, "cancelled").catch(() => {});

  return NextResponse.json({ ok: true });
}
