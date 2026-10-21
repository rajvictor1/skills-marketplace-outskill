import { Star } from "lucide-react";

const EXAMPLES = [
  {
    stars: 5,
    text: "A clear place to discover a skill and read its instructions before trying it.",
    name: "Example reviewer A",
  },
  {
    stars: 4,
    text: "The category structure makes it easier to find a useful starting point.",
    name: "Example reviewer B",
  },
  {
    stars: 5,
    text: "I would like to see more publishing examples and step-by-step guides.",
    name: "Example reviewer C",
  },
];
export function SampleReviews() {
  return (
    <section
      aria-labelledby="sample-reviews-title"
      className="border-y border-border bg-primary/10 px-5 py-12 sm:px-8"
    >
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">
              Design preview
            </p>
            <h2
              id="sample-reviews-title"
              className="mt-2 text-2xl font-semibold tracking-tight"
            >
              How community reviews will look
            </h2>
          </div>
          <span className="rounded-full border border-primary/20 bg-card px-3 py-1.5 text-xs font-semibold text-primary">
            Sample reviews · not real endorsements
          </span>
        </div>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {EXAMPLES.map((review) => (
            <figure
              key={review.name}
              className="rounded-xl border border-border bg-card p-5"
            >
              <div
                className="flex gap-1 text-caution"
                role="img"
                aria-label={`${review.stars} out of 5 example stars`}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className="size-4"
                    fill={star <= review.stars ? "currentColor" : "none"}
                    aria-hidden
                  />
                ))}
              </div>
              <blockquote className="mt-4 text-sm leading-relaxed text-muted-foreground">
                {review.text}
              </blockquote>
              <figcaption className="mt-4 text-xs font-semibold">
                {review.name}
                <span className="ml-2 font-normal text-muted-foreground">
                  Illustrative
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
        <p className="mt-4 text-xs text-muted-foreground">
          These examples are for visual review only. They are excluded from the
          real community rating and review count.
        </p>
      </div>
    </section>
  );
}
