"use client";
import { useState } from "react";

// Tabbed Specification / Description / Warranty section on the product page.
// Tabs auto-hide when their content is empty.
export default function ProductInfoTabs({ specs, description, warranty }) {
  const tabs = [
    Array.isArray(specs) && specs.length > 0 ? { id: "spec", label: "Specification" } : null,
    description ? { id: "desc", label: "Description" } : null,
    warranty ? { id: "war", label: "Warranty" } : null,
  ].filter(Boolean);

  const [active, setActive] = useState(tabs[0]?.id);
  if (tabs.length === 0) return null;

  return (
    <section className="mt-10">
      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setActive(t.id)}
              className={`text-sm font-medium px-4 py-2 rounded-md transition-colors border ${
                isActive
                  ? "bg-[#b8553a] text-white border-[#b8553a]"
                  : "bg-white text-[#1a2b4a] border-[#e5e7eb] hover:border-[#1a2b4a]"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {active === "spec" && Array.isArray(specs) && specs.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">Specification</h2>
          <div className="border border-[#e5e7eb] rounded-lg overflow-hidden max-w-3xl">
            <table className="w-full text-sm">
              <tbody>
                {specs.map((s, i) => (
                  <tr key={i} className="border-b border-[#e5e7eb] last:border-0">
                    <td className="px-5 py-3.5 text-gray-500 align-top w-1/3 bg-[#fafaf7]">{s.key}</td>
                    <td className="px-5 py-3.5 text-[#1a1a1a]">{s.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {active === "desc" && description && (
        <div>
          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">Description</h2>
          <div className="py-2 text-sm text-gray-600 leading-relaxed max-w-3xl whitespace-pre-line">
            {description}
          </div>
        </div>
      )}

      {active === "war" && warranty && (
        <div>
          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">Warranty</h2>
          <div className="py-2 text-sm text-gray-600 leading-relaxed max-w-3xl whitespace-pre-line">
            {warranty}
          </div>
        </div>
      )}
    </section>
  );
}
