import Link from "next/link";
import Image from "next/image";
import { getHeroLayout } from "../lib/heroLayouts";

// Renders the homepage hero according to settings.heroLayout. Each cell
// type (hero / card1 / card2 / card3) has its own renderer — the layout
// preset only decides which cells render and what shape they take.

function MainHero({ settings, priority }) {
  return (
    // Aspect-ratio fallback for mobile prevents CLS while the hero image
    // loads. On desktop the parent grid imposes its own height, so the
    // aspect-ratio is unused there.
    <div className="relative rounded-2xl overflow-hidden bg-[#f5f1e8] min-h-[320px] h-full" style={{ aspectRatio: "16 / 10" }}>
      {settings.heroImage && (
        <Image
          src={settings.heroImage}
          alt={settings.heroTitle || "Hero"}
          fill
          priority={priority}
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
  );
}

// Compact card used for square slots. Wide variant (used for "card3" in
// hero-plus-3) splits the card into a left text panel + right image.
function MiniCard({ mini, wide, defaultColor }) {
  if (!mini) return null;
  const bg = mini.bgColor || defaultColor || "#ede8f0";

  if (wide) {
    return (
      <div className="relative rounded-2xl overflow-hidden min-h-[200px] h-full" style={{ backgroundColor: bg, aspectRatio: "16 / 6" }}>
        <div className="grid grid-cols-2 h-full">
          <div className="p-6 md:p-8 flex flex-col justify-center">
            {mini.eyebrow && <p className="text-[#1a2b4a]/70 text-sm font-medium mb-2">{mini.eyebrow}</p>}
            {mini.title && (
              <h3 className="font-serif text-2xl md:text-3xl text-[#1a2b4a] leading-tight mb-3">{mini.title}</h3>
            )}
            {mini.badgeText && (
              <p className="text-[#b8553a] font-bold text-sm mb-3">{mini.badgeText}</p>
            )}
            <Link
              href={mini.href || "/products"}
              className="text-[#1a2b4a] text-xs font-bold tracking-[0.2em] uppercase border-b-2 border-[#1a2b4a] w-fit pb-0.5 hover:text-[#c9a961] hover:border-[#c9a961] transition-colors"
            >
              Shop Now
            </Link>
          </div>
          <div className="relative">
            {mini.image && (
              <Image src={mini.image} alt={mini.title || ""} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={mini.href || "/products"}
      className="relative rounded-2xl overflow-hidden p-6 flex flex-col group min-h-[200px] h-full"
      style={{ backgroundColor: bg, aspectRatio: "1 / 1" }}
    >
      {mini.badgeText && (
        <span className="self-center inline-flex items-center gap-1 bg-[#b8553a] text-white text-[11px] font-bold tracking-[0.15em] uppercase px-3 py-1 rounded-full shadow-sm">
          <span className="w-1.5 h-1.5 bg-white rounded-full" />
          {mini.badgeText}
        </span>
      )}
      {mini.eyebrow && <p className="text-[#1a2b4a]/60 text-xs font-medium text-center">{mini.eyebrow}</p>}
      {mini.title && <h3 className="font-serif text-xl text-[#1a2b4a] text-center mt-1 leading-tight">{mini.title}</h3>}
      <div className="relative flex-1 mt-2 min-h-[100px]">
        {mini.image && (
          <Image src={mini.image} alt={mini.title || ""} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-contain group-hover:scale-105 transition-transform duration-500" />
        )}
      </div>
    </Link>
  );
}

export default function HomeHero({ settings }) {
  const layout = getHeroLayout(settings.heroLayout);
  const minis = settings.miniBanners || [];
  const DEFAULT_COLORS = ["#ede8f0", "#f5e8e0", "#dde5d8"];

  return (
    <section className="max-w-7xl mx-auto px-4 pt-6 pb-12">
      <div className={layout.grid}>
        {layout.cells.map((cell, i) => {
          if (cell.key === "hero") {
            return (
              <div key={cell.key} className={cell.className}>
                <MainHero settings={settings} priority={i === 0} />
              </div>
            );
          }
          const idx = Number(cell.key.replace("card", "")) - 1;
          const mini = minis[idx];
          if (!mini) return <div key={cell.key} className={cell.className} />;
          return (
            <div key={cell.key} className={cell.className}>
              <MiniCard mini={mini} wide={!!cell.wide} defaultColor={DEFAULT_COLORS[idx]} />
            </div>
          );
        })}
      </div>
    </section>
  );
}
