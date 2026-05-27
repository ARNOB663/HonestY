import { withAdmin, httpError } from "../../../../../lib/withAdmin";
import { dbConnect } from "../../../../../lib/mongodb";
import Order from "../../../../../models/Order";
import { sendStatusUpdate } from "../../../../../lib/mailer";

const STATUSES = ["pending", "paid", "fulfilled", "shipped", "delivered", "refunded", "cancelled"];

export const PATCH = withAdmin(async ({ body, params, session }) => {
  const update = {};
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) throw httpError("Invalid status");
    update.status = body.status;
  }
  if (body.paymentVerified !== undefined) {
    update["payment.verified"] = !!body.paymentVerified;
  }
  if (body.adminNotes !== undefined) {
    update.adminNotes = String(body.adminNotes || "").slice(0, 2000);
  }
  if (body.refundAmount !== undefined) {
    const n = Number(body.refundAmount);
    update.refundAmount = Number.isFinite(n) && n >= 0 ? n : 0;
  }
  if (body.refundReason !== undefined) {
    update.refundReason = String(body.refundReason || "").slice(0, 500);
  }
  if (Object.keys(update).length === 0) throw httpError("Nothing to update");

  await dbConnect();
  const before = await Order.findById(params.id).lean();
  if (!before) throw httpError("Not found", 404);

  const ops = { $set: update };
  const statusChanged = update.status && update.status !== before.status;
  if (statusChanged) {
    ops.$push = { statusHistory: { status: update.status, at: new Date(), by: session?.user?.email } };
  }

  const order = await Order.findByIdAndUpdate(params.id, ops, { new: true });
  if (!order) throw httpError("Not found", 404);

  if (statusChanged) {
    sendStatusUpdate(order, update.status).catch(() => {});
  }

  return { ok: true };
});

export const DELETE = withAdmin(async ({ params }) => {
  await dbConnect();
  await Order.findByIdAndDelete(params.id);
  return { ok: true };
});
