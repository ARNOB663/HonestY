"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function StaffManager({ initial, currentEmail }) {
  const router = useRouter();
  const [staff, setStaff] = useState(initial);
  const [form, setForm] = useState({ email: "", name: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function invite(e) {
    e.preventDefault();
    setBusy(true); setMsg("");
    const res = await fetch("/api/admin/staff", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setMsg(data.error || "Failed"); return; }
    setForm({ email: "", name: "", password: "" });
    setMsg(data.promoted ? "Existing user promoted to admin." : "Admin created.");
    router.refresh();
  }

  async function demote(id, email) {
    if (email === currentEmail) { alert("You can't demote yourself."); return; }
    if (!confirm(`Remove admin access for ${email}?`)) return;
    const res = await fetch(`/api/admin/staff/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: "user" }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "Failed"); return; }
    setStaff((arr) => arr.filter((u) => u._id !== id));
    router.refresh();
  }

  const field = "w-full border border-gray-300 rounded px-3 py-2 text-sm";
  return (
    <div className="space-y-6">
      <form onSubmit={invite} className="bg-white border border-gray-200 rounded-lg p-5 space-y-4 max-w-2xl">
        <h2 className="font-semibold">Add admin</h2>
        {msg && <p className="text-sm text-gray-700">{msg}</p>}
        <p className="text-xs text-gray-500">If the email already exists, that user is promoted. Otherwise a new admin account is created with the password you set.</p>
        <div className="grid grid-cols-3 gap-3">
          <input className={field} placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className={field} placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className={field} placeholder="Password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        </div>
        <button disabled={busy} className="bg-[#1a2b4a] text-white px-4 py-2 rounded text-sm disabled:opacity-50">{busy ? "…" : "Add admin"}</button>
      </form>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
            <tr><th className="px-4 py-2">Name</th><th className="px-4 py-2">Email</th><th className="px-4 py-2">Added</th><th className="px-4 py-2"></th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {staff.length === 0 && <tr><td colSpan={4} className="px-4 py-10 text-center text-gray-500">No admins.</td></tr>}
            {staff.map((u) => (
              <tr key={u._id}>
                <td className="px-4 py-2">{u.name || "—"}</td>
                <td className="px-4 py-2">{u.email}{u.email === currentEmail && <span className="ml-2 text-xs text-gray-400">(you)</span>}</td>
                <td className="px-4 py-2 text-gray-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-2 text-right">
                  {u.email !== currentEmail && (
                    <button onClick={() => demote(u._id, u.email)} className="text-red-600 hover:underline text-xs">Remove admin</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
