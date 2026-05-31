import { unstable_cache } from "next/cache";
import { dbConnect } from "../../../lib/mongodb";
import Discount from "../../../models/Discount";
import DiscountsManager from "../../../components/admin/DiscountsManager";

export const dynamic = "force-dynamic";

const cachedDiscounts = unstable_cache(
  async () => {
    await dbConnect();
    return Discount.find({}).sort({ createdAt: -1 }).lean();
  },
  ["admin-discounts-list-v1"],
  { revalidate: 60, tags: ["admin-discounts"] }
);

export default async function AdminDiscounts() {
  const docs = await cachedDiscounts();
  const initial = docs.map((d) => ({ ...d, _id: String(d._id) }));
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Discounts</h1>
      <DiscountsManager initial={initial} />
    </div>
  );
}
