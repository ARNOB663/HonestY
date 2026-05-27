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

// Districts grouped by division. Used to cascade the City select on address
// forms so customers only see relevant options for their division.
export const BD_DISTRICTS = {
  Dhaka: [
    "Dhaka", "Faridpur", "Gazipur", "Gopalganj", "Kishoreganj", "Madaripur",
    "Manikganj", "Munshiganj", "Narayanganj", "Narsingdi", "Rajbari",
    "Shariatpur", "Tangail",
  ],
  Chattogram: [
    "Bandarban", "Brahmanbaria", "Chandpur", "Chattogram", "Comilla",
    "Cox's Bazar", "Feni", "Khagrachhari", "Lakshmipur", "Noakhali",
    "Rangamati",
  ],
  Khulna: [
    "Bagerhat", "Chuadanga", "Jashore", "Jhenaidah", "Khulna", "Kushtia",
    "Magura", "Meherpur", "Narail", "Satkhira",
  ],
  Rajshahi: [
    "Bogura", "Chapainawabganj", "Joypurhat", "Naogaon", "Natore", "Pabna",
    "Rajshahi", "Sirajganj",
  ],
  Barishal: [
    "Barguna", "Barishal", "Bhola", "Jhalokati", "Patuakhali", "Pirojpur",
  ],
  Sylhet: [
    "Habiganj", "Moulvibazar", "Sunamganj", "Sylhet",
  ],
  Rangpur: [
    "Dinajpur", "Gaibandha", "Kurigram", "Lalmonirhat", "Nilphamari",
    "Panchagarh", "Rangpur", "Thakurgaon",
  ],
  Mymensingh: [
    "Jamalpur", "Mymensingh", "Netrokona", "Sherpur",
  ],
};

export function getDistrictsForDivision(division) {
  return BD_DISTRICTS[division] || [];
}

export const COUNTRIES = [
  { code: "BD", name: "Bangladesh" },
];

export const DEFAULT_COUNTRY = "BD";
