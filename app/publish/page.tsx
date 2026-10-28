import { Breadcrumbs, PageSeo } from "@/components/seo/page-seo";
import { PUBLIC_PAGES } from "@/lib/seo/site";
import { staticMetadata } from "@/lib/seo/site";

import { ShieldCheck } from "lucide-react";
import { RecipePublisherOptions } from "@/components/recipe-publisher-options";
import { getCategoryBySlug } from "@/lib/skills/taxonomy";
import { getViewer } from "@/lib/admin";
import { hasDatabaseConnection } from "@/lib/db/connection";

export const metadata = staticMetadata("/publish", false);

export default async function PublishPage({
  searchParams,
}: {
  searchParams: Promise<{
    category?: string | string[];
  }>;
}) {
  const params = await searchParams;
  const databaseReady = hasDatabaseConnection();
  const viewer = databaseReady ? await getViewer() : null;
  const requestedCategory = params.category;
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
          Submit a recipe for review
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          The manager-standard submission is a human-readable recipe.md plus a separate validation-report.md. The checker follows the manager&apos;s A–Q sections and report requirements. New YAML and ZIP submissions are paused until the team approves their package contract. Nothing is installed or run.
        </p>
      </div>

      <RecipePublisherOptions
        databaseReady={databaseReady}
        authenticated={Boolean(viewer?.user)}
        initialCategory={selectedCategory}
      />
    </main>
  );
}
