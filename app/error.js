"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }) {
  // Surface in console + Vercel logs so we can actually diagnose what broke.
  useEffect(() => { console.error("Storefront error:", error); }, [error]);
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-[#c9a961] text-xs font-semibold tracking-[0.2em] uppercase mb-2">Something broke</p>
        <h1 className="font-serif text-3xl text-[#1a2b4a] mb-4">We hit a snag.</h1>
        <p className="text-sm text-gray-500 mb-6">An unexpected error occurred. You can retry, or head back to the shop.</p>
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => reset()} className="bg-[#1a2b4a] text-white px-5 py-2.5 rounded text-sm hover:bg-[#0e1a30]">Try again</button>
          <Link href="/" className="border border-[#1a2b4a] text-[#1a2b4a] px-5 py-2.5 rounded text-sm hover:bg-[#1a2b4a] hover:text-white">Go home</Link>
        </div>
      </div>
    </div>
  );
}
