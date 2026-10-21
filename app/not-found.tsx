import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-4 py-20 text-center sm:px-6">
      <Logo withWordmark={false} className="[&_svg]:size-10" />

      <p className="mt-6 font-mono text-xs uppercase tracking-[0.18em] text-primary">
        404
      </p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
        Page not found
      </h1>
      <p className="mt-4 max-w-md text-base leading-relaxed text-muted-foreground">
        This page moved, or it never existed. Nothing here was blocked by the
        scanner. The link just does not lead anywhere.
      </p>

      <form action="/search" className="mt-6 flex w-full max-w-md gap-2">
        <label htmlFor="missing-search" className="sr-only">
          Search AI agent recipes
        </label>
        <input
          id="missing-search"
          name="q"
          placeholder="Search AI agent recipes"
          className="min-w-0 flex-1 rounded-xl border border-input bg-card px-4 py-3"
        />
        <button className="cta-primary px-5">Search</button>
      </form>
      <nav
        aria-label="Popular categories"
        className="mt-5 flex flex-wrap justify-center gap-5 text-primary underline"
      >
        <Link href="/skills/categories/marketing">Marketing</Link>
        <Link href="/skills/categories/software-development">
          Software Development
        </Link>
        <Link href="/skills/categories/research">Research</Link>
      </nav>
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button size="lg" asChild>
          <Link href="/">Back to home</Link>
        </Button>
        <Button size="lg" variant="outline" asChild>
          <Link href="/skills">
            Browse recipes
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </main>
  );
}
