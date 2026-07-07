import { useId, useState } from 'react';
import type { SeriesPoint } from '../logic/metrics';
import { formatCurrency, formatPrice } from '../format';

interface SeriesDef {
  key: string;
  label: string;
  colorVar: string; // CSS custom property name, e.g. '--series-1'
  value: (p: SeriesPoint) => number;
}

const WIDTH = 720;
const HEIGHT = 300;
const M = { top: 20, right: 96, bottom: 40, left: 64 };
const PLOT_W = WIDTH - M.left - M.right;
const PLOT_H = HEIGHT - M.top - M.bottom;

function niceTicks(min: number, max: number, count = 5): number[] {
  if (min === max) return [min];
  const span = max - min;
  const step0 = span / count;
  const mag = Math.pow(10, Math.floor(Math.log10(step0)));
  const norm = step0 / mag;
  const step = (norm >= 5 ? 10 : norm >= 2 ? 5 : norm >= 1 ? 2 : 1) * mag;
  const start = Math.ceil(min / step) * step;
  const ticks: number[] = [];
  for (let v = start; v <= max + step * 0.5; v += step) ticks.push(Number(v.toFixed(10)));
  return ticks;
}

function LineChart({
  data,
  series,
  yFormat,
  zeroBased,
  title,
  subtitle,
}: {
  data: SeriesPoint[];
  series: SeriesDef[];
  yFormat: (n: number) => string;
  zeroBased: boolean;
  title: string;
  subtitle: string;
}) {
  const clipId = useId();
  const [hover, setHover] = useState<number | null>(null);

  if (data.length === 0) return null;

  const times = data.map((d) => Date.parse(`${d.date}T00:00:00Z`));
  const xMin = Math.min(...times);
  const xMax = Math.max(...times);
  const xSpan = xMax - xMin || 1;

  const allY = series.flatMap((s) => data.map((d) => s.value(d)));
  let yMin = zeroBased ? 0 : Math.min(...allY);
  let yMax = Math.max(...allY);
  if (yMin === yMax) yMax = yMin + 1;
  const pad = (yMax - yMin) * 0.08;
  yMin = zeroBased ? 0 : yMin - pad;
  yMax = yMax + pad;

  const xScale = (t: number) => M.left + ((t - xMin) / xSpan) * PLOT_W;
  const yScale = (v: number) => M.top + PLOT_H - ((v - yMin) / (yMax - yMin)) * PLOT_H;

  const ticks = niceTicks(yMin, yMax, 5);

  const linePath = (s: SeriesDef) =>
    data
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${xScale(times[i]!).toFixed(2)} ${yScale(s.value(d)).toFixed(2)}`)
      .join(' ');

  // X ticks: first, last and a few between.
  const xTickIdx = (() => {
    if (data.length <= 6) return data.map((_, i) => i);
    const step = (data.length - 1) / 5;
    return Array.from({ length: 6 }, (_, i) => Math.round(i * step));
  })();

  const onMove = (e: React.PointerEvent<SVGRectElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * WIDTH;
    const t = xMin + ((px - M.left) / PLOT_W) * xSpan;
    let best = 0;
    let bestD = Infinity;
    for (let i = 0; i < times.length; i++) {
      const d = Math.abs(times[i]! - t);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    setHover(best);
  };

  const hoverX = hover !== null ? xScale(times[hover]!) : null;

  return (
    <figure className="chart">
      <figcaption className="chart-caption">
        <span className="chart-title">{title}</span>
        <span className="chart-subtitle">{subtitle}</span>
      </figcaption>

      {series.length > 1 && (
        <div className="chart-legend">
          {series.map((s) => (
            <span key={s.key} className="legend-item">
              <span className="legend-swatch" style={{ background: `var(${s.colorVar})` }} />
              {s.label}
            </span>
          ))}
        </div>
      )}

      <svg
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        className="chart-svg"
        role="img"
        aria-label={`${title}. ${subtitle}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <defs>
          <clipPath id={clipId}>
            <rect x={M.left} y={M.top} width={PLOT_W} height={PLOT_H} />
          </clipPath>
        </defs>

        {/* Gridlines + y ticks */}
        {ticks.map((tk) => (
          <g key={tk}>
            <line
              x1={M.left}
              x2={M.left + PLOT_W}
              y1={yScale(tk)}
              y2={yScale(tk)}
              className="grid-line"
            />
            <text x={M.left - 10} y={yScale(tk)} className="axis-text axis-y" dominantBaseline="middle">
              {yFormat(tk)}
            </text>
          </g>
        ))}

        {/* X axis ticks */}
        {xTickIdx.map((i) => (
          <text key={i} x={xScale(times[i]!)} y={M.top + PLOT_H + 22} className="axis-text axis-x">
            {data[i]!.date.slice(2)}
          </text>
        ))}

        {/* Baseline */}
        <line
          x1={M.left}
          x2={M.left + PLOT_W}
          y1={M.top + PLOT_H}
          y2={M.top + PLOT_H}
          className="axis-line"
        />

        {/* Crosshair */}
        {hoverX !== null && (
          <line x1={hoverX} x2={hoverX} y1={M.top} y2={M.top + PLOT_H} className="crosshair" />
        )}

        {/* Series lines */}
        <g clipPath={`url(#${clipId})`}>
          {series.map((s) => (
            <path
              key={s.key}
              d={linePath(s)}
              fill="none"
              stroke={`var(${s.colorVar})`}
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* End dots + direct labels */}
        {series.map((s) => {
          const li = data.length - 1;
          const cy = yScale(s.value(data[li]!));
          const cx = xScale(times[li]!);
          return (
            <g key={`end-${s.key}`}>
              <circle cx={cx} cy={cy} r={4} fill={`var(${s.colorVar})`} className="end-dot" />
              {/* Direct end-label only when a single series can't collide; for
                  converging multi-series the legend + hover tooltip carry identity. */}
              {series.length === 1 && (
                <text x={cx + 10} y={cy} className="end-label" dominantBaseline="middle">
                  {yFormat(s.value(data[li]!))}
                </text>
              )}
            </g>
          );
        })}

        {/* Hover markers */}
        {hover !== null &&
          series.map((s) => (
            <circle
              key={`h-${s.key}`}
              cx={xScale(times[hover]!)}
              cy={yScale(s.value(data[hover]!))}
              r={4}
              fill={`var(${s.colorVar})`}
              className="end-dot"
            />
          ))}

        {/* Tooltip */}
        {hover !== null &&
          (() => {
            const cx = xScale(times[hover]!);
            const boxW = 150;
            const boxH = 22 + series.length * 18;
            const bx = Math.min(Math.max(cx + 12, M.left), M.left + PLOT_W - boxW);
            const by = M.top + 4;
            return (
              <g className="tooltip" pointerEvents="none">
                <rect x={bx} y={by} width={boxW} height={boxH} rx={6} className="tooltip-box" />
                <text x={bx + 10} y={by + 16} className="tooltip-date">
                  {data[hover]!.date}
                </text>
                {series.map((s, i) => (
                  <g key={s.key}>
                    <circle cx={bx + 14} cy={by + 30 + i * 18} r={4} fill={`var(${s.colorVar})`} />
                    <text x={bx + 24} y={by + 34 + i * 18} className="tooltip-row">
                      {s.label}: {yFormat(s.value(data[hover]!))}
                    </text>
                  </g>
                ))}
              </g>
            );
          })()}

        {/* Hover capture */}
        <rect
          x={M.left}
          y={M.top}
          width={PLOT_W}
          height={PLOT_H}
          fill="transparent"
          onPointerMove={onMove}
          onPointerLeave={() => setHover(null)}
        />
      </svg>
    </figure>
  );
}

export function Charts({ series }: { series: SeriesPoint[] }) {
  return (
    <div className="charts">
      <LineChart
        data={series}
        title="Unit price over time"
        subtitle="Price per unit at each transaction's effective date"
        zeroBased={false}
        yFormat={(n) => formatPrice(n)}
        series={[
          { key: 'price', label: 'Unit price', colorVar: '--series-1', value: (p) => p.unitPrice },
        ]}
      />
      <LineChart
        data={series}
        title="Invested vs estimated value"
        subtitle="Cumulative money in vs running units valued at each row's price"
        zeroBased
        yFormat={(n) => formatCurrency(n)}
        series={[
          {
            key: 'invested',
            label: 'Invested',
            colorVar: '--series-1',
            value: (p) => p.cumulativeInvested,
          },
          {
            key: 'value',
            label: 'Est. value',
            colorVar: '--series-2',
            value: (p) => p.portfolioValue,
          },
        ]}
      />
    </div>
  );
}
