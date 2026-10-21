"use client";
import { useActionState } from "react";
import {
  moderateRating,
  reviewSubmission,
  unpublishSkill,
} from "@/app/actions/admin";
export function AdminReviewForm({
  id,
  mode = "review",
}: {
  id: string;
  mode?: "review" | "unpublish" | "rating";
}) {
  const fn =
    mode === "unpublish"
      ? unpublishSkill
      : mode === "rating"
        ? moderateRating
        : reviewSubmission;
  const [state, action, pending] = useActionState(fn, { message: "" });
  return (
    <form action={action} className="mt-5 space-y-3">
      <input
        type="hidden"
        name={
          mode === "review"
            ? "submissionId"
            : mode === "rating"
              ? "ratingId"
              : "skillId"
        }
        value={id}
      />
      <label className="block text-sm font-medium" htmlFor={`note-${id}`}>
        Review notes{" "}
        {mode === "review"
          ? "(required for changes or rejection)"
          : "(required)"}
      </label>
      <textarea
        id={`note-${id}`}
        name="note"
        maxLength={2000}
        rows={3}
        required={mode !== "review"}
        className="w-full rounded-xl border border-border bg-card p-3 text-sm"
      />
      <div className="flex flex-wrap gap-2">
        {mode === "review" ? (
          <>
            <button
              name="decision"
              value="approved"
              disabled={pending}
              className="min-h-11 rounded-xl cta-success px-5 py-2.5 text-sm font-semibold"
            >
              Approve and publish
            </button>
            <button
              name="decision"
              value="changes_requested"
              disabled={pending}
              className="min-h-11 rounded-xl border border-border bg-caution/10 text-caution px-5 py-2.5 text-sm font-semibold"
            >
              Request changes
            </button>
            <button
              name="decision"
              value="rejected"
              disabled={pending}
              className="min-h-11 rounded-xl border border-danger/30 px-5 py-2.5 text-sm font-semibold text-danger"
            >
              Reject
            </button>
          </>
        ) : (
          <button
            disabled={pending}
            className="min-h-11 rounded-xl border border-danger/30 px-5 py-2.5 text-sm font-semibold text-danger"
          >
            {mode === "rating" ? "Hide review" : "Unpublish skill"}
          </button>
        )}
      </div>
      <p className="text-sm text-muted-foreground" role="status">
        {pending ? "Saving decision…" : state.message}
      </p>
    </form>
  );
}
