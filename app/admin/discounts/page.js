import { dbConnect } from "../../../lib/mongodb";
import Discount from "../../../models/Discount";
import DiscountsManager from "../../../components/admin/DiscountsManager";

export const dynamic = "force-dynamic";

export default async function AdminDiscounts() {
  await dbConnect();
  const docs = await Discount.find({}).sort({ createdAt: -1 }).lean();
  const initial = docs.map((d) => ({ ...d, _id: String(d._id) }));
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Discounts</h1>
      <DiscountsManager initial={initial} />
    </div>
  );
}
