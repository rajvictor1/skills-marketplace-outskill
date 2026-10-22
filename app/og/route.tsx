import { ImageResponse } from "next/og";
import { PUBLIC_PAGES } from "@/lib/seo/site";
import { DOCS } from "@/lib/docs-content";
import { getCategoryBySlug, categorySlug } from "@/lib/skills/taxonomy";
import { getCatalogSkillBySlug } from "@/lib/skills/catalog";
export async function GET(request: Request) {
  const path = new URL(request.url).searchParams.get("path") ?? "/";
  let title: string | undefined = PUBLIC_PAGES[path]?.title,
    description: string | undefined = PUBLIC_PAGES[path]?.description;
  const parts = path.split("/").filter(Boolean);
  if (parts[0] === "docs" && parts.length === 2) {
    title = Object.hasOwn(DOCS, parts[1]) ? DOCS[parts[1]].title : undefined;
    description = Object.hasOwn(DOCS, parts[1])
      ? DOCS[parts[1]].intro
      : undefined;
  }
  if (parts[0] === "skills" && parts[1] === "categories" && parts.length >= 3) {
    const match = getCategoryBySlug(parts[2]);
    if (match) {
      const sub = parts[3]
        ? match.category.subcategories.find((s) => categorySlug(s) === parts[3])
        : undefined;
      if (parts.length === 3 || sub) {
        title = `${sub ?? match.category.name} AI agent recipes`;
        description = `Explore ${match.category.name} recipes. Inspect instructions, requirements and review results.`;
      }
    }
  }
  if (parts[0] === "skills" && parts.length === 2) {
    const lookup = await getCatalogSkillBySlug(parts[1]);
    if (lookup.status === "found" && !lookup.skill.metadata?.isSample) {
      title = lookup.skill.name;
      description = lookup.skill.summary;
    }
  }
  if (!title) return new Response("Not found", { status: 404 });
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          width: "100%",
          height: "100%",
          background: "#101522",
          color: "#eef0f7",
          padding: 64,
          borderTop: "12px solid #8b7af2",
        }}
      >
        <div style={{ display: "flex", color: "#b8adff", fontSize: 32 }}>
          Skillbuffet / AI agent recipes
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 60,
            lineHeight: 1.1,
            fontWeight: 700,
          }}
        >
          {title.slice(0, 110)}
        </div>
        <div
          style={{
            display: "flex",
            fontSize: 26,
            lineHeight: 1.4,
            color: "#abb5ca",
          }}
        >
          {description?.slice(0, 180)}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: { "Cache-Control": "public, max-age=300" },
    },
  );
}
