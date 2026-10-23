import { Breadcrumbs, PageSeo } from "@/components/seo/page-seo";
import Link from "next/link";
import { PUBLIC_PAGES } from "@/lib/seo/site";
import { staticMetadata } from "@/lib/seo/site";

import {
  Eye,
  FileWarning,
  TerminalSquare,
  Bot,
  ShieldCheck,
} from "lucide-react";

import { PublishForm } from "@/components/publish-form";
import { RecipeZipPublisher } from "@/components/recipe-zip-publisher";
import { getCategoryBySlug } from "@/lib/skills/taxonomy";
import { SCAN_LAYERS } from "@/lib/trust";
import { getViewer } from "@/lib/admin";
import { hasDatabaseConnection } from "@/lib/db/connection";

export const metadata = staticMetadata("/publish", false);

const LAYER_ICONS = {
  hidden_text: Eye,
  dangerous_pattern: FileWarning,
  script_analysis: TerminalSquare,
  llm_injection: Bot,
} as const;

export default async function PublishPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string | string[];
    source?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const databaseReady = hasDatabaseConnection();
  const viewer = databaseReady ? await getViewer() : null;
  const requestedCategory = params.category;
  const initialSource = params.source === "github" ? "github" : "paste";
  const selectedCategory =
    typeof requestedCategory === "string"
      ? getCategoryBySlug(requestedCategory)?.category.name
      : undefined;
  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:py-16">
      <PageSeo
        path="/publish"
        {...PUBLIC_PAGES["/publish"]}
        crumbs={[{ name: "Submit a recipe", path: "/publish" }]}
      />
      <div className="col-span-full mx-auto w-full max-w-7xl px-5 pt-6">
        <Breadcrumbs items={[{ name: "Submit a recipe", path: "/publish" }]} />
      </div>
      <div className="max-w-2xl">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground">
          <ShieldCheck className="size-3.5 text-primary" aria-hidden />
          Static checks before admin review
        </span>
        <h1 className="mt-5 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Publish a recipe
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Upload your recipe pack and choose one recipe inside it.
          Pick a category and submit it to the administrator. Each version stays private
          until approved. Uploading does not install or run a recipe.
        </p>
      </div>

      <section className="mt-8 rounded-2xl border border-primary/30 bg-primary/10 p-5 sm:p-6" aria-labelledby="recipe-format-heading">
        <h2 id="recipe-format-heading" className="text-base font-semibold text-foreground">
          Which recipe format do you have?
        </h2>
        <div className="mt-3 grid gap-4 text-sm leading-relaxed text-muted-foreground sm:grid-cols-2">
          <p>
            <strong className="text-foreground">A recipe.yaml package:</strong> Use
            the ZIP publisher below. It checks one recipe with its schemas and
            source files. If an archive contains several, choose one to submit.
          </p>
          <p>
            <strong className="text-foreground">One SKILL.md file:</strong> The
            older instruction-only uploader remains under Legacy format while
            existing listings migrate. See the{" "}
            <Link href="/docs/recipe-packages" className="font-medium text-primary underline underline-offset-4">
              package guide
            </Link>.
          </p>
        </div>
      </section>

      {viewer?.user ? (
        <div className="mt-10"><RecipeZipPublisher initialCategory={selectedCategory} /></div>
      ) : databaseReady ? (
        <section className="mt-10 rounded-3xl border border-primary/30 bg-category-violet p-6 sm:p-8" aria-labelledby="publish-sign-in-title">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Before you upload</p>
          <h2 id="publish-sign-in-title" className="mt-2 text-xl font-semibold text-foreground">Create an account or sign in</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            A free account is required to inspect and submit a recipe pack. Your submission stays private until an administrator reviews it.
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/auth/sign-up" className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground">Create a free account</Link>
            <Link href="/auth/sign-in" className="inline-flex min-h-11 items-center rounded-xl border border-border px-5 py-2 text-sm font-semibold text-foreground">Sign in</Link>
          </div>
        </section>
      ) : (
        <p role="status" className="mt-10 rounded-2xl border border-caution/30 bg-caution/10 p-5 text-sm text-foreground">
          Recipe publishing is temporarily unavailable because the account database is not connected.
        </p>
      )}

      {viewer?.user ? <details className="mt-10 rounded-2xl border border-border bg-card p-5 sm:p-7">
        <summary className="cursor-pointer text-base font-semibold text-foreground">Legacy format: single SKILL.md instruction file</summary>
        <p className="mt-3 text-sm text-muted-foreground">Use this only for an existing SKILL.md recipe. New multi-file recipes belong in the ZIP publisher above.</p>
      <div className="mt-6 grid gap-8 lg:grid-cols-[1.5fr_1fr] lg:gap-10">
        <PublishForm
          initialCategory={selectedCategory}
          initialSource={initialSource}
        />

        <aside className="lg:pt-1">
          <h2 className="text-sm font-semibold tracking-tight text-foreground">
            What we check
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Three automatic checks read the file; an optional AI classifier runs
            when configured. Submitted instructions are never executed.
          </p>

          <ul className="mt-5 grid gap-3">
            {SCAN_LAYERS.map((layer, i) => {
              const Icon = LAYER_ICONS[layer.key];
              return (
                <li
                  key={layer.key}
                  className="rounded-2xl border border-border bg-card p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                      <Icon className="size-4.5" aria-hidden />
                    </span>
                    <h3 className="text-sm font-semibold text-foreground">
                      {layer.name}
                    </h3>
                    <span className="ml-auto font-mono text-xs text-muted-foreground">
                      0{i + 1}
                    </span>
                  </div>
                  <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">
                    {layer.blurb}
                  </p>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
      </details> : null}
    </main>
  );
}
