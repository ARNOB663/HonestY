"use client";
import { useEffect } from "react";

// Triggers the browser print dialog when the invoice page loads.
// Admin opens the invoice in a new tab → print dialog appears automatically.
export default function InvoiceAutoPrint() {
  useEffect(() => {
    const t = setTimeout(() => {
      try { window.print(); } catch {}
    }, 300);
    return () => clearTimeout(t);
  }, []);
  return null;
}
