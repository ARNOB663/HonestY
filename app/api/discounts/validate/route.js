import { NextResponse } from "next/server";
import { dbConnect } from "../../../../lib/mongodb";
import Discount from "../../../../models/Discount";

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

  const code = String(body.code || "").trim().toUpperCase();
  const subtotal = Number(body.subtotal) || 0;
  if (!code) return NextResponse.json({ error: "Code is required" }, { status: 400 });

  await dbConnect();
  const d = await Discount.findOne({ code }).lean();
  const now = new Date();
  if (!d || !d.active) return NextResponse.json({ error: "Invalid code" }, { status: 404 });
  if (d.expiresAt && new Date(d.expiresAt) < now) return NextResponse.json({ error: "Code expired" }, { status: 410 });
  if (d.usageLimit && d.usedCount >= d.usageLimit) return NextResponse.json({ error: "Code fully redeemed" }, { status: 410 });
  if (subtotal < (d.minSubtotal || 0)) return NextResponse.json({ error: `Minimum subtotal ৳${d.minSubtotal}` }, { status: 400 });

  const v = Math.max(0, d.value);
  let discountAmount;
  if (d.type === "percent") {
    discountAmount = Math.round(((subtotal * Math.min(v, 100)) / 100) * 100) / 100;
  } else {
    discountAmount = Math.min(v, subtotal);
  }
  return NextResponse.json({ code: d.code, type: d.type, value: d.value, discountAmount });
}
