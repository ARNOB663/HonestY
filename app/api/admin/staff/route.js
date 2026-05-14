import bcrypt from "bcryptjs";
import { withAdmin, httpError } from "../../../../lib/withAdmin";
import { dbConnect } from "../../../../lib/mongodb";
import User from "../../../../models/User";

export const POST = withAdmin(async ({ body }) => {
  const { email, password, name } = body;
  if (!email || !password) throw httpError("email and password required");
  if (String(password).length < 8) throw httpError("Password must be at least 8 characters");
  await dbConnect();
  const existing = await User.findOne({ email: String(email).toLowerCase() });
  if (existing) {
    existing.role = "admin";
    if (name) existing.name = name;
    await existing.save();
    return { ok: true, promoted: true };
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await User.create({ email: String(email).toLowerCase(), name, passwordHash, role: "admin" });
  return { ok: true };
});
