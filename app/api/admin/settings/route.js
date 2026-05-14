import { withAdmin } from "../../../../lib/withAdmin";
import { dbConnect } from "../../../../lib/mongodb";
import Settings from "../../../../models/Settings";

function nonNeg(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export const PUT = withAdmin(async ({ body }) => {
  await dbConnect();
  await Settings.findOneAndUpdate(
    { key: "store" },
    {
      key: "store",
      storeName: String(body.storeName || "").slice(0, 100),
      supportEmail: String(body.supportEmail || "").slice(0, 200),
      supportPhone: String(body.supportPhone || "").slice(0, 50),
      currency: String(body.currency || "USD").slice(0, 10),
      flatShippingRate: nonNeg(body.flatShippingRate),
      freeShippingThreshold: nonNeg(body.freeShippingThreshold),
      taxRate: nonNeg(body.taxRate),
      announcement: String(body.announcement || "").slice(0, 300),
    },
    { upsert: true, new: true }
  );
  return { ok: true };
});
