// Lightweight pure-SVG chart components — no chart library dependency.

export function BarChart({ data, height = 200, format = (n) => n }) {
  if (!data || data.length === 0) {
    return <p className="text-sm text-gray-400 py-8 text-center">No data yet.</p>;
  }
  const max = Math.max(...data.map((d) => d.value));
  if (max <= 0) {
    return (
      <div className="py-12 text-center text-sm text-gray-400">
        No orders in this period yet.
      </div>
    );
  }
  const width = 600;
  const barW = width / data.length;
  return (
    <div className="w-full overflow-x-auto">
      <svg viewBox={`0 0 ${width} ${height + 30}`} className="w-full" style={{ minWidth: 320 }}>
        {/* baseline */}
        <line x1="0" y1={height} x2={width} y2={height} stroke="#e5e7eb" strokeWidth="1" />
        {data.map((d, i) => {
          const h = (d.value / max) * (height - 20);
          const x = i * barW + 4;
          const y = height - h;
          const isMax = d.value === max && d.value > 0;
          return (
            <g key={i}>
              {d.value > 0 && (
                <rect
                  x={x}
                  y={y}
                  width={Math.max(2, barW - 8)}
                  height={h}
                  rx={3}
                  fill="#1a2b4a"
                  opacity={isMax ? 1 : 0.65}
                >
                  <title>{`${d.label}: ${format(d.value)}`}</title>
                </rect>
              )}
              {data.length <= 16 && (
                <text x={x + (barW - 8) / 2} y={height + 14} textAnchor="middle" fontSize="9" fill="#888">
                  {d.label}
                </text>
              )}
              {isMax && (
                <text x={x + (barW - 8) / 2} y={y - 4} textAnchor="middle" fontSize="9" fill="#1a2b4a" fontWeight="bold">
                  {format(d.value)}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

const COLORS = ["#1a2b4a", "#c9a961", "#b8553a", "#16a34a", "#7c3aed", "#0ea5e9", "#e11d48"];

export function Donut({ segments, size = 160, thickness = 28 }) {
  const items = (segments || []).filter((s) => s && s.value > 0);
  const total = items.reduce((s, x) => s + x.value, 0);
  if (total === 0) {
    return <p className="text-sm text-gray-400 py-12 text-center">No data yet.</p>;
  }

  const radius = size / 2;
  const inner = radius - thickness;
  const cx = radius;
  const cy = radius;

  // Single-segment case: SVG arcs can't draw a full 360° in one path because
  // the start and end points coincide. Render two half-rings instead.
  if (items.length === 1) {
    return (
      <div className="flex items-center gap-6 flex-wrap">
        <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
          <circle cx={cx} cy={cy} r={radius - thickness / 2} fill="none" stroke={COLORS[0]} strokeWidth={thickness} />
          <text x={cx} y={cy - 2} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1a2b4a">{items.length}</text>
          <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="#888">category</text>
        </svg>
        <ul className="space-y-1.5 text-xs">
          <li className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[0] }} />
            <span className="text-gray-700">{items[0].label}</span>
            <span className="text-gray-400">100%</span>
          </li>
        </ul>
      </div>
    );
  }

  let acc = 0;
  function arcPath(start, end) {
    const startAngle = (start * 2 * Math.PI) - Math.PI / 2;
    const endAngle = (end * 2 * Math.PI) - Math.PI / 2;
    const x1 = cx + radius * Math.cos(startAngle);
    const y1 = cy + radius * Math.sin(startAngle);
    const x2 = cx + radius * Math.cos(endAngle);
    const y2 = cy + radius * Math.sin(endAngle);
    const x3 = cx + inner * Math.cos(endAngle);
    const y3 = cy + inner * Math.sin(endAngle);
    const x4 = cx + inner * Math.cos(startAngle);
    const y4 = cy + inner * Math.sin(startAngle);
    const large = end - start > 0.5 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} L ${x3} ${y3} A ${inner} ${inner} 0 ${large} 0 ${x4} ${y4} Z`;
  }

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size}>
        {items.map((s, i) => {
          const frac = s.value / total;
          const start = acc;
          acc += frac;
          return (
            <path key={i} d={arcPath(start, acc)} fill={COLORS[i % COLORS.length]}>
              <title>{`${s.label}: ${Math.round(frac * 100)}%`}</title>
            </path>
          );
        })}
        <text x={cx} y={cy - 2} textAnchor="middle" fontSize="14" fontWeight="bold" fill="#1a2b4a">{items.length}</text>
        <text x={cx} y={cy + 14} textAnchor="middle" fontSize="9" fill="#888">categories</text>
      </svg>
      <ul className="space-y-1.5 text-xs">
        {items.map((s, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
            <span className="text-gray-700">{s.label}</span>
            <span className="text-gray-400">{Math.round((s.value / total) * 100)}%</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
