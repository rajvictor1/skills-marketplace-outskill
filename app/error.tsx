"use client";
import Link from "next/link";
export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="mx-auto max-w-3xl px-5 py-20">
      <p className="editorial-kicker text-primary">
        Something needs another try
      </p>
      <h1 className="mt-4 text-4xl font-semibold">
        We couldn’t load this page.
      </h1>
      <p className="mt-5 leading-relaxed text-muted-foreground">
        The service may be temporarily unavailable. No successful save is
        confirmed by this message. Check your workspace before submitting the
        same version again.
      </p>
      <div className="mt-7 flex flex-wrap gap-4">
        <button
          onClick={reset}
          className="cta-primary rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
        >
          Try again
        </button>
        <Link
          href="/"
          className="cta-secondary rounded-full border border-border px-5 py-3 text-sm font-semibold"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
