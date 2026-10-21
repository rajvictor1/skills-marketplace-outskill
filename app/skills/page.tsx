import { Breadcrumbs, PageSeo } from "@/components/seo/page-seo";
import { PUBLIC_PAGES } from "@/lib/seo/site";
import { staticMetadata } from "@/lib/seo/site";

import { headers } from "next/headers";

import { Catalog } from "@/components/catalog";
import { CategoryDirectory } from "@/components/category-directory";
import { getCatalogState } from "@/lib/skills/catalog";
import { DemoDataNotice } from "@/components/dashboard/demo-data-notice";

export const metadata = staticMetadata("/skills", true);

export default async function SkillsPage() {
  await headers();
  const catalog = await getCatalogState();
  return (
    <main className="bg-card pb-24">
      <PageSeo
        path="/skills"
        {...PUBLIC_PAGES["/skills"]}
        crumbs={[{ name: "All skills", path: "/skills" }]}
      />
      <div className="col-span-full mx-auto w-full max-w-7xl px-5 pt-6">
        <Breadcrumbs items={[{ name: "All skills", path: "/skills" }]} />
      </div>
      <section className="brand-hero dark-surface px-5 py-20 text-foreground sm:px-8 sm:py-24">
        <div className="mx-auto max-w-7xl">
          <p className="editorial-kicker text-[#bbc7ff]">
            The Skillbuffet marketplace
          </p>
          <h1 className="mt-5 max-w-4xl text-balance text-5xl font-semibold leading-[1.04] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Find a skill for what comes next.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[#d4d6eb]">
            Browse AI agent skills by use case, inspect each review result, and
            decide what belongs in your workflow. Blocked submissions never
            appear here.
          </p>
        </div>
      </section>
      <CategoryDirectory />
      <div
        id="catalog-results"
        className="mx-auto max-w-7xl scroll-mt-20 border-t border-border px-5 pt-14 sm:px-8"
      >
        <p className="editorial-kicker text-primary">Search the marketplace</p>
        <h2 className="mb-7 mt-3 text-3xl font-semibold tracking-[-0.045em] text-foreground sm:text-4xl">
          All available skills
        </h2>
        {catalog.hasSampleContent && (
          <div className="mb-6 max-w-3xl">
            <DemoDataNotice>
              Example skills fill the preview categories. They are code
              fixtures, not creator submissions; they have not been scanned or
              installed.
            </DemoDataNotice>
          </div>
        )}
        {catalog.source === "unavailable" && (
          <div className="mb-6 max-w-3xl">
            <DemoDataNotice>{`The database is unavailable. Real submissions cannot be shown right now${catalog.hasSampleContent ? ", but preview examples remain visible." : "."}`}</DemoDataNotice>
          </div>
        )}
        <Catalog skills={catalog.skills} />
      </div>
    </main>
  );
}
