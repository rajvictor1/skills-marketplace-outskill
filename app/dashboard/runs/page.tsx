import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock3, CircleAlert, CircleCheck, ListChecks } from "lucide-react";
import { DemoDataNotice } from "@/components/dashboard/demo-data-notice";
import { SAMPLE_RUNS } from "@/lib/dashboard-data";

export const metadata: Metadata = { title: "Agents & runs" };

export default function RunsPage() {
  const successful = SAMPLE_RUNS.filter((run) => run.status === "success").length;
  const review = SAMPLE_RUNS.filter((run) => run.status === "review").length;
  const failed = SAMPLE_RUNS.filter((run) => run.status === "failed").length;
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <div className="mb-7"><p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Execution monitoring</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Agents & runs</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Review example executions, outcomes, duration, cost, and approval status.</p></div>
    <DemoDataNotice>These run rows are illustrative examples. The product currently stores skill submissions and security scans, but does not execute skills or collect agent run events, cost, or latency.</DemoDataNotice>
    <section className="mt-5 grid gap-3 sm:grid-cols-3" aria-label="Example run outcomes"><OutcomeCard label="Successful" value={successful} note="Sample completed runs" icon={CircleCheck} tone="good" /><OutcomeCard label="Human review" value={review} note="Approval is a separate outcome" icon={ListChecks} tone="review" /><OutcomeCard label="Failed" value={failed} note="Example failed runs" icon={CircleAlert} tone="bad" /></section>
    <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h2 className="text-lg font-semibold">Recent sample runs</h2><p className="mt-1 text-xs text-muted-foreground">Select a row to inspect its example timeline.</p></div><div className="inline-flex items-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-3.5" aria-hidden />Showing {SAMPLE_RUNS.length} examples</div></div>
    <div className="mt-4 overflow-x-auto rounded-2xl border border-border bg-card"><table className="w-full min-w-[760px] border-collapse text-left"><thead><tr className="border-b border-border text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground">{["Skill / agent", "Outcome", "Duration", "Est. cost", "Started", ""].map((heading) => <th key={heading} scope="col" className="px-5 py-3 font-medium">{heading}</th>)}</tr></thead><tbody className="divide-y divide-border/70">{SAMPLE_RUNS.map((run) => <tr key={run.id} className="hover:bg-secondary/30"><td className="px-5 py-4"><p className="text-sm font-medium">{run.skill}</p><p className="mt-1 text-xs text-muted-foreground">{run.agent} · {run.category}</p></td><td className="px-5 py-4"><Status status={run.status} /></td><td className="px-5 py-4 font-mono text-xs">{run.duration}</td><td className="px-5 py-4 font-mono text-xs">{run.cost}</td><td className="px-5 py-4 text-xs text-muted-foreground">{run.started}</td><td className="px-5 py-4"><Link href={`/dashboard/runs/${run.id}`} aria-label={`View ${run.id}`} className="inline-flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground"><ArrowRight className="size-4" aria-hidden /></Link></td></tr>)}</tbody></table></div>
    <p className="mt-4 text-xs text-muted-foreground">Cost and duration are examples, not measured values. A production run record will need an agent execution integration and a defined cost source.</p>
  </main>;
}

function OutcomeCard({ label, value, note, icon: Icon, tone }: { label: string; value: number; note: string; icon: typeof CircleCheck; tone: "good" | "review" | "bad" }) { const style = tone === "good" ? "text-primary bg-primary/10" : tone === "review" ? "text-caution bg-caution/10" : "text-danger bg-danger/10"; return <article className="rounded-2xl border border-border bg-card p-5"><div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{label}</p><span className={`flex size-8 items-center justify-center rounded-lg ${style}`}><Icon className="size-4" aria-hidden /></span></div><p className="mt-3 font-mono text-3xl font-semibold">{value.toLocaleString()}</p><p className="mt-1 text-xs text-muted-foreground">{note}</p></article>; }

function Status({ status }: { status: string }) { const label = status === "success" ? "Successful" : status === "review" ? "Human review" : "Failed"; const classes = status === "success" ? "bg-primary/10 text-primary" : status === "review" ? "bg-caution/10 text-caution" : "bg-danger/10 text-danger"; return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs ${classes}`}>{label}</span>; }
