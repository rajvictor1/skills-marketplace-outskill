"use client";
import { SKILL_CATEGORY_NAMES, getSubcategories } from "@/lib/skills/taxonomy";
import { useActionState, useState } from "react";
import {
  checkRecipeSampleInput,
  saveRecipeListingPreview,
  stageRecipePublication,
  uploadRecipePackage,
  reviewRecipePackage,
} from "@/app/actions/recipe-packages";
export function RecipePackageUpload() {
  const [state, action, pending] = useActionState(uploadRecipePackage, {
    message: "",
  });
  return (
    <form action={action} className="mt-5 space-y-4">
      <label htmlFor="recipe-package" className="block text-sm font-semibold">
        Prepared recipe package (.json, up to 1 MB)
      </label>
      <input
        id="recipe-package"
        name="package"
        type="file"
        accept=".json,application/json"
        required
        className="block w-full rounded-xl border border-border bg-background p-3 text-sm"
      />
      <label className="flex items-start gap-3 text-sm">
        <input type="checkbox" name="submit" className="mt-1" /> Submit for
        review after inspection (requires valid structural and security checks)
      </label>
      <button
        disabled={pending}
        className="min-h-11 rounded-xl cta-success px-5 py-2.5 text-sm font-semibold"
      >
        {pending ? "Inspecting and saving…" : "Inspect and save privately"}
      </button>
      <p role="status" className="text-sm text-muted-foreground">
        {state.message}
      </p>
      <p className="text-xs text-muted-foreground">
        Private drafts can be saved even when inspection finds issues. Review
        the report, correct the source files, then upload a new version when
        ready.
      </p>
    </form>
  );
}
export function RecipePackageReview({
  id,
  status,
}: {
  id: string;
  status: string;
}) {
  const [state, action, pending] = useActionState(reviewRecipePackage, {
    message: "",
  });
  return (
    <form action={action} className="mt-5 space-y-3">
      <input type="hidden" name="versionId" value={id} />
      <label
        htmlFor={`recipe-note-${id}`}
        className="block text-sm font-semibold"
      >
        Review note (10–2,000 characters)
      </label>
      <textarea
        id={`recipe-note-${id}`}
        name="note"
        required
        minLength={10}
        maxLength={2000}
        rows={3}
        className="w-full rounded-xl border border-border bg-background p-3 text-sm"
      />
      <div className="flex flex-wrap gap-3">
        {(status === "draft"
          ? [["submitted", "Submit for review"]]
          : [
              ["approved", "Approve for private registry"],
              ["rejected", "Reject version"],
            ]
        ).map(([value, label]) => (
          <button
            key={value}
            name="decision"
            value={value}
            disabled={pending}
            className="min-h-11 rounded-xl border border-border bg-category-violet px-5 py-2.5 text-sm font-semibold"
          >
            {label}
          </button>
        ))}
      </div>
      <p role="status" className="text-sm text-muted-foreground">
        {pending ? "Recording review…" : state.message}
      </p>
    </form>
  );
}

export type ListingDraft = {
  title: string;
  summary: string;
  category: string;
  subcategory: string;
} | null;
export function RecipeListingDraftForm({
  id,
  recipeId,
  draft,
}: {
  id: string;
  recipeId: string;
  draft: ListingDraft;
}) {
  const [state, action, pending] = useActionState(saveRecipeListingPreview, {
    message: "",
  });
  const [category, setCategory] = useState(draft?.category ?? "Research");
  return (
    <section
      className="mt-5 rounded-2xl border border-border bg-category-teal p-5"
      aria-label="Private marketplace preview"
    >
      <p className="text-xs font-semibold uppercase tracking-widest text-primary">
        Private preview · editable
      </p>
      {draft && (
        <div className="mt-4 rounded-xl border border-border bg-card p-5">
          <p className="text-xs font-semibold text-primary">
            {draft.category} / {draft.subcategory}
          </p>
          <h4 className="mt-2 text-xl font-semibold">{draft.title}</h4>
          <p className="mt-2 text-sm text-muted-foreground">{draft.summary}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            Source: {recipeId} · Package review: approved · Runtime: unverified
            · Visibility: private
          </p>
        </div>
      )}
      <form action={action} className="mt-5 space-y-4">
        <input type="hidden" name="versionId" value={id} />
        <label className="block text-sm font-semibold">
          Display title
          <input
            name="title"
            required
            minLength={3}
            maxLength={100}
            defaultValue={draft?.title ?? recipeId.replace(/[._-]/g, " ")}
            className="mt-2 block w-full rounded-xl border border-border bg-background p-3"
          />
        </label>
        <label className="block text-sm font-semibold">
          Short description
          <textarea
            name="summary"
            required
            minLength={10}
            maxLength={500}
            rows={3}
            defaultValue={draft?.summary ?? ""}
            className="mt-2 block w-full rounded-xl border border-border bg-background p-3"
          />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold">
            Category
            <select
              name="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="mt-2 block w-full rounded-xl border border-border bg-background p-3"
            >
              {SKILL_CATEGORY_NAMES.map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold">
            Subcategory
            <select
              name="subcategory"
              key={category}
              defaultValue={
                category === draft?.category ? draft.subcategory : undefined
              }
              className="mt-2 block w-full rounded-xl border border-border bg-background p-3"
            >
              {getSubcategories(category).map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
          </label>
        </div>
        <button
          disabled={pending}
          className="min-h-11 rounded-xl cta-success px-5 py-2.5 text-sm font-semibold"
        >
          {pending ? "Saving preview…" : "Save private preview"}
        </button>
        <p role="status" className="text-sm text-muted-foreground">
          {state.message}
        </p>
      </form>
    </section>
  );
}

export function RecipePublicationForm({
  id,
  draft,
}: {
  id: string;
  draft: ListingDraft;
}) {
  const [state, action, pending] = useActionState(stageRecipePublication, {
    message: "",
  });
  const [category, setCategory] = useState(draft?.category ?? "Research");
  return (
    <details className="mt-5 rounded-xl border border-border p-4">
      <summary className="cursor-pointer text-sm font-semibold">
        Public publication (later)
      </summary>
      <p className="mt-3 text-sm text-muted-foreground">
        Choose the public details and confirm that you may redistribute every
        bundled file. The final publication decision happens at the admin review
        desk.
      </p>
      <form action={action} className="mt-4 space-y-4">
        <input type="hidden" name="versionId" value={id} />
        <label className="block text-sm font-semibold">
          Display title
          <input
            name="name"
            defaultValue={draft?.title ?? ""}
            required
            minLength={3}
            maxLength={100}
            className="mt-2 block w-full rounded-xl border border-border bg-background p-3"
          />
        </label>
        <label className="block text-sm font-semibold">
          Summary
          <textarea
            name="summary"
            defaultValue={draft?.summary ?? ""}
            required
            minLength={30}
            maxLength={500}
            rows={3}
            className="mt-2 block w-full rounded-xl border border-border bg-background p-3"
          />
        </label>
        <label className="block text-sm font-semibold">
          Category
          <select
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="mt-2 block w-full rounded-xl border border-border bg-background p-3"
          >
            {SKILL_CATEGORY_NAMES.map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          Subcategory
          <select
            key={category}
            name="subcategory"
            defaultValue={
              category === draft?.category ? draft.subcategory : undefined
            }
            className="mt-2 block w-full rounded-xl border border-border bg-background p-3"
          >
            {getSubcategories(category).map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>
        </label>
        <label className="block text-sm font-semibold">
          License or redistribution terms
          <input
            name="license"
            required
            minLength={2}
            maxLength={120}
            className="mt-2 block w-full rounded-xl border border-border bg-background p-3"
          />
        </label>
        <label className="flex items-start gap-3 text-sm">
          <input name="rights" type="checkbox" required className="mt-1" />I
          have permission to publish and redistribute all files in this package
          under these terms.
        </label>
        <button
          disabled={pending}
          className="min-h-11 rounded-xl cta-success px-5 py-2.5 text-sm font-semibold"
        >
          {pending ? "Preparing submission…" : "Send to publication review"}
        </button>
        <p role="status" className="text-sm text-muted-foreground">
          {state.message}
        </p>
      </form>
    </details>
  );
}

export function RecipeInputPreview({
  id,
  fields,
}: {
  id: string;
  fields: { name: string; title: string; type: string; required: boolean }[];
}) {
  const [state, action, pending] = useActionState(checkRecipeSampleInput, {
    message: "",
  });
  const [mode, setMode] = useState<"fields" | "json">("fields");
  return (
    <details className="mt-5 rounded-xl border border-border p-4">
      <summary className="cursor-pointer text-sm font-semibold">
        Preview required inputs ({fields.length})
      </summary>
      <p className="mt-3 text-sm text-muted-foreground">
        Try fictional values. Validation checks the bundled input schema and
        shows errors without saving your values. This does not run the recipe.
      </p>
      <div
        className="mt-4 flex flex-wrap gap-2"
        role="group"
        aria-label="Sample input mode"
      >
        <button
          type="button"
          aria-pressed={mode === "fields"}
          onClick={() => setMode("fields")}
          className="rounded-xl border border-border px-4 py-2 text-sm"
        >
          Guided fields
        </button>
        <button
          type="button"
          aria-pressed={mode === "json"}
          onClick={() => setMode("json")}
          className="rounded-xl border border-border px-4 py-2 text-sm"
        >
          Paste JSON
        </button>
      </div>
      <form action={action} className="mt-4 space-y-4" autoComplete="off">
        <input type="hidden" name="versionId" value={id} />
        <input type="hidden" name="mode" value={mode} />
        {mode === "json" ? (
          <label className="block text-sm font-semibold">
            Sample JSON object
            <textarea
              name="sampleJson"
              rows={8}
              maxLength={32768}
              defaultValue="{}"
              spellCheck={false}
              className="mt-2 block w-full rounded-xl border border-border bg-background p-3 font-mono text-sm"
            />
          </label>
        ) : (
          fields.map((field, index) => (
            <label
              key={field.name}
              htmlFor={`sample-${id}-${index}`}
              className="block text-sm font-semibold"
            >
              {field.title}{" "}
              <span className="text-xs font-normal text-muted-foreground">
                {field.required ? "Required" : "Optional"} ·{" "}
                {field.type === "complex" ? "JSON value" : field.type}
              </span>
              {field.type === "boolean" ? (
                <select
                  id={`sample-${id}-${index}`}
                  name={`field:${field.name}`}
                  defaultValue=""
                  className="mt-2 block w-full rounded-xl border border-border bg-background p-3"
                >
                  <option value="">Not supplied</option>
                  <option value="true">True</option>
                  <option value="false">False</option>
                </select>
              ) : field.type === "complex" ||
                field.type === "object" ||
                field.type === "array" ? (
                <textarea
                  id={`sample-${id}-${index}`}
                  name={`field:${field.name}`}
                  rows={4}
                  maxLength={32768}
                  placeholder="Enter a JSON value"
                  spellCheck={false}
                  className="mt-2 block w-full rounded-xl border border-border bg-background p-3 font-mono text-sm"
                />
              ) : (
                <input
                  id={`sample-${id}-${index}`}
                  name={`field:${field.name}`}
                  type={
                    field.type === "number" || field.type === "integer"
                      ? "number"
                      : "text"
                  }
                  step={field.type === "integer" ? 1 : "any"}
                  maxLength={field.type === "string" ? 32768 : undefined}
                  className="mt-2 block w-full rounded-xl border border-border bg-background p-3 text-sm"
                />
              )}
            </label>
          ))
        )}
        <button
          disabled={pending}
          className="min-h-11 rounded-xl cta-success px-5 py-2.5 text-sm font-semibold"
        >
          {pending ? "Checking…" : "Check sample values"}
        </button>
        <p role="status" className="text-sm text-muted-foreground">
          {state.message}
        </p>
        {state.issues?.length ? (
          <ul className="space-y-1 text-sm text-caution">
            {state.issues.map((issue, index) => (
              <li key={`${issue.path}-${index}`}>
                {issue.path || "Root"}: {issue.keyword}
                {issue.missingProperty
                  ? ` · missing ${issue.missingProperty}`
                  : ""}
              </li>
            ))}
          </ul>
        ) : null}
      </form>
    </details>
  );
}
