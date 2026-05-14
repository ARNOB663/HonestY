import Link from "next/link";
import Logo from "./Logo";
import { MapPinIcon, MailIcon, PhoneIcon } from "./Icons";

export default function Footer() {
  return (
    <footer className="bg-[#1a2b4a] text-white mt-0">
      <div className="max-w-7xl mx-auto px-4 py-16 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-10">
        {/* Brand */}
        <div className="col-span-2 md:col-span-3 lg:col-span-2">
          <div className="mb-4">
            <Logo size="md" color="#ffffff" />
          </div>
          <p className="font-serif italic text-[#c9a961] text-base mb-4">Honesty in every step.</p>
          <p className="text-sm opacity-80 leading-relaxed max-w-sm">
            A curated shop of beautifully made things — from independent makers,
            with transparent sourcing and pricing you can trust.
          </p>
          <div className="mt-6 space-y-2.5">
            <div className="flex items-start gap-2.5 text-sm opacity-85">
              <MapPinIcon size={14} className="mt-0.5 shrink-0" />
              <span>32 Linen Lane, Suite 4<br />Toronto, Canada</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm opacity-85">
              <MailIcon size={14} className="shrink-0" />
              <span>hello@honesty.shop</span>
            </div>
            <div className="flex items-center gap-2.5 text-sm opacity-85">
              <PhoneIcon size={14} className="shrink-0" />
              <span>(+1) 416 555 0188</span>
            </div>
          </div>
        </div>

        {/* Shop */}
        <div>
          <h4 className="font-semibold text-sm mb-5 tracking-[0.15em] uppercase text-[#c9a961]">Shop</h4>
          <ul className="space-y-3">
            {[
              { label: "All Products", href: "/products" },
              { label: "Fashion", href: "/collections/fashion" },
              { label: "Home & Living", href: "/collections/home-living" },
              { label: "Beauty", href: "/collections/beauty" },
              { label: "Wellness", href: "/collections/wellness" },
              { label: "Accessories", href: "/collections/accessories" },
            ].map((item) => (
              <li key={item.label}>
                <Link href={item.href} className="text-sm opacity-80 hover:opacity-100 hover:text-[#c9a961] transition-colors">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Company */}
        <div>
          <h4 className="font-semibold text-sm mb-5 tracking-[0.15em] uppercase text-[#c9a961]">Company</h4>
          <ul className="space-y-3">
            {["Our Story", "Makers", "Journal", "Sustainability", "Press", "Careers"].map((item) => (
              <li key={item}>
                <a href="#" className="text-sm opacity-80 hover:opacity-100 hover:text-[#c9a961] transition-colors">{item}</a>
              </li>
            ))}
          </ul>
        </div>

        {/* Help */}
        <div>
          <h4 className="font-semibold text-sm mb-5 tracking-[0.15em] uppercase text-[#c9a961]">Help</h4>
          <ul className="space-y-3">
            {["Shipping & Delivery", "Returns & Exchanges", "Size Guide", "Care Instructions", "Contact", "FAQ"].map((item) => (
              <li key={item}>
                <a href="#" className="text-sm opacity-80 hover:opacity-100 hover:text-[#c9a961] transition-colors">{item}</a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/15">
        <div className="max-w-7xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {[
              { label: "Instagram", path: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37zM17.5 6.5h.01M7.5 2h9a5.5 5.5 0 0 1 5.5 5.5v9a5.5 5.5 0 0 1-5.5 5.5h-9A5.5 5.5 0 0 1 2 16.5v-9A5.5 5.5 0 0 1 7.5 2z" },
              { label: "Pinterest", path: "M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.03-2.83.19-.77 1.27-5.37 1.27-5.37s-.32-.65-.32-1.61c0-1.51.88-2.64 1.97-2.64.93 0 1.38.7 1.38 1.53 0 .94-.6 2.34-.91 3.64-.26 1.09.54 1.97 1.61 1.97 1.93 0 3.41-2.03 3.41-4.97 0-2.6-1.87-4.41-4.54-4.41-3.09 0-4.91 2.32-4.91 4.72 0 .93.36 1.94.8 2.49a.32.32 0 0 1 .07.31c-.08.34-.27 1.09-.3 1.24-.05.2-.16.24-.38.15-1.43-.67-2.33-2.77-2.33-4.46 0-3.62 2.63-6.95 7.58-6.95 3.98 0 7.08 2.84 7.08 6.63 0 3.96-2.49 7.14-5.95 7.14" },
              { label: "Facebook", path: "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" },
              { label: "Email", path: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6" },
            ].map((s) => (
              <a key={s.label} href="#" className="w-9 h-9 border border-white/25 rounded-full flex items-center justify-center hover:bg-white/10 hover:border-[#c9a961] hover:text-[#c9a961] transition-colors" aria-label={s.label}>
                <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d={s.path} />
                </svg>
              </a>
            ))}
          </div>

          <p className="text-xs opacity-70 text-center">
            &copy; {new Date().getFullYear()} Honesty. All rights reserved.
          </p>

          <div className="flex items-center gap-1.5">
            {["VISA","MC","AMEX","PayPal","ApplePay"].map((p) => (
              <span key={p} className="bg-white/10 text-white/80 text-[10px] font-medium px-2 py-1 rounded">{p}</span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
