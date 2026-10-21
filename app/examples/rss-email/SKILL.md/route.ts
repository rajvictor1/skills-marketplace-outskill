import {
  curatedExamplesEnabled,
  RSS_EXAMPLE_MARKDOWN,
} from "@/lib/curated-examples";
export const dynamic = "force-dynamic";
export function GET() {
  if (!curatedExamplesEnabled())
    return new Response("Not found", { status: 404 });
  return new Response(RSS_EXAMPLE_MARKDOWN, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": 'attachment; filename="SKILL.md"',
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "no-store",
    },
  });
}
