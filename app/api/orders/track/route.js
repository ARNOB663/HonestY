import { NextResponse } from "next/server";
import { prisma } from "../../../../lib/db";

export async function GET(req) {
  const url = new URL(req.url);
  const id = (url.searchParams.get("id") || "").trim();
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  if (!id || !email) return NextResponse.json({ error: "id and email required" }, { status: 400 });

  // `id` is either the numeric SQL id OR the 6-char `code`.
  const numId = Number(id);
  const where = Number.isFinite(numId) ? { id: numId } : { code: String(id).toUpperCase() };

  const order = await prisma.order.findFirst({
    where: { ...where, userEmail: email },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  // Whitelist the response — the full row carries internal-only data
  // (adminNotes, per-item costPrice, statusHistory with staff emails).
  return NextResponse.json({
    order: {
      _id: order.code || String(order.id),
      status: order.status,
      createdAt: order.createdAt,
      subtotal: order.subtotal,
      shipping: order.shipping,
      discountCode: order.discountCode,
      discountAmount: order.discountAmount,
      total: order.total,
      paymentMethod: order.paymentMethod,
      items: (order.items || []).map((it) => ({
        title: it.title,
        variantName: it.variantName,
        qty: it.qty,
        price: it.price,
        image: it.image,
      })),
    },
  });
}
