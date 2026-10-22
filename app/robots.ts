import type { MetadataRoute } from "next";
import { INDEXING_ENABLED, absoluteUrl } from "@/lib/seo/site";
export default function robots(): MetadataRoute.Robots {
  return INDEXING_ENABLED
    ? {
        rules: {
          userAgent: "*",
          allow: "/",
          disallow: [
            "/admin",
            "/dashboard",
            "/api/",
            "/auth/",
            "/publish",
            "/search",
          ],
        },
        sitemap: absoluteUrl("/sitemap-index.xml"),
      }
    : { rules: { userAgent: "*", disallow: "/" } };
}
