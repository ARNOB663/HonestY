"use client";
import { useEffect, useState } from "react";
import { ChevronUp } from "./Icons";

// CLS-friendly variant: the button is always mounted (no `return null`) and
// visibility is controlled via opacity + pointer-events. Adding/removing the
// DOM node triggers Vercel's layout-shift reporter even though the button
// is position:fixed, so we avoid that by keeping it in the tree from first
// paint and only animating its appearance.
export default function ScrollToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="Scroll to top"
      tabIndex={show ? 0 : -1}
      className={`fixed bottom-6 right-6 z-50 bg-[#c9a961] text-white w-11 h-11 rounded-full flex items-center justify-center shadow-lg hover:bg-[#a68a4f] transition-all duration-200 ${
        show ? "opacity-100 translate-y-0 pointer-events-auto" : "opacity-0 translate-y-2 pointer-events-none"
      }`}
    >
      <ChevronUp size={18} />
    </button>
  );
}
