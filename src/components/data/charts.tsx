import { useId } from "react";

export function AreaTrend({
  values,
  label,
  height = 224,
}: {
  values: number[];
  label: string;
  height?: number;
}) {
  const titleId = useId();
  const max = Math.max(...values, 1);
  const usableWidth = 672;
  const baseline = 203;
  const chartTop = 20;
  const scale = baseline - chartTop;
  const pointAt = (value: number, index: number) =>
    `${54 + (index * usableWidth) / Math.max(values.length - 1, 1)},${baseline - (value / max) * scale}`;
  const points = values.map(pointAt).join(" ");
  const lastX = 54 + ((values.length - 1) * usableWidth) / Math.max(values.length - 1, 1);
  const lastY = baseline - (values.at(-1)! / max) * scale;

  return (
    <svg
      className="dashboard-chart-svg"
      viewBox={`0 0 750 ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-labelledby={titleId}
    >
      <title id={titleId}>{label}</title>
      {[28, 72, 116, 160, 203].map((y) => (
        <line key={y} x1="44" x2="736" y1={y} y2={y} stroke="var(--chart-grid)" strokeWidth="1" />
      ))}
      <polygon points={`54,203 ${points} 726,203`} fill="var(--chart-area)" />
      <polyline
        points={points}
        fill="none"
        stroke="var(--chart-line)"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="5.5" fill="var(--chart-line)" stroke="var(--card)" strokeWidth="3" />
    </svg>
  );
}

export function GroupedBars({
  data,
  series,
  label,
  height = 224,
}: {
  data: { label: string; values: number[] }[];
  series: { name: string; color: string }[];
  label: string;
  height?: number;
}) {
  const titleId = useId();
  const max = Math.max(...data.flatMap((item) => item.values), 1);
  const groupWidth = 672 / Math.max(data.length, 1);
  const barWidth = Math.min(18, (groupWidth - 18) / series.length);

  return (
    <svg
      className="dashboard-chart-svg"
      viewBox={`0 0 750 ${height}`}
      role="img"
      aria-labelledby={titleId}
    >
      <title id={titleId}>{label}</title>
      {[28, 72, 116, 160, 203].map((y) => (
        <line key={y} x1="44" x2="736" y1={y} y2={y} stroke="var(--chart-grid)" strokeWidth="1" />
      ))}
      {data.map((item, groupIndex) => {
        const groupStart = 54 + groupIndex * groupWidth + 8;
        return (
          <g key={item.label}>
            {item.values.map((value, seriesIndex) => {
              const barHeight = (value / max) * 175;
              return (
                <rect
                  key={series[seriesIndex]?.name ?? seriesIndex}
                  x={groupStart + seriesIndex * (barWidth + 4)}
                  y={203 - barHeight}
                  width={barWidth}
                  height={Math.max(barHeight, 2)}
                  rx="3"
                  fill={series[seriesIndex]?.color ?? "var(--chart-1)"}
                />
              );
            })}
            <text x={groupStart + (groupWidth - 24) / 2} y={height - 6} textAnchor="middle" fontSize="9" fill="currentColor" opacity="0.6">
              {item.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export function ProgressRow({
  label,
  percent,
  color,
  value,
}: {
  label: string;
  percent: number;
  color: string;
  value?: string;
}) {
  return (
    <li>
      <div className="mb-1 flex items-center justify-between gap-2">
        <span className="text-[11px] text-muted-foreground">{label}</span>
        <span className="text-[11px] font-medium text-card-foreground">{value ?? `${percent}%`}</span>
      </div>
      <div className="h-[5px] overflow-hidden rounded-full bg-muted">
        <span
          className="block h-full rounded-full transition-[width] duration-500"
          style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: color }}
        />
      </div>
    </li>
  );
}

export function DistributionBar({
  segments,
  label,
}: {
  segments: { name: string; percent: number; color: string }[];
  label: string;
}) {
  return (
    <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label={label}>
      {segments.map((segment) => (
        <span
          key={segment.name}
          style={{ width: `${segment.percent}%`, backgroundColor: segment.color }}
          title={`${segment.name}: ${segment.percent}%`}
        />
      ))}
    </div>
  );
}
