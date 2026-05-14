import Link from "next/link";
import Image from "next/image";
import ProductCard from "../components/ProductCard";
import CategoryTabs from "../components/CategoryTabs";
import NewsletterForm from "../components/NewsletterForm";
import VisualCategories from "../components/VisualCategories";
import Testimonials from "../components/Testimonials";
import BrandStory from "../components/BrandStory";
import TrustBadges from "../components/TrustBadges";
import { getFeaturedProducts, getAllProducts } from "../lib/products";

export const revalidate = 3600;

const JOURNAL = [
  {
    id: 1,
    title: "The case for buying less, but better",
    date: "May 2026",
    img: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=600&q=80",
    cat: "Slow Living",
  },
  {
    id: 2,
    title: "Meet the makers behind our ceramics",
    date: "Apr 2026",
    img: "https://images.unsplash.com/photo-1578500494198-246f612d3b3d?w=600&q=80",
    cat: "Maker Stories",
  },
  {
    id: 3,
    title: "A guide to caring for natural fibres",
    date: "Mar 2026",
    img: "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=600&q=80",
    cat: "Care Guide",
  },
];

export default async function Home() {
  const [featured, allProducts] = await Promise.all([
    getFeaturedProducts(),
    getAllProducts(),
  ]);

  return (
    <div className="bg-[#fafaf7]">
      {/* HERO — promo grid */}
      <section className="max-w-7xl mx-auto px-4 pt-6 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 lg:grid-rows-2 gap-4 lg:h-[600px]">
          {/* MAIN LARGE CARD */}
          <div className="lg:col-span-2 lg:row-span-2 relative rounded-2xl overflow-hidden bg-[#f5f1e8] min-h-[420px]">
            <Image
              src="https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1200&q=85"
              alt="Linen Shirt"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover object-right"
            />
            <div className="relative z-10 p-8 md:p-12 lg:p-14 flex flex-col h-full max-w-[55%]">
              <p className="text-[#1a2b4a]/70 text-sm font-medium mb-4">Honestly made</p>
              <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1a2b4a] leading-[1.1] mb-6">
                Relaxed Linen<br />Shirt — Natural
              </h2>
              <p className="text-[#1a2b4a] text-base mb-2 mt-auto">
                Starting <span className="text-[#b8553a] font-bold text-xl">৳8,900</span>
              </p>
              <Link
                href="/products/linen-shirt-natural"
                className="inline-block w-fit mt-4 bg-[#1a2b4a] text-white font-semibold px-7 py-3 rounded text-sm tracking-[0.15em] uppercase hover:bg-[#0e1a30] transition-colors"
              >
                Shop Now
              </Link>
              {/* Slider dots */}
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#1a2b4a]" />
                <span className="w-2 h-2 rounded-full bg-[#1a2b4a]/30" />
              </div>
            </div>
          </div>

          {/* SMALL TOP — Ceramic */}
          <Link
            href="/products/ceramic-vase-stone"
            className="relative rounded-2xl overflow-hidden bg-[#ede8f0] p-6 flex flex-col group min-h-[200px]"
          >
            <p className="text-[#1a2b4a]/60 text-xs font-medium text-center">Editor&apos;s pick</p>
            <h3 className="font-serif text-xl text-[#1a2b4a] text-center mt-1 leading-tight">
              Hand-thrown<br />Ceramic Vase
            </h3>
            <div className="relative flex-1 mt-2 min-h-[100px]">
              <Image
                src="https://images.unsplash.com/photo-1578500494198-246f612d3b3d?auto=format&fit=crop&w=500&q=80"
                alt="Ceramic Vase"
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-contain group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </Link>

          {/* SMALL TOP — Face Oil */}
          <Link
            href="/products/rose-face-oil"
            className="relative rounded-2xl overflow-hidden bg-[#f5e8e0] p-6 flex flex-col group min-h-[200px]"
          >
            <p className="text-[#1a2b4a]/60 text-xs font-medium text-center">Up to 20% off</p>
            <h3 className="font-serif text-xl text-[#1a2b4a] text-center mt-1 leading-tight">
              Rose & Jojoba<br />Face Oil
            </h3>
            <div className="relative flex-1 mt-2 min-h-[100px]">
              <Image
                src="https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=500&q=80"
                alt="Face Oil"
                fill
                sizes="(max-width: 1024px) 50vw, 25vw"
                className="object-contain group-hover:scale-105 transition-transform duration-500"
              />
            </div>
          </Link>

          {/* WIDE BOTTOM — Yoga Mat */}
          <div className="lg:col-span-2 relative rounded-2xl overflow-hidden bg-[#dde5d8] min-h-[220px]">
            <div className="grid grid-cols-2 h-full">
              <div className="p-6 md:p-8 flex flex-col justify-center">
                <p className="text-[#1a2b4a]/70 text-sm font-medium mb-2">Weekend offer</p>
                <h3 className="font-serif text-2xl md:text-3xl text-[#1a2b4a] leading-tight mb-3">
                  Cork Yoga Mat
                </h3>
                <p className="text-[#1a2b4a] text-sm mb-3">
                  Starting <span className="text-[#b8553a] font-bold text-base">৳8,800</span>
                </p>
                <Link
                  href="/products/cork-yoga-mat"
                  className="text-[#1a2b4a] text-xs font-bold tracking-[0.2em] uppercase border-b-2 border-[#1a2b4a] w-fit pb-0.5 hover:text-[#c9a961] hover:border-[#c9a961] transition-colors"
                >
                  Shop Now
                </Link>
              </div>
              <div className="relative">
                <Image
                  src="https://images.unsplash.com/photo-1591291621164-2c6367723315?auto=format&fit=crop&w=700&q=80"
                  alt="Yoga Mat"
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <TrustBadges />

      {/* Visual categories */}
      <VisualCategories />

      {/* Featured */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <p className="text-[#c9a961] text-xs font-semibold tracking-[0.2em] uppercase mb-2">Editor&apos;s Picks</p>
          <h2 className="font-serif text-3xl md:text-4xl text-[#1a2b4a]">This week&apos;s favourites</h2>
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

      {/* Brand story */}
      <BrandStory />

      {/* Category tabs - shop by category */}
      <section className="bg-[#f5f1e8] py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-[#c9a961] text-xs font-semibold tracking-[0.2em] uppercase mb-2">Best Sellers</p>
            <h2 className="font-serif text-3xl md:text-4xl text-[#1a2b4a]">Loved across the shop</h2>
          </div>
          <CategoryTabs products={allProducts} />
        </div>
      </section>

      {/* Testimonials */}
      <Testimonials />

      {/* Newsletter */}
      <section className="bg-[#1a2b4a] py-20">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <p className="text-[#c9a961] text-xs font-semibold tracking-[0.25em] uppercase mb-3">Stay in touch</p>
          <h2 className="font-serif text-3xl md:text-4xl text-white mb-3">Join the Honesty letter</h2>
          <p className="text-white/70 text-sm mb-8 leading-relaxed">
            Slow notes on new arrivals, maker stories, and quiet ideas for living well. Once a month, never more.
          </p>
          <NewsletterForm />
        </div>
      </section>

      {/* Journal */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <p className="text-[#c9a961] text-xs font-semibold tracking-[0.2em] uppercase mb-2">From the Journal</p>
          <h2 className="font-serif text-3xl md:text-4xl text-[#1a2b4a]">Stories & guides</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {JOURNAL.map((j) => (
            <article key={j.id} className="group cursor-pointer">
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-5">
                <Image
                  src={j.img}
                  alt={j.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 768px) 100vw, 33vw"
                />
              </div>
              <p className="text-[#c9a961] text-[11px] font-semibold tracking-[0.2em] uppercase mb-2">{j.cat}</p>
              <h3 className="font-serif text-xl text-[#1a2b4a] leading-snug mb-2 group-hover:text-[#c9a961] transition-colors">
                {j.title}
              </h3>
              <p className="text-xs text-gray-500">{j.date}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
