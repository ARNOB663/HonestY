export default function Logo({ size = "md", color = "#1a2b4a" }) {
  const heights = { sm: 24, md: 32, lg: 44 };
  const h = heights[size] || heights.md;

  return (
    <div className="flex items-center" style={{ height: h }}>
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
