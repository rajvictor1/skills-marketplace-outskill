import { getCatalogSkillBySlug } from "@/lib/skills/catalog";
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const result = await getCatalogSkillBySlug(slug);
  if (result.status !== "found")
    return Response.json(
      {
        error:
          result.status === "unavailable"
            ? "Catalog unavailable"
            : "Recipe not found",
      },
      { status: result.status === "unavailable" ? 503 : 404 },
    );
  const s = result.skill;
  if (s.metadata?.isSample)
    return Response.json({ error: "Recipe not found" }, { status: 404 });
  return Response.json({
    slug: s.slug,
    name: s.name,
    summary: s.summary,
    category: s.category,
    subcategory: s.subcategory,
    version: s.version,
    metadata: s.metadata,
    downloads: s.installs,
    ratingAverage: s.ratingAverage ?? 0,
    ratingCount: s.ratingCount ?? 0,
    adminApproved: true,
    security: {
      trustTier: s.trustTier,
      riskScore: s.riskScore,
      scannerVersion: s.scannerVersion,
      classifier: s.classifierModel,
    },
    instructions: s.skillMd,
  });
}
