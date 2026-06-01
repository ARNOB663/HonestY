import mongoose from "mongoose";

const TrustBadgeSchema = new mongoose.Schema(
  {
    title: String,
    sub: String,
    icon: { type: String, default: "shipping" }, // key into a known icon set
  },
  { _id: false }
);

const VisualCategorySchema = new mongoose.Schema(
  {
    slug: String,
    title: String,
    image: String,
  },
  { _id: false }
);

const TestimonialSchema = new mongoose.Schema(
  {
    name: String,
    role: String,
    quote: String,
  },
  { _id: false }
);

const FooterLinkSchema = new mongoose.Schema(
  { label: String, href: String },
  { _id: false }
);

// Top header navigation link. Same shape as FooterLinkSchema but kept
// separate so future fields (icon, target, group) don't bleed across.
const NavLinkSchema = new mongoose.Schema(
  { label: String, href: String },
  { _id: false }
);

const FooterColumnSchema = new mongoose.Schema(
  {
    title: String,
    links: { type: [FooterLinkSchema], default: [] },
  },
  { _id: false }
);

const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "store", unique: true, index: true },

    // Store basics
    storeName: { type: String, default: "Honesty" },
    supportEmail: String,
    supportPhone: String,
    currency: { type: String, default: "BDT" },
    taxRate: { type: Number, default: 0 },
    announcement: { type: String, default: "Free shipping on orders over ৳2,000 — Dhaka same-day, others 2-3 days." },

    // Shipping — zone-based
    dhakaShippingRate: { type: Number, default: 60 },
    outsideShippingRate: { type: Number, default: 120 },
    // Legacy single rate (kept for backward compat)
    flatShippingRate: { type: Number, default: 80 },
    freeShippingThreshold: { type: Number, default: 2000 },

    // Payment methods
    bkashNumber: { type: String, default: "01XXXXXXXXX" },
    nagadNumber: { type: String, default: "01XXXXXXXXX" },
    enableBkash: { type: Boolean, default: true },
    enableNagad: { type: Boolean, default: true },
    enableCod: { type: Boolean, default: true },

    // Top header navigation links. Empty array = use the hardcoded fallback
    // in Header.js. Anything else completely replaces the nav.
    navLinks: {
      type: [NavLinkSchema],
      default: [
        { label: "Home", href: "/" },
        { label: "Shop All", href: "/products" },
        { label: "Fashion", href: "/collections/fashion" },
        { label: "Home & Living", href: "/collections/home-living" },
        { label: "Beauty", href: "/collections/beauty" },
        { label: "Wellness", href: "/collections/wellness" },
      ],
    },

    // Homepage section titles
    saleTitle: { type: String, default: "On sale now" },
    saleSubtitle: { type: String, default: "Limited time — while stocks last" },
    bestSellersTitle: { type: String, default: "Most loved this season" },
    bestSellersEyebrow: { type: String, default: "Best Sellers" },
    favouritesTitle: { type: String, default: "This week's favourites" },
    favouritesEyebrow: { type: String, default: "Editor's Picks" },

    // Trust badges (4)
    trustBadges: {
      type: [TrustBadgeSchema],
      default: [
        { title: "Free shipping", sub: "On every order over ৳2,000", icon: "shipping" },
        { title: "7-day returns", sub: "Easy, no-questions-asked", icon: "returns" },
        { title: "Secure payments", sub: "Encrypted at every step", icon: "secure" },
        { title: "Honest support", sub: "Real humans, 7 days a week", icon: "support" },
      ],
    },

    // Shop by Category section
    categoriesTitle: { type: String, default: "Explore our collections" },
    categoriesEyebrow: { type: String, default: "Shop by Category" },
    homeCategories: {
      type: [VisualCategorySchema],
      default: [
        { slug: "fashion", title: "Fashion", image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80" },
        { slug: "home-living", title: "Home & Living", image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80" },
        { slug: "beauty", title: "Beauty", image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80" },
        { slug: "wellness", title: "Wellness", image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=600&q=80" },
        { slug: "electronics", title: "Electronics", image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80" },
        { slug: "kids", title: "Kids & Baby", image: "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=600&q=80" },
      ],
    },

    // Brand Story
    brandStoryEyebrow: { type: String, default: "Our story" },
    brandStoryTitle: { type: String, default: "Honesty in every step,\nfrom maker to your door." },
    brandStoryBody: {
      type: String,
      default: "We believe a good shop should tell you where things come from, who made them, and what they cost to make. That's the promise behind everything we sell — from a hand-thrown ceramic vase to a wireless speaker.\n\nEvery item is chosen for its craftsmanship, its makers' ethics, and its longevity. Less stuff, made well, kept for years.",
    },
    brandStoryCtaText: { type: String, default: "Discover the Range" },
    brandStoryCtaHref: { type: String, default: "/products" },
    brandStoryImage: {
      type: String,
      default: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80",
    },

    // Testimonials
    testimonials: {
      type: [TestimonialSchema],
      default: [
        { name: "Nusrat A.", role: "Dhaka", quote: "The linen shirt fits perfectly and the delivery to Banani was same-day. Will definitely order again." },
        { name: "Tahmid R.", role: "Chattogram", quote: "Honest pricing for genuinely well-made things. Quality matches what they promise." },
        { name: "Ayesha K.", role: "Sylhet", quote: "Customer service replied within minutes when I had a question about sizing. Felt looked after." },
      ],
    },

    // Footer
    footerTagline: { type: String, default: "Honest goods for slow living." },
    footerColumns: {
      type: [FooterColumnSchema],
      default: [
        {
          title: "Shop",
          links: [
            { label: "All products", href: "/products" },
            { label: "Fashion", href: "/collections/fashion" },
            { label: "Home & Living", href: "/collections/home-living" },
            { label: "Beauty", href: "/collections/beauty" },
            { label: "Wellness", href: "/collections/wellness" },
          ],
        },
        {
          title: "Help",
          links: [
            { label: "Contact us", href: "/p/contact" },
            { label: "Shipping & returns", href: "/p/shipping" },
            { label: "FAQ", href: "/p/faq" },
          ],
        },
      ],
    },
    footerInstagram: String,
    footerFacebook: String,
    footerWhatsapp: String,
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
