// Honesty — category list and (historically) a hardcoded product catalogue.
//
// Products now live exclusively in MongoDB. Add / edit / delete them from
// /admin/products in the live site. The `products` export below is kept as
// an empty array so existing imports (lib/products.js fallback path when
// MONGODB_URI is not set, e.g. preview builds) don't break.
//
// `collections` is still used as a fallback seed for the Category collection
// in Mongo on first read (see lib/products.js → getAllCategories), so leave
// it populated unless you've moved categories to admin-only management.

export const collections = [
  { slug: "fashion", title: "Fashion", blurb: "Everyday essentials, made to last." },
  { slug: "home-living", title: "Home & Living", blurb: "Pieces that turn a house into a home." },
  { slug: "beauty", title: "Beauty", blurb: "Clean, honest skincare and care." },
  { slug: "wellness", title: "Wellness", blurb: "Tools and rituals for slow living." },
  { slug: "electronics", title: "Electronics", blurb: "Quietly capable everyday tech." },
  { slug: "kids", title: "Kids & Baby", blurb: "Gentle on skin, kind to the planet." },
  { slug: "accessories", title: "Accessories", blurb: "The finishing touches." },
];

export const products = [];
