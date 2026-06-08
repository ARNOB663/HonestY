// Delete stock-alert records older than 30 days. They accumulate when
// products never come back in stock and customers stop caring.
//
// Body: { olderThanDays?: 30 }
import { withAdmin } from "../../../../../lib/withAdmin";
import { prisma } from "../../../../../lib/db";

export const POST = withAdmin(async ({ body }) => {
  const days = Math.max(1, Number(body.olderThanDays) || 30);
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const result = await prisma.stockAlert.deleteMany({
    where: { createdAt: { lt: cutoff } },
  });
  return { ok: true, deleted: result.count, olderThanDays: days };
});
