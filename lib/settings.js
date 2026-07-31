import { cache } from "react";
import { prisma } from "./db";
import { computeShippingCost } from "./shipping";

const DEFAULTS = {
  storeName: "Honesty",
  currency: "BDT",
  flatShippingRate: 80,
  freeShippingThreshold: 2000,
  homeDivision: "Chattogram",
  localShippingRate: 60,
  outsideShippingRate: 120,
  bkashNumber: "01XXXXXXXXX",
  nagadNumber: "01XXXXXXXXX",
  enableBkash: true,
  enableNagad: true,
  enableCod: true,
  // {freeShipping} and {homeDivision} are substituted with live settings — see
  // applyStoreTokens — so this copy follows the store instead of naming a city.
  announcement: "Free shipping on orders over {freeShipping} — {homeDivision} same-day, others 2-3 days.",
  deliveryNote: "{homeDivision} same-day, others 2-3d",
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

// Compute shipping cost from the customer's division: the local rate inside
// `homeDivision`, the outside rate everywhere else.
// See lib/shipping.js — the client uses the very same function.
export function computeShippingByZone(subtotal, settings, division) {
  return computeShippingCost(subtotal, settings, division);
}
