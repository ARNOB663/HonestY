"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import Logo from "./Logo";
import { SearchIcon, UserIcon, CartIcon, MenuIcon, XIcon, HeartIcon } from "./Icons";
import { formatMoney } from "../lib/format";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Shop All" },
  { href: "/collections/fashion", label: "Fashion" },
  { href: "/collections/home-living", label: "Home & Living" },
  { href: "/collections/beauty", label: "Beauty" },
  { href: "/collections/wellness", label: "Wellness" },
];

function useSearchSuggest(query) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) { setResults([]); return; }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: ctrl.signal });
        if (r.ok) {
          const data = await r.json();
          setResults(data.results || []);
        }
      } catch {} finally { setLoading(false); }
    }, 180);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [query]);
  return { results, loading };
}

function SearchBox({ inputClass, formClass, onNavigate }) {
  const router = useRouter();
  const [val, setVal] = useState("");
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const { results, loading } = useSearchSuggest(val);

  useEffect(() => {
    function onDoc(e) { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function submit(e) {
    e.preventDefault();
    if (val.trim()) {
      setOpen(false);
      onNavigate?.();
      router.push(`/products?q=${encodeURIComponent(val.trim())}`);
    }
  }

  return (
    <div ref={boxRef} className={`relative ${formClass.includes("flex-1") ? "flex-1" : ""}`}>
      <form onSubmit={submit} className={formClass}>
        <input
          type="text"
          placeholder="Search for products, collections, stories…"
          value={val}
          onChange={(e) => { setVal(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className={inputClass}
        />
        <button type="submit" className="px-5 text-[#1a2b4a] flex items-center justify-center hover:bg-[#f5f1e8] transition-colors">
          <SearchIcon size={18} />
        </button>
      </form>
      {open && val.trim().length >= 2 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-[#e8e4d8] rounded-md shadow-lg z-50 max-h-96 overflow-auto">
          {loading && <div className="px-4 py-3 text-sm text-gray-400">Searching…</div>}
          {!loading && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-gray-400">No matches for &ldquo;{val}&rdquo;</div>
          )}
          {results.map((r) => (
            <Link
              key={r.slug}
              href={`/products/${r.slug}`}
              onClick={() => { setOpen(false); onNavigate?.(); }}
              className="flex items-center gap-3 px-3 py-2 hover:bg-[#fafaf7] border-b border-[#f0eee5] last:border-0"
            >
              <div className="relative w-10 h-10 bg-gray-50 rounded shrink-0 overflow-hidden">
                {r.image && <Image src={r.image} alt="" fill sizes="40px" className="object-cover" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#1a2b4a] truncate">{r.title}</p>
                <p className="text-xs text-gray-500 capitalize">{r.collection}</p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-[#b8553a]">{formatMoney(r.price)}</p>
                {!r.inStock && <p className="text-[10px] text-red-600">Out of stock</p>}
              </div>
            </Link>
          ))}
          {results.length > 0 && (
            <button
              onClick={submit}
              className="block w-full text-center px-3 py-2 text-xs text-[#1a2b4a] font-medium hover:bg-[#fafaf7] border-t border-[#e8e4d8]"
            >
              See all results for &ldquo;{val}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function Header({ announcement }) {
  const { count } = useCart();
  const { count: wishCount } = useWishlist();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full">
      {announcement && (
        <div className="bg-[#1a2b4a] text-white text-xs py-2 hidden sm:block">
          <div className="max-w-7xl mx-auto px-4 flex items-center justify-center">
            <p className="text-center tracking-wide">{announcement}</p>
          </div>
        </div>
      )}

      <div className="bg-white border-b border-[#e8e4d8]">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-6">
          <Link href="/" className="shrink-0">
            <Logo size="md" />
          </Link>

          <div className="flex-1 hidden md:block max-w-xl mx-auto">
            <SearchBox
              inputClass="flex-1 px-4 text-sm outline-none text-[#1a2b4a] bg-transparent"
              formClass="flex h-11 border border-[#e8e4d8] rounded overflow-hidden bg-[#fafaf7] focus-within:border-[#1a2b4a] transition-colors"
            />
          </div>

          <div className="flex items-center gap-5 shrink-0 ml-auto md:ml-0">
            <div className="hidden md:flex items-center gap-2 group">
              <UserIcon size={20} className="text-[#1a2b4a]" />
              <div className="text-xs leading-tight">
                {session?.user ? (
                  <>
                    <span className="block text-gray-500">Hi, {(session.user.name || session.user.email || "").split(" ")[0].split("@")[0]}</span>
                    <Link href="/account" className="font-medium text-[#1a2b4a] block hover:text-[#c9a961] transition-colors">My Account</Link>
                  </>
                ) : (
                  <>
                    <Link href="/login" className="block hover:text-[#c9a961] transition-colors">Sign In</Link>
                    <span className="font-medium text-[#1a2b4a] block">Account</span>
                  </>
                )}
                {session?.user?.role === "admin" && (
                  <Link href="/admin" className="font-medium text-[#c9a961] block hover:underline">Admin</Link>
                )}
              </div>
            </div>

            <Link href="/wishlist" className="hidden md:flex items-center text-[#1a2b4a] hover:text-[#c9a961] transition-colors relative" aria-label="Wishlist">
              <HeartIcon size={20} />
              {wishCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-[#b8553a] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{wishCount}</span>
              )}
            </Link>

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

        <div className="md:hidden px-4 pb-3">
          <SearchBox
            inputClass="flex-1 px-3 text-sm outline-none bg-transparent"
            formClass="flex h-10 border border-[#e8e4d8] rounded overflow-hidden bg-[#fafaf7]"
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      </div>

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
              <Link
                href="/wishlist"
                className="block py-3 text-[#1a2b4a] text-sm border-t border-[#e8e4d8] mt-1"
                onClick={() => setMobileOpen(false)}
              >
                Wishlist
              </Link>
            </li>
            {session?.user ? (
              <>
                <li>
                  <Link
                    href="/account"
                    className="block py-3 text-[#1a2b4a] text-sm border-t border-[#e8e4d8] mt-1 font-medium"
                    onClick={() => setMobileOpen(false)}
                  >
                    My Account ({(session.user.name || session.user.email || "").split(" ")[0].split("@")[0]})
                  </Link>
                </li>
                <li>
                  <button
                    onClick={() => { signOut(); setMobileOpen(false); }}
                    className="block py-3 text-[#1a2b4a] text-sm w-full text-left border-t border-[#e8e4d8]"
                  >
                    Sign Out
                  </button>
                </li>
              </>
            ) : (
              <li>
                <Link
                  href="/login"
                  className="block py-3 text-[#1a2b4a] text-sm border-t border-[#e8e4d8] mt-1"
                  onClick={() => setMobileOpen(false)}
                >
                  Sign In
                </Link>
              </li>
            )}
          </ul>
        </div>
      )}
    </header>
  );
}
