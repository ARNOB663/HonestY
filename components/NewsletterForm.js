"use client";
import { useState } from "react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot
  const [state, setState] = useState("idle"); // idle | sending | done | error
  const [msg, setMsg] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!email.trim()) return;
    setState("sending"); setMsg("");
    try {
      const r = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), website }),
      });
      if (r.ok) {
        setState("done");
        setMsg("Thanks! You're on the list.");
        setEmail("");
      } else {
        const data = await r.json().catch(() => ({}));
        setState("error");
        setMsg(data.error || "Something went wrong.");
      }
    } catch {
      setState("error");
      setMsg("Network error. Try again.");
    }
  }

  if (state === "done") {
    return <p className="text-[#c9a961] font-medium text-sm py-3">{msg}</p>;
  }

  return (
    <div className="max-w-md mx-auto">
      <form className="flex gap-2" onSubmit={submit}>
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
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email address"
          className="flex-1 px-4 py-3 rounded text-sm outline-none text-[#1a2b4a] bg-white placeholder:text-gray-400"
        />
        <button
          type="submit"
          disabled={state === "sending"}
          className="bg-[#c9a961] text-white font-bold px-6 py-3 rounded text-sm hover:bg-[#a68a4f] transition-colors whitespace-nowrap disabled:opacity-50"
        >
          {state === "sending" ? "…" : "SUBSCRIBE"}
        </button>
      </form>
      {state === "error" && <p className="text-red-300 text-xs mt-2">{msg}</p>}
    </div>
  );
}
