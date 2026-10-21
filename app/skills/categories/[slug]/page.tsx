import { pageMetadata } from "@/lib/seo/site";
import { Breadcrumbs, PageSeo, FaqSection } from "@/components/seo/page-seo";
import { categoryFaq } from "@/lib/seo/content";
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, ArrowUpRight } from "lucide-react";

import { Catalog } from "@/components/catalog";
import { DemoDataNotice } from "@/components/dashboard/demo-data-notice";
import { WorkflowTemplateCard } from "@/components/workflow-template-card";
import { getCatalogState } from "@/lib/skills/catalog";
import {
  CATEGORY_DESCRIPTIONS,
  categorySlug,
  getCategoryBySlug,
} from "@/lib/skills/taxonomy";
import { WORKFLOW_TEMPLATES } from "@/lib/workflows/templates";

type CategoryPageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const match = getCategoryBySlug(slug);
  if (!match) return { title: "Category not found" };
  const catalog = await getCatalogState();
  const hasReal = catalog.skills.some(
    (s) => s.category === match.category.name && !s.metadata?.isSample,
  );
  return pageMetadata(
    `/skills/categories/${slug}`,
    `${match.category.name} AI Skills and Task Guides`,
    `Explore ${match.category.name.toLowerCase()} AI agent skills. ${CATEGORY_DESCRIPTIONS[match.category.name]} Read the instructions before use.`,
    hasReal,
  );
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const match = getCategoryBySlug(slug);
  if (!match) notFound();

  await headers();
  const catalog = await getCatalogState();
  const skills = catalog.skills.filter(
    (skill) => skill.category === match.category.name,
  );
  const workflowTemplates = WORKFLOW_TEMPLATES.filter(
    (template) => template.category === match.category.name,
  );
  const related = match.group.categories
    .filter((item) => item.name !== match.category.name)
    .slice(0, 4);

  return (
    <main className="bg-card pb-24">
      <section className="brand-hero dark-surface px-5 pb-18 pt-12 text-foreground sm:px-8 sm:pb-22">
        <div className="mx-auto max-w-7xl">
          <PageSeo
            path={`/skills/categories/${slug}`}
            title={`${match.category.name} AI skills`}
            description={CATEGORY_DESCRIPTIONS[match.category.name]}
            crumbs={[
              { name: "All skills", path: "/skills" },
              { name: match.category.name, path: `/skills/categories/${slug}` },
            ]}
            faq={categoryFaq(match.category.name)}
          />
          <Breadcrumbs
            items={[
              { name: "All skills", path: "/skills" },
              { name: match.category.name, path: `/skills/categories/${slug}` },
            ]}
          />

          <div className="mt-16 flex flex-col justify-between gap-8 lg:flex-row lg:items-end">
            <div>
              <p className="editorial-kicker text-primary">
                {match.group.name} / Skills
              </p>
              <h1 className="mt-5 max-w-4xl text-balance text-5xl font-semibold leading-[1.02] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                {match.category.name} skills
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-muted-foreground">
                {CATEGORY_DESCRIPTIONS[match.category.name]} Browse specialties
                including {match.category.subcategories.join(", ")}. Compare
                each skill’s declared inputs, outputs, compatible agents and
                requested access. Read its saved instructions and review before
                using it with your own data.
              </p>
            </div>
            <Link
              href={`/publish?category=${slug}`}
              className="cta-secondary inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-full border border-border px-6 text-sm font-semibold text-foreground transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
            >
              Publish in this field{" "}
              <ArrowUpRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 pt-12 sm:px-8">
        <h2 className="text-2xl font-semibold">Browse by specialty</h2>
        <div className="mt-5 flex flex-wrap gap-3">
          {match.category.subcategories.map((sub) => (
            <Link
              key={sub}
              className="cta-secondary px-4 py-3 text-sm"
              href={`/skills/categories/${slug}/${categorySlug(sub)}`}
            >
              {sub}
            </Link>
          ))}
        </div>
      </section>
      {workflowTemplates.length > 0 && (
        <section
          id="workflow-templates"
          className="mx-auto max-w-7xl scroll-mt-24 px-5 pt-14 sm:px-8"
          aria-labelledby="workflow-templates-heading"
        >
          <p className="editorial-kicker text-primary">Automation templates</p>
          <h2
            id="workflow-templates-heading"
            className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-foreground sm:text-4xl"
          >
            n8n workflows for {match.category.name.toLowerCase()}
          </h2>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Download a workflow to import into your own n8n account. Workflows
            have separate setup requirements and are not AI agent skills.
          </p>
          <div className="mt-8 grid gap-5">
            {workflowTemplates.map((template) => (
              <WorkflowTemplateCard key={template.slug} template={template} />
            ))}
          </div>
        </section>
      )}

      <div className="mx-auto max-w-7xl px-5 pt-14 sm:px-8">
        <div className="flex flex-col justify-between gap-5 border-b border-border pb-7 sm:flex-row sm:items-end">
          <div>
            <p className="editorial-kicker text-primary">
              Explore this category
            </p>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.045em] text-foreground sm:text-4xl">
              AI skills for {match.category.name.toLowerCase()}
            </h2>
          </div>
          <Link
            href="/skills"
            className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            <ArrowLeft className="size-4" aria-hidden /> All categories
          </Link>
        </div>

        {catalog.hasSampleContent && (
          <div className="mt-7 max-w-3xl">
            <DemoDataNotice>
              These example skills are preview fixtures. They are not real
              submissions, scanned listings, or install activity.
            </DemoDataNotice>
          </div>
        )}
        {catalog.source === "unavailable" && (
          <div className="mt-7 max-w-3xl">
            <DemoDataNotice>{`The database could not be reached. Real submissions are unavailable${catalog.hasSampleContent ? ", but examples remain visible." : "."}`}</DemoDataNotice>
          </div>
        )}
        <div className="mt-9">
          <Catalog skills={skills} focusedCategory={match.category.name} />
        </div>
        {skills.length === 0 && catalog.source !== "unavailable" && (
          <Link
            href={`/publish?category=${slug}`}
            className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            Be the first to publish here{" "}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        )}
      </div>

      {related.length > 0 && (
        <section
          className="mx-auto mt-24 max-w-7xl border-t border-border px-5 pt-12 sm:px-8"
          aria-labelledby="related-categories-heading"
        >
          <h2
            id="related-categories-heading"
            className="text-2xl font-semibold tracking-[-0.035em] text-foreground"
          >
            Explore nearby fields
          </h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {related.map((item) => (
              <Link
                key={item.name}
                href={`/skills/categories/${categorySlug(item.name)}`}
                className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-5 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:text-primary"
              >
                {item.name}
                <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            ))}
          </div>
        </section>
      )}
      <FaqSection items={categoryFaq(match.category.name)} />
    </main>
  );
}
