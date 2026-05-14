"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

function Stars({ rating, size = 14, onChange }) {
  return (
    <div className="inline-flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <button
          key={i}
          type={onChange ? "button" : undefined}
          onClick={onChange ? () => onChange(i) : undefined}
          className={onChange ? "cursor-pointer" : "cursor-default"}
          aria-label={`${i} star${i > 1 ? "s" : ""}`}
        >
          <svg width={size} height={size} viewBox="0 0 24 24" fill={i <= rating ? "#f5a623" : "#e5e7eb"}>
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        </button>
      ))}
    </div>
  );
}

export default function ReviewSection({ slug }) {
  const { data: session } = useSession();
  const [reviews, setReviews] = useState([]);
  const [summary, setSummary] = useState({ count: 0, avg: 0 });
  const [form, setForm] = useState({ rating: 5, title: "", body: "" });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState("");
  const [showForm, setShowForm] = useState(false);

  async function load() {
    try {
      const r = await fetch(`/api/reviews?slug=${encodeURIComponent(slug)}`);
      const data = await r.json();
      setReviews(data.reviews || []);
      setSummary(data.summary || { count: 0, avg: 0 });
    } catch {}
  }
  useEffect(() => { load(); }, [slug]);

  async function submit(e) {
    e.preventDefault();
    setSubmitting(true); setMsg("");
    const r = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productSlug: slug, ...form }),
    });
    const data = await r.json();
    setSubmitting(false);
    if (!r.ok) { setMsg(data.error || "Failed"); return; }
    setMsg("Thanks! Your review is pending approval.");
    setForm({ rating: 5, title: "", body: "" });
    setShowForm(false);
  }

  return (
    <section className="mt-12 border-t border-[#e8e4d8] pt-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-[#1a2b4a]">Reviews</h2>
          {summary.count > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <Stars rating={Math.round(summary.avg)} />
              <span className="text-sm text-gray-600">{summary.avg.toFixed(1)} · {summary.count} review{summary.count !== 1 ? "s" : ""}</span>
            </div>
          )}
        </div>
        {session?.user ? (
          <button onClick={() => setShowForm((s) => !s)} className="bg-[#1a2b4a] text-white text-sm font-bold px-4 py-2 rounded hover:bg-[#0e1a30]">
            {showForm ? "Cancel" : "Write a review"}
          </button>
        ) : (
          <Link href={`/login?callbackUrl=/products/${slug}`} className="text-sm text-[#1a2b4a] hover:underline">Sign in to review</Link>
        )}
      </div>

      {showForm && session?.user && (
        <form onSubmit={submit} className="border border-[#e8e4d8] rounded-lg p-5 mb-6 space-y-3">
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">Rating:</span>
            <Stars rating={form.rating} size={22} onChange={(v) => setForm((f) => ({ ...f, rating: v }))} />
          </div>
          <input
            className="w-full border border-[#e8e4d8] rounded px-3 py-2 text-sm outline-none focus:border-[#1a2b4a]"
            placeholder="Headline (optional)"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            maxLength={120}
          />
          <textarea
            className="w-full border border-[#e8e4d8] rounded px-3 py-2 text-sm outline-none focus:border-[#1a2b4a]"
            placeholder="Share your honest thoughts…"
            rows={4}
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            required
            maxLength={2000}
          />
          {msg && <p className="text-xs text-gray-600">{msg}</p>}
          <button disabled={submitting} className="bg-[#1a2b4a] text-white text-sm font-bold px-4 py-2 rounded disabled:opacity-50">
            {submitting ? "Submitting…" : "Submit review"}
          </button>
        </form>
      )}

      {msg && !showForm && <p className="text-sm text-green-700 mb-4">{msg}</p>}

      {reviews.length === 0 ? (
        <p className="text-sm text-gray-500">No reviews yet. Be the first to share your experience.</p>
      ) : (
        <ul className="space-y-5">
          {reviews.map((r) => (
            <li key={r._id} className="border-b border-[#e8e4d8] pb-5 last:border-0">
              <div className="flex items-center gap-3 mb-1">
                <Stars rating={r.rating} />
                <span className="text-sm font-semibold text-[#1a2b4a]">{r.name}</span>
                {r.verified && <span className="text-[10px] uppercase font-bold text-green-700 bg-green-50 px-1.5 py-0.5 rounded">Verified buyer</span>}
                <span className="text-xs text-gray-400 ml-auto">{new Date(r.createdAt).toLocaleDateString()}</span>
              </div>
              {r.title && <p className="text-sm font-semibold text-[#1a2b4a] mt-1">{r.title}</p>}
              <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{r.body}</p>
              {r.reply && (
                <div className="mt-2 ml-4 pl-3 border-l-2 border-[#c9a961]">
                  <p className="text-xs font-semibold text-[#c9a961] mb-0.5">Honesty replied</p>
                  <p className="text-xs text-gray-600 whitespace-pre-wrap">{r.reply}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
