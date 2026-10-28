import Link from "next/link";
import { RecipeMarkdownPublisher } from "@/components/recipe-markdown-publisher";

export function RecipePublisherOptions({
  databaseReady,
  authenticated,
  initialCategory,
}: {
  databaseReady: boolean;
  authenticated: boolean;
  initialCategory?: string;
}) {
  return (
    <section className="mt-10" aria-labelledby="publisher-format-title">
      <div className="max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">Manager-standard recipe submission</p>
        <h2 id="publisher-format-title" className="mt-2 text-xl font-semibold text-foreground">Submit one recipe</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Upload the human-readable <code>recipe.md</code> and its separate <code>validation-report.md</code>. YAML and ZIP uploads are paused because their package schema has not been approved.
        </p>
      </div>

      {!databaseReady ? (
        <div role="status" className="mt-5 rounded-2xl border border-caution/30 bg-caution/10 p-5 text-sm text-foreground">
          Uploading is unavailable because this local setup has no database connection configured.
          <div className="mt-3 flex flex-wrap gap-4">
            <Link href="/templates/recipe-markdown-standard.md" download className="font-semibold text-primary underline underline-offset-4">Download recipe.md outline</Link>
            <Link href="/templates/recipe-validation-report.md" download className="font-semibold text-primary underline underline-offset-4">Download validation-report.md outline</Link>
          </div>
        </div>
      ) : !authenticated ? (
        <section className="mt-5 rounded-3xl border border-primary/30 bg-category-violet p-6 sm:p-8" aria-labelledby="publish-sign-in-title">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Before you upload</p>
          <h3 id="publish-sign-in-title" className="mt-2 text-xl font-semibold text-foreground">Create an account or sign in</h3>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">A free account is required to inspect and submit a recipe. Your submission stays private until an administrator reviews it.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/auth/sign-up" className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Create a free account</Link>
            <Link href="/auth/sign-in" className="inline-flex min-h-11 items-center rounded-xl border border-border px-5 py-2 text-sm font-semibold text-foreground">Sign in</Link>
          </div>
        </section>
      ) : (
        <div className="mt-5">
          <RecipeMarkdownPublisher initialCategory={initialCategory} />
        </div>
      )}
    </section>
  );
}
