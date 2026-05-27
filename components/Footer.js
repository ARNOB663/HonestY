import Link from "next/link";
import Logo from "./Logo";
import { MapPinIcon, MailIcon, PhoneIcon } from "./Icons";
import { getStoreSettings } from "../lib/settings";

const DEFAULT_COLUMNS = [
  {
    title: "Shop",
    links: [
      { label: "All Products", href: "/products" },
      { label: "Fashion", href: "/collections/fashion" },
      { label: "Home & Living", href: "/collections/home-living" },
      { label: "Beauty", href: "/collections/beauty" },
      { label: "Wellness", href: "/collections/wellness" },
    ],
  },
  {
    title: "Help",
    links: [
      { label: "Contact", href: "/p/contact" },
      { label: "Shipping & returns", href: "/p/shipping" },
      { label: "FAQ", href: "/p/faq" },
    ],
  },
];

const SOCIAL_ICONS = {
  instagram: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01M7.5 2h9a5.5 5.5 0 0 1 5.5 5.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2z",
  facebook: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z",
  whatsapp: "M20.5 3.5A11 11 0 0 0 3.6 17.8L2 22l4.3-1.4A11 11 0 1 0 20.5 3.5zM16 14.3c-.2.6-1.2 1.2-1.7 1.2-.4 0-1 0-1.6-.2-.4-.1-1-.3-1.6-.6-2.8-1.2-4.6-4-4.8-4.2-.1-.2-1.1-1.5-1.1-2.8 0-1.4.7-2 .9-2.3.2-.2.5-.3.7-.3h.5c.2 0 .4-.1.6.5.2.6.7 2 .8 2.1 0 .1.1.3 0 .5l-.3.4-.4.4c-.1.2-.3.3-.1.6.1.3.7 1.1 1.5 1.8 1 .9 1.8 1.2 2.1 1.3.3.2.5.1.7-.1l.8-.9c.2-.3.4-.2.7-.1.3.1 1.8.9 2.1 1 .3.2.5.2.6.4.1.1.1.7-.1 1.3z",
};

function SocialLink({ kind, href }) {
  if (!href) return null;
  const path = SOCIAL_ICONS[kind];
  if (!path) return null;
  const url = kind === "whatsapp" ? `https://wa.me/${href.replace(/\D/g, "")}` : href;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="w-9 h-9 border border-white/25 rounded-full flex items-center justify-center hover:bg-white/10 hover:border-[#c9a961] hover:text-[#c9a961] transition-colors" aria-label={kind}>
      <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
        <path d={path} />
      </svg>
    </a>
  );
}

export default async function Footer() {
  const settings = await getStoreSettings();
  const columns = settings.footerColumns?.length ? settings.footerColumns : DEFAULT_COLUMNS;
  return (
    <footer className="bg-[#1a2b4a] text-white mt-0">
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
        <div className="col-span-2 md:col-span-3 lg:col-span-2">
          <div className="mb-4">
            <Logo size="md" color="#ffffff" />
          </div>
          <p className="font-serif italic text-[#c9a961] text-base mb-4">{settings.footerTagline || "Honesty in every step."}</p>
          <p className="text-sm opacity-80 leading-relaxed max-w-sm">{settings.storeName} — honestly made, honestly priced.</p>
          <div className="mt-6 space-y-2.5">
            {settings.supportEmail && (
              <div className="flex items-center gap-2.5 text-sm opacity-85">
                <MailIcon size={14} className="shrink-0" />
                <a href={`mailto:${settings.supportEmail}`} className="hover:opacity-100">{settings.supportEmail}</a>
              </div>
            )}
            {settings.supportPhone && (
              <div className="flex items-center gap-2.5 text-sm opacity-85">
                <PhoneIcon size={14} className="shrink-0" />
                <a href={`tel:${settings.supportPhone}`} className="hover:opacity-100">{settings.supportPhone}</a>
              </div>
            )}
          </div>
        </div>

        {columns.slice(0, 3).map((col, i) => (
          <div key={i}>
            <h4 className="font-semibold text-sm mb-5 tracking-[0.15em] uppercase text-[#c9a961]">{col.title}</h4>
            <ul className="space-y-3">
              {(col.links || []).map((l, j) => (
                <li key={j}>
                  <Link href={l.href || "#"} className="text-sm opacity-80 hover:opacity-100 hover:text-[#c9a961] transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-white/15">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <SocialLink kind="instagram" href={settings.footerInstagram} />
            <SocialLink kind="facebook" href={settings.footerFacebook} />
            <SocialLink kind="whatsapp" href={settings.footerWhatsapp} />
          </div>

          <p className="text-xs opacity-70 text-center">
            &copy; {new Date().getFullYear()} {settings.storeName}. All rights reserved.
          </p>

          <div className="flex items-center gap-1.5">
            {settings.enableBkash !== false && <span className="bg-white/10 text-white/80 text-[10px] font-medium px-2 py-1 rounded">bKash</span>}
            {settings.enableNagad !== false && <span className="bg-white/10 text-white/80 text-[10px] font-medium px-2 py-1 rounded">Nagad</span>}
            {settings.enableCod !== false && <span className="bg-white/10 text-white/80 text-[10px] font-medium px-2 py-1 rounded">COD</span>}
          </div>
        </div>
      </div>
    </footer>
  );
}
