"use client";
import { useState } from "react";

// Older products store plain text in `description`. If the value has no HTML
// tags, treat it as plain text: escape it and wrap newline-separated chunks
// in <p> tags so the prose styling still works. Otherwise pass through.
function toRichHtml(value) {
  const str = String(value || "");
  if (/<\/?(p|h\d|ul|ol|li|strong|em|b|i|u|a|br)\b/i.test(str)) return str;
  const escaped = str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return escaped
    .split(/\n\s*\n/)
    .map((p) => `<p>${p.replace(/\n/g, "<br>")}</p>`)
    .join("");
}

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
          <h2 className="text-lg font-semibold text-[#1a1a1a] mb-2">Descriptions</h2>
          <div
            className="product-prose text-gray-700 leading-relaxed max-w-3xl"
            dangerouslySetInnerHTML={{ __html: toRichHtml(description) }}
          />
        </div>
      )}

      {active === "war" && warranty && (
        <div>
          <h2 className="text-2xl font-bold text-[#1a1a1a] mb-4">Warranty</h2>
          <div className="py-2 text-sm text-gray-700 leading-relaxed max-w-3xl whitespace-pre-line">
            {warranty}
          </div>
        </div>
      )}

      <style jsx global>{`
        .product-prose h1, .product-prose h2 {
          font-size: 1.6rem;
          font-weight: 700;
          color: #1a1a1a;
          line-height: 1.25;
          margin: 1.5rem 0 0.75rem;
        }
        .product-prose h3 {
          font-size: 1.15rem;
          font-weight: 600;
          color: #1a1a1a;
          margin: 1rem 0 0.5rem;
        }
        .product-prose p {
          font-size: 0.95rem;
          margin: 0.6rem 0;
        }
        .product-prose ul {
          list-style: none;
          padding-left: 0;
          margin: 0.8rem 0;
        }
        .product-prose ul li {
          position: relative;
          padding-left: 1.25rem;
          margin: 0.4rem 0;
          font-size: 0.95rem;
        }
        .product-prose ul li::before {
          content: "•";
          position: absolute;
          left: 0;
          color: #c9a961;
          font-weight: bold;
        }
        .product-prose ol {
          list-style: decimal;
          padding-left: 1.4rem;
          margin: 0.8rem 0;
        }
        .product-prose ol li { margin: 0.4rem 0; font-size: 0.95rem; }
        .product-prose a {
          color: #1a35d4;
          text-decoration: underline;
        }
        .product-prose strong, .product-prose b { font-weight: 700; color: #1a1a1a; }
      `}</style>
    </section>
  );
}
