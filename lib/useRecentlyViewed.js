"use client";
// localStorage-backed list of recently-viewed product slugs.
// - Tracks up to 8 most recent
// - Auto-deduplicates (a re-visited slug moves to the front)
// - SSR-safe (returns empty array until hydrated)

import { useCallback, useEffect, useState } from "react";

const KEY = "honesty.recentlyViewed.v1";
const MAX = 8;

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch { return []; }
}

function save(arr) {
  try { localStorage.setItem(KEY, JSON.stringify(arr.slice(0, MAX))); } catch {}
}

export function useRecentlyViewed() {
  const [slugs, setSlugs] = useState([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSlugs(load());
    setHydrated(true);
  }, []);

  const track = useCallback((slug) => {
    if (!slug) return;
    setSlugs((curr) => {
      const next = [slug, ...curr.filter((s) => s !== slug)].slice(0, MAX);
      save(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    save([]);
    setSlugs([]);
  }, []);

  return { slugs, hydrated, track, clear };
}
