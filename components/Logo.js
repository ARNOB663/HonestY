export default function Logo({ size = "md", color = "#1a2b4a" }) {
  const heights = { sm: 24, md: 32, lg: 44 };
  const h = heights[size] || heights.md;

  // Elegant italic serif wordmark in Cormorant Garamond. The "H" gets a small
  // gold accent dot to subtly mark the brand without an icon.
  return (
    <div className="flex items-baseline" style={{ height: h }}>
      <span
        className="font-serif tracking-tight leading-none"
        style={{
          color,
          fontSize: h * 0.95,
          fontWeight: 700,
          fontStyle: "italic",
          letterSpacing: "-0.01em",
        }}
      >
        Honesty
      </span>
      <span
        aria-hidden="true"
        style={{
          color: "#c9a961",
          fontSize: h * 0.95,
          fontWeight: 700,
          fontStyle: "italic",
          marginLeft: "0.05em",
          lineHeight: 1,
        }}
      >
        .
      </span>
    </div>
  );
}
