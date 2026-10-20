import Link from "next/link";
import { Activity, ArrowRight, ArrowUpRight, CheckCircle2, CircleDollarSign, Clock3, Download, ShieldCheck, Users } from "lucide-react";
import { DemoDataNotice } from "@/components/dashboard/demo-data-notice";
import { TrendChart } from "@/components/dashboard/trend-chart";
import { DASHBOARD_KPIS, DASHBOARD_PULSE, SAMPLE_ACTIVITY, TOP_SKILLS } from "@/lib/dashboard-data";

export default function DashboardOverviewPage() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
      <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Marketplace overview</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Your skills at work</h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">A clear view of skill adoption, agent outcomes, and marketplace health.</p>
        </div>
        <Link href="/publish" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90">Publish a skill <ArrowRight className="size-4" aria-hidden /></Link>
      </div>

      <DemoDataNotice />

      <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Marketplace key metrics">
        {DASHBOARD_KPIS.map((item, index) => <MetricCard key={item.label} {...item} index={index} />)}
      </section>

      <section className="mt-5 grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(18rem,0.9fr)]">
        <TrendChart />
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6" aria-labelledby="top-skills-title">
          <div className="flex items-start justify-between gap-3"><div><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Discovery</p><h2 id="top-skills-title" className="mt-1 text-lg font-semibold">Top skills</h2></div><span className="rounded-full border border-border px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">Sample catalog</span></div>
          <ol className="mt-5 divide-y divide-border/70">
            {TOP_SKILLS.map((skill) => <li key={skill.name} className="flex items-center gap-3 py-4 first:pt-0 last:pb-0">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-secondary font-mono text-xs text-muted-foreground">0{skill.rank}</span>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{skill.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">{skill.category}</p></div>
              <div className="text-right"><p className="font-mono text-sm">{skill.installs.toLocaleString()}</p><p className="text-[10px] text-muted-foreground">installs</p></div>
            </li>)}
          </ol>
          <Link href="/skills" className="mt-5 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">Browse marketplace <ArrowRight className="size-3.5" aria-hidden /></Link>
        </section>
      </section>

      <section className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6" aria-labelledby="pulse-title">
          <div className="flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Marketplace health</p><h2 id="pulse-title" className="mt-1 text-lg font-semibold">Creator & adoption pulse</h2></div><Users className="size-4 text-primary" aria-hidden /></div>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {DASHBOARD_PULSE.map((item, index) => {
              const icons = [Users, Clock3, CircleDollarSign];
              const Icon = icons[index];
              return <div key={item.label} className="rounded-xl border border-border/80 bg-background/40 p-4"><Icon className="size-4 text-muted-foreground" aria-hidden /><p className="mt-4 font-mono text-2xl font-semibold tracking-tight">{item.value}</p><p className="mt-1 text-sm font-medium">{item.label}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.detail}</p></div>;
            })}
          </div>
          <p className="mt-4 text-xs leading-relaxed text-muted-foreground">Time saved is a planning estimate only. Replace it with measured task baselines and completed-run data before using it for customer reporting.</p>
        </section>
        <section className="rounded-2xl border border-border bg-card p-5 sm:p-6" aria-labelledby="activity-title">
          <div className="flex items-center justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground">Recent sample events</p><h2 id="activity-title" className="mt-1 text-lg font-semibold">Activity</h2></div><Activity className="size-4 text-primary" aria-hidden /></div>
          <ol className="mt-5 space-y-5">
            {SAMPLE_ACTIVITY.map((item) => <li key={item.title} className="flex gap-3">
              <span className={`mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full ${item.type === "review" ? "bg-caution/10 text-caution" : "bg-primary/10 text-primary"}`}>{item.type === "review" ? <ShieldCheck className="size-4" aria-hidden /> : item.type === "install" ? <Download className="size-4" aria-hidden /> : <CheckCircle2 className="size-4" aria-hidden />}</span>
              <div className="min-w-0 flex-1"><p className="text-sm font-medium leading-snug">{item.title}</p><p className="mt-1 text-xs text-muted-foreground">{item.detail}</p></div><time className="shrink-0 pt-0.5 text-[10px] text-muted-foreground">{item.time}</time>
            </li>)}
          </ol>
          <Link href="/dashboard/runs" className="mt-5 inline-flex items-center gap-1.5 text-sm text-primary hover:underline">View sample runs <ArrowRight className="size-3.5" aria-hidden /></Link>
        </section>
      </section>
      <div className="mt-5 flex flex-col gap-2 border-t border-border/70 pt-4 text-[11px] leading-relaxed text-muted-foreground sm:flex-row sm:items-center sm:justify-between"><span>Success rate = successful runs ÷ completed runs. Human review remains a separate outcome.</span><span>Demo metrics are not live analytics.</span></div>
    </main>
  );
}

function MetricCard({ label, value, change, note, index }: { label: string; value: string; change: string; note: string; index: number }) {
  const icons = [ShieldCheck, Activity, CheckCircle2, Download];
  const Icon = icons[index] ?? ArrowUpRight;
  return <article className="rounded-2xl border border-border bg-card p-5">
    <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p><Icon className="size-4 text-primary" aria-hidden /></div>
    <p className="mt-4 font-mono text-3xl font-semibold tracking-tight">{value}</p>
    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1"><span className="inline-flex items-center gap-1 text-xs font-medium text-primary"><ArrowUpRight className="size-3" aria-hidden />{change}</span><span className="text-xs text-muted-foreground">{note}</span></div>
  </article>;
}
