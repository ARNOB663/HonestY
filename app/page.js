import Link from "next/link";
import ProductCard from "../components/ProductCard";
import CategoryTabs from "../components/CategoryTabs";
import NewsletterForm from "../components/NewsletterForm";
import HomeHero from "../components/HomeHero";
import VisualCategories from "../components/VisualCategories";
import Testimonials from "../components/Testimonials";
import BrandStory from "../components/BrandStory";
import TrustBadges from "../components/TrustBadges";
import { getFeaturedProducts, getAllProducts, getOnSaleProducts, getActiveSalesGroups } from "../lib/products";
import { getStoreSettings } from "../lib/settings";

export const revalidate = 3600;

export default async function Home() {
  const [featured, allProducts, onSale, settings, salesGroups] = await Promise.all([
    getFeaturedProducts(),
    getAllProducts({ limit: 24 }),
    getOnSaleProducts({ limit: 6 }),
    getStoreSettings(),
    getActiveSalesGroups(),
  ]);

  return (
    <div className="bg-[#fafaf7]">
      {/* 1. HERO BANNER — layout determined by settings.heroLayout */}
      <HomeHero settings={settings} />

      {/* 2. SALE */}
      {onSale.length > 0 && (
        <section className="bg-gradient-to-b from-[#fff7f1] to-[#fafaf7] py-14 border-y border-[#f0d9c8]">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
              <div>
                <p className="text-[#b8553a] text-xs font-bold tracking-[0.25em] uppercase mb-2 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#b8553a] animate-pulse" />
                  Limited Time
                </p>
                <h2 className="font-serif text-3xl md:text-4xl text-[#1a2b4a]">{settings.saleTitle}</h2>
                {settings.saleSubtitle && <p className="text-sm text-gray-500 mt-1">{settings.saleSubtitle}</p>}
              </div>
              <Link
                href="/products?sort=price-asc"
                className="text-xs font-bold tracking-[0.2em] uppercase border-b-2 border-[#1a2b4a] pb-0.5 hover:text-[#b8553a] hover:border-[#b8553a] transition-colors"
              >
                View all deals →
              </Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {onSale.slice(0, 6).map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Custom sales groups (admin-controlled). Renders zero or more sections. */}
      {salesGroups.map((g) => (
        g.products.length > 0 && (
          <section key={g.slug} className="max-w-7xl mx-auto px-4 py-12 border-t border-[#e8e4d8]">
            <div className="flex items-end justify-between mb-8 flex-wrap gap-3">
              <div>
                <p className="text-[#b8553a] text-xs font-bold tracking-[0.25em] uppercase mb-2 flex items-center gap-2">
                  <span className="inline-block w-2 h-2 rounded-full bg-[#b8553a] animate-pulse" />
                  {g.eyebrow}
                </p>
                <h2 className="font-serif text-3xl md:text-4xl text-[#1a2b4a]">{g.title}</h2>
                {g.subtitle && <p className="text-sm text-gray-500 mt-1">{g.subtitle}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {g.products.slice(0, 12).map((p) => (
                <ProductCard key={p.slug} product={p} />
              ))}
            </div>
          </section>
        )
      ))}

      {/* 3. TRUST BADGES */}
      <TrustBadges badges={settings.trustBadges} />

      {/* 4. SHOP BY CATEGORY */}
      <VisualCategories
        eyebrow={settings.categoriesEyebrow}
        title={settings.categoriesTitle}
        cards={settings.homeCategories}
      />

      {/* 5. BEST SELLERS */}
      <section className="bg-[#f5f1e8] py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-[#c9a961] text-xs font-semibold tracking-[0.2em] uppercase mb-2">{settings.bestSellersEyebrow}</p>
            <h2 className="font-serif text-3xl md:text-4xl text-[#1a2b4a]">{settings.bestSellersTitle}</h2>
          </div>
          <CategoryTabs products={allProducts} />
        </div>
      </section>

      {/* 6. FAVOURITES */}
      {featured.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <p className="text-[#c9a961] text-xs font-semibold tracking-[0.2em] uppercase mb-2">{settings.favouritesEyebrow}</p>
            <h2 className="font-serif text-3xl md:text-4xl text-[#1a2b4a]">{settings.favouritesTitle}</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {featured.slice(0, 6).map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              href="/products"
              className="inline-block border border-[#1a2b4a] text-[#1a2b4a] font-medium px-8 py-3 rounded text-sm tracking-[0.15em] uppercase hover:bg-[#1a2b4a] hover:text-white transition-colors"
            >
              View All Products
            </Link>
          </div>
        </section>
      )}

      {/* 7. BRAND STORY */}
      <BrandStory
        eyebrow={settings.brandStoryEyebrow}
        title={settings.brandStoryTitle}
        body={settings.brandStoryBody}
        ctaText={settings.brandStoryCtaText}
        ctaHref={settings.brandStoryCtaHref}
        image={settings.brandStoryImage}
      />

      {/* 8. TESTIMONIALS */}
      <Testimonials items={settings.testimonials} />

      {/* 9. NEWSLETTER */}
      <section className="bg-[#1a2b4a] py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-[#c9a961] text-xs font-semibold tracking-[0.25em] uppercase mb-3">Stay in touch</p>
          <h2 className="font-serif text-3xl md:text-4xl text-white mb-3">Join the {settings.storeName} letter</h2>
          <p className="text-white/70 text-sm mb-8 leading-relaxed">
            Slow notes on new arrivals, maker stories, and quiet ideas for living well. Once a month, never more.
          </p>
          <NewsletterForm />
        </div>
      </section>
    </div>
  );
}
