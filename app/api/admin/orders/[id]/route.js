import { withAdmin, httpError } from "../../../../../lib/withAdmin";
import { dbConnect } from "../../../../../lib/mongodb";
import Order from "../../../../../models/Order";

const STATUSES = ["pending", "paid", "fulfilled", "shipped", "delivered", "refunded", "cancelled"];

export const PATCH = withAdmin(async ({ body, params }) => {
  if (body.status && !STATUSES.includes(body.status)) throw httpError("Invalid status");
  await dbConnect();
  const order = await Order.findByIdAndUpdate(params.id, { status: body.status }, { new: true });
  if (!order) throw httpError("Not found", 404);
  return { ok: true };
});

export const DELETE = withAdmin(async ({ params }) => {
  await dbConnect();
  await Order.findByIdAndDelete(params.id);
  return { ok: true };
});
