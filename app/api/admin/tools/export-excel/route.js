// Full database backup as an Excel workbook (.xlsx) with one sheet per table.
// Opens directly in Excel, Numbers, LibreOffice — universal format.
import { requireAdminApi } from "../../../../../lib/adminAuth";
import { prisma } from "../../../../../lib/db";
import * as XLSX from "xlsx";

// Flatten Prisma objects to plain values that Excel handles cleanly.
function flatten(rows) {
  return rows.map((r) => {
    const out = {};
    for (const [k, v] of Object.entries(r)) {
      if (v === null || v === undefined) out[k] = "";
      else if (v instanceof Date) out[k] = v.toISOString();
      else if (typeof v === "object") out[k] = JSON.stringify(v);
      else out[k] = v;
    }
    return out;
  });
}

export async function GET(req) {
  const auth = await requireAdminApi(req);
  if (auth.error) return auth.error;

  const [
    users, products, productVariants, orders, orderItems,
    categories, salesGroups, discounts, pages, settings,
    subscribers, stockAlerts, auditLogs, media,
  ] = await Promise.all([
    prisma.user.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.product.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.productVariant.findMany({ orderBy: { id: "asc" } }),
    prisma.order.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.orderItem.findMany({ orderBy: { id: "asc" } }),
    prisma.category.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.salesGroup.findMany({ orderBy: { sortOrder: "asc" } }),
    prisma.discount.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.page.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.settings.findMany(),
    prisma.subscriber.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.stockAlert.findMany({ orderBy: { createdAt: "asc" } }),
    prisma.auditLog.findMany({ orderBy: { createdAt: "desc" }, take: 5000 }),
    prisma.media.findMany({ orderBy: { createdAt: "asc" } }),
  ]);

  const wb = XLSX.utils.book_new();
  const sheets = [
    ["Users", users],
    ["Products", products],
    ["Product Variants", productVariants],
    ["Orders", orders],
    ["Order Items", orderItems],
    ["Categories", categories],
    ["Sales Groups", salesGroups],
    ["Discounts", discounts],
    ["Pages", pages],
    ["Settings", settings],
    ["Subscribers", subscribers],
    ["Stock Alerts", stockAlerts],
    ["Audit Log (last 5000)", auditLogs],
    ["Media", media],
  ];

  for (const [name, rows] of sheets) {
    const ws = XLSX.utils.json_to_sheet(flatten(rows));
    // Sheet names cannot exceed 31 chars in Excel.
    XLSX.utils.book_append_sheet(wb, ws, name.slice(0, 31));
  }

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  const date = new Date().toISOString().slice(0, 10);
  return new Response(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="honesty-backup-${date}.xlsx"`,
    },
  });
}
