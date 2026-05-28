import { revalidatePath } from "next/cache";
import { withAdmin } from "../../../../lib/withAdmin";
import { dbConnect } from "../../../../lib/mongodb";
import Settings from "../../../../models/Settings";

// Bust the storefront pages that read store settings so admin edits show
// without waiting for the 1-hour revalidate window to expire.
function bustStorefrontFromSettings() {
  try {
    revalidatePath("/");
    revalidatePath("/products");
    revalidatePath("/sitemap.xml");
    revalidatePath("/robots.txt");
  } catch {}
}

function nonNeg(v) {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : 0;
}
function str(v, max) {
  return String(v ?? "").slice(0, max);
}
function bool(v) { return !!v; }

function cleanArray(arr, mapFn, max = 20) {
  if (!Array.isArray(arr)) return undefined;
  return arr.slice(0, max).map(mapFn).filter(Boolean);
}

const VALID_ICONS = new Set(["shipping", "returns", "secure", "support", "leaf", "phone", "shield", "star"]);

export const PUT = withAdmin(async ({ body }) => {
  await dbConnect();
  const update = {
    key: "store",
    storeName: str(body.storeName, 100),
    supportEmail: str(body.supportEmail, 200),
    supportPhone: str(body.supportPhone, 50),
    currency: str(body.currency, 10) || "BDT",
    taxRate: nonNeg(body.taxRate),
    announcement: str(body.announcement, 300),

    flatShippingRate: nonNeg(body.flatShippingRate),
    freeShippingThreshold: nonNeg(body.freeShippingThreshold),
    dhakaShippingRate: nonNeg(body.dhakaShippingRate),
    outsideShippingRate: nonNeg(body.outsideShippingRate),

    bkashNumber: str(body.bkashNumber, 20),
    nagadNumber: str(body.nagadNumber, 20),
    enableBkash: bool(body.enableBkash),
    enableNagad: bool(body.enableNagad),
    enableCod: bool(body.enableCod),

    saleTitle: str(body.saleTitle, 120),
    saleSubtitle: str(body.saleSubtitle, 200),
    bestSellersTitle: str(body.bestSellersTitle, 120),
    bestSellersEyebrow: str(body.bestSellersEyebrow, 60),
    favouritesTitle: str(body.favouritesTitle, 120),
    favouritesEyebrow: str(body.favouritesEyebrow, 60),

    categoriesTitle: str(body.categoriesTitle, 120),
    categoriesEyebrow: str(body.categoriesEyebrow, 60),

    brandStoryEyebrow: str(body.brandStoryEyebrow, 60),
    brandStoryTitle: str(body.brandStoryTitle, 200),
    brandStoryBody: str(body.brandStoryBody, 2000),
    brandStoryCtaText: str(body.brandStoryCtaText, 40),
    brandStoryCtaHref: str(body.brandStoryCtaHref, 200),
    brandStoryImage: str(body.brandStoryImage, 500),

    journalTitle: str(body.journalTitle, 120),
    journalEyebrow: str(body.journalEyebrow, 60),

    footerTagline: str(body.footerTagline, 200),
    footerInstagram: str(body.footerInstagram, 200),
    footerFacebook: str(body.footerFacebook, 200),
    footerWhatsapp: str(body.footerWhatsapp, 30),
  };

  // Hero & mini banners are now managed via PATCH (from the Media page),
  // not via this PUT, so SettingsForm doesn't overwrite them by omission.

  const trustBadges = cleanArray(body.trustBadges, (b) => ({
    title: str(b?.title, 80),
    sub: str(b?.sub, 120),
    icon: VALID_ICONS.has(String(b?.icon)) ? String(b.icon) : "shipping",
  }), 6);
  if (trustBadges) update.trustBadges = trustBadges;

  const homeCategories = cleanArray(body.homeCategories, (c) => {
    if (!c?.slug || !c?.title) return null;
    return {
      slug: str(c.slug, 60),
      title: str(c.title, 60),
      image: str(c.image, 500),
    };
  }, 12);
  if (homeCategories) update.homeCategories = homeCategories;

  const journalPosts = cleanArray(body.journalPosts, (p) => ({
    title: str(p?.title, 200),
    date: str(p?.date, 40),
    category: str(p?.category, 60),
    image: str(p?.image, 500),
    href: str(p?.href, 200),
  }), 6);
  if (journalPosts) update.journalPosts = journalPosts;

  const testimonials = cleanArray(body.testimonials, (t) => ({
    name: str(t?.name, 60),
    role: str(t?.role, 60),
    quote: str(t?.quote, 400),
  }), 8);
  if (testimonials) update.testimonials = testimonials;

  const footerColumns = cleanArray(body.footerColumns, (c) => ({
    title: str(c?.title, 60),
    links: cleanArray(c?.links, (l) => ({
      label: str(l?.label, 60),
      href: str(l?.href, 200),
    }), 10) || [],
  }), 4);
  if (footerColumns) update.footerColumns = footerColumns;

  await Settings.findOneAndUpdate({ key: "store" }, update, { upsert: true, new: true });
  bustStorefrontFromSettings();
  return { ok: true };
});

// Partial update — only touches the hero/banner fields, leaving everything
// else intact. Used by the Hero & Banners editor on the Media page.
export const PATCH = withAdmin(async ({ body }) => {
  const set = {};
  if (body.heroEyebrow !== undefined) set.heroEyebrow = str(body.heroEyebrow, 80);
  if (body.heroTitle !== undefined) set.heroTitle = str(body.heroTitle, 160);
  if (body.heroPriceText !== undefined) set.heroPriceText = str(body.heroPriceText, 80);
  if (body.heroCtaText !== undefined) set.heroCtaText = str(body.heroCtaText, 40);
  if (body.heroCtaHref !== undefined) set.heroCtaHref = str(body.heroCtaHref, 200);
  if (body.heroImage !== undefined) set.heroImage = str(body.heroImage, 500);

  if (body.miniBanners !== undefined) {
    const minis = cleanArray(body.miniBanners, (b) => ({
      eyebrow: str(b?.eyebrow, 60),
      title: str(b?.title, 120),
      href: str(b?.href, 200),
      image: str(b?.image, 500),
      badgeText: str(b?.badgeText, 40),
      bgColor: str(b?.bgColor, 20) || "#ede8f0",
    }), 6);
    if (minis) set.miniBanners = minis;
  }

  if (Object.keys(set).length === 0) return { ok: true };
  await dbConnect();
  await Settings.findOneAndUpdate({ key: "store" }, { $set: set }, { upsert: true, new: true });
  bustStorefrontFromSettings();
  return { ok: true };
});
