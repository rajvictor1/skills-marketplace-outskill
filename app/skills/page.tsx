import Link from "next/link";
import { Breadcrumbs, PageSeo } from "@/components/seo/page-seo";
import { PUBLIC_PAGES } from "@/lib/seo/site";
import { staticMetadata } from "@/lib/seo/site";

import { headers } from "next/headers";

import { Catalog } from "@/components/catalog";
import { getCatalogState } from "@/lib/skills/catalog";
import { DemoDataNotice } from "@/components/dashboard/demo-data-notice";

export const metadata = staticMetadata("/skills", true);

export default async function SkillsPage() {
  await headers();
  const catalog = await getCatalogState();
  return (
    <main className="min-h-screen bg-background pb-16">
      <PageSeo
        path="/skills"
        {...PUBLIC_PAGES["/skills"]}
        crumbs={[{ name: "All recipes", path: "/skills" }]}
      />
      <div className="col-span-full mx-auto w-full max-w-7xl px-5 pt-6">
        <Breadcrumbs items={[{ name: "All recipes", path: "/skills" }]} />
      </div>
      <header className="mx-auto max-w-7xl px-5 pb-8 pt-10 sm:px-8 sm:pb-10 sm:pt-14">
        <p className="editorial-kicker text-primary">The Skillbuffet marketplace</p>
        <div className="mt-3 flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div>
            <h1 className="text-balance text-4xl font-semibold tracking-[-0.05em] text-foreground sm:text-5xl">
              Recipe Marketplace
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base">
              Find recipes by field or task. Review their instructions, declared access, and scan results before deciding what fits your workflow.
            </p>
          </div>
          <Link href="/publish" className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
            Submit a recipe <span className="ml-2" aria-hidden>↗</span>
          </Link>
        </div>
      </header>
      <div id="catalog-results" className="scroll-mt-20 border-t border-border/70 bg-background pt-6 sm:pt-8">
        {catalog.hasSampleContent && (
          <div className="mx-auto mb-5 max-w-7xl px-5 sm:px-8">
            <DemoDataNotice>
              A curated Markdown example is included for preview review. It is
              labeled untested and is separate from approved creator
              submissions.
            </DemoDataNotice>
          </div>
        )}
        {catalog.source === "unavailable" && (
          <div className="mx-auto mb-5 max-w-7xl px-5 sm:px-8">
            <DemoDataNotice>{`The database is unavailable. Real submissions cannot be shown right now${catalog.hasSampleContent ? ", but preview examples remain visible." : "."}`}</DemoDataNotice>
          </div>
        )}
        <Catalog skills={catalog.skills} variant="marketplace" />
      </div>
    </main>
  );
}
