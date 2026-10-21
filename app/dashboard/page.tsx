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
  const realSkills = catalog.skills.filter((item) => !item.metadata?.isSample);
  return (
    <MarketplaceOverview
      trend={getIllustrativeTrend(90)}
      catalog={{
        available: catalog.source !== "unavailable",
        count: realSkills.length,
        downloads: realSkills.reduce((total, item) => total + item.installs, 0),
        categories: new Set(realSkills.map((s) => s.category)).size,
        categoryTotal: SKILL_CATEGORY_NAMES.length,
      }}
    />
  );
}
