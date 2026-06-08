// Email the admin a list of all products at or below a stock threshold.
// Use as an ad-hoc check or set it as a cron job in cPanel later.
//
// Body: { threshold?: 5 }
import { withAdmin } from "../../../../../lib/withAdmin";
import { prisma } from "../../../../../lib/db";
import nodemailer from "nodemailer";

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

export const POST = withAdmin(async ({ body, session }) => {
  const threshold = Math.max(0, Number(body.threshold) || 5);
  const products = await prisma.product.findMany({
    where: { inventory: { lte: threshold } },
    select: { slug: true, title: true, inventory: true, collection: true },
    orderBy: { inventory: "asc" },
  });

  const to = session?.user?.email;
  if (!to) return { ok: false, error: "No admin email on session" };

  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");
  if (!host || !user || !pass) {
    return { ok: false, error: "SMTP env vars not set", products: products.length };
  }

  if (products.length === 0) {
    return { ok: true, sent: false, message: "No low-stock products — nothing to email." };
  }

  const rows = products.map((p) =>
    `<tr><td style="padding:6px 12px;">${esc(p.title)}</td><td style="padding:6px 12px;color:#888;">${esc(p.collection || "—")}</td><td style="padding:6px 12px;text-align:right;font-weight:700;color:${p.inventory <= 0 ? "#c00" : "#a60"};">${p.inventory}</td></tr>`
  ).join("");

  const html = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,sans-serif;background:#fafaf7;padding:24px;color:#1a2b4a;">
  <div style="max-width:640px;margin:0 auto;background:#fff;border:1px solid #e8e4d8;border-radius:8px;overflow:hidden;">
    <div style="background:#1a2b4a;color:#fff;padding:16px 20px;font-weight:700;">Low stock report</div>
    <div style="padding:20px;font-size:14px;">
      <p>${products.length} product${products.length === 1 ? "" : "s"} at or below ${threshold} units:</p>
      <table style="width:100%;border-collapse:collapse;margin-top:12px;font-size:13px;">
        <thead><tr style="background:#fafaf7;text-align:left;"><th style="padding:6px 12px;">Product</th><th style="padding:6px 12px;">Category</th><th style="padding:6px 12px;text-align:right;">Stock</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  </div></body></html>`;

  const port = Number(process.env.SMTP_PORT) || 465;
  const transporter = nodemailer.createTransport({
    host, port, secure: port === 465, auth: { user, pass },
  });
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || user,
      to,
      subject: `Low stock: ${products.length} product${products.length === 1 ? "" : "s"} need restocking`,
      html,
    });
    return { ok: true, sent: true, products: products.length, to };
  } catch (e) {
    return { ok: false, error: e.message, products: products.length };
  }
});
