import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Check, Clock3, ListChecks } from "lucide-react";
import { DemoDataNotice } from "@/components/dashboard/demo-data-notice";
import { SAMPLE_RUNS } from "@/lib/dashboard-data";

export const metadata: Metadata = { title: "Run detail" };

export default async function SampleRunDetailPage({ params }: { params: Promise<{ runId: string }> }) {
  const { runId } = await params;
  const run = SAMPLE_RUNS.find((item) => item.id === runId);
  if (!run) notFound();
  return <main className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <Link href="/dashboard/runs" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" aria-hidden />Back to Agents & runs</Link>
    <div className="mt-7"><p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Example execution · {run.id}</p><h1 className="mt-2 text-3xl font-semibold tracking-tight">{run.skill}</h1><p className="mt-2 text-sm text-muted-foreground">{run.agent} · {run.category} · {run.started}</p></div>
    <div className="mt-6"><DemoDataNotice>This is a static example run detail. No agent was invoked and no customer data was processed.</DemoDataNotice></div>
    <section className="mt-5 grid gap-3 sm:grid-cols-3"><InfoCard label="Outcome" value={run.status === "success" ? "Successful" : run.status === "review" ? "Needs human review" : "Failed"} icon={Check} /><InfoCard label="Duration" value={run.duration} icon={Clock3} /><InfoCard label="Approval" value={run.approval} icon={ListChecks} /></section>
    <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-7"><h2 className="text-lg font-semibold">Execution timeline</h2><ol className="mt-5 space-y-5">{[
      ["Skill selected", "The agent selected this skill for the sample task."],
      ["Security and permission context checked", "Declared permissions would be shown here before tool access."],
      [run.status === "review" ? "Waiting for a human decision" : run.status === "failed" ? "Run stopped" : "Run completed", run.status === "review" ? "The sample task is paused until a reviewer approves the proposed action." : run.status === "failed" ? "The sample run stopped with an example error state." : "The sample output was returned to the requesting agent."],
    ].map(([title, description], index) => <li key={title} className="flex gap-3"><span className={`flex size-7 shrink-0 items-center justify-center rounded-full text-xs ${index === 2 && run.status === "review" ? "bg-caution/10 text-caution" : "bg-primary/10 text-primary"}`}>{index + 1}</span><div><p className="text-sm font-medium">{title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{description}</p></div></li>)}</ol><div className="mt-6 rounded-xl border border-border/80 bg-background/40 p-4"><p className="text-xs text-muted-foreground">Example cost</p><p className="mt-1 font-mono text-lg">{run.cost}</p><p className="mt-1 text-[11px] text-muted-foreground">Not connected to provider billing or usage records.</p></div></section>
  </main>;
}

function InfoCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Check }) { return <div className="rounded-xl border border-border bg-card p-4"><div className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="size-3.5" aria-hidden />{label}</div><p className="mt-2 text-sm font-medium">{value}</p></div>; }
