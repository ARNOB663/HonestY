// Meta Pixel event helpers.
//
// Every one of these is a no-op when the pixel is disabled (no
// NEXT_PUBLIC_FB_PIXEL_ID) or when fbevents.js hasn't loaded yet — `fbq` is
// simply undefined and we bail. Callers never need to guard.

const CURRENCY = "BDT";

// fbq's signature is (…, params, options) — eventID belongs in the 4th
// argument, not in params. Passing it inside params would leave the event
// un-deduplicated.
function fire(event, params, eventId) {
  if (typeof window === "undefined" || typeof window.fbq !== "function") return;
  if (eventId) window.fbq("track", event, params, { eventID: eventId });
  else window.fbq("track", event, params);
}

// Fires on a completed order. `eventId` should be the order id so Meta can
// de-duplicate if a Conversions API server event is added later.
export function trackPurchase({ value, items = [], eventId }) {
  fire(
    "Purchase",
    {
      value: Number(value) || 0,
      currency: CURRENCY,
      content_type: "product",
      contents: items.map((i) => ({
        id: i.slug,
        quantity: i.qty,
        item_price: i.price,
      })),
    },
    eventId
  );
}

export function trackAddToCart({ slug, price, qty = 1 }) {
  fire("AddToCart", {
    value: (Number(price) || 0) * qty,
    currency: CURRENCY,
    content_type: "product",
    contents: [{ id: slug, quantity: qty, item_price: price }],
  });
}
