import { requireAdminApi } from "../../../../../lib/adminAuth";
import { prisma } from "../../../../../lib/db";

function csvCell(v) {
  if (v === null || v === undefined) return "";
  let s = String(v);
  // Neutralize spreadsheet formula injection: customer-controlled fields
  // (name, address, email) could start with = + - @ and execute when the
  // CSV is opened in Excel/LibreOffice.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req) {
  const auth = await requireAdminApi(req);
  if (auth.error) return auth.error;

  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const q = url.searchParams.get("q");
  const from = url.searchParams.get("from");
  const to = url.searchParams.get("to");

  const where = {};
  if (status) where.status = status;
  if (q) {
    const qLower = q.toLowerCase();
    const qUpper = q.toUpperCase();
    where.OR = [
      { userEmail: { contains: qLower } },
      { shipName: { contains: qLower } },
      { shipPhone: { contains: qLower } },
      { paymentTxnId: { contains: qUpper } },
    ];
  }
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) {
      const d = new Date(to);
      d.setDate(d.getDate() + 1);
      where.createdAt.lt = d;
    }
  }

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: { items: true },
  });

  const headers = [
    "id", "createdAt", "status", "email", "name", "phone",
    "address", "city", "state",
    "paymentMethod", "paymentVerified", "txnId", "payerNumber",
    "items", "subtotal", "shipping", "discountCode", "discountAmount", "total",
  ];
  const rows = [headers.join(",")];
  for (const o of orders) {
    const itemsStr = (o.items || []).map((i) => `${i.qty}× ${i.title}`).join(" | ");
    rows.push([
      o.code || String(o.id),
      o.createdAt?.toISOString?.() || "",
      o.status,
      o.userEmail,
      o.shipName,
      o.shipPhone,
      o.shipLine1,
      o.shipCity,
      o.shipState,
      o.paymentMethod,
      o.paymentVerified ? "yes" : "no",
      o.paymentTxnId,
      o.paymentPayer,
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
