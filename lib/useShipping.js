"use client";
import { useEffect, useState } from "react";

const DEFAULT = {
  flatShippingRate: 80,
  freeShippingThreshold: 2000,
  dhakaShippingRate: 60,
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

export function computeShipping(subtotal, settings, division) {
  const freeOver = Number(settings.freeShippingThreshold) || 0;
  if (freeOver > 0 && subtotal >= freeOver) return 0;
  if (division !== undefined) {
    const isDhaka = String(division || "").trim().toLowerCase() === "dhaka";
    if (isDhaka && Number(settings.dhakaShippingRate)) return Number(settings.dhakaShippingRate);
    if (!isDhaka && Number(settings.outsideShippingRate)) return Number(settings.outsideShippingRate);
  }
  return Number(settings.flatShippingRate) || 0;
}
