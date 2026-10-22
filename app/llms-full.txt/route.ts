import { absoluteUrl } from "@/lib/seo/site";
import { DOCS } from "@/lib/docs-content";
export function GET() {
  return new Response(
    [
      "# Skillbuffet documentation",
      "Reusable AI agent instructions with automated checks and administrator review. Skillbuffet does not run recipes. Review does not guarantee safety.",
      ...Object.entries(DOCS).map(
        ([slug, d]) =>
          `## ${d.title}\n\nSource: ${absoluteUrl(`/docs/${slug}`)}\n\n${d.intro}\n\n${d.sections.map((s) => `### ${s.title}\n\n${s.body}`).join("\n\n")}`,
      ),
    ].join("\n\n"),
    { headers: { "Content-Type": "text/plain; charset=utf-8" } },
  );
}
