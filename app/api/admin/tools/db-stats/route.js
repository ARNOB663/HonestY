// Row counts per table — handy snapshot of "how much data is in the system".
import { withAdmin } from "../../../../../lib/withAdmin";
import { prisma } from "../../../../../lib/db";

export const GET = withAdmin(async () => {
  const [
    users, products, productVariants, orders, orderItems,
    categories, salesGroups, discounts, pages, settings,
    subscribers, stockAlerts, auditLogs, media,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.productVariant.count(),
    prisma.order.count(),
    prisma.orderItem.count(),
    prisma.category.count(),
    prisma.salesGroup.count(),
    prisma.discount.count(),
    prisma.page.count(),
    prisma.settings.count(),
    prisma.subscriber.count(),
    prisma.stockAlert.count(),
    prisma.auditLog.count(),
    prisma.media.count(),
  ]);

  return {
    counts: {
      users, products, productVariants, orders, orderItems,
      categories, salesGroups, discounts, pages, settings,
      subscribers, stockAlerts, auditLogs, media,
    },
    total: users + products + productVariants + orders + orderItems +
           categories + salesGroups + discounts + pages + settings +
           subscribers + stockAlerts + auditLogs + media,
    generatedAt: new Date().toISOString(),
  };
});
