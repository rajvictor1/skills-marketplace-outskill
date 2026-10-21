"use client";

import { useMemo, useState } from "react";
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

function ChartPlot({
  data,
  metric,
}: {
  data: TrendPoint[];
  metric: ChartMetric;
}) {
  const [selectedDate, setSelectedDate] = useState("");
  const selected =
    data.find((point) => point.date === selectedDate) ?? data.at(-1);
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
  const summary =
    metric === "runs"
      ? "Daily run volume"
      : metric === "success"
        ? "Daily outcome distribution: successful, human review, and failed runs"
        : metric === "cost"
          ? "Illustrative daily run cost in US dollars"
          : "Illustrative average run latency in minutes";
  const latest = values.at(-1) ?? 0;
  const labels =
    metric === "success"
      ? `${latest.toFixed(1)}% successful in latest sample`
      : metric === "cost"
        ? `$${latest.toFixed(2)} latest sample`
        : metric === "latency"
          ? `${latest.toFixed(1)} min latest sample`
          : `${Math.round(latest).toLocaleString()} runs latest sample`;
  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{summary}</span>
        <span className="font-mono text-foreground">{labels}</span>
      </div>
      <div className="relative overflow-hidden rounded-xl bg-background/45 p-2">
        <div
          className="pointer-events-none absolute inset-x-2 top-2 bottom-8 flex flex-col justify-between"
          aria-hidden="true"
        >
          {[0, 1, 2, 3].map((n) => (
            <span key={n} className="border-t border-border/70" />
          ))}
        </div>
        {metric === "runs" || metric === "success" ? (
          <svg
            role="img"
            aria-label={summary}
            viewBox={`0 0 ${width} ${height}`}
            className="relative h-52 w-full"
            preserveAspectRatio="none"
          >
            <title>{summary}. Illustrative data, not live telemetry.</title>
            {data.map((point, index) => {
              const gap = 3;
              const barWidth = (width - gap * (data.length - 1)) / data.length;
              const total = Math.max(point.runs, 1);
              const barHeight =
                metric === "success"
                  ? height - 18
                  : (total / Math.max(...data.map((item) => item.runs))) *
                    (height - 18);
              const successHeight = (barHeight * point.successful) / total;
              const reviewHeight = (barHeight * point.review) / total;
              const x = index * (barWidth + gap);
              const y = height - barHeight - 8;
              return (
                <g
                  key={point.date}
                  onMouseEnter={() => setSelectedDate(point.date)}
                  onClick={() => setSelectedDate(point.date)}
                >
                  <title>
                    {point.date}: {point.runs.toLocaleString()} completed ·{" "}
                    {point.successful} successful · {point.review} for human
                    review · {point.failed} failed
                  </title>
                  <rect
                    x={x}
                    y={y}
                    width={barWidth}
                    height={successHeight}
                    rx="2"
                    fill="var(--chart-1)"
                    opacity=".86"
                  />
                  <rect
                    x={x}
                    y={y + successHeight}
                    width={barWidth}
                    height={reviewHeight}
                    fill="var(--caution)"
                    opacity=".88"
                  />
                  <rect
                    x={x}
                    y={y + successHeight + reviewHeight}
                    width={barWidth}
                    height={Math.max(
                      0,
                      barHeight - successHeight - reviewHeight,
                    )}
                    rx="2"
                    fill="var(--danger)"
                    opacity=".88"
                  />
                </g>
              );
            })}
          </svg>
        ) : (
          <svg
            role="img"
            aria-label={summary}
            viewBox={`0 0 ${width} ${height}`}
            className="relative h-52 w-full"
            preserveAspectRatio="none"
          >
            <title>{summary}. Illustrative data, not live telemetry.</title>
            <polyline
              points={points}
              fill="none"
              stroke="var(--chart-1)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
            />
            {data.map((point, index) => (
              <circle
                key={point.date}
                cx={10 + (index / Math.max(data.length - 1, 1)) * (width - 20)}
                cy={Number(points.split(" ")[index]?.split(",")[1] ?? 0)}
                r="2.5"
                fill="var(--chart-1)"
              >
                <title>
                  {point.date}:{" "}
                  {metric === "cost"
                    ? `$${point.cost.toFixed(2)}`
                    : `${point.latency} min`}
                </title>
              </circle>
            ))}
          </svg>
        )}
        <div className="mt-1 flex justify-between px-1 text-[10px] font-mono text-muted-foreground">
          <span>{data[0]?.date}</span>
          <span>{data[Math.floor(data.length / 2)]?.date}</span>
          <span>{data.at(-1)?.date}</span>
        </div>
      </div>
      {selected && (
        <div className="mt-3 rounded-lg border border-border bg-background/60 p-3">
          <label
            htmlFor="chart-inspect-day"
            className="mr-2 text-xs text-muted-foreground"
          >
            Inspect sample day
          </label>
          <select
            id="chart-inspect-day"
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
      <div
        className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground"
        aria-label="Chart legend"
      >
        {(metric === "runs" || metric === "success"
          ? [
              ["var(--chart-1)", "Successful"],
              ["var(--caution)", "Human review"],
              ["var(--danger)", "Failed"],
            ]
          : [["var(--chart-1)", metric === "cost" ? "Run cost" : "Latency"]]
        ).map(([color, label]) => (
          <span key={label} className="inline-flex items-center gap-2">
            <i
              className="size-2 rounded-full"
              style={{ backgroundColor: color }}
            />
            {label}
          </span>
        ))}
      </div>
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
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
              metric === key
                ? "bg-primary/10 text-primary"
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
