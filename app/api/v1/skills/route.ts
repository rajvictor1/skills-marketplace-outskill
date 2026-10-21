import { getCatalogState } from "@/lib/skills/catalog";
export async function GET(request: Request) {
  const catalog = await getCatalogState();
  if (catalog.source === "unavailable")
    return Response.json({ error: "Catalog unavailable" }, { status: 503 });
  const query = new URL(request.url).searchParams;
  const category = query.get("category");
  const q = (query.get("q") ?? "").slice(0, 200).toLowerCase();
  const limit = Math.min(50, Math.max(1, Number(query.get("limit")) || 20));
  const offset = Math.max(0, Math.floor(Number(query.get("offset")) || 0));
  const rows = catalog.skills.filter(
    (s) =>
      (!category || s.category === category) &&
      (!q ||
        `${s.name} ${s.summary} ${(s.tags ?? []).join(" ")}`
          .toLowerCase()
          .includes(q)),
  );
  return Response.json({
    total: rows.length,
    limit,
    offset,
    skills: rows
      .slice(offset, offset + limit)
      .map((s) => ({
        slug: s.slug,
        name: s.name,
        summary: s.summary,
        category: s.category,
        subcategory: s.subcategory,
        version: s.version,
        downloads: s.installs,
        ratingAverage: s.ratingAverage ?? 0,
        ratingCount: s.ratingCount ?? 0,
        adminApproved: true,
        url: `/skills/${s.slug}`,
      })),
  });
}
