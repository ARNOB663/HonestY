"use client";
import { Suspense, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") || "/";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const res = await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    if (res?.error) return setErr("Invalid email or password");
    router.push(callbackUrl);
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1a2b4a]">Sign In</h1>
          <p className="text-sm text-gray-500 mt-1">Welcome back to Honesty</p>
        </div>
        <div className="bg-white border border-[#e8e4d8] rounded-lg p-8 shadow-sm">
          <button
            type="button"
            onClick={() => signIn("google", { callbackUrl })}
            className="w-full flex items-center justify-center gap-2.5 border border-[#e8e4d8] rounded py-2.5 text-sm font-medium text-[#1a2b4a] hover:bg-gray-50 transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.7-6.1 8-11.3 8a12 12 0 1 1 0-24c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 1 0 24 44a20 20 0 0 0 19.6-23.5z"/>
              <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8A12 12 0 0 1 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7A20 20 0 0 0 6.3 14.7z"/>
              <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2a12 12 0 0 1-18-6.3l-6.5 5A20 20 0 0 0 24 44z"/>
              <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3a12 12 0 0 1-4.1 5.6l6.2 5.2c-.4.4 6.6-4.8 6.6-14.8 0-1.3-.1-2.3-.4-3.5z"/>
            </svg>
            Continue with Google
          </button>
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-[#e8e4d8]" />
            <span className="text-xs text-gray-400 uppercase tracking-wide">or</span>
            <div className="flex-1 h-px bg-[#e8e4d8]" />
          </div>
          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[#1a2b4a] mb-1.5">Email</label>
              <input
                className="w-full border border-[#e8e4d8] rounded px-3 py-2.5 text-sm outline-none focus:border-[#1a2b4a] transition-colors"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-[#1a2b4a]">Password</label>
                <Link href="/forgot" className="text-xs text-[#1a2b4a] hover:underline">Forgot?</Link>
              </div>
              <input
                className="w-full border border-[#e8e4d8] rounded px-3 py-2.5 text-sm outline-none focus:border-[#1a2b4a] transition-colors"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                maxLength={200}
              />
            </div>
            {err && <p className="text-[#b8553a] text-sm">{err}</p>}
            <button
              disabled={loading}
              className="w-full bg-[#1a2b4a] text-white font-bold py-3 rounded text-sm tracking-wide hover:bg-[#0e1a30] transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? "Signing in…" : "SIGN IN"}
            </button>
          </form>
          <p className="mt-5 text-sm text-center text-gray-500">
            New here?{" "}
            <Link href="/register" className="text-[#1a2b4a] font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-gray-400">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
