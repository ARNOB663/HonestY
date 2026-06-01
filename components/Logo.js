export default function Logo({ size = "md", color = "#1a2b4a" }) {
  const heights = { sm: 24, md: 32, lg: 44 };
  const h = heights[size] || heights.md;

  return (
    <div className="flex items-center gap-2" style={{ height: h }}>
      <svg viewBox="0 0 48 48" width={h} height={h} fill="none" stroke={color} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round">
        {/* H letter frame */}
        <path d="M14 12v24" />
        <path d="M14 24h20" />
        <path d="M34 12v24" />
        {/* Leaf on top-left */}
        <path d="M14 12 C10 7, 14 4, 18 7 C18 10, 16 12, 14 12 Z" fill={color} fillOpacity="0.15" />
        {/* Leaf on top-right */}
        <path d="M34 12 C38 7, 34 4, 30 7 C30 10, 32 12, 34 12 Z" fill={color} fillOpacity="0.15" />
        {/* Sprout from right side */}
        <path d="M40 18 Q44 14, 42 8" />
        <path d="M42 12 Q45 11, 46 9" fill={color} fillOpacity="0.2" />
      </svg>
      <span
        className="font-serif tracking-tight leading-none"
        style={{ color, fontSize: h * 0.7, fontWeight: 800 }}
      >
        Honest
        <span style={{ fontSize: h * 1.05, fontWeight: 900, letterSpacing: "-0.02em", verticalAlign: "baseline" }}>Y</span>
      </span>
    </div>
  );
}
