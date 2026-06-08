// Send a custom email to every subscriber. Throttled to avoid Gmail's
// per-second cap (Gmail SMTP allows ~100/sec but practical safe = 5/sec).
//
// Body: { subject, message }
// Returns: { ok, sent, failed }
import { withAdmin, httpError } from "../../../../../lib/withAdmin";
import { prisma } from "../../../../../lib/db";
import nodemailer from "nodemailer";

const SMTP_HOST = process.env.SMTP_HOST;
const SMTP_PORT = Number(process.env.SMTP_PORT) || 465;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = (process.env.SMTP_PASS || "").replace(/\s+/g, "");
const FROM = process.env.SMTP_FROM || SMTP_USER;
const BRAND = process.env.NEXT_PUBLIC_STORE_NAME || "Honesty";

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

async function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

export const POST = withAdmin(async ({ body }) => {
  const subject = String(body.subject || "").trim().slice(0, 200);
  const message = String(body.message || "").trim().slice(0, 10000);
  if (!subject) throw httpError("Subject is required");
  if (!message) throw httpError("Message is required");
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    throw httpError("SMTP env vars missing");
  }

  const subs = await prisma.subscriber.findMany({ select: { email: true } });
  if (subs.length === 0) return { ok: true, sent: 0, failed: 0 };

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST, port: SMTP_PORT, secure: SMTP_PORT === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  const html = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,sans-serif;background:#fafaf7;margin:0;padding:24px;color:#1a2b4a;">
<div style="max-width:600px;margin:0 auto;background:#fff;border:1px solid #e8e4d8;border-radius:8px;overflow:hidden;">
  <div style="background:#1a2b4a;color:#fff;padding:18px 24px;font-weight:700;letter-spacing:1px;">${esc(BRAND)}</div>
  <div style="padding:24px;font-size:14px;line-height:1.6;">${String(message).split(/\n+/).map((p) => `<p>${esc(p)}</p>`).join("")}</div>
  <div style="padding:16px 24px;background:#fafaf7;color:#888;font-size:11px;border-top:1px solid #e8e4d8;">You're receiving this because you signed up at ${esc(BRAND)}.</div>
</div></body></html>`;

  const text = message;

  let sent = 0;
  let failed = 0;
  // ~5 emails per second pace.
  for (const s of subs) {
    try {
      await transporter.sendMail({ from: FROM, to: s.email, subject, html, text });
      sent++;
    } catch {
      failed++;
    }
    await sleep(200);
  }
  return { ok: true, sent, failed, total: subs.length };
});
