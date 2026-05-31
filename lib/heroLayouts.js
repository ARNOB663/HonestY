// Catalog of homepage hero layout presets. Each preset defines:
//   - id:           value stored in Settings.heroLayout
//   - label:        human name for the admin picker
//   - description:  short hint
//   - slots:        side cards beyond the main hero (0–3)
//   - grid:         responsive Tailwind classes for the storefront
//   - staticGrid:   non-responsive Tailwind classes for admin thumbs/preview
//                   (no `lg:` prefixes, no fixed heights — sized by parent)
//   - cells:        { key, className (storefront), staticClassName (admin) }
//                   key is one of "hero" | "card1" | "card2" | "card3"

export const HERO_LAYOUTS = [
  {
    id: "hero-plus-3",
    label: "Hero + 3 cards",
    description: "Big main banner with three smaller side cards. Best for variety.",
    slots: 3,
    grid: "grid grid-cols-1 lg:grid-cols-4 lg:grid-rows-2 gap-4 lg:h-[600px]",
    staticGrid: "grid grid-cols-4 grid-rows-2 gap-1 w-full h-full",
    cells: [
      { key: "hero",  className: "lg:col-span-2 lg:row-span-2", staticClassName: "col-span-2 row-span-2" },
      { key: "card1", className: "lg:col-span-1",               staticClassName: "col-span-1" },
      { key: "card2", className: "lg:col-span-1",               staticClassName: "col-span-1" },
      { key: "card3", className: "lg:col-span-2", wide: true,   staticClassName: "col-span-2" },
    ],
  },
  {
    id: "single",
    label: "Single hero",
    description: "One big banner spanning the full width.",
    slots: 0,
    grid: "grid grid-cols-1 gap-4 lg:h-[460px]",
    staticGrid: "grid grid-cols-1 gap-1 w-full h-full",
    cells: [
      { key: "hero", className: "min-h-[320px]", staticClassName: "" },
    ],
  },
  {
    id: "two-up",
    label: "Two side-by-side",
    description: "Two equal banners for parallel promos.",
    slots: 1,
    grid: "grid grid-cols-1 md:grid-cols-2 gap-4 lg:h-[460px]",
    staticGrid: "grid grid-cols-2 gap-1 w-full h-full",
    cells: [
      { key: "hero",  className: "", staticClassName: "" },
      { key: "card1", className: "", staticClassName: "" },
    ],
  },
  {
    id: "three-up",
    label: "Three side-by-side",
    description: "Three equal cards for category spotlights.",
    slots: 2,
    grid: "grid grid-cols-1 md:grid-cols-3 gap-4 lg:h-[420px]",
    staticGrid: "grid grid-cols-3 gap-1 w-full h-full",
    cells: [
      { key: "hero",  className: "", staticClassName: "" },
      { key: "card1", className: "", staticClassName: "" },
      { key: "card2", className: "", staticClassName: "" },
    ],
  },
  {
    id: "four-grid",
    label: "Four in a 2×2",
    description: "2×2 grid when all promos have equal weight.",
    slots: 3,
    grid: "grid grid-cols-1 md:grid-cols-2 gap-4 lg:h-[600px]",
    staticGrid: "grid grid-cols-2 grid-rows-2 gap-1 w-full h-full",
    cells: [
      { key: "hero",  className: "", staticClassName: "" },
      { key: "card1", className: "", staticClassName: "" },
      { key: "card2", className: "", staticClassName: "" },
      { key: "card3", className: "", staticClassName: "" },
    ],
  },
];

export function getHeroLayout(id) {
  return HERO_LAYOUTS.find((l) => l.id === id) || HERO_LAYOUTS[0];
}
