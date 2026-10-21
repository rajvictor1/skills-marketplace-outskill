"use client";
import { SKILL_CATEGORY_NAMES, getSubcategories } from "@/lib/skills/taxonomy";
import { useActionState, useState } from "react";
import {
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

export function RecipePublicationForm({ id }: { id: string }) {
  const [state, action, pending] = useActionState(stageRecipePublication, {
    message: "",
  });
  const [category, setCategory] = useState("Research");
  return (
    <details className="mt-5 rounded-xl border border-border p-4">
      <summary className="cursor-pointer text-sm font-semibold">
        Prepare marketplace submission
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
