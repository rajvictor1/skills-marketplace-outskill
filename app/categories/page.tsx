import { staticMetadata, PUBLIC_PAGES } from "@/lib/seo/site";
import { Breadcrumbs, PageSeo } from "@/components/seo/page-seo";
import { CategoryDirectory } from "@/components/category-directory";
export const metadata = staticMetadata("/categories");
export default function Categories() {
  return (
    <main>
      <div className="mx-auto max-w-7xl px-5 pt-12">
        <PageSeo
          path="/categories"
          {...PUBLIC_PAGES["/categories"]}
          crumbs={[{ name: "Categories", path: "/categories" }]}
        />
        <Breadcrumbs items={[{ name: "Categories", path: "/categories" }]} />
        <h1 className="text-4xl font-semibold">AI agent recipe categories</h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">
          Explore business, technology, data, research and productivity recipes.
          Each category lists its specialties so you can find a relevant task or
          choose a field for your own submission. Empty categories accept
          submissions; only approved recipes are available for download.
        </p>
      </div>
      <CategoryDirectory />
    </main>
  );
}
