import { withAdmin, httpError } from "../../../../../../lib/withAdmin";
import { prisma } from "../../../../../../lib/db";
import { sendCustomMessage } from "../../../../../../lib/mailer";

export const POST = withAdmin(async ({ body, params }) => {
  const subject = String(body.subject || "").trim().slice(0, 200);
  const message = String(body.message || "").trim().slice(0, 5000);
  if (!subject) throw httpError("Subject is required");
  if (!message) throw httpError("Message is required");

  // Accept either numeric id or 6-char `code`.
  const numId = Number(params.id);
  const where = Number.isFinite(numId)
    ? { id: numId }
    : { code: String(params.id).toUpperCase() };

  const order = await prisma.order.findFirst({ where, include: { items: true } });
  if (!order) throw httpError("Order not found", 404);

  const result = await sendCustomMessage({
    to: order.userEmail,
    subject,
    message,
    order,
  });
  if (!result.ok && !result.skipped) {
    throw httpError(result.error || "Failed to send", 500);
  }
  return { ok: true, skipped: !!result.skipped };
});
