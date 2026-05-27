"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [website, setWebsite] = useState(""); // honeypot — must stay empty
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const r = await fetch("/api/register", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name, email, password, website }),
    });
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setLoading(false);
      return setErr(j.error || "Failed to register");
    }
    await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    router.push("/");
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1a2b4a]">Create Account</h1>
          <p className="text-sm text-gray-500 mt-1">Join Honesty today</p>
        </div>
        <div className="bg-white border border-[#e8e4d8] rounded-lg p-8 shadow-sm">
          <form onSubmit={onSubmit} className="space-y-4">
            {/* Honeypot: hidden from humans, bots tend to fill it. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="hidden"
              aria-hidden="true"
            />
            <div>
              <label className="block text-sm font-medium text-[#1a2b4a] mb-1.5">Full Name</label>
              <input
                className="w-full border border-[#e8e4d8] rounded px-3 py-2.5 text-sm outline-none focus:border-[#1a2b4a] transition-colors"
                placeholder="John Doe"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
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
              <label className="block text-sm font-medium text-[#1a2b4a] mb-1.5">Password</label>
              <input
                className="w-full border border-[#e8e4d8] rounded px-3 py-2.5 text-sm outline-none focus:border-[#1a2b4a] transition-colors"
                type="password"
                placeholder="Min. 8 characters"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {err && <p className="text-[#b8553a] text-sm">{err}</p>}
            <button
              disabled={loading}
              className="w-full bg-[#1a2b4a] text-white font-bold py-3 rounded text-sm tracking-wide hover:bg-[#0e1a30] transition-colors disabled:opacity-50 mt-2"
            >
              {loading ? "Creating…" : "CREATE ACCOUNT"}
            </button>
          </form>
          <p className="mt-5 text-sm text-center text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-[#1a2b4a] font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
