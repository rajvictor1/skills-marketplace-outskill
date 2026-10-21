"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Download,
  GitBranch,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { TrendChart } from "@/components/dashboard/trend-chart";
import {
  getOverviewDemo,
  getActiveSkillSparkline,
  type RangeKey,
  type TrendPoint,
  OVERVIEW_SKILLS,
  SAMPLE_ACTIVITY,
} from "@/lib/dashboard-data";

type CatalogSnapshot = {
  available: boolean;
  count: number;
  downloads: number;
  categories: number;
  categoryTotal: number;
};
const RANGES: { key: RangeKey; label: string; days: number }[] = [
  { key: "1d", label: "Today", days: 1 },
  { key: "7d", label: "Last 7 days", days: 7 },
  { key: "30d", label: "Last 30 days", days: 30 },
  { key: "90d", label: "Last 90 days", days: 90 },
];
const number = (n: number) => n.toLocaleString("en-US");

export function MarketplaceOverview({
  trend,
  catalog,
}: {
  trend: TrendPoint[];
  catalog: CatalogSnapshot;
}) {
  const [range, setRange] = useState<RangeKey>("30d");
  const days = RANGES.find((item) => item.key === range)?.days ?? 30;
  const data = trend.slice(-days);
  const model = getOverviewDemo(data);
  const kpis = [
    {
      label: "Active skills",
      value: number(model.activeSkills),
      note: "Published and available to agents",
      change: "+12.4%",
      icon: ShieldCheck,
      tone: "violet",
      href: "#top-skills",
      values: getActiveSkillSparkline(data, model.activeSkills),
    },
    {
      label: "Successful agent runs",
      value: number(model.successful),
      note: "Tasks completed with usable outcomes",
      change: "+18.7%",
      icon: Activity,
      tone: "teal",
      href: "#agent-activity",
      values: data.map((p) => p.successful),
    },
    {
      label: "Marketplace success rate",
      value: `${model.successRate.toFixed(1)}%`,
      note: "Successful runs ÷ completed runs",
      change: "+1.9 pts",
      icon: CheckCircle2,
      tone: "blue",
      href: "#agent-activity",
      values: data.map((p) => (p.successful / p.runs) * 100),
    },
    {
      label: "Creator earnings",
      value: `$${number(model.earnings)}`,
      note: "Illustrative creator revenue, not payouts",
      change: "+24.1%",
      icon: CircleDollarSign,
      tone: "peach",
      href: "#creator-pulse",
      values: data.map((p) => p.successful * 1.73),
    },
  ];
  return (
    <main className="mx-auto max-w-7xl px-4 py-7 sm:px-6 lg:px-8">
      <header className="flex flex-col justify-between gap-5 xl:flex-row xl:items-end">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.16em] text-primary">
            Your skills ecosystem
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight sm:text-[28px]">
            Marketplace Overview
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
            Marketplace health, agent activity, and creator value in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="overview-range">
            Overview date range
          </label>
          <select
            id="overview-range"
            value={range}
            onChange={(e) => setRange(e.target.value as RangeKey)}
            className="h-11 max-w-full rounded-lg border border-border bg-card px-3 text-xs text-foreground"
          >
            {RANGES.map((item) => (
              <option key={item.key} value={item.key}>
                {item.label}
              </option>
            ))}
          </select>
          <Link
            href="/publish?source=github"
            className="cta-secondary inline-flex h-11 items-center gap-2 rounded-lg border border-border bg-card px-3 text-xs font-medium hover:bg-secondary"
          >
            <GitBranch className="size-3.5" aria-hidden />
            Import repository
          </Link>
          <Link
            href="/publish"
            className="cta-primary inline-flex h-11 items-center gap-2 rounded-lg bg-[#6958ea] px-4 text-xs font-semibold text-white hover:bg-[#7969f1]"
          >
            Publish a skill <ArrowUpRight className="size-3.5" aria-hidden />
          </Link>
        </div>
      </header>

      <div
        className="mt-5 flex gap-3 rounded-xl border border-primary/25 bg-primary/10 px-4 py-3 text-xs leading-relaxed text-muted-foreground"
        role="note"
      >
        <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />
        <p>
          <strong className="text-foreground">Illustrative dashboard.</strong>{" "}
          All operational KPIs, trends, skill rankings, creators and activity
          below are sample data for this design. Agent execution and payments
          are not connected. The separate catalog snapshot at the bottom uses
          real approved listings.
        </p>
      </div>

      <section
        className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-4"
        aria-label="Illustrative marketplace key metrics"
      >
        {kpis.map(({ icon: Icon, ...item }) => (
          <a
            key={item.label}
            href={item.href}
            className="dashboard-metric dashboard-kpi group relative min-w-0 overflow-hidden rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/60 sm:p-5"
            data-tone={item.tone}
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-xs leading-relaxed text-muted-foreground">
                {item.label}
              </p>
              <span className="dashboard-metric-icon flex size-8 shrink-0 items-center justify-center rounded-lg">
                <Icon className="size-4" aria-hidden />
              </span>
            </div>
            <p className="mt-4 text-[clamp(1.35rem,2.3vw,1.9rem)] font-semibold leading-none tracking-tight tabular-nums">
              {item.value}
            </p>
            <div className="mt-4 h-10">
              <Sparkline values={item.values} />
            </div>
            <p className="mt-3 text-xs font-medium text-[#7dd3b2]">
              {item.change}{" "}
              <span className="font-normal text-muted-foreground">
                sample comparison
              </span>
            </p>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              {item.note}
            </p>
          </a>
        ))}
      </section>

      <section
        id="agent-activity"
        className="mt-5 grid scroll-mt-24 gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(16rem,.9fr)]"
      >
        <TrendChart data={trend} range={range} onRangeChange={setRange} />
        <section
          id="top-skills"
          className="min-w-0 scroll-mt-24 rounded-xl border border-border bg-card p-5"
          aria-labelledby="top-skills-title"
        >
          <SectionHeading
            kicker="Discovery & quality"
            title="Top skills this week"
            id="top-skills-title"
          />
          <p className="mt-2 text-[11px] text-muted-foreground">
            Sample ranking · selected period outcomes
          </p>
          <ol className="mt-4 divide-y divide-border">
            {OVERVIEW_SKILLS.map((skill, i) => (
              <li key={skill.name} className="py-3.5 first:pt-0 last:pb-0">
                <details className="group">
                  <summary className="flex cursor-pointer list-none items-start gap-3 rounded-lg outline-offset-4 marker:hidden focus-visible:outline-2 focus-visible:outline-primary">
                    <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 font-mono text-[11px] text-primary">
                      0{i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] font-medium leading-snug">
                        {skill.name}
                      </p>
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {skill.category} ·{" "}
                        {number(Math.round(model.successful * skill.share))}{" "}
                        outcomes
                      </p>
                      <p className="mt-1.5 text-[11px] text-[#7dd3b2]">
                        {skill.reliability}% reliability{" "}
                        <span className="text-muted-foreground">· sample</span>
                      </p>
                    </div>
                    <span
                      className={`inline-flex shrink-0 items-center text-[11px] ${skill.trend < 0 ? "text-caution" : "text-[#7dd3b2]"}`}
                    >
                      {skill.trend < 0 ? (
                        <ArrowDownRight className="size-3" aria-hidden />
                      ) : (
                        <ArrowUpRight className="size-3" aria-hidden />
                      )}
                      {Math.abs(skill.trend)}%
                    </span>
                  </summary>
                  <p className="ml-10 mt-3 rounded-lg bg-background p-3 text-xs leading-relaxed text-muted-foreground">
                    Illustrative skill, not a public listing.{" "}
                    {skill.description} Reliability and outcomes are simulated;
                    this entry cannot be installed.
                  </p>
                </details>
              </li>
            ))}
          </ol>
          <Link
            href="/skills"
            className="mt-5 inline-flex items-center gap-2 text-xs font-medium text-primary hover:underline"
          >
            Browse real skills <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </section>
      </section>

      <div className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,.85fr)]">
        <section
          id="creator-pulse"
          className="min-w-0 scroll-mt-24 rounded-xl border border-border bg-card p-5"
          aria-labelledby="pulse-title"
        >
          <SectionHeading
            kicker="Marketplace health"
            title="Creator & adoption pulse"
            id="pulse-title"
          />
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {[
              {
                icon: Users,
                value: number(model.creators),
                label: "Active creators",
                detail: "Sample creator community",
                tone: "violet",
              },
              {
                icon: Download,
                value: number(model.installs),
                label: "Agent installs",
                detail: "Illustrative enabled skills; not file downloads",
                tone: "teal",
              },
              {
                icon: Clock3,
                value: `${number(model.hours)} hrs`,
                label: "Estimated time saved",
                detail: "Sample estimate, not measured customer savings",
                tone: "peach",
              },
            ].map(({ icon: Icon, ...item }) => (
              <article
                key={item.label}
                data-tone={item.tone}
                className="dashboard-metric rounded-xl border border-border bg-background/50 p-4"
              >
                <div className="flex items-center gap-3">
                  <span className="dashboard-metric-icon flex size-9 items-center justify-center rounded-lg">
                    <Icon className="size-4" aria-hidden />
                  </span>
                  <div>
                    <p className="text-xl font-semibold tabular-nums">
                      {item.value}
                    </p>
                    <h3 className="text-xs font-medium text-muted-foreground">
                      {item.label}
                    </h3>
                  </div>
                </div>
                <p className="mt-3 text-[11px] leading-relaxed text-muted-foreground">
                  {item.detail}
                </p>
              </article>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
            <span>Sample creator mix</span>
            {[
              ["Developer", 34],
              ["Marketing", 26],
              ["Sales", 18],
              ["Operations", 14],
              ["Other", 8],
            ].map(([label, value]) => (
              <span key={label}>
                {label}{" "}
                <strong className="font-medium text-foreground">
                  {value}%
                </strong>
              </span>
            ))}
          </div>
        </section>

        <section
          className="min-w-0 rounded-xl border border-border bg-card p-5"
          aria-labelledby="marketplace-activity-title"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SectionHeading
              kicker="Operational events"
              title="Marketplace activity"
              id="marketplace-activity-title"
            />
            <span className="rounded-full bg-primary/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
              Sample events
            </span>
          </div>
          <ol className="mt-4 divide-y divide-border">
            {SAMPLE_ACTIVITY.map((item) => (
              <li key={item.title} className="py-3 first:pt-0 last:pb-0">
                <details>
                  <summary className="flex cursor-pointer list-none items-center gap-3 rounded-lg outline-offset-4 marker:hidden focus-visible:outline-2 focus-visible:outline-primary">
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-lg ${item.type === "review" ? "bg-caution/10 text-caution" : "bg-primary/10 text-primary"}`}
                    >
                      {item.type === "review" ? (
                        <ShieldCheck className="size-4" aria-hidden />
                      ) : item.type === "install" ? (
                        <Download className="size-4" aria-hidden />
                      ) : (
                        <CheckCircle2 className="size-4" aria-hidden />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[13px] leading-relaxed">
                        {item.title}
                      </p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">
                        {item.detail}
                      </p>
                    </div>
                    <span className="text-right text-[10px] text-muted-foreground">
                      {item.time}
                      <span className="block text-primary">
                        Inspect example
                      </span>
                    </span>
                  </summary>
                  <p className="ml-11 mt-3 rounded-lg bg-background p-3 text-xs leading-relaxed text-muted-foreground">
                    Design example only. This event was not generated by a real
                    agent or customer. No approval, external action or run
                    occurred.
                  </p>
                </details>
              </li>
            ))}
          </ol>
        </section>
      </div>
      <section
        className="mt-5 rounded-xl border border-[#7dd3b2]/25 bg-[#7dd3b2]/5 px-5 py-4"
        aria-labelledby="real-catalog-title"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="real-catalog-title" className="text-sm font-semibold">
            Live catalog snapshot
          </h2>
          <Link
            href="/skills"
            className="text-xs font-medium text-primary hover:underline"
          >
            Open marketplace →
          </Link>
        </div>
        {catalog.available ? (
          <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
            <strong className="text-foreground">{catalog.count}</strong>{" "}
            approved skills ·{" "}
            <strong className="text-foreground">{catalog.downloads}</strong>{" "}
            recorded downloads ·{" "}
            <strong className="text-foreground">
              {catalog.categories}/{catalog.categoryTotal}
            </strong>{" "}
            categories populated. These are real catalog totals and are separate
            from the sample dashboard above.
          </p>
        ) : (
          <p role="status" className="mt-2 text-xs text-caution">
            Live catalog is unavailable. No real counts can be confirmed right
            now.
          </p>
        )}
      </section>
      <p className="mt-4 text-[11px] leading-relaxed text-muted-foreground">
        Demo period: {data[0]?.date} to {data.at(-1)?.date} (UTC). Period
        selector updates sample totals and chart together. Percentage
        comparisons and rankings are illustrative. Downloads do not prove
        installation or successful execution.
      </p>
    </main>
  );
}
function SectionHeading({
  kicker,
  title,
  id,
}: {
  kicker: string;
  title: string;
  id: string;
}) {
  return (
    <div>
      <p className="text-[10px] font-medium uppercase tracking-[.14em] text-muted-foreground">
        {kicker}
      </p>
      <h2 id={id} className="mt-1 text-base font-semibold">
        {title}
      </h2>
    </div>
  );
}
function Sparkline({ values }: { values: number[] }) {
  const id = useId().replace(/:/g, "");
  const min = Math.min(...values);
  const span = Math.max(...values) - min || 1;
  const coordinates =
    values.length === 1
      ? [
          [2, 23],
          [158, 23],
        ]
      : values.map((v, i) => [
          2 + (i / (values.length - 1)) * 156,
          33 - ((v - min) / span) * 28,
        ]);
  const points = coordinates.map((point) => point.join(",")).join(" ");
  const last = coordinates.at(-1) ?? [158, 23];
  return (
    <svg
      aria-hidden
      viewBox="0 0 160 40"
      preserveAspectRatio="none"
      className="dashboard-sparkline h-full w-full"
    >
      <defs>
        <linearGradient id={`${id}-line`}>
          <stop stopColor="var(--metric-color)" />
          <stop offset="1" stopColor="var(--metric-end)" />
        </linearGradient>
        <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor="var(--metric-color)" stopOpacity=".3" />
          <stop offset="1" stopColor="var(--metric-end)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`2,40 ${points} 158,40`} fill={`url(#${id}-area)`} />
      <polyline
        points={points}
        fill="none"
        stroke={`url(#${id}-line)`}
        strokeWidth="2.5"
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx={last[0]} cy={last[1]} r="2.5" fill="var(--metric-end)" />
    </svg>
  );
}
