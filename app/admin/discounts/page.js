import { unstable_cache } from "next/cache";
import { prisma } from "../../../lib/db";
import DiscountsManager from "../../../components/admin/DiscountsManager";

export const dynamic = "force-dynamic";

const cachedDiscounts = unstable_cache(
  async () => prisma.discount.findMany({ orderBy: { createdAt: "desc" } }),
  ["admin-discounts-list-v1"],
  { revalidate: 60, tags: ["admin-discounts"] }
);

export default async function AdminDiscounts() {
  const docs = await cachedDiscounts();
  const initial = docs.map((d) => ({ ...d, _id: String(d.id) }));
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Discounts</h1>
      <DiscountsManager initial={initial} />
    </div>
  );
}
