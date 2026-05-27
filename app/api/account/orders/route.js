import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { dbConnect } from "../../../../lib/mongodb";
import Order from "../../../../models/Order";

const PAGE_SIZE = 10;

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const url = new URL(req.url);
  const page = Math.max(0, Math.floor(Number(url.searchParams.get("page")) || 0));

  await dbConnect();
  const email = session.user.email.toLowerCase();
  const [orders, total] = await Promise.all([
    Order.find({ userEmail: email })
      .sort({ createdAt: -1 })
      .skip(page * PAGE_SIZE)
      .limit(PAGE_SIZE)
      .select("items subtotal shipping discountAmount total status payment.method payment.verified createdAt")
      .lean(),
    Order.countDocuments({ userEmail: email }),
  ]);

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: String(o._id),
      items: o.items || [],
      subtotal: o.subtotal,
      shipping: o.shipping,
      discountAmount: o.discountAmount,
      total: o.total,
      status: o.status,
      paymentMethod: o.payment?.method,
      paymentVerified: !!o.payment?.verified,
      createdAt: o.createdAt,
    })),
    page,
    hasMore: (page + 1) * PAGE_SIZE < total,
    total,
  });
}
