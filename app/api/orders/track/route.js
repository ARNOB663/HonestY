import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { dbConnect } from "../../../../lib/mongodb";
import Order from "../../../../models/Order";

export async function GET(req) {
  const url = new URL(req.url);
  const id = (url.searchParams.get("id") || "").trim();
  const email = (url.searchParams.get("email") || "").trim().toLowerCase();
  if (!id || !email) return NextResponse.json({ error: "id and email required" }, { status: 400 });
  if (!mongoose.isValidObjectId(id)) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  await dbConnect();
  const order = await Order.findOne({ _id: id, userEmail: email })
    .select("_id status items subtotal shipping discountCode discountAmount total createdAt")
    .lean();
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ order: { ...order, _id: String(order._id) } });
}
