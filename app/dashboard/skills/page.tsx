import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Package, ShieldCheck } from "lucide-react";
import { getCreatorWorkspace } from "@/lib/dashboard-queries";
import { Button } from "@/components/ui/button";
import { DemoDataNotice } from "@/components/dashboard/demo-data-notice";
import { TrustBadge } from "@/components/trust-badge";

export const metadata: Metadata = { title: "My skills" };

function StateNotice({ title, body, href, label }: { title: string; body: string; href?: string; label?: string }) {
  return <div className="rounded-2xl border border-border bg-card p-8 text-center sm:p-12"><span className="mx-auto flex size-11 items-center justify-center rounded-xl bg-secondary text-primary"><Package className="size-5" aria-hidden /></span><h2 className="mt-4 text-lg font-semibold">{title}</h2><p className="mx-auto mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">{body}</p>{href && label && <Button asChild className="mt-5"><Link href={href}>{label}<ArrowRight className="size-4" aria-hidden /></Link></Button>}</div>;
}

export default async function MySkillsPage() {
  const workspace = await getCreatorWorkspace();
  const published = workspace.status === "ready" ? workspace.skills.filter((item) => item.status === "published").length : 0;
  const installs = workspace.status === "ready" ? workspace.skills.reduce((total, item) => total + item.installs, 0) : 0;
  return <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Creator workspace</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">My skills</h1><p className="mt-2 text-sm text-muted-foreground">Manage submissions saved to your creator account.</p></div><Button asChild><Link href="/publish">Publish a skill <ArrowRight className="size-4" aria-hidden /></Link></Button></div>
    {workspace.status === "ready" && <div className="mb-5 grid gap-3 sm:grid-cols-3"><SmallMetric label="Your submissions" value={workspace.skills.length.toLocaleString()} /><SmallMetric label="Published" value={published.toLocaleString()} /><SmallMetric label="Installs" value={installs.toLocaleString()} /></div>}
    {workspace.status === "no_database" && <><DemoDataNotice>This creator workspace will show actual submissions after a Postgres database is configured and migrated. The example marketplace skills are not owned by your account.</DemoDataNotice><div className="mt-5"><StateNotice title="Creator storage is not configured" body="Publishing saves the submitted SKILL.md snapshot and scan report in the marketplace database. Set DATABASE_URL and apply the database migrations before accepting submissions." /></div></>}
    {workspace.status === "signed_out" && <StateNotice title="Sign in to view your skills" body="Creator submissions are private to the account that uploaded them. Sign in to view your published and blocked submissions." href="/auth/sign-in" label="Sign in" />}
    {workspace.status === "unavailable" && <StateNotice title="We could not load your creator workspace" body="Check the database connection and confirm the latest database migration has been applied. Your saved submissions have not been changed." />}
    {workspace.status === "ready" && workspace.skills.length === 0 && <StateNotice title="Your creator workspace is ready" body="You have not submitted a skill yet. Add your SKILL.md, choose its category, declare its permissions, and review the scanner report before publishing." href="/publish" label="Publish your first skill" />}
    {workspace.status === "ready" && workspace.skills.length > 0 && <>
      <div className="mb-4 flex items-center gap-2 rounded-xl border border-border bg-card/70 px-4 py-3 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" aria-hidden />These rows come from your signed-in creator account. Install activity and agent runs are not tracked yet, so recorded install counters may remain at zero.</div>
      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="hidden grid-cols-[minmax(14rem,2fr)_1fr_0.8fr_0.7fr_0.7fr] gap-4 border-b border-border px-5 py-3 text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground md:grid"><span>Skill</span><span>Status</span><span>Security review</span><span>Installs</span><span>Updated</span></div>
        <div className="divide-y divide-border/70">{workspace.skills.map((item) => <article key={item.id} className="grid gap-3 px-5 py-4 md:grid-cols-[minmax(14rem,2fr)_1fr_0.8fr_0.7fr_0.7fr] md:items-center md:gap-4">
          <div className="min-w-0"><Link href={item.status === "published" ? `/skills/${item.slug}` : "/security"} className="font-medium hover:text-primary">{item.name}</Link><p className="mt-1 truncate text-xs text-muted-foreground">{item.category}{item.subcategory ? ` · ${item.subcategory}` : ""}{item.version ? ` · v${item.version}` : ""}</p><p className="mt-1 line-clamp-1 text-xs text-muted-foreground">{item.summary ?? "No marketplace summary"}</p></div>
          <div><span className={`inline-flex rounded-full px-2.5 py-1 text-xs capitalize ${item.status === "published" ? "bg-primary/10 text-primary" : item.status === "blocked" ? "bg-danger/10 text-danger" : "bg-secondary text-muted-foreground"}`}>{item.status}</span></div>
          <div>{item.trustTier === "pending" ? <span className="text-xs text-muted-foreground">Pending scan</span> : <TrustBadge tier={item.trustTier} />}{item.riskScore !== null && <p className="mt-1 text-[10px] text-muted-foreground">Risk score {item.riskScore}/100</p>}</div>
          <div className="font-mono text-sm">{item.installs.toLocaleString()}<span className="ml-1 text-[10px] font-sans text-muted-foreground md:hidden">installs</span></div>
          <time dateTime={item.updatedAt.toISOString()} className="text-xs text-muted-foreground">{item.updatedAt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</time>
        </article>)}</div>
      </div>
    </>}
    <p className="mt-6 text-xs leading-relaxed text-muted-foreground">Submitted content and its scan results are stored with the marketplace database; they are not added to this application&apos;s source code repository.</p>
  </main>;
}

function SmallMetric({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-border bg-card p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-2 font-mono text-2xl font-semibold">{value}</p></div>; }
