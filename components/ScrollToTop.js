"use client";
import { useEffect, useState } from "react";
import { ChevronUp } from "./Icons";

export default function ScrollToTop() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  if (!show) return null;
  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-50 bg-[#c9a961] text-white w-11 h-11 rounded-full flex items-center justify-center shadow-lg hover:bg-[#a68a4f] transition-colors"
      aria-label="Scroll to top"
    >
      <ChevronUp size={18} />
    </button>
  );
}
