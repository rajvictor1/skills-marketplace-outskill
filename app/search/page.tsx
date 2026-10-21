import { pageMetadata } from "@/lib/seo/site";
import { getCatalogState } from "@/lib/skills/catalog";
import { Catalog } from "@/components/catalog";
import { Breadcrumbs, PageSeo } from "@/components/seo/page-seo";
export const metadata = pageMetadata(
  "/search",
  "Search AI Agent Recipes by Task, Creator or Category",
  "Search Skillbuffet by task, recipe name, creator or tag. Compare reviewed files, requirements and runtime status before downloading.",
  false,
);
export const dynamic = "force-dynamic";
export default async function Search({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [catalog, params] = await Promise.all([
    getCatalogState(),
    searchParams,
  ]);
  return (
    <main className="mx-auto max-w-7xl px-5 py-12">
      <PageSeo
        path="/search"
        title="Search AI agent recipes"
        description="Search approved Skillbuffet listings by task, creator or tag."
        crumbs={[{ name: "Search recipes", path: "/search" }]}
      />
      <Breadcrumbs items={[{ name: "Search recipes", path: "/search" }]} />
      <h1 className="text-4xl font-semibold">Search AI agent recipes</h1>
      <p className="my-6 text-lg text-muted-foreground">
        Search approved listings by task, creator or tag. A matching result is a
        starting point: read its instructions and review before downloading.
      </p>
      <Catalog
        skills={catalog.skills}
        initialQuery={
          typeof params.q === "string" ? params.q.slice(0, 200) : ""
        }
      />
    </main>
  );
}
