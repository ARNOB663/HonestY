// Shipping labels CSV for the courier. Includes every order in
// "confirmed / paid / fulfilled" status (i.e. ready to ship, not yet shipped).
// Format: one row per parcel, in the column order most BD couriers expect
// (Pathao, Steadfast, RedX accept the same template).
import { requireAdminApi } from "../../../../../lib/adminAuth";
import { prisma } from "../../../../../lib/db";

function csv(v) {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req) {
  const auth = await requireAdminApi(req);
  if (auth.error) return auth.error;

  const orders = await prisma.order.findMany({
    where: { status: { in: ["confirmed", "paid", "fulfilled"] } },
    orderBy: { createdAt: "asc" },
  });

  const headers = [
    "Order ID", "Recipient Name", "Recipient Phone", "Recipient Address",
    "City", "Area / District", "Country",
    "COD Amount (BDT)", "Item Description", "Order Date",
  ];
  const rows = [headers.join(",")];
  for (const o of orders) {
    const cod = o.paymentMethod === "cod" ? o.total : 0;
    rows.push([
      o.code || String(o.id),
      o.shipName,
      o.shipPhone,
      o.shipLine1,
      o.shipCity,
      o.shipState,
      o.shipCountry || "Bangladesh",
      cod,
      `Order ${o.code || o.id}`,
      o.createdAt?.toISOString?.().slice(0, 10) || "",
    ].map(csv).join(","));
  }
  const date = new Date().toISOString().slice(0, 10);
  return new Response(rows.join("\r\n"), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="shipping-labels-${date}.csv"`,
    },
  });
}
