import { withAdmin, httpError } from "../../../../../lib/withAdmin";
import { dbConnect } from "../../../../../lib/mongodb";
import Discount from "../../../../../models/Discount";

const ALLOWED = ["active", "value", "minSubtotal", "usageLimit", "expiresAt"];

export const PATCH = withAdmin(async ({ body, params }) => {
  await dbConnect();
  const existing = await Discount.findById(params.id).lean();
  if (!existing) throw httpError("Not found", 404);

  const update = {};
  for (const key of ALLOWED) {
    if (!(key in body)) continue;
    if (key === "active") update.active = !!body.active;
    else if (key === "expiresAt") update.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;
    else {
      const n = Number(body[key]);
      if (!Number.isFinite(n) || n < 0) throw httpError(`${key} must be a non-negative number`);
      if (key === "value" && existing.type === "percent" && n > 100) {
        throw httpError("percent value must be ≤ 100");
      }
      update[key] = key === "usageLimit" ? Math.floor(n) : n;
    }
  }

  await Discount.findByIdAndUpdate(params.id, update);
  return { ok: true };
});

export const DELETE = withAdmin(async ({ params }) => {
  await dbConnect();
  await Discount.findByIdAndDelete(params.id);
  return { ok: true };
});
