"use client";

export default function AdminError({ error, reset }) {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-semibold mb-2">Admin error</h1>
      <p className="text-sm text-gray-600 mb-4">{error?.message || "Unexpected error."}</p>
      <button onClick={() => reset()} className="bg-[#1a2b4a] text-white px-4 py-2 rounded text-sm">Try again</button>
    </div>
  );
}
