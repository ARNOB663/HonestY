// Shipping rate resolution, shared by the server (authoritative — what the
// customer is actually charged, see app/api/orders/route.js) and the client
// (what the cart and checkout display). Both must agree exactly or the cart
// shows one price and the order charges another, so the logic lives here once
// rather than being mirrored in lib/settings.js and lib/useShipping.js.
//
// No imports: this module is pulled into both a server route and a "use client"
// bundle.

// True when the delivery address is in the division the store ships from.
export function isLocalDivision(settings, division) {
  const home = String(settings?.homeDivision ?? "").trim().toLowerCase();
  if (!home) return false;
  return String(division ?? "").trim().toLowerCase() === home;
}

// `division === undefined` means "not known yet" — the cart page prices before
// an address exists — and falls straight through to the flat estimate. An empty
// string is different: the customer reached checkout without a division, and is
// treated as outside the home division.
//
// A rate of 0 is honoured as free delivery; the flat rate is used only when a
// rate is missing or non-numeric.
export function computeShippingCost(subtotal, settings, division) {
  const freeOver = Number(settings?.freeShippingThreshold) || 0;
  if (freeOver > 0 && Number(subtotal) >= freeOver) return 0;

  if (division !== undefined) {
    const local = isLocalDivision(settings, division);
    const rate = Number(local ? settings?.localShippingRate : settings?.outsideShippingRate);
    if (Number.isFinite(rate) && rate >= 0) return rate;
  }

  return Number(settings?.flatShippingRate) || 0;
}
