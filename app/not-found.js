import Link from "next/link";
import ProductCard from "../components/ProductCard";
import { getFeaturedProducts } from "../lib/products";

export const metadata = {
  title: "Page not found — Honesty",
  description: "We couldn't find what you were looking for.",
};

export default async function NotFound() {
  // Fetch a handful of featured products so the bounce becomes a save.
  let featured = [];
  try {
    featured = (await getFeaturedProducts()).slice(0, 4);
  } catch {}

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 py-16">
      <div className="text-center max-w-xl">
        <p className="text-[#c9a961] text-xs font-semibold tracking-[0.25em] uppercase mb-3">404</p>
        <h1 className="font-serif text-4xl md:text-5xl text-[#1a2b4a] mb-4">This page took a wrong turn</h1>
        <p className="text-sm text-gray-600 leading-relaxed mb-8">
          The link might be broken or the page may have moved. Try one of these instead.
        </p>

        <form action="/products" method="GET" className="flex gap-2 max-w-md mx-auto mb-8">
          <input
            name="q"
            placeholder="Search products…"
            className="flex-1 border border-[#e8e4d8] rounded px-4 py-3 text-sm bg-white outline-none focus:border-[#1a2b4a]"
            autoFocus
          />
          <button className="bg-[#1a2b4a] text-white font-bold px-5 rounded text-sm hover:bg-[#0e1a30]">
            Search
          </button>
        </form>

        <div className="flex items-center justify-center gap-3 flex-wrap text-sm">
          <Link href="/" className="text-[#1a2b4a] font-semibold underline-offset-4 hover:underline">← Home</Link>
          <span className="text-gray-300">·</span>
          <Link href="/products" className="text-[#1a2b4a] font-semibold underline-offset-4 hover:underline">Browse all products</Link>
          <span className="text-gray-300">·</span>
          <Link href="/track" className="text-[#1a2b4a] font-semibold underline-offset-4 hover:underline">Track order</Link>
        </div>
      </div>

      {featured.length > 0 && (
        <section className="w-full max-w-7xl mt-16">
          <p className="text-center text-xs uppercase tracking-[0.2em] text-gray-500 mb-6">Or check out a few favourites</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {featured.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
