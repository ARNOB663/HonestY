import { withAdmin, httpError } from "../../../../../lib/withAdmin";
import { dbConnect } from "../../../../../lib/mongodb";
import Review from "../../../../../models/Review";

const STATUSES = ["pending", "approved", "hidden", "spam"];

export const PATCH = withAdmin(async ({ body, params }) => {
  await dbConnect();
  const update = {};
  if (body.status) {
    if (!STATUSES.includes(body.status)) throw httpError("Invalid status");
    update.status = body.status;
  }
  if ("reply" in body) update.reply = String(body.reply || "").slice(0, 1000);
  const r = await Review.findByIdAndUpdate(params.id, update, { new: true });
  if (!r) throw httpError("Not found", 404);
  return { ok: true };
});

export const DELETE = withAdmin(async ({ params }) => {
  await dbConnect();
  await Review.findByIdAndDelete(params.id);
  return { ok: true };
});
