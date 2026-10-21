import { absoluteUrl, PUBLIC_PAGES } from "@/lib/seo/site";
import { DOCS } from "@/lib/docs-content";
import { CATEGORY_GROUPS, categorySlug } from "@/lib/skills/taxonomy";
export function GET() {
  const text = [
    "# Skillbuffet",
    "> A marketplace of reusable AI agent instructions, organized by category. Only administrator-approved saved versions reach the public catalog. Skillbuffet does not execute skills or guarantee their safety.",
    "## Core pages",
    ...Object.entries(PUBLIC_PAGES)
      .filter(
        ([p]) => !["/publish", "/reviews", "/privacy", "/terms"].includes(p),
      )
      .map(([p, v]) => `- [${v.title}](${absoluteUrl(p)}): ${v.description}`),
    "## Categories",
    ...CATEGORY_GROUPS.flatMap<{
      name: string;
      subcategories: readonly string[];
    }>((g) => g.categories).map(
      (c) =>
        `- [${c.name}](${absoluteUrl(`/skills/categories/${categorySlug(c.name)}`)}): ${c.subcategories.join(", ")}. Availability depends on approved submissions.`,
    ),
    "## Documentation",
    ...Object.entries(DOCS).map(
      ([slug, d]) =>
        `- [${d.title}](${absoluteUrl(`/docs/${slug}`)}): ${d.intro}`,
    ),
    "## Data and boundaries",
    "- Read-only approved catalog: " + absoluteUrl("/api/v1/skills"),
    "- Pending, rejected, blocked and unpublished submissions are private.",
    "- Workflow JSON templates are distinct from SKILL.md agent instructions.",
    "- Download counts do not prove installation or successful use. Ratings are not security certifications.",
    "- Preview environments are not intended for indexing.",
    "- This file is a discovery aid, not a guarantee of search ranking or AI citation.",
    "- Extended documentation: " + absoluteUrl("/llms-full.txt"),
  ].join("\n\n");
  return new Response(text, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
