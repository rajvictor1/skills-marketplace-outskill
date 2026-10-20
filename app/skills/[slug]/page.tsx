import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import matter from "gray-matter";
import {
  ArrowLeft,
  Download,
  FileText,
  TerminalSquare,
  Clock,
  Package,
} from "lucide-react";

import { TrustBadge } from "@/components/trust-badge";
import { FindingsList } from "@/components/findings-list";
import { Markdown } from "@/components/markdown";
import { InstallCommand } from "@/components/install-command";
import { DemoDataNotice } from "@/components/dashboard/demo-data-notice";
import { SEVERITY_META } from "@/lib/trust";
import { getCatalogSkillBySlug } from "@/lib/skills/catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lookup = await getCatalogSkillBySlug(slug);
  if (lookup.status !== "found") return { title: lookup.status === "unavailable" ? "Catalog unavailable" : "Skill not found" };
  const { skill } = lookup;
  return { title: skill.name, description: skill.summary };
}

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await headers();
  const { slug } = await params;
  const lookup = await getCatalogSkillBySlug(slug);
  if (lookup.status === "not_found") notFound();
  if (lookup.status === "unavailable") return <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6"><DemoDataNotice>The catalog database is currently unavailable, so this listing could not be confirmed. Check the database connection and migrations, then try again.</DemoDataNotice></main>;
  const { skill } = lookup;
  const isExample = lookup.source === "demo" || Boolean(skill.metadata?.isSample);

  const severityCounts = skill.findings.reduce<Record<string, number>>(
    (acc, f) => {
      acc[f.severity] = (acc[f.severity] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Link
        href="/skills"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to catalog
      </Link>

      {/* header */}
      <div className="mt-6 flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
              {skill.category}
            </span>
            {skill.subcategory && <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">{skill.subcategory}</span>}
            {isExample ? <span className="rounded-full border border-primary/20 bg-primary/[0.07] px-2.5 py-1 text-xs font-semibold text-primary">Example skill</span> : <TrustBadge tier={skill.trustTier} />}
            <span className="font-mono text-xs text-muted-foreground">
              v{skill.version}
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {skill.name}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-muted-foreground">
            {skill.summary}
          </p>
          {skill.tags?.length ? <div className="mt-3 flex flex-wrap gap-2">{skill.tags.map((tag) => <span key={tag} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{tag}</span>)}</div> : null}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-[11px] font-medium text-secondary-foreground">
                {skill.author.initials}
              </span>
              <span className="text-foreground">{skill.author.name}</span>
              <span>· {skill.author.role}</span>
            </span>
            {!isExample && <span className="flex items-center gap-1.5">
              <Download className="size-4" aria-hidden />
              Install tracking not connected
            </span>}
            {!isExample && <span className="flex items-center gap-1.5">
              <Clock className="size-4" aria-hidden />
              Updated {skill.updatedAt}
            </span>}
          </div>
        </div>
      </div>

      {isExample && <div className="mt-6"><DemoDataNotice>This is an example for the marketplace preview. It is not a creator submission, has not been security scanned, and cannot be installed from Skillbuffet.</DemoDataNotice></div>}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-12">
        {/* main column */}
        <div className="min-w-0 space-y-10">
          {/* scan report */}
          {!isExample && <section>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Security scan report
              </h2>
              <span className="font-mono text-xs text-muted-foreground">
                {skill.scannerVersion}
              </span>
            </div>

            <div className="mt-4">
              <TrustBadge tier={skill.trustTier} showBlurb />
            </div>

            {/* severity summary */}
            {skill.findings.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(["critical", "high", "medium", "low", "info"] as const)
                  .filter((s) => severityCounts[s])
                  .map((s) => (
                    <span
                      key={s}
                      className={
                        "rounded-full px-2.5 py-0.5 text-xs font-medium " +
                        SEVERITY_META[s].surface
                      }
                    >
                      {severityCounts[s]} {SEVERITY_META[s].label.toLowerCase()}
                    </span>
                  ))}
              </div>
            )}

            <div className="mt-5">
              <FindingsList findings={skill.findings} />
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Classifier: {skill.classifierModel}. Automated vetting reduces
              risk but is not a guarantee. Review a skill before trusting it with
              sensitive data.
            </p>
          </section>}

          {/* SKILL.md */}
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              SKILL.md
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isExample ? "Illustrative instructions for this preview listing. Adapt and review them before submitting a real skill." : "The full instructions that load into your agent. Read them before installing."}
            </p>
            <div className="mt-4 rounded-2xl border border-border bg-card p-6">
              <Markdown>{matter(skill.skillMd).content}</Markdown>
            </div>
          </section>
        </div>

        {/* sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <MarketplaceDetails metadata={skill.metadata} />
          {isExample ? <div className="rounded-2xl border border-border bg-card p-5"><h3 className="text-sm font-semibold text-foreground">Build a real skill</h3><p className="mt-2 text-xs leading-relaxed text-muted-foreground">Use this example for inspiration, then submit your own SKILL.md for security review.</p><Link href="/publish" className="mt-4 inline-flex text-sm font-semibold text-primary hover:underline">Open publishing form</Link></div> : <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="text-sm font-semibold text-foreground">Install</h3>
            <div className="mt-3">
              <InstallCommand slug={skill.slug} />
            </div>
          </div>}

          <div className="rounded-2xl border border-border bg-card p-5">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Package className="size-4 text-muted-foreground" aria-hidden />
              Bundle contents
            </h3>
            <ul className="mt-3 grid gap-2">
              {skill.files.map((f) => (
                <li
                  key={f.path}
                  className="flex items-center gap-2 text-sm"
                >
                  {f.isScript ? (
                    <TerminalSquare
                      className="size-4 shrink-0 text-caution"
                      aria-hidden
                    />
                  ) : (
                    <FileText
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  )}
                  <span className="truncate font-mono text-xs text-foreground">
                    {f.path}
                  </span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground">
                    {f.sizeLabel}
                  </span>
                </li>
              ))}
            </ul>
            {!isExample && <p className="mt-3 text-xs text-muted-foreground">
              Scripts are analyzed statically. We never execute a submitted
              skill.
            </p>}
          </div>
        </aside>
      </div>
    </main>
  );
}

function MarketplaceDetails({ metadata }: { metadata?: import("@/lib/sample-data").SkillMarketplaceMetadata }) {
  if (!metadata) return null;
  const permissions = metadata.requestedPermissions ?? [];
  const compatibility = metadata.compatibility ?? [];
  const hasDetails = metadata.license || permissions.length || compatibility.length || metadata.inputs || metadata.outputs || metadata.dataHandling || metadata.documentationUrl || metadata.supportUrl;
  if (!hasDetails) return null;
  const documentationUrl = safeHttpsUrl(metadata.documentationUrl);
  const supportUrl = safeHttpsUrl(metadata.supportUrl);
  return <section className="rounded-2xl border border-border bg-card p-5" aria-labelledby="skill-profile-title">
    <h3 id="skill-profile-title" className="text-sm font-semibold">Skill profile</h3>
    {metadata.license && <DetailField label="License" value={metadata.license} />}
    <DetailField label="Works with" value={compatibility.length ? compatibility.join(", ") : "Not specified"} />
    <div className="mt-4"><p className="text-xs font-medium text-muted-foreground">Declared access needs</p>{permissions.length ? <ul className="mt-2 grid gap-1.5">{permissions.map((permission) => <li key={permission} className="flex items-start gap-2 text-xs leading-relaxed"><span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-caution" />{permission}</li>)}</ul> : <p className="mt-1 text-xs text-foreground">No extra access declared</p>}</div>
    {metadata.inputs && <DetailField label="Expected inputs" value={metadata.inputs} />}
    {metadata.outputs && <DetailField label="Expected outputs" value={metadata.outputs} />}
    {metadata.dataHandling && <DetailField label="Data handling" value={metadata.dataHandling} />}
    {documentationUrl && <p className="mt-4 text-xs"><a href={documentationUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Documentation ↗</a></p>}
    {supportUrl && <p className="mt-2 text-xs"><a href={supportUrl} target="_blank" rel="noreferrer" className="text-primary hover:underline">Support ↗</a></p>}
    <p className="mt-4 border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">Creator declarations are informational. The scan report is a separate automated review.</p>
  </section>;
}

function DetailField({ label, value }: { label: string; value: string }) {
  return <div className="mt-4"><p className="text-xs font-medium text-muted-foreground">{label}</p><p className="mt-1 break-words text-xs leading-relaxed text-foreground">{value}</p></div>;
}

function safeHttpsUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}
