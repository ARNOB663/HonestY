// Sends a test email using the SMTP creds in .env.local.
// Run with: node scripts/testEmail.js [to-address]
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config({ path: ".env.local" });

const to = process.argv[2] || process.env.SMTP_USER;
const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT) || 465;
const user = process.env.SMTP_USER;
const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");
const from = process.env.SMTP_FROM || user;
const brand = process.env.NEXT_PUBLIC_STORE_NAME || "Honesty";

console.log(`[test] host=${host} port=${port} user=${user} pass=${pass ? `set (${pass.length} chars)` : "MISSING"}`);

if (!host || !user || !pass) {
  console.error("[test] ❌ SMTP_HOST / SMTP_USER / SMTP_PASS missing in .env.local");
  process.exit(2);
}
if (!to) {
  console.error("[test] ❌ no recipient");
  process.exit(1);
}

const t = nodemailer.createTransport({ host, port, secure: port === 465, auth: { user, pass } });

console.log("[test] verifying SMTP connection…");
try {
  await t.verify();
  console.log("[test] ✅ SMTP server accepts our credentials");
} catch (e) {
  console.error("[test] ❌ verify failed:", e.message);
  process.exit(3);
}

console.log(`[test] sending test message to ${to}…`);
try {
  const info = await t.sendMail({
    from,
    to,
    subject: `${brand} — SMTP test`,
    text: `If you can read this, ${brand} email is working. Sent at ${new Date().toISOString()}.`,
    html: `<p>If you can read this, <strong>${brand}</strong> email is working.</p><p style="color:#888;font-size:12px;">Sent at ${new Date().toISOString()}.</p>`,
  });
  console.log("[test] ✅ sent. messageId:", info.messageId);
  console.log("[test] check your inbox (and spam folder).");
} catch (e) {
  console.error("[test] ❌ send failed:", e.message);
  process.exit(4);
}
