"use client";
// 零依赖 SVG 环形图（growth-board 风格统计卡用）
export interface DonutSegment {
  value: number;
  color: string;
  label?: string;
}

export default function Donut({
  segments,
  size = 130,
  thickness = 16,
  centerLabel,
  centerSub,
}: {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
  centerLabel?: string;
  centerSub?: string;
}) {
  const total = segments.reduce((a, s) => a + Math.max(0, s.value), 0);
  const r = (size - thickness) / 2;
  const C = 2 * Math.PI * r;
  const c = size / 2;
  let acc = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: "block" }}>
      <circle cx={c} cy={c} r={r} fill="none" stroke="var(--border)" strokeWidth={thickness} />
      <g transform={`rotate(-90 ${c} ${c})`}>
        {segments.map((s, i) => {
          const frac = total > 0 ? Math.max(0, s.value) / total : 0;
          const dash = Math.max(0, frac * C - 2);
          const off = -acc * C;
          acc += frac;
          return dash <= 0 ? null : (
            <circle
              key={i}
              cx={c} cy={c} r={r} fill="none"
              stroke={s.color} strokeWidth={thickness}
              strokeDasharray={`${dash} ${C}`}
              strokeDashoffset={off}
              style={{ transition: "stroke-dasharray .5s" }}
            />
          );
        })}
      </g>
      <text x="50%" y={centerSub ? "46%" : "50%"} textAnchor="middle" dominantBaseline="central"
        style={{ fontSize: centerSub ? 20 : 16, fontWeight: 800, fill: "var(--text)" }}>
        {centerLabel}
      </text>
      {centerSub && (
        <text x="50%" y="60%" textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 10, fill: "var(--muted)" }}>
          {centerSub}
        </text>
      )}
    </svg>
  );
}
