import { requireAdminApi } from "../../../../../lib/adminAuth";
import { dbConnect } from "../../../../../lib/mongodb";
import Order from "../../../../../models/Order";

function csvCell(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function safeRegex(s) {
  return new RegExp(s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
}

export async function GET(req) {
  const auth = await requireAdminApi(req);
  if (auth.error) return auth.error;

  const url = new URL(req.url);
  const filter = {};
  const status = url.searchParams.get("status");
  const q = url.searchParams.get("q");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");
  if (status) filter.status = status;
  if (q) {
    const re = safeRegex(q);
    filter.$or = [
      { userEmail: re },
      { "shippingAddress.name": re },
      { "shippingAddress.phone": re },
      { "payment.txnId": new RegExp(q.toUpperCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
    ];
  }
  if (from || to) {
    filter.createdAt = {};
    if (from) filter.createdAt.$gte = new Date(from);
    if (to) {
      const d = new Date(to);
      d.setDate(d.getDate() + 1);
      filter.createdAt.$lt = d;
    }
  }

  await dbConnect();
  const orders = await Order.find(filter).sort({ createdAt: -1 }).limit(5000).lean();

  const headers = [
    "id", "createdAt", "status", "email", "name", "phone",
    "address", "city", "state", "zip",
    "paymentMethod", "paymentVerified", "txnId", "payerNumber",
    "items", "subtotal", "shipping", "discountCode", "discountAmount", "total",
  ];
  const rows = [headers.join(",")];
  for (const o of orders) {
    const a = o.shippingAddress || {};
    const p = o.payment || {};
    const itemsStr = (o.items || []).map((i) => `${i.qty}× ${i.title}`).join(" | ");
    rows.push([
      String(o._id),
      o.createdAt?.toISOString?.() || "",
      o.status,
      o.userEmail,
      a.name,
      a.phone,
      a.line1,
      a.city,
      a.state,
      a.zip,
      p.method,
      p.verified ? "yes" : "no",
      p.txnId,
      p.payerNumber,
      itemsStr,
      o.subtotal,
      o.shipping,
      o.discountCode,
      o.discountAmount,
      o.total,
    ].map(csvCell).join(","));
  }

  const csv = rows.join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
