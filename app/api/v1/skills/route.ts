import { getCatalogState } from "@/lib/skills/catalog";
import { CATEGORY_GROUPS } from "@/lib/skills/taxonomy";

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams;
  const limit = Math.min(48, Math.max(1, Math.floor(Number(query.get("limit")) || 24)));
  const offset = Math.min(240_000, Math.max(0, Math.floor(Number(query.get("offset")) || 0)));
  const page = Math.floor(offset / limit);
  const normalizedOffset = page * limit;
  const category = query.get("category")?.slice(0, 100) || undefined;
  const subcategory = query.get("subcategory")?.slice(0, 100) || undefined;
  const search = query.get("q")?.slice(0, 100) || undefined;
  const sortParam = query.get("sort");
  const sort = sortParam === "recent" || sortParam === "safest" ? sortParam : "popular";
  const group = query.get("group");
  const categories = group && group !== "All"
    ? CATEGORY_GROUPS.find((item) => item.name === group)?.categories.map((item) => item.name) ?? []
    : undefined;
  const catalog = await getCatalogState({ page, pageSize: limit, category, categories, subcategory, search, sort });
  if (catalog.source === "unavailable")
    return Response.json({ error: "Catalog unavailable" }, { status: 503 });
  return Response.json({
    total: catalog.total,
    limit,
    offset: normalizedOffset,
    skills: catalog.skills.map((item) => ({
      id: item.id,
      slug: item.slug,
      name: item.name,
      description: item.description,
      summary: item.summary,
      category: item.category,
      tags: item.tags ?? [],
      metadata: item.metadata ?? {},
      trustTier: item.trustTier,
      installs: item.installs,
      ratingAverage: item.ratingAverage ?? 0,
      ratingCount: item.ratingCount ?? 0,
      adminApproved: item.adminApproved ?? true,
      author: { name: item.author.name },
    })),
  });
}
