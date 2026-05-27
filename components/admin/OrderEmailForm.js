"use client";
import { useState } from "react";

export default function OrderEmailForm({ id, customerEmail, orderShort }) {
  const [subject, setSubject] = useState(`Update on your order #${orderShort}`);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [msg, setMsg] = useState("");

  async function send(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true); setMsg("");
    const r = await fetch(`/api/admin/orders/${id}/email`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, message }),
    });
    setSending(false);
    if (r.ok) {
      const data = await r.json().catch(() => ({}));
      if (data.skipped) {
        setMsg("Mailer not configured — message not sent.");
      } else {
        setMsg("Sent.");
        setMessage("");
      }
    } else {
      const data = await r.json().catch(() => ({}));
      setMsg(data.error || "Send failed.");
    }
    setTimeout(() => setMsg(""), 4000);
  }

  return (
    <form onSubmit={send} className="bg-white border border-gray-200 rounded-lg p-5">
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <h2 className="font-semibold text-sm">Send custom email</h2>
        <span className="text-xs text-gray-500">To: {customerEmail}</span>
      </div>
      <div className="space-y-2">
        <div>
          <label className="block text-xs uppercase text-gray-500 mb-1">Subject</label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            maxLength={200}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            required
          />
        </div>
        <div>
          <label className="block text-xs uppercase text-gray-500 mb-1">Message</label>
          <textarea
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Hi! Just wanted to let you know…"
            maxLength={5000}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
            required
          />
        </div>
      </div>
      <div className="flex items-center justify-between mt-3">
        <span className="text-xs text-gray-500">{message.length} / 5000</span>
        <div className="flex items-center gap-2">
          {msg && <span className={`text-xs ${msg === "Sent." ? "text-green-700" : "text-red-700"}`}>{msg}</span>}
          <button disabled={sending || !message.trim()} className="bg-[#1a2b4a] text-white text-sm px-4 py-1.5 rounded disabled:opacity-50">
            {sending ? "Sending…" : "Send email"}
          </button>
        </div>
      </div>
    </form>
  );
}
