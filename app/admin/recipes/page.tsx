import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getViewer, isAdmin } from "@/lib/admin";
import {
  listPrivateRecipeVersions,
  type PrivateRecipeVersion,
} from "@/lib/recipes/storage";
import { privateRobots } from "@/lib/seo/site";
import { AdminTabs } from "@/components/admin-tabs";
import {
  RecipePublicationForm,
  RecipeListingDraftForm,
  RecipeInputPreview,
  RecipePackageUpload,
  RecipePackageReview,
} from "@/components/recipe-package-form";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Private recipe workbench",
  robots: privateRobots,
  alternates: { canonical: null },
};
export default async function RecipeWorkbench({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const viewer = await getViewer();
  if (!viewer?.user) redirect("/auth/sign-in");
  if (!(await isAdmin(viewer.user.id))) notFound();
  let versions: PrivateRecipeVersion[] = [];
  let unavailable = false;
  let hasMore = false;
  const page = Math.min(10_000, Math.max(0, Math.floor(Number((await searchParams).page) || 0)));
  try {
    const result = await listPrivateRecipeVersions(page);
    versions = result.items;
    hasMore = result.hasMore;
  } catch {
    unavailable = true;
  }
  return (
    <main className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <AdminTabs active="recipes" />
      <Link href="/admin" className="text-sm font-semibold text-primary">
        ← Admin review desk
      </Link>
      <header className="mt-5 rounded-3xl bg-category-violet p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Owner / team access
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Private recipe workbench
        </h1>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          Save complete recipe packages, inspect their contracts and record an
          approval for the private registry. Published catalog access and
          runtime activation remain separate steps.
        </p>
      </header>
      <section className="mt-7 rounded-2xl border border-border bg-card p-6">
        <h2 className="text-xl font-semibold">Upload a package</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Upload the prepared JSON envelope containing files and a manifestPath.
          Source scripts are inspected as text. Runtime form input is discarded
          before storage.{" "}
          <Link href="/docs/recipe-packages" className="text-primary underline">
            Preparation guide
          </Link>
        </p>
        {unavailable ? (
          <p role="alert" className="mt-4 text-sm text-caution">
            Private recipe storage is unavailable in this environment. No files
            have been saved. The configured Preview is required.
          </p>
        ) : (
          <RecipePackageUpload />
        )}
      </section>
      <section className="mt-9">
        <h2 className="text-xl font-semibold">Saved versions</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          20 versions per page. Files and inspection reports are immutable;
          corrections require a new version number.
        </p>
        {!unavailable && !versions.length && (
          <p className="mt-5 rounded-2xl border border-border bg-category-teal p-6 text-sm">
            No packages saved yet. Your first private upload will appear here.
          </p>
        )}
        <div className="mt-5 space-y-5">
          {versions.map((v) => (
            <article
              key={v.id}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <div className="flex flex-wrap justify-between gap-3">
                <h3 className="break-all text-lg font-semibold">
                  {v.recipe_id}{" "}
                  <span className="text-sm text-muted-foreground">
                    v{v.version}
                  </span>
                </h3>
                <span className="rounded-full bg-category-teal px-3 py-1 text-xs font-semibold">
                  {v.status.replaceAll("_", " ")}
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">
                {v.inspection.files.length} files ·{" "}
                {v.inspection.inputFields.length} input fields ·{" "}
                {v.inspection.issues.length} structural issues ·{" "}
                {v.inspection.security.status.replaceAll("_", " ")}
              </p>
              <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
                SHA-256 {v.package_hash}
              </p>
              {v.inspection.issues.length > 0 && (
                <div className="mt-4 rounded-xl border border-border bg-category-peach p-4">
                  <p className="text-sm font-semibold">
                    {v.inspection.issues.length} compatibility issue
                    {v.inspection.issues.length === 1 ? "" : "s"} to resolve
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    {v.inspection.issues.slice(0, 5).map((issue, index) => (
                      <li key={`${issue.file}-${issue.path}-${index}`}>
                        {issue.file}
                        {issue.path ? ` · ${issue.path}` : ""}: {issue.message}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-xs text-muted-foreground">
                    The private draft stays available for review. Corrected
                    source files need a new version number.
                  </p>
                </div>
              )}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-semibold">
                  Inspect validation report and runtime blockers
                </summary>
                <pre className="mt-3 max-h-96 overflow-auto whitespace-pre-wrap break-words rounded-xl bg-background p-4 text-xs">
                  {JSON.stringify(v.inspection, null, 2)}
                </pre>
              </details>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2">
                <Link
                  href={`/admin/recipes/${v.id}`}
                  className="text-sm font-semibold text-primary underline"
                >
                  Explore {v.inspection.files.length} files
                </Link>
                <a
                  href={`/api/v1/recipes/packages/${v.id}`}
                  className="text-sm font-semibold text-primary underline"
                >
                  Download private package and report
                </a>
              </div>
              {v.review_note && (
                <p className="mt-3 whitespace-pre-wrap break-words text-sm">
                  Review: {v.review_note}
                </p>
              )}
              {(v.status === "draft" || v.status === "pending_review") && (
                <RecipePackageReview id={v.id} status={v.status} />
              )}
              {v.inspection.inputFields.length > 0 && (
                <RecipeInputPreview
                  id={v.id}
                  fields={v.inspection.inputFields}
                />
              )}
              <RecipeListingDraftForm
                id={v.id}
                recipeId={v.recipe_id}
                draft={v.listing_draft}
                reviewStatus={v.status}
              />
              {v.status === "approved" && (
                <RecipePublicationForm id={v.id} draft={v.listing_draft} />
              )}
              <p className="mt-4 text-xs text-muted-foreground">
                Private source record · Publication tracked at the admin review
                desk · Installed: no · Runtime verified: no · Active: no
              </p>
            </article>
          ))}
        </div>
        <nav className="mt-6 flex justify-between gap-4 text-sm font-semibold text-primary" aria-label="Private recipe versions">
          {page > 0 ? <Link href={`/admin/recipes?page=${page - 1}`}>← Previous page</Link> : <span />}
          {hasMore && <Link href={`/admin/recipes?page=${page + 1}`}>Next page →</Link>}
        </nav>
      </section>
    </main>
  );
}
