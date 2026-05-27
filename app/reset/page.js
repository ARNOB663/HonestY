"use client";
import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr("");
    if (password.length < 8) return setErr("Password must be at least 8 characters");
    if (password !== confirm) return setErr("Passwords don't match");
    setLoading(true);
    const r = await fetch("/api/auth/reset", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    setLoading(false);
    const data = await r.json().catch(() => ({}));
    if (!r.ok) return setErr(data.error || "Could not reset");
    setDone(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1a2b4a]">Set a new password</h1>
        </div>
        <div className="bg-white border border-[#e8e4d8] rounded-lg p-8 shadow-sm">
          {!token ? (
            <p className="text-sm text-red-600">
              This link is missing a token. <Link href="/forgot" className="underline">Request a new reset link</Link>.
            </p>
          ) : done ? (
            <p className="text-sm text-green-700">Password updated. Redirecting to sign in…</p>
          ) : (
            <form onSubmit={submit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#1a2b4a] mb-1.5">New password</label>
                <input
                  className="w-full border border-[#e8e4d8] rounded px-3 py-2.5 text-sm outline-none focus:border-[#1a2b4a]"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  maxLength={200}
                  autoComplete="new-password"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#1a2b4a] mb-1.5">Confirm password</label>
                <input
                  className="w-full border border-[#e8e4d8] rounded px-3 py-2.5 text-sm outline-none focus:border-[#1a2b4a]"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  minLength={8}
                  maxLength={200}
                  autoComplete="new-password"
                />
              </div>
              {err && <p className="text-sm text-red-600">{err}</p>}
              <button
                disabled={loading}
                className="w-full bg-[#1a2b4a] text-white font-bold py-3 rounded text-sm tracking-wide hover:bg-[#0e1a30] disabled:opacity-50"
              >
                {loading ? "Saving…" : "UPDATE PASSWORD"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPage() {
  return (
    <Suspense fallback={<div className="px-4 py-16 text-center text-gray-400">Loading…</div>}>
      <ResetForm />
    </Suspense>
  );
}
