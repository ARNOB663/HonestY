import bcrypt from "bcryptjs";
import { revalidateTag } from "next/cache";
import { withAdmin, httpError } from "../../../../lib/withAdmin";
import { prisma } from "../../../../lib/db";

export const POST = withAdmin(async ({ body }) => {
  const { email, password, name } = body;
  if (!email || !password) throw httpError("email and password required");
  if (String(password).length < 8) throw httpError("Password must be at least 8 characters");
  const lower = String(email).toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: lower } });
  if (existing) {
    await prisma.user.update({
      where: { id: existing.id },
      data: { role: "admin", name: name || existing.name },
    });
    try { revalidateTag("admin-staff"); } catch {}
    return { ok: true, promoted: true };
  }
  const passwordHash = await bcrypt.hash(password, 12);
  await prisma.user.create({ data: { email: lower, name, passwordHash, role: "admin" } });
  try { revalidateTag("admin-staff"); } catch {}
  return { ok: true };
});
