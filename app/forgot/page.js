"use client";
import { useState } from "react";
import Link from "next/link";

export default function ForgotPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setLoading(true);
    await fetch("/api/auth/forgot", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    }).catch(() => {});
    setLoading(false);
    setSubmitted(true);
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1a2b4a]">Forgot your password?</h1>
          <p className="text-sm text-gray-500 mt-1">We&apos;ll email you a link to reset it.</p>
        </div>
        <div className="bg-white border border-[#e8e4d8] rounded-lg p-8 shadow-sm">
          {submitted ? (
            <div className="text-sm text-gray-700 space-y-3">
              <p>If an account exists for <strong>{email}</strong>, a reset link is on its way.</p>
              <p className="text-xs text-gray-500">Check your spam folder if you don&apos;t see it within a few minutes.</p>
              <Link href="/login" className="inline-block mt-3 text-[#1a2b4a] font-medium hover:underline text-sm">← Back to sign in</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1a2b4a] mb-1.5">Email</label>
                <input
                  className="w-full border border-[#e8e4d8] rounded px-3 py-2.5 text-sm outline-none focus:border-[#1a2b4a] transition-colors"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
              <button
                disabled={loading}
                className="w-full bg-[#1a2b4a] text-white font-bold py-3 rounded text-sm tracking-wide hover:bg-[#0e1a30] transition-colors disabled:opacity-50"
              >
                {loading ? "Sending…" : "SEND RESET LINK"}
              </button>
              <p className="text-sm text-center text-gray-500">
                <Link href="/login" className="hover:underline">Back to sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
