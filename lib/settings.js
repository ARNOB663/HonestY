import { cache } from "react";
import { dbConnect } from "./mongodb";
import Settings from "../models/Settings";

const DEFAULTS = {
  storeName: "Honesty",
  currency: "BDT",
  flatShippingRate: 80,
  freeShippingThreshold: 2000,
  dhakaShippingRate: 60,
  outsideShippingRate: 120,
  bkashNumber: "01XXXXXXXXX",
  nagadNumber: "01XXXXXXXXX",
  enableBkash: true,
  enableNagad: true,
  enableCod: true,
  announcement: "Free shipping on orders over ৳2,000 — Dhaka same-day, others 2-3 days.",
};

// Wrapped in React's per-request `cache` so the layout, homepage, footer, etc.
// share one DB read per request instead of querying Settings several times.
export const getStoreSettings = cache(async () => {
  if (!process.env.MONGODB_URI) return DEFAULTS;
  try {
    await dbConnect();
    const doc = await Settings.findOne({ key: "store" }).lean();
    if (!doc) return DEFAULTS;
    return { ...DEFAULTS, ...doc };
  } catch {
    return DEFAULTS;
  }
});

// Compute shipping cost based on the customer's shipping zone (Dhaka vs outside).
// Falls back to flatShippingRate when zone-based rates aren't configured.
export function computeShippingByZone(subtotal, settings, division) {
  const freeOver = Number(settings.freeShippingThreshold) || 0;
  if (freeOver > 0 && subtotal >= freeOver) return 0;
  const isDhaka = String(division || "").trim().toLowerCase() === "dhaka";
  if (isDhaka && Number.isFinite(Number(settings.dhakaShippingRate))) {
    return Number(settings.dhakaShippingRate);
  }
  if (!isDhaka && Number.isFinite(Number(settings.outsideShippingRate))) {
    return Number(settings.outsideShippingRate);
  }
  return Number(settings.flatShippingRate) || 0;
}
