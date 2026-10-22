"use client";
import { useActionState, useEffect } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { toast } from "sonner";
import { rateSkill } from "@/app/actions/rate";
import type { RecipeReviewAccess } from "@/lib/community";
export function RatingSummary({
  average,
  count,
}: {
  average: number;
  count: number;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-sm">
      <span className="inline-flex text-caution" aria-hidden>
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className="size-4"
            fill={n <= Math.round(average) ? "currentColor" : "none"}
          />
        ))}
      </span>
      <span>
        {count
          ? `${average.toFixed(1)}/5 · ${count} ${count === 1 ? "review" : "reviews"}`
          : "No reviews yet"}
      </span>
    </span>
  );
}
export function ReviewForm({
  target,
  access = "ready",
}: {
  target: string;
  access?: RecipeReviewAccess;
}) {
  const [state, action, pending] = useActionState(rateSkill, { message: "" });
  useEffect(() => {
    if (!state.message) return;
    if (state.ok) toast.success(state.message);
    else toast.error(state.message);
  }, [state]);

  if (access === "signed_out")
    return (
      <p className="mt-5 rounded-xl border border-border bg-card p-4 text-sm">
        <Link
          className="font-semibold text-primary underline"
          href="/auth/sign-in"
        >
          Sign in
        </Link>{" "}
        and download this recipe before leaving a review.
      </p>
    );
  if (access === "creator")
    return (
      <p className="mt-5 rounded-xl border border-border bg-card p-4 text-sm">
        You published this recipe, so your account cannot review it. Other
        signed-in users can review it after downloading it.
      </p>
    );
  if (access === "unavailable")
    return (
      <p className="mt-5 rounded-xl border border-border bg-card p-4 text-sm">
        Reviews are temporarily unavailable. Please try again later.
      </p>
    );

  return (
    <form action={action} className="mt-5 space-y-4">
      <input type="hidden" name="target" value={target} />
      {access === "download_required" && (
        <p className="rounded-xl border border-primary/30 bg-primary/10 p-4 text-sm">
          First{" "}
          <a
            className="font-semibold text-primary underline"
            href="#download-recipe"
          >
            download this recipe
          </a>
          , then return here to submit your review.
        </p>
      )}
      <fieldset disabled={pending}>
        <legend className="text-sm font-semibold">
          How was your experience?
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className="cursor-pointer rounded-lg border border-border bg-card px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary/10"
            >
              <input
                type="radio"
                name="stars"
                value={n}
                required
                className="mr-1 accent-primary"
                aria-label={`${n} ${n === 1 ? "star" : "stars"}`}
              />
              {n} <span aria-hidden>★</span>
            </label>
          ))}
        </div>
        <label className="mt-4 block text-sm" htmlFor={`review-${target}`}>
          Your review{" "}
          <span className="text-muted-foreground">(optional, public)</span>
        </label>
        <textarea
          id={`review-${target}`}
          name="comment"
          maxLength={800}
          rows={3}
          className="mt-2 w-full rounded-xl border border-border bg-card p-3 text-sm"
          placeholder="What worked well? What could be improved?"
        />
      </fieldset>
      <button
        disabled={pending}
        className="cta-primary rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Saving…" : "Submit review"}
      </button>
      {state.message && (
        <p
          role={state.ok ? "status" : "alert"}
          className={`rounded-xl border p-4 text-sm font-medium ${
            state.ok
              ? "border-primary/40 bg-primary/10 text-foreground"
              : "border-destructive/40 bg-destructive/10 text-foreground"
          }`}
        >
          {state.message}
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        One editable rating per account. Reviews are public.
      </p>
    </form>
  );
}
