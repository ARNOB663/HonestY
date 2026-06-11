import { requireAdminApi } from "../../../../../lib/adminAuth";
import { prisma } from "../../../../../lib/db";

function csvCell(v) {
  if (v === null || v === undefined) return "";
  let s = String(v);
  // Neutralize spreadsheet formula injection: subscriber emails are
  // user-controlled and could start with = + - @.
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export async function GET(req) {
  const auth = await requireAdminApi(req);
  if (auth.error) return auth.error;

  const subs = await prisma.subscriber.findMany({ orderBy: { createdAt: "desc" } });
  const rows = ["email,source,subscribedAt"];
  for (const s of subs) {
    rows.push([s.email, s.source, s.createdAt?.toISOString?.() || ""].map(csvCell).join(","));
  }
  const csv = rows.join("\r\n");
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  });
}
