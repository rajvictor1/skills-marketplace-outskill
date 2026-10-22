import "server-only";
import {
  PUBLIC_PAGES,
  CONTENT_UPDATED,
  INDEXING_ENABLED,
  absoluteUrl,
} from "@/lib/seo/site";
import { DOCS } from "@/lib/docs-content";
import { CATEGORY_GROUPS, categorySlug } from "@/lib/skills/taxonomy";
import { getPublishedCatalogIndex } from "@/lib/skills/catalog";
export async function discoveryEntries() {
  if (!INDEXING_ENABLED) return [];
  const real = [] as Awaited<ReturnType<typeof getPublishedCatalogIndex>>["entries"];
  for (let page = 0; ; page += 1) {
    const result = await getPublishedCatalogIndex(page);
    // Fail closed rather than publish an incomplete sitemap on a database outage.
    if (result.source === "unavailable")
      throw new Error("Catalog unavailable for sitemap generation");
    real.push(...result.entries.filter((entry) => entry.adminApproved && !entry.metadata?.isSample));
    if (!result.hasMore) break;
  }
  const pages = Object.keys(PUBLIC_PAGES)
    .filter((p) => p !== "/publish")
    .map((path) => ({ url: absoluteUrl(path), lastModified: CONTENT_UPDATED }));
  const docs = Object.keys(DOCS).map((slug) => ({
    url: absoluteUrl(`/docs/${slug}`),
    lastModified: CONTENT_UPDATED,
  }));
  const categories = CATEGORY_GROUPS.flatMap<{
    name: string;
    subcategories: readonly string[];
  }>((g) => g.categories).flatMap((c) => {
    if (!real.some((s) => s.category === c.name)) return [];
    const path = `/skills/categories/${categorySlug(c.name)}`;
    return [
      { url: absoluteUrl(path), lastModified: CONTENT_UPDATED },
      ...c.subcategories
        .filter((sub) =>
          real.some((s) => s.category === c.name && s.subcategory === sub),
        )
        .map((sub) => ({
          url: absoluteUrl(`${path}/${categorySlug(sub)}`),
          lastModified: CONTENT_UPDATED,
        })),
    ];
  });
  return [
    ...pages,
    ...docs,
    ...categories,
    ...real.map((s) => ({
      url: absoluteUrl(`/skills/${s.slug}`),
      lastModified: s.updatedAt,
    })),
  ];
}
