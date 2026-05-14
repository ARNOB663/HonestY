// Bangladesh-first money & locale helpers.
// All prices in the catalog are stored as plain numbers in BDT.

export const CURRENCY = "BDT";
export const CURRENCY_SYMBOL = "৳";

export function formatMoney(amount, opts = {}) {
  const n = Number(amount) || 0;
  const { decimals = 0, symbol = true } = opts;
  const formatted = n.toLocaleString("en-BD", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  return symbol ? `${CURRENCY_SYMBOL}${formatted}` : formatted;
}

// Bangladesh divisions (used as the "State / Region" equivalent on shipping forms).
export const BD_DIVISIONS = [
  "Dhaka",
  "Chattogram",
  "Khulna",
  "Rajshahi",
  "Barishal",
  "Sylhet",
  "Rangpur",
  "Mymensingh",
];

export const COUNTRIES = [
  { code: "BD", name: "Bangladesh" },
];

export const DEFAULT_COUNTRY = "BD";
