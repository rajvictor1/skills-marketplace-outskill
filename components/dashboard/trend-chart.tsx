"use client";

import { useId, useMemo, useState } from "react";
import { Activity, Clock3, DollarSign, ListFilter } from "lucide-react";
import {
  getIllustrativeTrend,
  type ChartMetric,
  type RangeKey,
  type TrendPoint,
} from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

const METRICS: { key: ChartMetric; label: string; icon: typeof Activity }[] = [
  { key: "runs", label: "Runs", icon: Activity },
  { key: "success", label: "Outcomes", icon: ListFilter },
  { key: "cost", label: "Cost", icon: DollarSign },
  { key: "latency", label: "Latency", icon: Clock3 },
];

const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: "1d", label: "Today", days: 1 },
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
];

function linePoints(values: number[], width: number, height: number, pad = 8) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  return values
    .map(
      (value, index) =>
        `${pad + (index / Math.max(values.length - 1, 1)) * (width - pad * 2)},${height - pad - ((value - min) / span) * (height - pad * 2)}`,
    )
    .join(" ");
}

const PALETTES: Record<
  ChartMetric,
  { colors: [string, string, string]; label: string }
> = {
  runs: { colors: ["#b39bff", "#79b9fa", "#68d9cc"], label: "Run volume" },
  success: {
    colors: ["#55d6ab", "#f3bf72", "#fb8999"],
    label: "Outcome distribution",
  },
  cost: { colors: ["#f4a58a", "#f0ba7b", "#f5d47b"], label: "Execution cost" },
  latency: {
    colors: ["#89a8ff", "#6ac9f0", "#74ded2"],
    label: "Response time",
  },
};

function ChartPlot({
  data,
  metric,
}: {
  data: TrendPoint[];
  metric: ChartMetric;
}) {
  const chartId = useId().replace(/:/g, "");
  const [selectedDate, setSelectedDate] = useState("");
  const selected =
    data.find((point) => point.date === selectedDate) ?? data.at(-1);
  const { colors } = PALETTES[metric];
  const width = 760;
  const height = 230;
  const values = data.map((point) =>
    metric === "runs"
      ? point.runs
      : metric === "success"
        ? (point.successful / point.runs) * 100
        : metric === "cost"
          ? point.cost
          : point.latency,
  );
  const points = linePoints(values, width, height, 10);
  const coordinates = points
    .split(" ")
    .map((point) => point.split(",").map(Number));
  const maxRuns = Math.max(1, ...data.map((point) => point.runs));
  const summary =
    metric === "runs"
      ? "Daily run volume"
      : metric === "success"
        ? "Daily outcome distribution: successful, human review, and failed runs"
        : metric === "cost"
          ? "Illustrative daily run cost in US dollars"
          : "Illustrative average run latency in minutes";
  const latest = values.at(-1) ?? 0;
  const label =
    metric === "runs"
      ? `${Math.round(latest).toLocaleString()} runs`
      : metric === "success"
        ? `${latest.toFixed(1)}% successful`
        : metric === "cost"
          ? `$${latest.toFixed(2)}`
          : `${latest.toFixed(1)} min`;
  const stacked = metric === "runs" || metric === "success";
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{summary}</span>
        <span
          className="rounded-md px-2 py-1 font-mono"
          style={{ color: colors[0], backgroundColor: `${colors[0]}12` }}
        >
          {label}{" "}
          <span className="font-sans text-[10px] text-muted-foreground">
            latest sample
          </span>
        </span>
      </div>
      <div
        className="relative overflow-hidden rounded-xl border border-border/50 p-2"
        style={{
          background: `linear-gradient(180deg, ${colors[0]}0c, transparent 85%), var(--background)`,
        }}
      >
        <div
          className="pointer-events-none absolute inset-x-2 top-2 bottom-8 flex flex-col justify-between"
          aria-hidden
        >
          {[0, 1, 2, 3].map((n) => (
            <span key={n} className="border-t border-border/50" />
          ))}
        </div>
        <svg
          role="img"
          aria-label={summary}
          viewBox={`0 0 ${width} ${height}`}
          className="relative h-52 w-full"
          preserveAspectRatio="none"
        >
          <title>{summary}. Illustrative data, not live telemetry.</title>
          <defs>
            <linearGradient id={`${chartId}-line`}>
              <stop stopColor={colors[0]} />
              <stop offset=".5" stopColor={colors[1]} />
              <stop offset="1" stopColor={colors[2]} />
            </linearGradient>
            <linearGradient id={`${chartId}-area`} x1="0" y1="0" x2="0" y2="1">
              <stop stopColor={colors[1]} stopOpacity=".32" />
              <stop offset="1" stopColor={colors[0]} stopOpacity=".02" />
            </linearGradient>
            {colors.map((color, i) => (
              <linearGradient
                key={color}
                id={`${chartId}-bar-${i}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop stopColor={color} />
                <stop offset="1" stopColor={color} stopOpacity=".55" />
              </linearGradient>
            ))}
          </defs>
          {stacked ? (
            data.map((point, index) => {
              const gap = data.length > 60 ? 2 : 4;
              const barWidth = (width - gap * (data.length - 1)) / data.length;
              const total = Math.max(point.runs, 1);
              const barHeight =
                metric === "success"
                  ? height - 18
                  : (total / maxRuns) * (height - 18);
              const reviewHeight = (barHeight * point.review) / total;
              const failedHeight = (barHeight * point.failed) / total;
              const successfulHeight = (barHeight * point.successful) / total;
              const x = index * (barWidth + gap);
              const base = height - 8;
              const colorIndex = metric === "runs" ? index % 3 : 0;
              return (
                <g
                  key={point.date}
                  onMouseEnter={() => setSelectedDate(point.date)}
                  onClick={() => setSelectedDate(point.date)}
                >
                  <title>
                    {point.date}: {point.successful} successful · {point.review}{" "}
                    human review · {point.failed} failed
                  </title>
                  <rect
                    x={x}
                    y={base - successfulHeight}
                    width={barWidth}
                    height={successfulHeight}
                    rx="2"
                    fill={`url(#${chartId}-bar-${colorIndex})`}
                  />
                  <rect
                    x={x}
                    y={base - successfulHeight - reviewHeight}
                    width={barWidth}
                    height={reviewHeight}
                    fill="var(--caution)"
                  />
                  <rect
                    x={x}
                    y={base - barHeight}
                    width={barWidth}
                    height={failedHeight}
                    rx="2"
                    fill="var(--danger)"
                  />
                </g>
              );
            })
          ) : (
            <>
              <polygon
                points={`10,${height - 8} ${points} ${coordinates.at(-1)?.[0] ?? 10},${height - 8}`}
                fill={`url(#${chartId}-area)`}
              />
              <polyline
                points={points}
                fill="none"
                stroke={`url(#${chartId}-line)`}
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {data.map((point, index) => (
                <circle
                  key={point.date}
                  cx={coordinates[index]?.[0]}
                  cy={coordinates[index]?.[1]}
                  r={selected?.date === point.date ? 4.5 : 2.5}
                  fill={
                    colors[
                      Math.min(
                        2,
                        Math.floor((index / Math.max(data.length - 1, 1)) * 3),
                      )
                    ]
                  }
                  stroke="var(--background)"
                  strokeWidth="1.5"
                  onMouseEnter={() => setSelectedDate(point.date)}
                  onClick={() => setSelectedDate(point.date)}
                >
                  <title>
                    {point.date}:{" "}
                    {metric === "cost"
                      ? `$${point.cost.toFixed(2)}`
                      : `${point.latency} min`}
                  </title>
                </circle>
              ))}
            </>
          )}
        </svg>
        <div className="mt-1 flex justify-between gap-1 px-1 font-mono text-[10px] text-muted-foreground">
          <span>{data[0]?.date}</span>
          {data.length > 1 && (
            <span>{data[Math.floor(data.length / 2)]?.date}</span>
          )}
          {data.length > 2 && <span>{data.at(-1)?.date}</span>}
        </div>
      </div>
      <div
        className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground"
        aria-label="Chart legend"
      >
        <span className="inline-flex items-center gap-2">
          <i
            className="h-2 w-5 rounded-full"
            style={{
              background:
                stacked && metric === "success"
                  ? colors[0]
                  : `linear-gradient(90deg, ${colors.join(", ")})`,
            }}
          />
          {stacked
            ? "Successful"
            : metric === "cost"
              ? "Run cost · USD"
              : "Latency · minutes"}
        </span>
        {stacked && (
          <>
            <span className="inline-flex items-center gap-2">
              <i className="size-2 rounded-full bg-caution" />
              Human review
            </span>
            <span className="inline-flex items-center gap-2">
              <i className="size-2 rounded-full bg-danger" />
              Failed
            </span>
          </>
        )}
      </div>
      {selected && (
        <div
          className="mt-3 rounded-lg border border-border bg-background/60 p-3"
          style={{ borderLeft: `2px solid ${colors[0]}` }}
        >
          <label
            htmlFor={`${chartId}-day`}
            className="mr-2 text-xs text-muted-foreground"
          >
            Inspect sample day
          </label>
          <select
            id={`${chartId}-day`}
            value={selected.date}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="max-w-full rounded-md border border-border bg-card px-2 py-1 text-xs text-foreground"
          >
            {data.map((point) => (
              <option key={point.date} value={point.date}>
                {point.date}
              </option>
            ))}
          </select>
          <p
            className="mt-2 text-[11px] leading-relaxed text-muted-foreground"
            aria-live="polite"
          >
            {selected.successful} successful · {selected.review} human review ·{" "}
            {selected.failed} failed ·{" "}
            {((selected.successful / selected.runs) * 100).toFixed(1)}% success
            · ${selected.cost.toFixed(2)} sample cost · {selected.latency} min
            latency
          </p>
        </div>
      )}
      {metric === "runs" && (
        <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
          Violet, blue and teal distinguish daily successful-run bars. Amber and
          pink indicate review and failure.
        </p>
      )}
    </div>
  );
}

export function TrendChart({
  data: suppliedData,
  range: suppliedRange,
  onRangeChange,
}: {
  data?: TrendPoint[];
  range?: RangeKey;
  onRangeChange?: (range: RangeKey) => void;
} = {}) {
  const [metric, setMetric] = useState<ChartMetric>("runs");
  const [localRange, setLocalRange] = useState<RangeKey>("30d");
  const range = suppliedRange ?? localRange;
  const setRange = onRangeChange ?? setLocalRange;
  const allData = useMemo(
    () => suppliedData ?? getIllustrativeTrend(),
    [suppliedData],
  );
  const days = RANGES.find((item) => item.key === range)?.days ?? 30;
  const data = allData.slice(-days);
  return (
    <section
      className="rounded-2xl border border-border bg-card p-5 sm:p-6"
      aria-labelledby="activity-chart-title"
      style={{ borderTopWidth: 2, borderTopColor: PALETTES[metric].colors[0] }}
    >
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">
            Usage pulse
          </p>
          <h2 id="activity-chart-title" className="mt-1 text-lg font-semibold">
            Agent activity
          </h2>
        </div>
        <label className="sr-only" htmlFor="trend-range">
          Date range
        </label>
        <select
          id="trend-range"
          value={range}
          onChange={(event) => setRange(event.target.value as RangeKey)}
          className="h-9 rounded-lg border border-border bg-background px-3 text-sm text-foreground"
        >
          {RANGES.map((item) => (
            <option key={item.key} value={item.key}>
              {item.label}
            </option>
          ))}
        </select>
      </div>
      <div
        className="mt-5 flex flex-wrap gap-1 border-b border-border pb-3"
        role="group"
        aria-label="Chart metric"
      >
        {METRICS.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            type="button"
            aria-pressed={metric === key}
            onClick={() => setMetric(key)}
            style={
              metric === key
                ? {
                    color: PALETTES[key].colors[0],
                    backgroundColor: `${PALETTES[key].colors[0]}18`,
                    boxShadow: `inset 0 0 0 1px ${PALETTES[key].colors[0]}40`,
                  }
                : { color: PALETTES[key].colors[0] }
            }
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              metric === key
                ? "font-medium"
                : "text-muted-foreground hover:bg-secondary/70 hover:text-foreground",
            )}
          >
            <Icon className="size-3.5" aria-hidden />
            {label}
          </button>
        ))}
      </div>
      <div className="mt-5">
        <ChartPlot data={data} metric={metric} />
      </div>
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">
        Illustrative trend only. Runs and latency are not yet collected by this
        marketplace.
      </p>
    </section>
  );
}
