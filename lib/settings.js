import { cache } from "react";
import { prisma } from "./db";
import { computeShippingCost } from "./shipping";

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
  // {freeShipping} is substituted with the live threshold — see applyStoreTokens.
  announcement: "Free shipping on orders over {freeShipping} — Chattogram same-day, others 2-3 days.",
  deliveryNote: "Chattogram same-day, others 2-3d",
};

// Wrapped in React's per-request `cache` so the layout, homepage, footer, etc.
// share one DB read per request instead of querying Settings several times.
export const getStoreSettings = cache(async () => {
  if (!process.env.DATABASE_URL) return DEFAULTS;
  try {
    const doc = await prisma.settings.findUnique({ where: { storeKey: "store" } });
    if (!doc) return DEFAULTS;
    return { ...DEFAULTS, ...doc };
  } catch {
    return DEFAULTS;
  }
});

// Compute shipping cost from the customer's division. Prefers the per-division
// `shippingZones` table, then the legacy Dhaka/Outside pair, then the flat rate.
// See lib/shipping.js — the client mirrors this via the same function.
export function computeShippingByZone(subtotal, settings, division) {
  return computeShippingCost(subtotal, settings, division);
}
