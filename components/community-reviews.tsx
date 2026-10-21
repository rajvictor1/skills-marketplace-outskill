"use client";
import { useActionState } from "react";
import { Star } from "lucide-react";
import { rateSkill } from "@/app/actions/rate";
export function RatingSummary({
  average,
  count,
}: {
  average: number;
  count: number;
}) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2 text-sm">
      <span className="inline-flex text-[#a86516]" aria-hidden>
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
export function ReviewForm({ target }: { target: string }) {
  const [state, action, pending] = useActionState(rateSkill, { message: "" });
  return (
    <form action={action} className="mt-5 space-y-4">
      <input type="hidden" name="target" value={target} />
      <fieldset disabled={pending}>
        <legend className="text-sm font-semibold">
          How was your experience?
        </legend>
        <div className="mt-3 flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className="cursor-pointer rounded-lg border border-border bg-white px-3 py-2 text-sm has-checked:border-primary has-checked:bg-primary/10"
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
          className="mt-2 w-full rounded-xl border border-border bg-white p-3 text-sm"
          placeholder="What worked well? What could be improved?"
        />
      </fieldset>
      <button
        disabled={pending}
        className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {pending ? "Saving…" : "Submit review"}
      </button>
      <p role="status" className="text-sm text-muted-foreground">
        {state.message}
      </p>
      <p className="text-xs text-muted-foreground">
        Sign-in required. One editable rating per account. Skill reviews require
        a recorded download; creators cannot review their own skill.
      </p>
    </form>
  );
}
