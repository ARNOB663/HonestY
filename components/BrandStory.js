import Link from "next/link";
import Image from "next/image";

export default function BrandStory({ eyebrow, title, body, ctaText, ctaHref, image }) {
  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="grid md:grid-cols-2 gap-10 lg:gap-16 items-center">
        <div className="relative aspect-[4/5] rounded-lg overflow-hidden">
          {image && (
            <Image
              src={image}
              alt="Our story"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          )}
        </div>
        <div>
          {eyebrow && <p className="text-[#c9a961] text-xs font-semibold tracking-[0.2em] uppercase mb-3">{eyebrow}</p>}
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl text-[#1a2b4a] leading-tight mb-5 whitespace-pre-line">
            {title}
          </h2>
          {body && (
            <div className="text-gray-600 leading-relaxed mb-8 whitespace-pre-line">{body}</div>
          )}
          {ctaText && (
            <Link
              href={ctaHref || "/products"}
              className="inline-block bg-[#1a2b4a] text-white font-medium px-8 py-3.5 rounded text-sm tracking-[0.15em] uppercase hover:bg-[#0e1a30] transition-colors"
            >
              {ctaText}
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
