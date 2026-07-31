"use client";
import { useEffect, useState } from "react";
import { computeShippingCost } from "./shipping";

const DEFAULT = {
  flatShippingRate: 80,
  freeShippingThreshold: 2000,
  homeDivision: "Chattogram",
  localShippingRate: 60,
  outsideShippingRate: 120,
  bkashNumber: "",
  nagadNumber: "",
  enableBkash: true,
  enableNagad: true,
  enableCod: true,
};
let cache = null;
let inflight = null;

async function fetchSettings() {
  if (cache) return cache;
  if (!inflight) {
    inflight = fetch("/api/public/settings")
      .then((r) => (r.ok ? r.json() : DEFAULT))
      .then((data) => {
        cache = { ...DEFAULT, ...data };
        return cache;
      })
      .catch(() => DEFAULT);
  }
  return inflight;
}

export function useShipping() {
  const [s, setS] = useState(cache || DEFAULT);
  useEffect(() => {
    if (cache) return;
    let alive = true;
    fetchSettings().then((next) => { if (alive) setS(next); });
    return () => { alive = false; };
  }, []);
  return s;
}

// Re-exported so the display price always matches what the server charges.
export { computeShippingCost as computeShipping };
