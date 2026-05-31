"use client";
import { useEffect } from "react";
import Link from "next/link";

export default function AdminError({ error, reset }) {
  useEffect(() => { console.error("Admin error:", error); }, [error]);

  return (
    <div className="bg-white border border-red-200 rounded-xl p-6 max-w-2xl shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-red-700 mb-1">Error</p>
      <h2 className="text-lg font-semibold text-[#1a1a1a] mb-2">This admin page hit an error</h2>
      <p className="text-sm text-gray-600 mb-4">
        {error?.message ? <code className="bg-red-50 px-1.5 py-0.5 rounded text-red-800 text-xs">{error.message}</code> : "Unknown error."}
      </p>
      <div className="flex items-center gap-2">
        <button onClick={() => reset()} className="bg-[#1a2b4a] text-white text-sm px-4 py-1.5 rounded hover:bg-[#0f1c33]">Retry</button>
        <Link href="/admin" className="text-sm text-blue-600 hover:underline">Back to dashboard</Link>
      </div>
    </div>
  );
}
