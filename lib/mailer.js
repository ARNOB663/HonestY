import nodemailer from "nodemailer";
import { formatMoney } from "./format";
import { getBaseUrl } from "./baseUrl";

let _transporter = null;
function transporter() {
  if (_transporter) return _transporter;
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, ""); // Gmail App Password may include spaces
  if (!host || !user || !pass) return null;
  _transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return _transporter;
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

const FROM = process.env.SMTP_FROM || process.env.SMTP_USER;
const BRAND = process.env.NEXT_PUBLIC_STORE_NAME || "Honesty";

async function send({ to, subject, html, text }) {
  const t = transporter();
  if (!t || !to) return { ok: false, skipped: true };
  try {
    await t.sendMail({ from: FROM, to, subject, html, text });
    return { ok: true };
  } catch (e) {
    console.warn("[mailer] send failed:", e.message);
    return { ok: false, error: e.message };
  }
}

function layout(title, bodyHtml) {
  return `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,sans-serif;background:#fafaf7;margin:0;padding:24px;color:#1a2b4a;">
<div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e8e4d8;border-radius:8px;overflow:hidden;">
  <div style="background:#1a2b4a;color:#fff;padding:18px 24px;font-weight:700;letter-spacing:1px;">${esc(BRAND)}</div>
  <div style="padding:24px;">
    <h1 style="font-size:18px;margin:0 0 16px;">${esc(title)}</h1>
    ${bodyHtml}
  </div>
  <div style="padding:16px 24px;background:#fafaf7;color:#888;font-size:12px;border-top:1px solid #e8e4d8;">
    You're receiving this because an order was placed at ${esc(BRAND)}.
  </div>
</div>
</body></html>`;
}

function itemsTable(items, totals) {
  const rows = (items || []).map((i) =>
    `<tr><td style="padding:6px 0;border-bottom:1px solid #f0eee5;">${esc(i.title)} × ${i.qty}</td><td style="padding:6px 0;border-bottom:1px solid #f0eee5;text-align:right;">${formatMoney((i.price || 0) * (i.qty || 1))}</td></tr>`
  ).join("");
  const disc = totals.discountAmount > 0
    ? `<tr><td style="padding:4px 0;color:#16a34a;">Discount${totals.discountCode ? ` (${esc(totals.discountCode)})` : ""}</td><td style="padding:4px 0;text-align:right;color:#16a34a;">−${formatMoney(totals.discountAmount)}</td></tr>`
    : "";
  return `
  <table style="width:100%;border-collapse:collapse;font-size:14px;margin-top:8px;">
    <tbody>${rows}</tbody>
    <tfoot>
      <tr><td style="padding-top:10px;color:#888;">Subtotal</td><td style="padding-top:10px;text-align:right;">${formatMoney(totals.subtotal)}</td></tr>
      ${disc}
      <tr><td style="padding:4px 0;color:#888;">Shipping</td><td style="padding:4px 0;text-align:right;">${totals.shipping === 0 ? "Free" : formatMoney(totals.shipping)}</td></tr>
      <tr><td style="padding-top:8px;font-weight:700;border-top:1px solid #e8e4d8;">Total</td><td style="padding-top:8px;text-align:right;font-weight:700;border-top:1px solid #e8e4d8;color:#b8553a;">${formatMoney(totals.total)}</td></tr>
    </tfoot>
  </table>`;
}

export async function sendOrderConfirmation(order) {
  const short = String(order._id).slice(-6);
  const addr = order.shippingAddress || {};
  const pay = order.payment || {};
  const payLine = pay.method === "cod"
    ? "Pay on delivery (Cash)."
    : `Paid via ${pay.method?.toUpperCase()} — TrxID <code>${esc(pay.txnId)}</code>. We'll verify shortly.`;
  const trackUrl = `${getBaseUrl()}/track?id=${order._id}`;
  const body = `
    <p>Thanks ${esc(addr.name || "")}, your order <strong>#${short}</strong> is in.</p>
    <p style="color:#666;font-size:14px;">${payLine}</p>
    ${itemsTable(order.items, order)}
    <p style="margin-top:20px;font-size:14px;"><strong>Ship to:</strong><br>${esc(addr.name)}<br>${esc(addr.line1)}<br>${esc(addr.city)}, ${esc(addr.state)} ${esc(addr.zip)}<br>${esc(addr.phone)}</p>
    <p style="margin-top:24px;"><a href="${esc(trackUrl)}" style="background:#1a2b4a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:4px;font-weight:700;font-size:14px;">Track your order</a></p>
  `;
  return send({
    to: order.userEmail,
    subject: `Order #${short} confirmed — ${BRAND}`,
    html: layout(`Order confirmed`, body),
    text: `Thanks for your order #${short}. Total ${formatMoney(order.total)}. Track: ${trackUrl}`,
  });
}

const STATUS_COPY = {
  paid: { title: "Payment received", line: "Your payment is confirmed. We're preparing your order." },
  fulfilled: { title: "Order packed", line: "Your order has been packed and is awaiting pickup by the courier." },
  shipped: { title: "Order shipped", line: "Your order is on the way." },
  delivered: { title: "Order delivered", line: "Your order has been delivered. Enjoy!" },
  cancelled: { title: "Order cancelled", line: "Your order has been cancelled. If this is unexpected, please reply to this email." },
  refunded: { title: "Refund issued", line: "We've issued a refund for your order." },
};

export async function sendBackInStock({ to, productTitle, productUrl }) {
  const body = `
    <p><strong>${esc(productTitle)}</strong> is back in stock!</p>
    <p style="color:#666;font-size:14px;">Get it before it sells out again.</p>
    <p style="margin-top:24px;"><a href="${esc(productUrl)}" style="background:#1a2b4a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:4px;font-weight:700;font-size:14px;">Shop now</a></p>
  `;
  return send({
    to,
    subject: `Back in stock: ${productTitle}`,
    html: layout("Back in stock", body),
    text: `${productTitle} is back in stock. ${productUrl}`,
  });
}

export async function sendCustomMessage({ to, subject, message, order }) {
  const short = order ? String(order._id).slice(-6) : "";
  const lines = String(message).split(/\n+/).map((p) => `<p>${esc(p)}</p>`).join("");
  const body = `
    ${lines}
    ${order ? `<p style="margin-top:18px;color:#888;font-size:12px;">Regarding order <strong>#${short}</strong></p>` : ""}
  `;
  return send({
    to,
    subject,
    html: layout(subject, body),
    text: message,
  });
}

export async function sendPasswordReset({ to, resetUrl }) {
  const body = `
    <p>You requested a password reset for your ${esc(BRAND)} account.</p>
    <p style="margin-top:12px;">Click the button below to choose a new password. This link expires in 1 hour.</p>
    <p style="margin-top:24px;"><a href="${esc(resetUrl)}" style="background:#1a2b4a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:4px;font-weight:700;font-size:14px;">Reset password</a></p>
    <p style="margin-top:20px;color:#888;font-size:12px;">If you didn't request this, you can safely ignore this email.</p>
  `;
  return send({
    to,
    subject: `Reset your ${BRAND} password`,
    html: layout("Reset your password", body),
    text: `Reset your password: ${resetUrl} (expires in 1 hour). If you didn't request this, ignore.`,
  });
}

export async function sendStatusUpdate(order, status) {
  const copy = STATUS_COPY[status];
  if (!copy) return { ok: false, skipped: true };
  const short = String(order._id).slice(-6);
  const trackUrl = `${getBaseUrl()}/track?id=${order._id}`;
  const body = `
    <p>${esc(copy.line)}</p>
    <p style="color:#666;font-size:14px;">Order <strong>#${short}</strong> · Total ${formatMoney(order.total)}</p>
    <p style="margin-top:24px;"><a href="${esc(trackUrl)}" style="background:#1a2b4a;color:#fff;text-decoration:none;padding:10px 20px;border-radius:4px;font-weight:700;font-size:14px;">View order</a></p>
  `;
  return send({
    to: order.userEmail,
    subject: `${copy.title} — Order #${short}`,
    html: layout(copy.title, body),
    text: `${copy.line} Order #${short}. ${trackUrl}`,
  });
}
