import { dbConnect } from "./mongodb";
import Settings from "../models/Settings";

const DEFAULTS = {
  storeName: "Honesty",
  currency: "BDT",
  flatShippingRate: 80,
  freeShippingThreshold: 2000,
  announcement: "Free shipping on orders over ৳2,000 — Dhaka same-day, others 2-3 days.",
};

export async function getStoreSettings() {
  if (!process.env.MONGODB_URI) return DEFAULTS;
  try {
    await dbConnect();
    const doc = await Settings.findOne({ key: "store" }).lean();
    if (!doc) return DEFAULTS;
    return { ...DEFAULTS, ...doc };
  } catch {
    return DEFAULTS;
  }
}
