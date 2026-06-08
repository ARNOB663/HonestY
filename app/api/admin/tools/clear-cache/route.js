// Manually bust ALL admin caches. Useful when something looks stale (e.g.
// after a manual SQL change in phpMyAdmin / Prisma Studio that bypassed the
// app's mutation endpoints).
import { revalidatePath, revalidateTag } from "next/cache";
import { withAdmin } from "../../../../../lib/withAdmin";

const ADMIN_TAGS = [
  "admin-dashboard",
  "admin-orders",
  "admin-products",
  "admin-customers",
  "admin-discounts",
  "admin-pages",
  "admin-staff",
  "admin-sales",
  "admin-subscribers",
  "admin-audit",
];

const STOREFRONT_PATHS = [
  "/",
  "/products",
  "/sitemap.xml",
  "/robots.txt",
];

export const POST = withAdmin(async () => {
  for (const tag of ADMIN_TAGS) {
    try { revalidateTag(tag); } catch {}
  }
  for (const path of STOREFRONT_PATHS) {
    try { revalidatePath(path); } catch {}
  }
  return { ok: true, busted: { tags: ADMIN_TAGS.length, paths: STOREFRONT_PATHS.length } };
});
