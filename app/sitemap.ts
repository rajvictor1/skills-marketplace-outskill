import type { MetadataRoute } from "next";
import { discoveryEntries } from "@/lib/seo/discovery";
export const dynamic = "force-dynamic";
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  return discoveryEntries();
}
