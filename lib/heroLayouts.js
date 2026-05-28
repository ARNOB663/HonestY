// Catalog of homepage hero layout presets. Each preset defines:
//   - id:        the value stored in Settings.heroLayout
//   - label:     human name shown in the admin picker
//   - description: short hint about when to use it
//   - slots:     how many side cards beyond the main hero (0–3)
//   - grid:      tailwind classes for the outer grid (mobile + desktop)
//   - cells:     array of { className, key } describing each cell
//                key = "hero" | "card1" | "card2" | "card3"
//
// The admin picker and storefront both read from this list so the two stay
// in sync — adding a new preset is a one-file change.

export const HERO_LAYOUTS = [
  {
    id: "hero-plus-3",
    label: "Hero + 3 cards",
    description: "Big main banner with three smaller side cards. Best for variety.",
    slots: 3,
    grid: "grid grid-cols-1 lg:grid-cols-4 lg:grid-rows-2 gap-4 lg:h-[600px]",
    cells: [
      { key: "hero", className: "lg:col-span-2 lg:row-span-2" },
      { key: "card1", className: "lg:col-span-1" },
      { key: "card2", className: "lg:col-span-1" },
      { key: "card3", className: "lg:col-span-2", wide: true },
    ],
  },
  {
    id: "single",
    label: "Single hero",
    description: "One big banner spanning the full width. Best for one strong message.",
    slots: 0,
    grid: "grid grid-cols-1 gap-4 lg:h-[460px]",
    cells: [
      { key: "hero", className: "min-h-[320px]" },
    ],
  },
  {
    id: "two-up",
    label: "Two side-by-side",
    description: "Two equal banners. Best for two parallel promos.",
    slots: 1,
    grid: "grid grid-cols-1 md:grid-cols-2 gap-4 lg:h-[460px]",
    cells: [
      { key: "hero", className: "" },
      { key: "card1", className: "" },
    ],
  },
  {
    id: "three-up",
    label: "Three side-by-side",
    description: "Three equal cards. Best for category spotlights.",
    slots: 2,
    grid: "grid grid-cols-1 md:grid-cols-3 gap-4 lg:h-[420px]",
    cells: [
      { key: "hero", className: "" },
      { key: "card1", className: "" },
      { key: "card2", className: "" },
    ],
  },
  {
    id: "four-grid",
    label: "Four in a 2×2",
    description: "Equal 2×2 grid. Best when all promos have equal weight.",
    slots: 3,
    grid: "grid grid-cols-1 md:grid-cols-2 gap-4 lg:h-[600px]",
    cells: [
      { key: "hero", className: "" },
      { key: "card1", className: "" },
      { key: "card2", className: "" },
      { key: "card3", className: "" },
    ],
  },
];

export function getHeroLayout(id) {
  return HERO_LAYOUTS.find((l) => l.id === id) || HERO_LAYOUTS[0];
}
