// Shipping rate resolution, shared by the server (authoritative — what the
// customer is actually charged, see app/api/orders/route.js) and the client
// (what the cart and checkout display). Both must agree exactly or the cart
// shows one price and the order charges another, so the logic lives here once
// rather than being mirrored in lib/settings.js and lib/useShipping.js.
//
// No imports: this module is pulled into both a server route and a "use client"
// bundle.

// Looks up a per-division rate from the `shippingZones` map set in
// admin → Settings → Shipping. Returns null when the division has no rate
// configured, so callers can fall through to the legacy two-zone fields.
// A configured rate of 0 is meaningful (free delivery to that division) and is
// returned as 0, not treated as unset.
export function shippingZoneRate(settings, division) {
  const zones = settings?.shippingZones;
  if (!zones || typeof zones !== "object" || Array.isArray(zones)) return null;
  const key = String(division ?? "").trim().toLowerCase();
  if (!key) return null;
  for (const [name, rate] of Object.entries(zones)) {
    if (String(name).trim().toLowerCase() !== key) continue;
    const n = Number(rate);
    return Number.isFinite(n) && n >= 0 ? n : null;
  }
  return null;
}

// `division === undefined` means "not known yet" — the cart page prices before
// an address exists — and falls straight through to the flat estimate. An empty
// string is different: the customer reached checkout without a division, and
// the legacy fallback still applies, matching the behaviour orders have always
// had.
export function computeShippingCost(subtotal, settings, division) {
  const freeOver = Number(settings?.freeShippingThreshold) || 0;
  if (freeOver > 0 && Number(subtotal) >= freeOver) return 0;

  if (division !== undefined) {
    const zoned = shippingZoneRate(settings, division);
    if (zoned !== null) return zoned;

    // Legacy Dhaka/Outside pair, kept so the store keeps working for any
    // division left blank in the zone table.
    const isDhaka = String(division ?? "").trim().toLowerCase() === "dhaka";
    const legacy = Number(isDhaka ? settings?.dhakaShippingRate : settings?.outsideShippingRate);
    if (Number.isFinite(legacy) && legacy > 0) return legacy;
  }

  return Number(settings?.flatShippingRate) || 0;
}
