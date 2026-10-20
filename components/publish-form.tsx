"use client";

import { useActionState, useMemo, useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  CircleAlert,
  FileText,
  LockKeyhole,
  ShieldCheck,
  UploadCloud,
} from "lucide-react";

import {
  INITIAL_PUBLISH_STATE,
  publishSkill,
} from "@/app/actions/publish-skill";
import { TrustBadge } from "@/components/trust-badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORY_GROUPS, getSubcategories } from "@/lib/skills/taxonomy";

type SourceType = "paste" | "upload" | "github";

const PERMISSIONS = [
  "Read local files",
  "Write or modify files",
  "Use the internet or network",
  "Run shell commands",
  "Connect to external apps or APIs",
  "Request human approval before actions",
];

const COMPATIBILITY = [
  "Claude Code",
  "Claude Desktop",
  "Cursor",
  "Windsurf",
  "Other agent",
];

const PLACEHOLDER = `---
name: my-skill
description: What the skill does and when an AI agent should use it.
---

# My Skill

Explain the workflow your agent should follow, step by step.
Keep instructions concrete. Do not ask the agent to reveal secrets or run untrusted code.`;

const inputClass = "min-h-11 rounded-xl border-border bg-background/60";

export function PublishForm({ initialCategory = "Marketing" }: { initialCategory?: string }) {
  const [sourceType, setSourceType] = useState<SourceType>("paste");
  const [category, setCategory] = useState<string>(initialCategory);
  const [subcategory, setSubcategory] = useState<string>(getSubcategories(initialCategory)[0] ?? "");
  const [selectedFileName, setSelectedFileName] = useState("");
  const [state, formAction, pending] = useActionState(
    publishSkill,
    INITIAL_PUBLISH_STATE,
  );
  const subcategories = useMemo(() => getSubcategories(category), [category]);

  return (
    <form action={formAction} className="space-y-8">
      <input type="hidden" name="sourceType" value={sourceType} />

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <FileText className="size-4.5" aria-hidden />
          </span>
          <div>
            <h2 className="text-base font-semibold text-foreground">1. Add your skill instructions</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Submit a standalone <code className="font-mono">SKILL.md</code> file. It needs YAML frontmatter with a lowercase ID and a clear description.
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2" role="tablist" aria-label="Skill source">
          <SourceTab active={sourceType === "paste"} onClick={() => setSourceType("paste")} icon={<FileText className="size-4" aria-hidden />}>Paste text</SourceTab>
          <SourceTab active={sourceType === "upload"} onClick={() => setSourceType("upload")} icon={<UploadCloud className="size-4" aria-hidden />}>Upload file</SourceTab>
          <SourceTab active={sourceType === "github"} onClick={() => setSourceType("github")} icon={<ArrowRight className="size-4 -rotate-45" aria-hidden />}>Import GitHub</SourceTab>
        </div>

        {sourceType === "paste" && (
          <div className="mt-5 grid gap-2">
            <Label htmlFor="skill-md">SKILL.md contents</Label>
            <Textarea
              id="skill-md"
              name="skillMd"
              placeholder={PLACEHOLDER}
              spellCheck={false}
              className="min-h-72 rounded-xl bg-background/60 font-mono text-sm leading-relaxed"
              disabled={pending}
              required
            />
            <p className="text-xs text-muted-foreground">UTF-8 Markdown, up to 256 KB.</p>
          </div>
        )}

        {sourceType === "upload" && (
          <div className="mt-5 grid gap-2">
            <Label htmlFor="skill-file">Choose SKILL.md</Label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border bg-background/40 px-6 py-10 text-center transition-colors hover:border-primary/50">
              <span className="flex size-11 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <UploadCloud className="size-5" aria-hidden />
              </span>
              <span>
                <span className="block text-sm font-medium text-foreground">{selectedFileName || "Choose a SKILL.md file"}</span>
                <span className="mt-1 block text-xs text-muted-foreground">One UTF-8 Markdown file · up to 256 KB</span>
              </span>
              <input
                id="skill-file"
                name="skillFile"
                type="file"
                accept=".md,text/markdown,text/plain"
                className="sr-only"
                disabled={pending}
                onChange={(event) => setSelectedFileName(event.target.files?.[0]?.name ?? "")}
              />
            </label>
            <p className="text-xs text-muted-foreground">This first publishing flow scans and stores SKILL.md. ZIP bundles and companion scripts are not accepted yet.</p>
          </div>
        )}

        {sourceType === "github" && (
          <div className="mt-5 grid gap-2">
            <Label htmlFor="repository-url">Public GitHub repository</Label>
            <Input
              id="repository-url"
              name="repositoryUrl"
              type="url"
              placeholder="https://github.com/your-org/your-skill"
              className={inputClass}
              disabled={pending}
              required
            />
            <p className="text-xs leading-relaxed text-muted-foreground">We read and scan only the root <code className="font-mono">SKILL.md</code> on the repository&apos;s default branch. Private repos, subfolders, scripts, and ZIP bundles are not supported in this first version.</p>
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <SectionIntro number="2" title="Describe it for the marketplace" description="Help a person or agent decide when this skill is the right fit." />
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Marketplace title" id="display-name" hint="A human-readable name, such as SEO Content Brief Builder.">
            <Input id="display-name" name="displayName" placeholder="SEO Content Brief Builder" className={inputClass} minLength={3} maxLength={80} required disabled={pending} />
          </Field>
          <Field label="Version" id="version-label" hint="Use semantic versioning: 1.0.0.">
            <Input id="version-label" name="versionLabel" defaultValue="1.0.0" className={`${inputClass} font-mono`} required disabled={pending} />
          </Field>
          <Field label="Category" id="category" hint="Choose one main category; this controls discovery filters.">
            <select
              id="category"
              name="category"
              value={category}
              onChange={(event) => {
                const nextCategory = event.target.value;
                setCategory(nextCategory);
                setSubcategory(getSubcategories(nextCategory)[0] ?? "");
              }}
              className={`${inputClass} w-full px-3 text-sm text-foreground`}
              disabled={pending}
            >
              {CATEGORY_GROUPS.map((group) => (
                <optgroup key={group.name} label={group.name}>
                  {group.categories.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}
                </optgroup>
              ))}
            </select>
          </Field>
          <Field label="Subcategory" id="subcategory" hint="Adds a more specific browse filter.">
            <select id="subcategory" name="subcategory" value={subcategory} onChange={(event) => setSubcategory(event.target.value)} className={`${inputClass} w-full px-3 text-sm text-foreground`} disabled={pending}>
              {subcategories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </Field>
          <Field label="Marketplace summary" id="summary" hint="20–280 characters. This appears on cards and search results." className="sm:col-span-2">
            <Textarea id="summary" name="summary" placeholder="Turns a target keyword into a practical content brief with intent, outline, entities, and internal links." className="min-h-24 rounded-xl bg-background/60" minLength={20} maxLength={280} required disabled={pending} />
          </Field>
          <Field label="Tags" id="tags" hint="Optional; up to 8 comma-separated tags.">
            <Input id="tags" name="tags" placeholder="SEO, content strategy, research" className={inputClass} disabled={pending} />
          </Field>
          <Field label="License" id="license" hint="Make reuse terms clear before publication.">
            <select id="license" name="license" defaultValue="" className={`${inputClass} w-full px-3 text-sm text-foreground`} required disabled={pending}>
              <option value="" disabled>Select a license</option>
              <option value="MIT">MIT</option>
              <option value="Apache-2.0">Apache-2.0</option>
              <option value="CC-BY-4.0">CC BY 4.0</option>
              <option value="Proprietary">Proprietary</option>
              <option value="Other">Other / specify in documentation</option>
            </select>
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <SectionIntro number="3" title="Declare compatibility and access" description="These declarations help people review the skill before installing it. They do not grant an agent access to these systems." />
        <div className="mt-6 grid gap-7 sm:grid-cols-2">
          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium text-foreground">Works with</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {COMPATIBILITY.map((item) => <CheckOption key={item} name="compatibility" value={item} label={item} />)}
            </div>
          </fieldset>
          <fieldset className="grid gap-3">
            <legend className="text-sm font-medium text-foreground">Declared access needs</legend>
            <p className="-mt-2 text-xs text-muted-foreground">Select every permission this skill may ask its user or agent to use. Leave blank if no extra access is needed.</p>
            <div className="grid gap-2">
              {PERMISSIONS.map((item) => <CheckOption key={item} name="permission" value={item} label={item} />)}
            </div>
          </fieldset>
        </div>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Expected inputs" id="inputs" hint="What information does the user provide?">
            <Textarea id="inputs" name="inputs" placeholder="Target keyword, audience, product context" className="min-h-24 rounded-xl bg-background/60" maxLength={1000} disabled={pending} />
          </Field>
          <Field label="Expected outputs" id="outputs" hint="What useful result should the skill produce?">
            <Textarea id="outputs" name="outputs" placeholder="A brief with search intent, outline, and internal-link suggestions" className="min-h-24 rounded-xl bg-background/60" maxLength={1000} disabled={pending} />
          </Field>
          <Field label="Data handling" id="data-handling" hint="Mention personal data, external services, or storage if relevant." className="sm:col-span-2">
            <Textarea id="data-handling" name="dataHandling" placeholder="Describe data this skill reads, sends to external services, or stores. Do not include secrets." className="min-h-24 rounded-xl bg-background/60" maxLength={1000} disabled={pending} />
          </Field>
          <Field label="Documentation URL" id="documentation-url">
            <Input id="documentation-url" name="documentationUrl" type="url" placeholder="https://example.com/docs" className={inputClass} disabled={pending} />
          </Field>
          <Field label="Support URL" id="support-url">
            <Input id="support-url" name="supportUrl" type="url" placeholder="https://example.com/support" className={inputClass} disabled={pending} />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <SectionIntro number="4" title="Scan and submit" description="We validate the metadata, scan SKILL.md, and save the version and scan report." />
        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-border bg-background/40 p-4 text-sm leading-relaxed text-muted-foreground">
          <input name="rightsConfirmed" type="checkbox" className="mt-1 size-4 accent-primary" required disabled={pending} />
          <span>I have the right to publish this content, have removed secrets and private customer information, and have described its expected access needs honestly.</span>
        </label>
        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Button size="lg" type="submit" disabled={pending}>
            {pending ? "Scanning and saving…" : "Scan and submit skill"}
            {!pending && <ArrowRight className="size-4" aria-hidden />}
          </Button>
          <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground"><LockKeyhole className="size-3.5" aria-hidden />Sign in required to store a submission</span>
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">Critical scanner findings block publication. Automated checks reduce risk but cannot guarantee a skill is safe. The scanner reads submitted instructions; it does not execute them.</p>
      </section>

      {state.status === "error" || state.status === "unauthorized" ? (
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5" role="alert">
          <p className="flex items-center gap-2 text-sm font-semibold text-danger"><CircleAlert className="size-4" aria-hidden />{state.message}</p>
          {state.issues?.length ? <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-muted-foreground">{state.issues.map((issue) => <li key={issue}>{issue}</li>)}</ul> : null}
          {state.status === "unauthorized" ? <Button className="mt-4" variant="outline" asChild><Link href="/auth/sign-in">Sign in to continue</Link></Button> : null}
        </div>
      ) : null}

      {state.status === "blocked" ? (
        <div className="rounded-2xl border border-danger/30 bg-danger/5 p-5" role="status">
          <p className="flex items-center gap-2 text-sm font-semibold text-danger"><CircleAlert className="size-4" aria-hidden />Submission blocked</p>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{state.message} The scanner reported {state.findingCount} finding{state.findingCount === 1 ? "" : "s"}. Review the SKILL.md and correct any unsafe behavior before submitting another version.</p>
          {state.findings.length > 0 && <ul className="mt-4 grid gap-3">{state.findings.map((item, index) => <li key={`${item.title}-${index}`} className="rounded-xl border border-danger/15 bg-background/50 p-4"><div className="flex flex-wrap items-center gap-2"><span className="rounded-full bg-danger/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-danger">{item.severity}</span>{item.filePath && <code className="text-[10px] text-muted-foreground">{item.filePath}</code>}</div><p className="mt-2 text-sm font-medium text-foreground">{item.title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{item.description}</p>{item.evidence && <pre className="mt-2 overflow-x-auto rounded-lg bg-background p-2 text-xs text-danger"><code>{item.evidence}</code></pre>}</li>)}</ul>}
          <Button className="mt-4" variant="outline" asChild><Link href="/dashboard/skills">Open My Skills<ArrowRight className="size-4" aria-hidden /></Link></Button>
        </div>
      ) : null}

      {state.status === "published" ? (
        <div className="rounded-2xl border border-safe/25 bg-safe/5 p-5" role="status">
          <div className="flex flex-wrap items-center gap-3"><Check className="size-5 text-safe" aria-hidden /><p className="text-sm font-semibold text-foreground">{state.skillName} is in the catalog</p><TrustBadge tier={state.trustTier} /></div>
          <p className="mt-2 text-sm text-muted-foreground">Your version and scan report were saved. Browse the public listing or manage it from Creator Studio.</p>
          <div className="mt-4 flex flex-wrap gap-3"><Button asChild><Link href={`/skills/${state.slug}`}>View listing<ArrowRight className="size-4" aria-hidden /></Link></Button><Button variant="outline" asChild><Link href="/dashboard/skills">Creator Studio</Link></Button></div>
        </div>
      ) : null}

      <div className="rounded-xl border border-border bg-background/30 p-4 text-xs leading-relaxed text-muted-foreground">
        <p className="flex items-center gap-2 font-medium text-foreground"><ShieldCheck className="size-4 text-primary" aria-hidden />What happens to the upload?</p>
        <p className="mt-2">The current version stores SKILL.md, category, tags, declared permissions, and the scan report in the Skillbuffet Postgres database. It is part of the marketplace data, not committed into this application&apos;s source-code repository. GitHub imports keep the repository URL and a snapshot of the submitted SKILL.md.</p>
      </div>
    </form>
  );
}

function SourceTab({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: ReactNode; children: ReactNode }) {
  return <button type="button" role="tab" aria-selected={active} onClick={onClick} className={`inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${active ? "border-primary/40 bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}>{icon}{children}</button>;
}

function SectionIntro({ number, title, description }: { number: string; title: string; description: string }) {
  return <div className="flex items-start gap-3"><span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary font-mono text-xs text-foreground">{number}</span><div><h2 className="text-base font-semibold text-foreground">{title}</h2><p className="mt-1 text-sm leading-relaxed text-muted-foreground">{description}</p></div></div>;
}

function Field({ label, id, hint, className, children }: { label: string; id: string; hint?: string; className?: string; children: ReactNode }) {
  return <div className={`grid content-start gap-2 ${className ?? ""}`}><Label htmlFor={id}>{label}</Label>{children}{hint ? <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}</div>;
}

function CheckOption({ name, value, label }: { name: string; value: string; label: string }) {
  return <label className="flex cursor-pointer items-start gap-2.5 text-sm text-muted-foreground"><input type="checkbox" name={name} value={value} className="mt-0.5 size-4 accent-primary" /><span>{label}</span></label>;
}
