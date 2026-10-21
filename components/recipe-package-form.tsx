"use client";
import { useActionState } from "react";
import {
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
