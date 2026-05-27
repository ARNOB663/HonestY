// Shared product-field sanitizers used by the admin create/update routes.

export function nonNegNumber(v, fallback) {
  if (v === "" || v == null) return fallback;
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function sanitizeVariants(raw) {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  return raw
    .filter((v) => v && typeof v.name === "string" && v.name.trim())
    .map((v) => {
      const id =
        String(v.id || v.name).toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 60) ||
        `v-${Math.random().toString(36).slice(2, 8)}`;
      if (seen.has(id)) return null;
      seen.add(id);
      const price = v.price === "" || v.price == null ? undefined : Math.max(0, Number(v.price)) || 0;
      const inventory = Math.max(0, Math.floor(Number(v.inventory) || 0));
      return {
        id,
        name: String(v.name).trim().slice(0, 80),
        sku: v.sku ? String(v.sku).trim().slice(0, 80) : undefined,
        price,
        inventory,
        image: v.image ? String(v.image).trim().slice(0, 500) : undefined,
        colorHex: v.colorHex ? String(v.colorHex).trim().slice(0, 16) : undefined,
      };
    })
    .filter(Boolean);
}
