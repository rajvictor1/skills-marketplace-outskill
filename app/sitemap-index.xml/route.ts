import { absoluteUrl, INDEXING_ENABLED } from "@/lib/seo/site";
export function GET() {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${INDEXING_ENABLED ? `<sitemap><loc>${absoluteUrl("/sitemap.xml")}</loc></sitemap>` : ""}</sitemapindex>`,
    { headers: { "Content-Type": "application/xml; charset=utf-8" } },
  );
}
