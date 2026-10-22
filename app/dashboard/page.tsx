export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { MarketplaceOverview } from "@/components/dashboard/marketplace-overview";
import { getCatalogCounters } from "@/lib/skills/catalog";
import { getIllustrativeTrend } from "@/lib/dashboard-data";
import { SKILL_CATEGORY_NAMES } from "@/lib/skills/taxonomy";
export const metadata: Metadata = {
  title: "Marketplace Overview",
  robots: { index: false },
};
export default async function DashboardPage() {
  const catalog = await getCatalogCounters();
  return (
    <MarketplaceOverview
      trend={getIllustrativeTrend(90)}
      catalog={{
      available: catalog.available,
      count: catalog.published,
      downloads: catalog.downloads,
      categories: catalog.categories,
        categoryTotal: SKILL_CATEGORY_NAMES.length,
      }}
    />
  );
}
