"use client";

import { useState } from "react";
import Link from "next/link";
import { inspectRecipeMarkdown, submitRecipeMarkdown } from "@/app/actions/recipe-markdown";
import { CATEGORY_GROUPS, getSubcategories } from "@/lib/skills/taxonomy";

type Inspection = Awaited<ReturnType<typeof inspectRecipeMarkdown>>;

export function RecipeMarkdownPublisher({ initialCategory = "Marketing" }: { initialCategory?: string }) {
  const [recipeFile, setRecipeFile] = useState<File | null>(null);
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [recipeId, setRecipeId] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState(initialCategory);
  const [subcategory, setSubcategory] = useState(getSubcategories(initialCategory)[0] ?? "");
  const [license, setLicense] = useState("");
  const [rights, setRights] = useState(false);
  const [inspection, setInspection] = useState<Inspection | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function makeForm() {
    const form = new FormData();
    if (recipeFile) form.set("recipe", recipeFile);
    if (reportFile) form.set("validationReport", reportFile);
    form.set("title", title);
    form.set("recipeId", recipeId);
    form.set("version", version);
    form.set("summary", summary);
    form.set("category", category);
    form.set("subcategory", subcategory);
    form.set("license", license);
    if (rights) form.set("rights", "on");
    return form;
  }

  async function inspect() {
    setBusy(true); setInspection(null); setSubmitted(false); setMessage("Checking the two Markdown files…");
    try {
      const result = await inspectRecipeMarkdown(makeForm());
      setInspection(result);
      setMessage(result.message);
    } catch {
      setMessage("Could not check these files. Please try again.");
    } finally { setBusy(false); }
  }

  async function submit() {
    setBusy(true); setSubmitted(false); setMessage("Rechecking and saving the recipe and report for admin review…");
    try {
      const result = await submitRecipeMarkdown(makeForm());
      setMessage(result.message);
      setSubmitted(result.ok);
    } catch {
      setMessage("Could not submit these files. Please try again.");
    } finally { setBusy(false); }
  }

  return (
    <section className="rounded-3xl border border-primary/30 bg-category-blue p-5 sm:p-7" aria-labelledby="markdown-recipe-heading">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Manager standard · Markdown</p>
      <h2 id="markdown-recipe-heading" className="mt-2 text-xl font-semibold text-foreground">Submit a recipe and its validation report</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        Upload two separate files: the human-readable <code>recipe.md</code> and <code>validation-report.md</code>. We check required section headings and run the static security scan. We do not verify the evidence or execute the recipe.
      </p>
      <div className="mt-3 flex flex-wrap gap-4 text-sm">
        <Link href="/templates/recipe-markdown-standard.md" download className="font-semibold text-primary underline underline-offset-4">Download recipe.md outline</Link>
        <Link href="/templates/recipe-validation-report.md" download className="font-semibold text-primary underline underline-offset-4">Download validation-report.md outline</Link>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="text-sm font-medium text-foreground">Recipe Markdown (.md, up to 256 KB)
          <input type="file" accept=".md,text/markdown,text/plain" className="mt-2 block w-full rounded-xl border border-border bg-background p-3 text-sm"
            onChange={(event) => { setRecipeFile(event.target.files?.[0] ?? null); setInspection(null); }} />
        </label>
        <label className="text-sm font-medium text-foreground">Separate validation report (.md, up to 128 KB)
          <input type="file" accept=".md,text/markdown,text/plain" className="mt-2 block w-full rounded-xl border border-border bg-background p-3 text-sm"
            onChange={(event) => { setReportFile(event.target.files?.[0] ?? null); setInspection(null); }} />
        </label>
      </div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-medium">Display title
          <input value={title} maxLength={100} onChange={(event) => setTitle(event.target.value)} className="mt-1 block min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
        </label>
        <label className="text-sm font-medium">Stable recipe ID
          <input value={recipeId} maxLength={160} onChange={(event) => setRecipeId(event.target.value.toLowerCase())} placeholder="hotel.booking.assistant" className="mt-1 block min-h-11 w-full rounded-xl border border-border bg-background px-3 font-mono text-sm" />
        </label>
        <label className="text-sm font-medium">Version
          <input value={version} onChange={(event) => setVersion(event.target.value)} placeholder="1.0.0" className="mt-1 block min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm" />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm font-medium">Category
            <select value={category} onChange={(event) => { const next = event.target.value; setCategory(next); setSubcategory(getSubcategories(next)[0] ?? ""); }} className="mt-1 block min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">
              {CATEGORY_GROUPS.map((group) => <optgroup key={group.name} label={group.name}>{group.categories.map((item) => <option key={item.name} value={item.name}>{item.name}</option>)}</optgroup>)}
            </select>
          </label>
          <label className="text-sm font-medium">Subcategory
            <select value={subcategory} onChange={(event) => setSubcategory(event.target.value)} className="mt-1 block min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">
              {getSubcategories(category).map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </label>
        </div>
      </div>
      <label className="mt-4 block text-sm font-medium">Short summary (30–500 characters)
        <textarea value={summary} maxLength={500} rows={3} onChange={(event) => setSummary(event.target.value)} className="mt-1 block w-full rounded-xl border border-border bg-background p-3 text-sm" />
      </label>
      <p className="mt-1 text-right text-xs text-muted-foreground">{summary.length}/500</p>
      <div className="mt-3 grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium">Reuse terms
          <select value={license} onChange={(event) => setLicense(event.target.value)} className="mt-2 block min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">
            <option value="">Choose reuse terms</option><option value="MIT">MIT</option><option value="Apache-2.0">Apache-2.0</option><option value="CC-BY-4.0">CC BY 4.0</option><option value="Proprietary">Proprietary</option><option value="Other">Other / stated in recipe</option>
          </select>
        </label>
        <label className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
          <input type="checkbox" checked={rights} onChange={(event) => setRights(event.target.checked)} className="mt-1 size-4 accent-primary" />
          I have permission to submit these files and have removed private data and credentials.
        </label>
      </div>
      <div className="mt-5 flex flex-wrap gap-3">
        <button type="button" onClick={inspect} disabled={!recipeFile || !reportFile || busy} className="min-h-11 rounded-xl border border-border px-5 text-sm font-semibold disabled:opacity-50">{busy ? "Checking…" : "Check both files"}</button>
        <button type="button" onClick={submit} disabled={!inspection?.valid || !license || !rights || busy} className="min-h-11 rounded-xl cta-success px-5 text-sm font-semibold disabled:opacity-50">Submit for admin review</button>
      </div>
      {message && <p role="status" className="mt-4 text-sm text-foreground">{message}</p>}
      {inspection?.issues?.length ? <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-danger">{inspection.issues.map((issue, index) => <li key={`${index}-${issue}`}>{issue}</li>)}</ul> : null}
      {inspection?.valid && <p className="mt-3 text-xs text-muted-foreground">Static checks passed. The validation report and its evidence are creator-provided; Skillbuffet has not independently verified them.</p>}
      {submitted && <Link href="/dashboard/skills" className="mt-4 inline-block text-sm font-semibold text-primary underline">Open My Recipes</Link>}
      <p className="mt-4 text-xs leading-relaxed text-muted-foreground">No JSON upload is offered because the team has not supplied an agreed JSON Schema for this Markdown contract. Submissions stay private until an administrator approves them; Skillbuffet does not install or run recipes.</p>
    </section>
  );
}
