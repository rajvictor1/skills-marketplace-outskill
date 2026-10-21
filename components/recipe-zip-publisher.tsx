"use client";

import { useState } from "react";
import Link from "next/link";
import { inspectRecipeZip, submitRecipeZip, type ZipRecipeRow, type ZipSubmitResult } from "@/app/actions/recipe-zip";
import { CATEGORY_GROUPS, getSubcategories } from "@/lib/skills/taxonomy";

type Choice = { selected: boolean; title: string; category: string; subcategory: string };
const categoryNames: string[] = CATEGORY_GROUPS.flatMap((group) => group.categories.map((category) => category.name));
function suggestedCategory(id: string | null, fallback: string) {
  if (/^(healthcare|health|personal\.tracking)/.test(id ?? "")) return "Healthcare";
  if (/^(advertising|marketing|social)/.test(id ?? "")) return "Marketing";
  if (/^(sales|customer|payment|inventory)/.test(id ?? "")) return "Sales";
  if (/^(research)/.test(id ?? "")) return "Research";
  if (/^(writing|brief)/.test(id ?? "")) return "Writing & Communication";
  return categoryNames.includes(fallback) ? fallback : "Other";
}

export function RecipeZipPublisher({ initialCategory = "Marketing" }: { initialCategory?: string }) {
  const [archive, setArchive] = useState<File | null>(null);
  const [rows, setRows] = useState<ZipRecipeRow[]>([]);
  const [choices, setChoices] = useState<Record<string, Choice>>({});
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [result, setResult] = useState<ZipSubmitResult | null>(null);
  const [license, setLicense] = useState("");
  const [rights, setRights] = useState(false);
  const selectedCount = Object.values(choices).filter((choice) => choice.selected).length;

  async function inspect() {
    if (!archive) { setMessage("Choose a ZIP file first."); return; }
    setBusy(true); setMessage("Reading recipes and checking files…"); setResult(null);
    try {
      const form = new FormData(); form.set("archive", archive);
      const response = await inspectRecipeZip(form);
      if (!response.ok) { setRows([]); setMessage(response.message); return; }
      setRows(response.recipes);
      setChoices(Object.fromEntries(response.recipes.map((row) => {
        const category = suggestedCategory(row.id, initialCategory);
        return [row.manifestPath, { selected: false, title: row.title, category,
          subcategory: getSubcategories(category)[0] ?? "" }];
      })));
      const valid = response.recipes.filter((row) => row.valid).length;
      setMessage(`Found ${response.recipes.length} recipes. ${valid} pass file checks. Choose up to 10 for this submission.`);
    } catch { setMessage("The ZIP could not be inspected. Please try again."); }
    finally { setBusy(false); }
  }
  async function submit() {
    if (!archive || !selectedCount) { setMessage("Select at least one valid recipe."); return; }
    if (!license || !rights) { setMessage("Choose reuse terms and confirm your publishing rights."); return; }
    setBusy(true); setMessage("Saving selected recipes for administrator review…");
    try {
      const selections = rows.filter((row) => choices[row.manifestPath]?.selected).map((row) => ({
        manifestPath: row.manifestPath,
        packageHash: row.packageHash,
        title: choices[row.manifestPath].title,
        category: choices[row.manifestPath].category,
        subcategory: choices[row.manifestPath].subcategory,
      }));
      const form = new FormData(); form.set("archive", archive);
      form.set("selections", JSON.stringify(selections)); form.set("license", license);
      if (rights) form.set("rights", "on");
      const response = await submitRecipeZip(form);
      setResult(response); setMessage(response.message);
      if (response.submitted?.length) {
        const submitted = new Set(response.submitted.map((item) => item.id));
        setChoices((current) => Object.fromEntries(Object.entries(current).map(([path, choice]) =>
          [path, { ...choice, selected: submitted.has(rows.find((row) => row.manifestPath === path)?.id ?? "") ? false : choice.selected }])));
      }
    } catch { setMessage("The submission could not be saved. Please try again."); }
    finally { setBusy(false); }
  }
  function update(path: string, patch: Partial<Choice>) {
    setChoices((current) => ({ ...current, [path]: { ...current[path], ...patch } }));
  }

  return (
    <section className="rounded-3xl border border-primary/30 bg-category-violet p-5 sm:p-7" aria-labelledby="zip-publish-heading">
      <p className="text-xs font-semibold uppercase tracking-wider text-primary">Recommended · structured recipes</p>
      <h2 id="zip-publish-heading" className="mt-2 text-xl font-semibold text-foreground">Upload a recipe ZIP</h2>
      <p className="mt-2 max-w-3xl text-sm leading-relaxed text-muted-foreground">
        A ZIP can contain many recipe.yaml files. We inspect each one separately, including its JSON schemas and source files.
        Inspection never runs the code. You choose which valid recipes to submit and where each belongs.
      </p>
      <div className="mt-5 flex flex-wrap items-end gap-3">
        <label className="min-w-0 flex-1 text-sm font-medium text-foreground">
          Recipe archive (.zip, up to 1.5 MB)
          <input type="file" accept=".zip,application/zip" className="mt-2 block w-full rounded-xl border border-border bg-background p-3 text-sm"
            onChange={(event) => { setArchive(event.target.files?.[0] ?? null); setRows([]); setChoices({}); setResult(null); setMessage(""); }} />
        </label>
        <button type="button" onClick={inspect} disabled={!archive || busy}
          className="min-h-11 rounded-xl cta-success px-5 text-sm font-semibold disabled:opacity-50">
          {busy ? "Working…" : "Inspect ZIP"}
        </button>
      </div>
      {message && <p role="status" className="mt-4 text-sm text-foreground">{message}</p>}
      {rows.length > 0 && (
        <div className="mt-6 space-y-3">
          {rows.map((row) => {
            const choice = choices[row.manifestPath];
            if (!choice) return null;
            return <article key={row.manifestPath} className="rounded-2xl border border-border bg-card p-4 sm:p-5">
              <div className="flex items-start gap-3">
                <input type="checkbox" aria-label={`Select ${row.id ?? row.manifestPath}`} checked={choice.selected}
                  disabled={!row.valid || busy || (!choice.selected && selectedCount >= 10)}
                  onChange={(event) => update(row.manifestPath, { selected: event.target.checked })}
                  className="mt-1 size-4 accent-primary" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="break-all text-sm font-semibold text-foreground">{row.id ?? row.manifestPath}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${row.valid ? "bg-safe/10 text-safe" : "bg-danger/10 text-danger"}`}>
                      {row.valid ? "File checks passed" : `${row.issueCount} issue${row.issueCount === 1 ? "" : "s"}`}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">v{row.version ?? "unknown"} · {row.fileCount} files · {row.manifestPath}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{row.description}</p>
                  {row.warnings.map((warning) => <p key={warning} className="mt-2 text-xs text-caution">{warning}</p>)}
                  {!row.valid && <ul className="mt-3 list-disc space-y-1 pl-4 text-xs text-danger">
                    {row.issues.map((issue, index) => <li key={`${issue}-${index}`}>{issue}</li>)}
                    {row.issueCount > row.issues.length && <li>More findings are available in the full QC report.</li>}
                  </ul>}
                  {row.valid && <div className="mt-4 grid gap-3 sm:grid-cols-[1.5fr_1fr_1fr]">
                    <label className="text-xs font-medium">Display title
                      <input value={choice.title} maxLength={100} onChange={(event) => update(row.manifestPath, { title: event.target.value })}
                        className="mt-1 block min-h-10 w-full rounded-lg border border-border bg-background px-3 text-sm" />
                    </label>
                    <label className="text-xs font-medium">Category
                      <select value={choice.category} onChange={(event) => update(row.manifestPath, { category: event.target.value,
                        subcategory: getSubcategories(event.target.value)[0] ?? "" })}
                        className="mt-1 block min-h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
                        {CATEGORY_GROUPS.map((group) => <optgroup key={group.name} label={group.name}>
                          {group.categories.map((category) => <option key={category.name}>{category.name}</option>)}
                        </optgroup>)}
                      </select>
                    </label>
                    <label className="text-xs font-medium">Subcategory
                      <select value={choice.subcategory} onChange={(event) => update(row.manifestPath, { subcategory: event.target.value })}
                        className="mt-1 block min-h-10 w-full rounded-lg border border-border bg-background px-3 text-sm">
                        {getSubcategories(choice.category).map((value) => <option key={value}>{value}</option>)}
                      </select>
                    </label>
                  </div>}
                </div>
              </div>
            </article>;
          })}
          <div className="rounded-2xl border border-border bg-card p-5">
            <p className="text-sm font-semibold">{selectedCount} selected for administrator review</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium">Reuse terms for the selected recipes
                <select value={license} onChange={(event) => setLicense(event.target.value)}
                  className="mt-2 block min-h-11 w-full rounded-xl border border-border bg-background px-3 text-sm">
                  <option value="">Choose reuse terms</option>
                  <option value="MIT">MIT</option><option value="Apache-2.0">Apache-2.0</option>
                  <option value="CC-BY-4.0">CC BY 4.0</option><option value="Proprietary">Proprietary</option>
                  <option value="Other">Other / stated in package</option>
                </select>
              </label>
              <label className="flex items-start gap-2 text-sm leading-relaxed text-muted-foreground">
                <input type="checkbox" checked={rights} onChange={(event) => setRights(event.target.checked)} className="mt-1 size-4 accent-primary" />
                I have permission to submit every selected file and have removed private data and credentials.
              </label>
            </div>
            <button type="button" onClick={submit} disabled={!selectedCount || busy}
              className="mt-5 min-h-11 rounded-xl cta-success px-5 text-sm font-semibold disabled:opacity-50">
              Submit selected recipes
            </button>
            <p className="mt-3 text-xs text-muted-foreground">Up to 10 at a time. Administrator approval is required before any listing becomes public. No recipe is installed or run.</p>
          </div>
        </div>
      )}
      {result?.failed?.length ? <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-danger">
        {result.failed.map((item) => <li key={item.id}>{item.id}: {item.reason}</li>)}
      </ul> : null}
      {result?.submitted?.length ? <Link href="/dashboard/skills" className="mt-4 inline-block text-sm font-semibold text-primary underline">Open My Recipes</Link> : null}
    </section>
  );
}
