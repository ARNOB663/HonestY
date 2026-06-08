import { revalidateTag } from "next/cache";
import { withAdmin, httpError } from "../../../../../lib/withAdmin";
import { prisma } from "../../../../../lib/db";
import { sendStatusUpdate } from "../../../../../lib/mailer";

const STATUSES = ["pending", "confirmed", "paid", "fulfilled", "shipped", "delivered", "refunded", "cancelled"];

// `id` can be either the numeric SQL primary key OR the 6-char public order
// `code` (preserved from the Mongo migration). Returns the matching order's
// internal `id` for downstream queries.
async function resolveOrderId(rawId) {
  const numId = Number(rawId);
  if (Number.isFinite(numId)) {
    const o = await prisma.order.findUnique({ where: { id: numId }, select: { id: true } });
    if (o) return o.id;
  }
  const o = await prisma.order.findUnique({
    where: { code: String(rawId).toUpperCase() },
    select: { id: true },
  });
  return o?.id ?? null;
}

export const PATCH = withAdmin(async ({ body, params, session }) => {
  const id = await resolveOrderId(params.id);
  if (id === null) throw httpError("Order not found", 404);

  const update = {};
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) throw httpError("Invalid status");
    update.status = body.status;
  }
  if (body.paymentVerified !== undefined) {
    update.paymentVerified = !!body.paymentVerified;
  }
  if (body.adminNotes !== undefined) {
    update.adminNotes = String(body.adminNotes || "").slice(0, 2000);
  }
  let pendingRefund;
  if (body.refundAmount !== undefined) {
    const n = Number(body.refundAmount);
    pendingRefund = Number.isFinite(n) && n >= 0 ? n : 0;
  }
  if (body.refundReason !== undefined) {
    update.refundReason = String(body.refundReason || "").slice(0, 500);
  }
  if (Object.keys(update).length === 0 && pendingRefund === undefined) throw httpError("Nothing to update");

  const before = await prisma.order.findUnique({ where: { id }, include: { items: true } });
  if (!before) throw httpError("Not found", 404);

  if (pendingRefund !== undefined) {
    if (pendingRefund > before.total) {
      throw httpError(`Refund cannot exceed order total (${before.total})`);
    }
    update.refundAmount = Math.round(pendingRefund * 100) / 100;
  }

  const statusChanged = update.status && update.status !== before.status;
  if (statusChanged) {
    const hist = Array.isArray(before.statusHistory) ? before.statusHistory : [];
    update.statusHistory = [...hist, { status: update.status, at: new Date().toISOString(), by: session?.user?.email }];
  }

  const order = await prisma.order.update({
    where: { id },
    data: update,
    include: { items: true },
  });

  if (statusChanged) {
    sendStatusUpdate(order, update.status).catch(() => {});
  }
  try { revalidateTag("admin-dashboard"); revalidateTag("admin-orders"); revalidateTag("admin-customers"); } catch {}

  return { ok: true };
});

export const DELETE = withAdmin(async ({ params }) => {
  const id = await resolveOrderId(params.id);
  if (id === null) throw httpError("Order not found", 404);
  await prisma.order.delete({ where: { id } });
  try { revalidateTag("admin-dashboard"); revalidateTag("admin-orders"); revalidateTag("admin-customers"); } catch {}
  return { ok: true };
});
