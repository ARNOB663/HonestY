"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";

// Mobile-only persistent bottom navigation. Hidden on md+ where the header
// nav is enough. Hidden on /admin pages since admin has its own sidebar.
export default function MobileBottomNav() {
  const pathname = usePathname() || "";
  const { count: cartCount } = useCart();
  const { count: wishCount } = useWishlist();
  const { data: session } = useSession();

  if (pathname.startsWith("/admin")) return null;

  const items = [
    { href: "/", label: "Home", match: (p) => p === "/", icon: HomeIcon },
    { href: "/products", label: "Shop", match: (p) => p.startsWith("/products") || p.startsWith("/collections"), icon: ShopIcon },
    { href: "/wishlist", label: "Wishlist", match: (p) => p.startsWith("/wishlist"), icon: HeartIcon, badge: wishCount },
    { href: "/cart", label: "Cart", match: (p) => p.startsWith("/cart"), icon: CartIcon, badge: cartCount },
    { href: session?.user ? "/account" : "/login", label: session?.user ? "Account" : "Sign in", match: (p) => p.startsWith("/account") || p.startsWith("/login"), icon: UserIcon },
  ];

  return (
    <nav className="md:hidden fixed inset-x-0 bottom-0 z-30 bg-white border-t border-[#e8e4d8] shadow-[0_-2px_8px_rgba(0,0,0,0.04)] pb-[env(safe-area-inset-bottom)]">
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const active = it.match(pathname);
          const Icon = it.icon;
          return (
            <li key={it.label}>
              <Link
                href={it.href}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                  active ? "text-[#1a2b4a]" : "text-gray-500"
                }`}
              >
                <span className="relative">
                  <Icon active={active} />
                  {it.badge > 0 && (
                    <span className="absolute -top-1.5 -right-2 bg-[#b8553a] text-white text-[9px] font-bold rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                      {it.badge > 9 ? "9+" : it.badge}
                    </span>
                  )}
                </span>
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function HomeIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5 12 3l9 6.5V20a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
    </svg>
  );
}
function ShopIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}
function HeartIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}
function CartIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
    </svg>
  );
}
function UserIcon({ active }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
