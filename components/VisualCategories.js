import Link from "next/link";
import Image from "next/image";

const CATEGORY_CARDS = [
  {
    slug: "fashion",
    title: "Fashion",
    image: "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=600&q=80",
  },
  {
    slug: "home-living",
    title: "Home & Living",
    image: "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=600&q=80",
  },
  {
    slug: "beauty",
    title: "Beauty",
    image: "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
  },
  {
    slug: "wellness",
    title: "Wellness",
    image: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?auto=format&fit=crop&w=600&q=80",
  },
  {
    slug: "electronics",
    title: "Electronics",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80",
  },
  {
    slug: "kids",
    title: "Kids & Baby",
    image: "https://images.unsplash.com/photo-1522771930-78848d9293e8?auto=format&fit=crop&w=600&q=80",
  },
];

export default function VisualCategories() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <p className="text-[#c9a961] text-xs font-semibold tracking-[0.2em] uppercase mb-2">Shop by Category</p>
        <h2 className="font-serif text-3xl md:text-4xl text-[#1a2b4a]">Explore our collections</h2>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {CATEGORY_CARDS.map((c) => (
          <Link
            key={c.slug}
            href={`/collections/${c.slug}`}
            className="group relative aspect-[3/4] rounded-lg overflow-hidden bg-[#f5f1e8]"
          >
            <Image
              src={c.image}
              alt={c.title}
              fill
              sizes="(max-width: 768px) 50vw, 17vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1a2b4a]/70 via-transparent to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 text-white">
              <h3 className="font-serif text-lg leading-tight">{c.title}</h3>
              <span className="text-[10px] font-medium tracking-[0.2em] uppercase opacity-80 group-hover:opacity-100 transition-opacity">Shop →</span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
