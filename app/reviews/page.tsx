export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { getRatings } from "@/lib/community";
import { RatingSummary, ReviewForm } from "@/components/community-reviews";
export const metadata: Metadata = {
  title: "Community reviews",
  description:
    "Read community feedback and share your experience with Skillbuffet.",
};
export default async function ReviewsPage() {
  const data = await getRatings("marketplace");
  return (
    <main className="mx-auto max-w-4xl px-5 py-16">
      <p className="editorial-kicker text-primary">From the community</p>
      <h1 className="mt-4 text-5xl font-semibold tracking-tight">
        Help shape a better buffet.
      </h1>
      <p className="mt-5 text-lg text-muted-foreground">
        Tell other builders what using Skillbuffet is like. These are community
        reviews of this marketplace, separate from GitHub stars and skill
        security checks.
      </p>
      <section className="mt-9 rounded-3xl border border-border bg-category-violet p-7">
        <RatingSummary average={data.average} count={data.count} />
        <p className="mt-3 text-sm">
          {data.available
            ? data.count
              ? "One rating per signed-in account. Reviewers have accounts; their identities are not independently verified."
              : "The community is just getting started. There are no reviews yet."
            : "Reviews are temporarily unavailable. Please try again later."}
        </p>
        <ReviewForm target="marketplace" />
      </section>
      <div className="mt-8 space-y-4">
        {data.reviews.map((review) => (
          <article
            key={review.id}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <p className="font-semibold">
              {review.name} · {review.stars}/5
            </p>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed">
              {review.comment || "Star rating only"}
            </p>
            <time className="mt-3 block text-xs text-muted-foreground">
              {review.createdAt.toISOString().slice(0, 10)}
            </time>
          </article>
        ))}
      </div>
    </main>
  );
}
