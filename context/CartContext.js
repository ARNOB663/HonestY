"use client";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import { useSession } from "next-auth/react";

const CartContext = createContext(null);
const STORAGE_KEY = "honesty.cart.v2";

function lineKey(slug, variantId) {
  return variantId ? `${slug}#${variantId}` : slug;
}

export function CartProvider({ children }) {
  const { status } = useSession();
  const authed = status === "authenticated";
  const [items, setItems] = useState([]);
  const [hydrated, setHydrated] = useState(false);
  const [notice, setNotice] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const validated = useRef(false);
  const mergedRef = useRef(false);
  const syncTimer = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  // On login: merge the local cart with the server cart (server quantities win
  // per line, local-only lines are kept), then push the merged set back.
  useEffect(() => {
    if (!hydrated || !authed || mergedRef.current) return;
    mergedRef.current = true;
    (async () => {
      try {
        const r = await fetch("/api/cart");
        if (!r.ok) return;
        const { items: serverItems } = await r.json();
        setItems((local) => {
          const byKey = new Map();
          for (const it of serverItems || []) byKey.set(lineKey(it.slug, it.variantId), it);
          for (const it of local) {
            const k = lineKey(it.slug, it.variantId);
            if (byKey.has(k)) byKey.set(k, { ...byKey.get(k), qty: Math.max(byKey.get(k).qty, it.qty) });
            else byKey.set(k, it);
          }
          return [...byKey.values()];
        });
      } catch {}
    })();
  }, [hydrated, authed]);

  // On logout, allow a future login to re-merge.
  useEffect(() => {
    if (!authed) mergedRef.current = false;
  }, [authed]);

  // Debounced push to server when authenticated.
  useEffect(() => {
    if (!hydrated || !authed || !mergedRef.current) return;
    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      }).catch(() => {});
    }, 600);
    return () => clearTimeout(syncTimer.current);
  }, [items, authed, hydrated]);

  // After hydration, sync cart against current product catalog. Drops items
  // that no longer exist or are out of stock; refreshes stale prices.
  // Runs once per session (guarded by validated.current). We intentionally
  // exclude `items` from deps — we want the snapshot at hydration time,
  // not a re-run on every cart mutation.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!hydrated || validated.current) return;
    validated.current = true;
    if (items.length === 0) return;

    const slugs = [...new Set(items.map((i) => i.slug))];
    (async () => {
      try {
        const res = await fetch("/api/cart/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ slugs }),
        });
        if (!res.ok) return;
        const { products } = await res.json();
        const bySlug = Object.fromEntries(products.map((p) => [p.slug, p]));

        let removed = 0;
        let repriced = 0;
        let clamped = 0;
        const next = [];
        for (const it of items) {
          const fresh = bySlug[it.slug];
          if (!fresh) { removed += 1; continue; }
          let price = fresh.price;
          let stock = fresh.inventory;
          let title = it.title;
          let image = fresh.image || it.image;
          if (it.variantId) {
            const v = (fresh.variants || []).find((x) => x.id === it.variantId);
            if (!v) { removed += 1; continue; }
            price = v.price ?? fresh.price;
            stock = v.inventory;
            title = `${fresh.title} — ${v.name}`;
            image = v.image || image;
          } else if (fresh.variants?.length > 0) {
            removed += 1; continue;
          }
          if (stock <= 0) { removed += 1; continue; }
          const qty = Math.min(it.qty, stock);
          if (qty !== it.qty) clamped += 1;
          if (price !== it.price) repriced += 1;
          next.push({
            slug: fresh.slug,
            title,
            price,
            image,
            qty,
            variantId: it.variantId || null,
            variantName: it.variantName || null,
          });
        }
        if (removed || repriced || clamped) {
          const parts = [];
          if (removed) parts.push(`${removed} item${removed > 1 ? "s" : ""} no longer available`);
          if (clamped) parts.push(`${clamped} reduced to available stock`);
          if (repriced) parts.push(`${repriced} price updated`);
          setNotice(parts.join(" · "));
          setItems(next);
        }
      } catch {}
    })();
  }, [hydrated]);

  function add(product, qty = 1, variant = null) {
    setItems((prev) => {
      const key = lineKey(product.slug, variant?.id);
      const i = prev.findIndex((x) => lineKey(x.slug, x.variantId) === key);
      if (i >= 0) {
        const copy = [...prev];
        copy[i] = { ...copy[i], qty: copy[i].qty + qty };
        return copy;
      }
      return [
        ...prev,
        {
          slug: product.slug,
          title: variant ? `${product.title} — ${variant.name}` : product.title,
          price: variant?.price ?? product.price,
          image: variant?.image || product.image,
          qty,
          variantId: variant?.id || null,
          variantName: variant?.name || null,
        },
      ];
    });
  }

  function remove(slug, variantId = null) {
    const key = lineKey(slug, variantId);
    setItems((prev) => prev.filter((x) => lineKey(x.slug, x.variantId) !== key));
  }

  function setQty(slug, qty, variantId = null) {
    const key = lineKey(slug, variantId);
    setItems((prev) =>
      prev
        .map((x) => (lineKey(x.slug, x.variantId) === key ? { ...x, qty: Math.max(1, qty) } : x))
        .filter((x) => x.qty > 0)
    );
  }

  function clear() {
    setItems([]);
    // Flush immediately (checkout navigates away before the debounce fires).
    if (authed && mergedRef.current) {
      fetch("/api/cart", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: [] }),
        keepalive: true,
      }).catch(() => {});
    }
  }

  function dismissNotice() {
    setNotice("");
  }

  const subtotal = items.reduce((s, x) => s + x.price * x.qty, 0);
  const count = items.reduce((s, x) => s + x.qty, 0);

  const openDrawer = () => setDrawerOpen(true);
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, subtotal, count, hydrated, notice, dismissNotice, drawerOpen, openDrawer, closeDrawer }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
