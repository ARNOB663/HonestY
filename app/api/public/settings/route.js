import { NextResponse } from "next/server";
import { getStoreSettings } from "../../../../lib/settings";

export const revalidate = 60;

// Public settings exposed to the storefront. Returns only fields safe for
// public consumption (no admin-only data, no internal notes).
export async function GET() {
  const s = await getStoreSettings();
  return NextResponse.json({
    storeName: s.storeName,
    currency: s.currency,
    flatShippingRate: Number(s.flatShippingRate) || 0,
    freeShippingThreshold: Number(s.freeShippingThreshold) || 0,
    dhakaShippingRate: Number(s.dhakaShippingRate) || 0,
    outsideShippingRate: Number(s.outsideShippingRate) || 0,
    bkashNumber: s.bkashNumber || "",
    nagadNumber: s.nagadNumber || "",
    enableBkash: s.enableBkash !== false,
    enableNagad: s.enableNagad !== false,
    enableCod: s.enableCod !== false,
    announcement: s.announcement || "",
  });
}
