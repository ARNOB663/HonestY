import Link from "next/link";
import Image from "next/image";

export default function BrandStory() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className="relative aspect-[4/5] rounded-lg overflow-hidden">
          <Image
            src="https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=900&q=80"
            alt="Our story"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
        <div>
          <p className="text-[#c9a961] text-xs font-semibold tracking-[0.2em] uppercase mb-3">Our story</p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1a2b4a] leading-tight mb-5">
            Honesty in every step,<br />from maker to your door.
          </h2>
          <p className="text-gray-600 leading-relaxed mb-4">
            We believe a good shop should tell you where things come from, who made them, and what they cost to make.
            That&apos;s the promise behind everything we sell — from a hand-thrown ceramic vase to a wireless speaker.
          </p>
          <p className="text-gray-600 leading-relaxed mb-8">
            Every item is chosen for its craftsmanship, its makers&apos; ethics, and its longevity.
            Less stuff, made well, kept for years.
          </p>
          <Link
            href="/products"
            className="inline-block bg-[#1a2b4a] text-white font-medium px-8 py-3.5 rounded text-sm tracking-[0.15em] uppercase hover:bg-[#0e1a30] transition-colors"
          >
            Discover the Range
          </Link>
        </div>
      </div>
    </section>
  );
}
