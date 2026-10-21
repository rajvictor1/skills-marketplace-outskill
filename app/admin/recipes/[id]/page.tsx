import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getViewer, isAdmin } from "@/lib/admin";
import { RecipeInputPreview } from "@/components/recipe-package-form";
import { getPrivateRecipeVersion } from "@/lib/recipes/storage";
import { privateRobots } from "@/lib/seo/site";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Private recipe files",
  robots: privateRobots,
  alternates: { canonical: null },
};

function displayContent(path: string, content: string) {
  if (!path.endsWith(".json")) return content;
  try {
    return JSON.stringify(JSON.parse(content), null, 2);
  } catch {
    return content;
  }
}

export default async function PrivateRecipeFiles({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ file?: string | string[] }>;
}) {
  const viewer = await getViewer();
  if (!viewer?.user) redirect("/auth/sign-in");
  if (!(await isAdmin(viewer.user.id))) notFound();

  const { id } = await params;
  const version = await getPrivateRecipeVersion(id);
  if (!version) notFound();

  const requested = (await searchParams).file;
  const selectedPath =
    typeof requested === "string" ? requested : version.manifest_path;
  const files = [...version.payload.files].sort((a, b) =>
    a.path.localeCompare(b.path),
  );
  const selected = files.find((file) => file.path === selectedPath);
  if (!selected) notFound();
  const content = displayContent(selected.path, selected.content);

  return (
    <main className="mx-auto max-w-7xl px-5 py-10 sm:px-8">
      <Link href="/admin/recipes" className="text-sm font-semibold text-primary">
        ← Private recipe workbench
      </Link>
      <header className="mt-5 rounded-3xl bg-category-violet p-6 sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-wider text-primary">
          Owner / team access · private files
        </p>
        <h1 className="mt-3 break-words text-2xl font-semibold tracking-tight sm:text-3xl">
          {version.listing_draft?.title ?? version.recipe_id}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {version.recipe_id} · v{version.version} · {files.length} files ·{" "}
          {version.status.replaceAll("_", " ")} · Runtime unverified
        </p>
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          Read source text and schemas without running them. This package is
          visible only to the platform owner/team.
        </p>
      </header>

      <div className="mt-7 grid gap-5 lg:grid-cols-[minmax(15rem,0.34fr)_minmax(0,1fr)]">
        <nav
          aria-label="Package files"
          className="min-w-0 rounded-2xl border border-border bg-card p-4"
        >
          <h2 className="px-2 text-sm font-semibold">Files ({files.length})</h2>
          <div className="mt-3 max-h-[70vh] space-y-1 overflow-auto">
            {files.map((file) => (
              <Link
                key={file.path}
                href={{
                  pathname: `/admin/recipes/${id}`,
                  query: { file: file.path },
                }}
                aria-current={file.path === selected.path ? "page" : undefined}
                className={`block break-all rounded-xl px-3 py-2 text-xs transition-colors hover:bg-category-teal ${
                  file.path === selected.path
                    ? "bg-category-teal font-semibold text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {file.path}
              </Link>
            ))}
          </div>
        </nav>

        <section className="min-w-0 rounded-2xl border border-border bg-card p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary">
                Source preview
              </p>
              <h2 className="mt-2 break-all text-lg font-semibold">
                {selected.path}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                {Buffer.byteLength(selected.content, "utf8").toLocaleString()} bytes
                {selected.path.endsWith(".json")
                  ? " · JSON formatted for reading"
                  : ""}
              </p>
            </div>
            <a
              href={`/api/v1/recipes/packages/${id}`}
              className="rounded-xl border border-border px-4 py-2 text-xs font-semibold text-primary hover:bg-category-violet"
            >
              Download complete package
            </a>
          </div>
          <pre className="mt-5 max-h-[70vh] overflow-auto whitespace-pre-wrap break-words rounded-xl border border-border bg-background p-4 font-mono text-xs leading-relaxed">
            <code>{content}</code>
          </pre>
          <p className="mt-3 text-xs text-muted-foreground">
            The original bytes remain in the private package download. This
            viewer does not edit or execute the file.
          </p>
        </section>
      </div>

      {version.inspection.inputFields.length > 0 && (
        <section className="mt-6 rounded-2xl border border-border bg-card p-5 sm:p-6">
          <h2 className="text-lg font-semibold">Check sample input</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Use fictional values to check this package&apos;s input schema. The
            check does not run the recipe or save the values.
          </p>
          <RecipeInputPreview
            id={version.id}
            fields={version.inspection.inputFields}
          />
        </section>
      )}
    </main>
  );
}
