// Recompute subtotal / total for every order from its items + shipping +
// discount. Useful after a data fix (e.g. bulk product price change applied
// retroactively, or items table was edited directly).
//
// Only touches orders that don't match — leaves correct ones alone.
import { revalidateTag } from "next/cache";
import { withAdmin } from "../../../../../lib/withAdmin";
import { prisma } from "../../../../../lib/db";

function round(n) { return Math.round(n * 100) / 100; }

export const POST = withAdmin(async () => {
  const orders = await prisma.order.findMany({ include: { items: true } });
  let fixed = 0;
  for (const o of orders) {
    const subtotal = round((o.items || []).reduce((s, i) => s + (i.price || 0) * (i.qty || 1), 0));
    const total = round(Math.max(0, subtotal - (o.discountAmount || 0)) + (o.shipping || 0));
    const subtotalOff = Math.abs(subtotal - (o.subtotal || 0)) > 0.01;
    const totalOff = Math.abs(total - (o.total || 0)) > 0.01;
    if (subtotalOff || totalOff) {
      await prisma.order.update({ where: { id: o.id }, data: { subtotal, total } });
      fixed++;
    }
  }
  try { revalidateTag("admin-dashboard"); revalidateTag("admin-orders"); } catch {}
  return { ok: true, scanned: orders.length, fixed };
});
