// Sends a test email to the currently signed-in admin to verify SMTP is
// configured correctly. Saves debugging time when emails "aren't arriving" —
// you find out instantly whether the problem is SMTP credentials or something
// downstream (Gmail filtering, customer's spam folder, etc).
import { withAdmin } from "../../../../../lib/withAdmin";
import nodemailer from "nodemailer";

export const POST = withAdmin(async ({ session }) => {
  const to = session?.user?.email;
  if (!to) return { ok: false, error: "No admin email on session" };

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 465;
  const user = process.env.SMTP_USER;
  const pass = (process.env.SMTP_PASS || "").replace(/\s+/g, "");
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass) {
    return {
      ok: false,
      error: "SMTP env vars not set. Need SMTP_HOST, SMTP_USER, SMTP_PASS.",
      config: { host: !!host, user: !!user, pass: !!pass, from: !!from },
    };
  }

  const transporter = nodemailer.createTransport({
    host, port, secure: port === 465,
    auth: { user, pass },
  });

  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject: "Honesty admin — test email",
      text: `This is a test email from your Honesty admin panel.\n\nSent at: ${new Date().toISOString()}\nSMTP host: ${host}:${port}\nFrom: ${from}\nTo: ${to}\n\nIf you got this, your SMTP setup works.`,
      html: `
        <h2>Test email from Honesty admin</h2>
        <p>If you got this, your SMTP setup works.</p>
        <table style="font-family:monospace;font-size:13px;border-collapse:collapse;">
          <tr><td style="padding:4px 12px;color:#888;">Sent at</td><td>${new Date().toISOString()}</td></tr>
          <tr><td style="padding:4px 12px;color:#888;">SMTP host</td><td>${host}:${port}</td></tr>
          <tr><td style="padding:4px 12px;color:#888;">From</td><td>${from}</td></tr>
          <tr><td style="padding:4px 12px;color:#888;">To</td><td>${to}</td></tr>
        </table>
      `,
    });
    return { ok: true, messageId: info.messageId, to };
  } catch (e) {
    return { ok: false, error: e.message };
  }
});
