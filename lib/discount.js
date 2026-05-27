// Shared discount maths so the validate preview and the order route agree.

function round(n) {
  return Math.round(n * 100) / 100;
}

// Given a discount doc and the eligible base amount, return the discount value.
export function discountAmountFor(discount, eligibleBase) {
  if (!discount || eligibleBase <= 0) return 0;
  if (discount.type === "percent") {
    const pct = Math.min(Math.max(discount.value, 0), 100);
    return round((eligibleBase * pct) / 100);
  }
  return round(Math.min(Math.max(discount.value, 0), eligibleBase));
}

// The base a discount applies to. For collection-scoped codes it's the sum of
// matching line items; otherwise the whole subtotal.
// `lines` = [{ price, qty, collection }]
export function eligibleBase(discount, subtotal, lines) {
  if (!discount || discount.appliesTo !== "collection" || !discount.collectionSlug) {
    return subtotal;
  }
  if (!Array.isArray(lines)) return 0;
  return round(
    lines
      .filter((l) => l.collection === discount.collectionSlug)
      .reduce((s, l) => s + (Number(l.price) || 0) * (Number(l.qty) || 0), 0)
  );
}
