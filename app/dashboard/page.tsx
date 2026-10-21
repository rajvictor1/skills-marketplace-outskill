export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import { MarketplaceOverview } from "@/components/dashboard/marketplace-overview";
import { getCatalogState } from "@/lib/skills/catalog";
import { getIllustrativeTrend } from "@/lib/dashboard-data";
import { SKILL_CATEGORY_NAMES } from "@/lib/skills/taxonomy";
export const metadata: Metadata = {
  title: "Marketplace Overview",
  robots: { index: false },
};
export default async function DashboardPage() {
  const catalog = await getCatalogState();
  return (
    <MarketplaceOverview
      trend={getIllustrativeTrend(90)}
      catalog={{
        available: catalog.source !== "unavailable",
        count: catalog.skills.length,
        downloads: catalog.skills.reduce(
          (total, item) => total + item.installs,
          0,
        ),
        categories: new Set(catalog.skills.map((s) => s.category)).size,
        categoryTotal: SKILL_CATEGORY_NAMES.length,
      }}
    />
  );
}
