import Link from "next/link";
import Image from "next/image";
import ProductCard from "../components/ProductCard";
import CategoryTabs from "../components/CategoryTabs";
import NewsletterForm from "../components/NewsletterForm";
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

  const minis = (settings.miniBanners || []).slice(0, 3);

  return (
    <div className="bg-[#fafaf7]">
      {/* 1. HERO BANNER */}
      <section className="max-w-7xl mx-auto px-4 pt-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 lg:grid-rows-2 gap-4 lg:h-[600px]">
          {/* MAIN LARGE CARD */}
          <div className="lg:col-span-2 lg:row-span-2 relative rounded-2xl overflow-hidden bg-[#f5f1e8] min-h-[420px]">
            {settings.heroImage && (
              <Image
                src={settings.heroImage}
                alt={settings.heroTitle || "Hero"}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-right"
              />
            )}
            <div className="relative z-10 p-8 md:p-12 lg:p-14 flex flex-col h-full max-w-[55%]">
              {settings.heroEyebrow && <p className="text-[#1a2b4a]/70 text-sm font-medium mb-4">{settings.heroEyebrow}</p>}
              {settings.heroTitle && (
                <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1a2b4a] leading-[1.1] mb-6">
                  {settings.heroTitle}
                </h2>
              )}
              {settings.heroPriceText && (
                <p className="text-[#1a2b4a] text-base mb-2 mt-auto">{settings.heroPriceText}</p>
              )}
              {settings.heroCtaText && (
                <Link
                  href={settings.heroCtaHref || "/products"}
                  className="inline-block w-fit mt-4 bg-[#1a2b4a] text-white font-semibold px-7 py-3 rounded text-sm tracking-[0.15em] uppercase hover:bg-[#0e1a30] transition-colors"
                >
                  {settings.heroCtaText}
                </Link>
              )}
            </div>
          </div>

          {/* Top right card 1 */}
          {minis[0] && (
            <Link
              href={minis[0].href || "/products"}
              className="relative rounded-2xl overflow-hidden p-6 flex flex-col group min-h-[200px]"
              style={{ backgroundColor: minis[0].bgColor || "#ede8f0" }}
            >
              {minis[0].badgeText && (
                <span className="self-center inline-flex items-center gap-1 bg-[#b8553a] text-white text-[11px] font-bold tracking-[0.15em] uppercase px-3 py-1 rounded-full shadow-sm">
                  <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  {minis[0].badgeText}
                </span>
              )}
              {minis[0].eyebrow && <p className="text-[#1a2b4a]/60 text-xs font-medium text-center">{minis[0].eyebrow}</p>}
              {minis[0].title && <h3 className="font-serif text-xl text-[#1a2b4a] text-center mt-1 leading-tight">{minis[0].title}</h3>}
              <div className="relative flex-1 mt-2 min-h-[100px]">
                {minis[0].image && (
                  <Image src={minis[0].image} alt={minis[0].title || ""} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-contain group-hover:scale-105 transition-transform duration-500" />
                )}
              </div>
            </Link>
          )}

          {/* Top right card 2 */}
          {minis[1] && (
            <Link
              href={minis[1].href || "/products"}
              className="relative rounded-2xl overflow-hidden p-6 flex flex-col group min-h-[200px]"
              style={{ backgroundColor: minis[1].bgColor || "#f5e8e0" }}
            >
              {minis[1].badgeText && (
                <span className="self-center inline-flex items-center gap-1 bg-[#b8553a] text-white text-[11px] font-bold tracking-[0.15em] uppercase px-3 py-1 rounded-full shadow-sm">
                  <span className="w-1.5 h-1.5 bg-white rounded-full" />
                  {minis[1].badgeText}
                </span>
              )}
              {minis[1].eyebrow && <p className="text-[#1a2b4a]/60 text-xs font-medium text-center">{minis[1].eyebrow}</p>}
              {minis[1].title && <h3 className="font-serif text-xl text-[#1a2b4a] text-center mt-2 leading-tight">{minis[1].title}</h3>}
              <div className="relative flex-1 mt-2 min-h-[100px]">
                {minis[1].image && (
                  <Image src={minis[1].image} alt={minis[1].title || ""} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-contain group-hover:scale-105 transition-transform duration-500" />
                )}
              </div>
            </Link>
          )}

          {/* Wide bottom */}
          {minis[2] && (
            <div className="lg:col-span-2 relative rounded-2xl overflow-hidden min-h-[220px]" style={{ backgroundColor: minis[2].bgColor || "#dde5d8" }}>
              <div className="grid grid-cols-2 h-full">
                <div className="p-6 md:p-8 flex flex-col justify-center">
                  {minis[2].eyebrow && <p className="text-[#1a2b4a]/70 text-sm font-medium mb-2">{minis[2].eyebrow}</p>}
                  {minis[2].title && (
                    <h3 className="font-serif text-2xl md:text-3xl text-[#1a2b4a] leading-tight mb-3">
                      {minis[2].title}
                    </h3>
                  )}
                  {minis[2].badgeText && (
                    <p className="text-[#b8553a] font-bold text-sm mb-3">{minis[2].badgeText}</p>
                  )}
                  <Link
                    href={minis[2].href || "/products"}
                    className="text-[#1a2b4a] text-xs font-bold tracking-[0.2em] uppercase border-b-2 border-[#1a2b4a] w-fit pb-0.5 hover:text-[#c9a961] hover:border-[#c9a961] transition-colors"
                  >
                    Shop Now
                  </Link>
                </div>
                <div className="relative">
                  {minis[2].image && (
                    <Image src={minis[2].image} alt={minis[2].title || ""} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

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

      {/* 10. JOURNAL */}
      {(settings.journalPosts || []).length > 0 && (
        <section className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <p className="text-[#c9a961] text-xs font-semibold tracking-[0.2em] uppercase mb-2">{settings.journalEyebrow}</p>
            <h2 className="font-serif text-3xl md:text-4xl text-[#1a2b4a]">{settings.journalTitle}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {settings.journalPosts.map((j, i) => {
              const Wrapper = j.href ? Link : "article";
              const wrapperProps = j.href ? { href: j.href } : {};
              return (
                <Wrapper key={i} {...wrapperProps} className="group block cursor-pointer">
                  <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-5">
                    {j.image && (
                      <Image
                        src={j.image}
                        alt={j.title || ""}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    )}
                  </div>
                  {j.category && <p className="text-[#c9a961] text-[11px] font-semibold tracking-[0.2em] uppercase mb-2">{j.category}</p>}
                  <h3 className="font-serif text-xl text-[#1a2b4a] leading-snug mb-2 group-hover:text-[#c9a961] transition-colors">{j.title}</h3>
                  {j.date && <p className="text-xs text-gray-500">{j.date}</p>}
                </Wrapper>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
