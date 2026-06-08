import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../../lib/auth";
import { prisma } from "../../../../lib/db";

const PAGE_SIZE = 10;

export async function GET(req) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }
  const url = new URL(req.url);
  const page = Math.max(0, Math.floor(Number(url.searchParams.get("page")) || 0));

  const email = session.user.email.toLowerCase();
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where: { userEmail: email },
      orderBy: { createdAt: "desc" },
      skip: page * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { items: true },
    }),
    prisma.order.count({ where: { userEmail: email } }),
  ]);

  return NextResponse.json({
    orders: orders.map((o) => ({
      id: o.code || String(o.id),
      items: o.items || [],
      subtotal: o.subtotal,
      shipping: o.shipping,
      discountAmount: o.discountAmount,
      total: o.total,
      status: o.status,
      paymentMethod: o.paymentMethod,
      paymentVerified: !!o.paymentVerified,
      createdAt: o.createdAt,
    })),
    page,
    hasMore: (page + 1) * PAGE_SIZE < total,
    total,
  });
}
