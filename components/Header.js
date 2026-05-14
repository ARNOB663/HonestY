"use client";
import Link from "next/link";
import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "../context/CartContext";
import Logo from "./Logo";
import { SearchIcon, UserIcon, CartIcon, MenuIcon, XIcon } from "./Icons";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop All" },
  { href: "/collections/fashion", label: "Fashion" },
  { href: "/collections/home-living", label: "Home & Living" },
  { href: "/collections/beauty", label: "Beauty" },
  { href: "/collections/wellness", label: "Wellness" },
];

export default function Header({ announcement }) {
  const { count } = useCart();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");

  function handleSearch(e) {
    e.preventDefault();
    if (searchVal.trim()) window.location.href = `/products?q=${encodeURIComponent(searchVal.trim())}`;
  }

  return (
    <header className="sticky top-0 z-50 w-full">
      {/* Top announcement bar */}
      {announcement && (
        <div className="bg-[#1a2b4a] text-white text-xs py-2 hidden sm:block">
          <div className="max-w-7xl mx-auto px-4 flex items-center">
            <p className="flex-1 text-center tracking-wide">{announcement}</p>
            <div className="flex items-center gap-4 shrink-0">
              <Link href="/track" className="hover:text-[#c9a961] whitespace-nowrap transition-colors">Track Order</Link>
              <span className="text-white/60 text-[11px]">BDT</span>
            </div>
          </div>
        </div>
      )}

      {/* Main header */}
      <div className="bg-white border-b border-[#e8e4d8]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-6">
          {/* Logo */}
          <Link href="/" className="shrink-0">
            <Logo size="md" />
          </Link>

          {/* Search (desktop) */}
          <form onSubmit={handleSearch} className="flex-1 hidden md:flex h-11 border border-[#e8e4d8] rounded overflow-hidden bg-[#fafaf7] focus-within:border-[#1a2b4a] transition-colors max-w-xl mx-auto">
            <input
              type="text"
              placeholder="Search for products, collections, stories…"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="flex-1 px-4 text-sm outline-none text-[#1a2b4a] bg-transparent"
            />
            <button type="submit" className="px-5 text-[#1a2b4a] flex items-center justify-center hover:bg-[#f5f1e8] transition-colors">
              <SearchIcon size={18} />
            </button>
          </form>

          {/* Header actions */}
          <div className="flex items-center gap-5 shrink-0 ml-auto md:ml-0">
            <div className="hidden md:flex items-center gap-2 group">
              <UserIcon size={20} className="text-[#1a2b4a]" />
              <div className="text-xs leading-tight">
                {session?.user ? (
                  <button onClick={() => signOut()} className="block font-medium hover:text-[#c9a961] transition-colors">Sign Out</button>
                ) : (
                  <Link href="/login" className="block hover:text-[#c9a961] transition-colors">Sign In</Link>
                )}
                {session?.user?.role === "admin" ? (
                  <Link href="/admin" className="font-medium text-[#c9a961] block hover:underline">Admin</Link>
                ) : (
                  <span className="font-medium text-[#1a2b4a] block">Account</span>
                )}
              </div>
            </div>


            <Link href="/cart" className="flex items-center gap-2 group">
              <div className="relative">
                <CartIcon size={20} className="text-[#1a2b4a]" />
                {count > 0 && (
                  <span className="absolute -top-2 left-3 bg-[#c9a961] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{count}</span>
                )}
              </div>
              <div className="text-xs leading-tight hidden md:block">
                <span className="block text-gray-500">{count} Item{count !== 1 ? "s" : ""}</span>
                <span className="font-medium text-[#1a2b4a] block">Cart</span>
              </div>
            </Link>

            <button
              className="md:hidden text-[#1a2b4a] p-1"
              onClick={() => setMobileOpen((o) => !o)}
              aria-label="Menu"
            >
              {mobileOpen ? <XIcon size={22} /> : <MenuIcon size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile search */}
        <form onSubmit={handleSearch} className="md:hidden px-4 pb-3 flex h-10 border border-[#e8e4d8] rounded overflow-hidden mx-4 bg-[#fafaf7]">
          <input
            type="text"
            placeholder="Search…"
            className="flex-1 px-3 text-sm outline-none bg-transparent"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
          />
          <button type="submit" className="px-4 text-[#1a2b4a] flex items-center">
            <SearchIcon size={16} />
          </button>
        </form>
      </div>

      {/* Desktop nav */}
      <nav className="bg-white border-b border-[#e8e4d8] hidden md:block">
        <div className="max-w-7xl mx-auto px-4">
          <ul className="flex items-center justify-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="block px-5 py-3 text-[#1a2b4a] text-sm font-medium hover:text-[#c9a961] transition-colors tracking-wide whitespace-nowrap"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden bg-white border-b border-[#e8e4d8]">
          <ul className="px-4 py-2">
            {NAV_LINKS.map((link) => (
              <li key={link.label}>
                <Link
                  href={link.href}
                  className="block py-3 text-[#1a2b4a] text-sm border-b border-[#e8e4d8] last:border-0 hover:text-[#c9a961] transition-colors"
                  onClick={() => setMobileOpen(false)}
                >
                  {link.label}
                </Link>
              </li>
            ))}
            <li>
              {session?.user ? (
                <button
                  onClick={() => { signOut(); setMobileOpen(false); }}
                  className="block py-3 text-[#1a2b4a] text-sm w-full text-left border-t border-[#e8e4d8] mt-1"
                >
                  Sign Out
                </button>
              ) : (
                <Link
                  href="/login"
                  className="block py-3 text-[#1a2b4a] text-sm border-t border-[#e8e4d8] mt-1"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </Link>
              )}
            </li>
          </ul>
        </div>
      )}
    </header>
  );
}
