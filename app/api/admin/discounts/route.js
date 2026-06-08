import { revalidateTag } from "next/cache";
import { withAdmin, httpError } from "../../../../lib/withAdmin";
import { prisma } from "../../../../lib/db";

function clampValue(type, raw) {
  const v = Number(raw);
  if (!Number.isFinite(v) || v < 0) return null;
  if (type === "percent" && v > 100) return null;
  return v;
}

export const POST = withAdmin(async ({ body }) => {
  const code = String(body.code || "").trim().toUpperCase();
  if (!code) throw httpError("code required");
  const type = body.type === "fixed" ? "fixed" : "percent";
  const value = clampValue(type, body.value);
  if (value === null) throw httpError("value must be a non-negative number (≤ 100 for percent)");
  const minSubtotal = Math.max(0, Number(body.minSubtotal) || 0);
  const usageLimit = Math.max(0, Math.floor(Number(body.usageLimit) || 0));
  const appliesTo = body.appliesTo === "collection" ? "collection" : "all";
  await prisma.discount.create({
    data: {
      code,
      type,
      value,
      minSubtotal,
      usageLimit,
      active: body.active !== false,
      expiresAt: body.expiresAt ? new Date(body.expiresAt) : null,
      description: String(body.description || "").slice(0, 300),
      appliesTo,
      collectionSlug: appliesTo === "collection" ? String(body.collectionSlug || "").trim().toLowerCase().slice(0, 60) : "",
    },
  });
  try { revalidateTag("admin-discounts"); } catch {}
  return { ok: true };
});
