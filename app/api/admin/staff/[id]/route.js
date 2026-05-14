import { withAdmin, httpError } from "../../../../../lib/withAdmin";
import { dbConnect } from "../../../../../lib/mongodb";
import User from "../../../../../models/User";

export const PATCH = withAdmin(async ({ body, params }) => {
  if (body.role && !["admin", "user"].includes(body.role)) throw httpError("invalid role");
  await dbConnect();
  if (body.role === "user") {
    const admins = await User.countDocuments({ role: "admin" });
    const target = await User.findById(params.id);
    if (target?.role === "admin" && admins <= 1) throw httpError("Cannot demote the last admin");
  }
  await User.findByIdAndUpdate(params.id, { role: body.role, $inc: { tokenVersion: 1 } });
  return { ok: true };
});
