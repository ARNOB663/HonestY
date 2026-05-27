"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

const WishlistContext = createContext(null);
const STORAGE_KEY = "honesty.wishlist.v1";

export function WishlistProvider({ children }) {
  const { data: session, status } = useSession();
  const authed = status === "authenticated";
  const [slugs, setSlugs] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const mergedRef = useRef(false);
  const syncTimer = useRef(null);

  // Hydrate from localStorage first.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setSlugs(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  // On login: merge local + server, push merged set back.
  useEffect(() => {
    if (!hydrated || !authed || mergedRef.current) return;
    mergedRef.current = true;
    (async () => {
      try {
        const r = await fetch("/api/wishlist");
        if (!r.ok) return;
        const data = await r.json();
        const serverSlugs = Array.isArray(data.slugs) ? data.slugs : [];
        const merged = Array.from(new Set([...serverSlugs, ...slugs]));
        setSlugs(merged);
        // If we added anything from local, push back.
        if (merged.length !== serverSlugs.length) {
          fetch("/api/wishlist", {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ slugs: merged }),
          }).catch(() => {});
        }
      } catch {}
    })();
  }, [hydrated, authed, slugs]);

  // On logout: reset the merge flag so a future login resyncs.
  useEffect(() => {
    if (!authed) mergedRef.current = false;
  }, [authed]);

  // Persist locally on every change.
  useEffect(() => {
    if (!hydrated) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs)); } catch {}
  }, [slugs, hydrated]);

  // Debounced push to server when authenticated.
  useEffect(() => {
    if (!hydrated || !authed || !mergedRef.current) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      fetch("/api/wishlist", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ slugs }),
      }).catch(() => {});
    }, 600);
    return () => clearTimeout(syncTimer.current);
  }, [slugs, authed, hydrated]);

  function toggle(slug) {
    if (!slug) return;
    setSlugs((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }
  function has(slug) { return slugs.includes(slug); }
  function remove(slug) { setSlugs((prev) => prev.filter((s) => s !== slug)); }
  function clear() { setSlugs([]); }

  return (
    <WishlistContext.Provider value={{ slugs, hydrated, count: slugs.length, toggle, has, remove, clear }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider");
  return ctx;
}
