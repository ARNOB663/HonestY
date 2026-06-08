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
  return NextResponse.json({
    order: {
      ...order,
      _id: order.code || String(order.id),
    },
  });
}
