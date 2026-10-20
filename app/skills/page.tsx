import type { Metadata } from "next";
import { headers } from "next/headers";

import { Catalog } from "@/components/catalog";
import { CategoryDirectory } from "@/components/category-directory";
import { getCatalogState } from "@/lib/skills/catalog";
import { DemoDataNotice } from "@/components/dashboard/demo-data-notice";

export const metadata: Metadata = {
  title: "Browse skills",
  description:
    "Browse security-scanned AI agent skills by category, permissions, compatibility, and trust tier.",
};

export default async function SkillsPage() {
  await headers();
  const catalog = await getCatalogState();
  return (
    <main className="bg-white pb-24">
      <section className="brand-hero dark-surface px-5 py-20 text-foreground sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="editorial-kicker text-[#bbc7ff]">The Skillbuffet marketplace</p>
          <h1 className="mt-5 max-w-4xl text-balance text-5xl font-semibold leading-[1.04] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Find a skill for what comes next.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#d4d6eb]">
            Browse AI agent skills by use case, inspect each review result, and decide what belongs in your workflow. Blocked submissions never appear here.
          </p>
        </div>
      </section>
      <CategoryDirectory />
      <div id="catalog-results" className="mx-auto max-w-7xl scroll-mt-20 border-t border-border px-5 pt-14 sm:px-8">
        <p className="editorial-kicker text-primary">Search the marketplace</p>
        <h2 className="mb-7 mt-3 text-3xl font-semibold tracking-[-0.045em] text-foreground sm:text-4xl">All available skills</h2>
        {catalog.hasSampleContent && <div className="mb-6 max-w-3xl"><DemoDataNotice>The catalog includes example skills for preview. Their stored scan records do not represent customer submissions or live install analytics.</DemoDataNotice></div>}
        {catalog.source === "unavailable" && <div className="mb-6 max-w-3xl"><DemoDataNotice>The database is configured but could not be reached. The catalog is empty until the connection and migrations are available.</DemoDataNotice></div>}
        <Catalog skills={catalog.skills} />
      </div>
    </main>
  );
}
