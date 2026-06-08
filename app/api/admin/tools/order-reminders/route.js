// Email customers whose orders are stuck pending for >24 hours.
// Common cause: prepaid order placed without TrxID, or admin forgot to confirm.
//
// Returns: { ok, sent, skipped }
import { withAdmin } from "../../../../../lib/withAdmin";
import { prisma } from "../../../../../lib/db";
import { sendCustomMessage } from "../../../../../lib/mailer";

const PENDING_AFTER_MS = 24 * 60 * 60 * 1000;

export const POST = withAdmin(async () => {
  const cutoff = new Date(Date.now() - PENDING_AFTER_MS);
  const stale = await prisma.order.findMany({
    where: { status: "pending", createdAt: { lt: cutoff } },
    include: { items: true },
  });

  let sent = 0;
  let skipped = 0;
  for (const o of stale) {
    if (!o.userEmail) { skipped++; continue; }
    const code = o.code || String(o.id);
    const result = await sendCustomMessage({
      to: o.userEmail,
      subject: `Quick check on your order #${code}`,
      message: `Hi,\n\nWe noticed your order #${code} is still pending confirmation. If you placed it via bKash or Nagad, please make sure you sent the payment and we got the TrxID.\n\nReply to this email if you need help — we're happy to sort it out.\n\nThanks,\nHonesty team`,
      order: o,
    });
    if (result.ok || result.skipped) sent++;
    else skipped++;
  }
  return { ok: true, scanned: stale.length, sent, skipped };
});
