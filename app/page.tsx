import { staticMetadata, PUBLIC_PAGES, INDEXING_ENABLED } from "@/lib/seo/site";
import { PageSeo, FaqSection } from "@/components/seo/page-seo";
import { HOME_FAQ } from "@/lib/seo/content";
export const metadata = staticMetadata("/");
import Link from "next/link";
import { headers } from "next/headers";
import {
  ArrowRight,
  ArrowUpRight,
  BadgeCheck,
  Bot,
  Eye,
  FileWarning,
  ShieldCheck,
  TerminalSquare,
} from "lucide-react";

import { SampleReviews } from "@/components/dashboard/sample-reviews";
import { getRatings } from "@/lib/community";
import { RatingSummary } from "@/components/community-reviews";
import { SKILL_CATEGORY_NAMES } from "@/lib/skills/taxonomy";
import { Button } from "@/components/ui/button";
import { ScanPreview } from "@/components/scan-preview";
import { SkillCard } from "@/components/skill-card";
import { DemoDataNotice } from "@/components/dashboard/demo-data-notice";
import { CategoryDirectory } from "@/components/category-directory";
import { getCatalogState } from "@/lib/skills/catalog";
import { WORKFLOW_TEMPLATES } from "@/lib/workflows/templates";
import { SCAN_LAYERS } from "@/lib/trust";

const LAYER_ICONS = {
  hidden_text: Eye,
  dangerous_pattern: FileWarning,
  script_analysis: TerminalSquare,
  llm_injection: Bot,
} as const;

export default async function Home() {
  await headers();
  const [catalog, reviews] = await Promise.all([
    getCatalogState(),
    getRatings("marketplace"),
  ]);
  const realSkills = catalog.skills.filter((item) => !item.metadata?.isSample);
  const featured = catalog.skills.slice(0, 3);
  const exampleCount = catalog.skills.filter(
    (skill) => skill.metadata?.isSample,
  ).length;
  const coveredCategories = new Set(realSkills.map((skill) => skill.category))
    .size;

  return (
    <main className="overflow-hidden">
      <PageSeo path="/" {...PUBLIC_PAGES["/"]} faq={HOME_FAQ} />
      <section className="brand-hero dark-surface relative px-5 pb-16 pt-16 text-foreground sm:px-8 sm:pb-24 sm:pt-28 lg:pb-32">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-5xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-border bg-primary/10 px-4 py-2 text-xs font-medium text-foreground/90 backdrop-blur-md">
              <ShieldCheck className="size-4 text-safe" aria-hidden />AI
              agent recipes you can inspect before you use
            </span>
            <h1 className="mt-7 text-balance text-[clamp(2.25rem,5.5vw,4.8rem)] font-semibold leading-[0.99] tracking-[-0.065em] text-foreground sm:mt-9">
              Discover AI agent recipes.
              <br />
              <span className="text-primary">Know what&apos;s inside.</span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-balance text-base leading-7 text-muted-foreground sm:mt-8 sm:text-xl sm:leading-relaxed">
              Find recipes for real work. See the instructions, included files
              and review details before deciding what to try in your own AI
              environment.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:mt-9 sm:flex-row">
              <Link
                href="/skills"
                className="brand-button inline-flex h-13 min-w-44 items-center justify-center gap-2 rounded-full px-7 text-sm font-semibold"
              >
                Explore recipes <ArrowRight className="size-4" aria-hidden />
              </Link>
              <Link
                href="/publish"
                className="cta-secondary inline-flex h-13 min-w-44 items-center justify-center gap-2 rounded-full border border-border px-7 text-sm font-semibold text-foreground transition-colors hover:bg-primary/10 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring"
              >
                Publish a recipe <ArrowUpRight className="size-4" aria-hidden />
              </Link>
            </div>
            <div className="mx-auto mt-7 flex max-w-xl flex-wrap items-center justify-center gap-4 rounded-2xl border border-border bg-primary/10 p-5 text-foreground sm:mt-9">
              <RatingSummary average={reviews.average} count={reviews.count} />
              <Link
                href="/reviews"
                className="text-sm font-semibold text-primary underline underline-offset-4"
              >
                {reviews.count
                  ? "Read community reviews"
                  : "Be the first to review Skillbuffet"}
              </Link>
            </div>
            <p className="mt-9 text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground sm:mt-12">
              For creators · teams · AI builders
            </p>
          </div>

          <div className="relative mx-auto mt-10 max-w-5xl rounded-[2rem] border border-border bg-primary/10 p-2 shadow-[0_32px_100px_#06091f99] sm:mt-16 sm:p-3">
            <div
              className="absolute inset-x-16 -top-12 -z-10 h-36 rounded-full bg-[#5875ff]/30 blur-3xl"
              aria-hidden
            />
            <ScanPreview />
          </div>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            An illustrative scanner example showing how a dangerous submission
            is blocked.
          </p>
        </div>
      </section>

      <section className="bg-background px-5 py-24 text-foreground sm:px-8 lg:py-32">
        <div className="mx-auto grid max-w-7xl items-start gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:gap-24">
          <div>
            <p className="editorial-kicker text-primary">
              Make an informed choice
            </p>
            <h2 className="mt-5 max-w-2xl text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
              Find a recipe. Understand it. Decide if it fits your workflow.
            </h2>
          </div>
          <div className="lg:pt-9">
            <p className="max-w-xl text-lg leading-relaxed text-muted-foreground">
              Each listing brings together a recipe&apos;s purpose, included
              files, declared access and review information. See what you are
              considering before you download and test it in your own system.
            </p>
            <Link
              href="#categories"
              className="mt-9 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
              Explore all {SKILL_CATEGORY_NAMES.length} categories{" "}
              <ArrowRight className="size-4" aria-hidden />
            </Link>
          </div>
        </div>
      </section>

      <CategoryDirectory compact />

      {!INDEXING_ENABLED && <SampleReviews />}

      <section className="bg-background px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="editorial-kicker text-primary">
              How Skillbuffet works
            </p>
            <h2 className="mt-4 text-balance text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-5xl">
              A clear path from discovery to review.
            </h2>
          </div>
          <div className="mt-14 grid gap-0 border-y border-border lg:grid-cols-3">
            {[
              [
                "01",
                "Discover",
                "Explore categories and find a recipe that matches the work you want to do.",
              ],
              [
                "02",
                "Inspect",
                "Read the instructions, inspect included files, and review the declared access and scan results.",
              ],
              [
                "03",
                "Submit for review",
                "Upload one supported recipe file or ZIP at a time. An administrator reviews it before it can be published.",
              ],
            ].map(([number, title, description]) => (
              <div
                key={number}
                className="border-b border-border py-9 last:border-b-0 lg:border-b-0 lg:border-r lg:px-9 lg:first:pl-0 lg:last:border-r-0"
              >
                <span className="font-mono text-xs font-semibold text-primary">
                  {number}
                </span>
                <h3 className="mt-6 text-2xl font-semibold tracking-[-0.04em]">
                  {title}
                </h3>
                <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="dark-surface bg-background px-5 py-24 text-foreground sm:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-end gap-8 lg:grid-cols-[1fr_0.9fr]">
            <div>
              <p className="editorial-kicker text-primary">What review means</p>
              <h2 className="mt-4 max-w-3xl text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.05em] sm:text-5xl lg:text-6xl">
                Review the recipe before it reaches the catalog.
              </h2>
            </div>
            <p className="max-w-xl text-base leading-relaxed text-muted-foreground lg:pb-2">
              Supported submissions go through format validation and static
              checks for signals such as hidden instructions, risky patterns
              and scripts. An administrator reviews each submitted version
              before approval. Skillbuffet does not execute recipes.
            </p>
          </div>
          <div className="mt-14 grid gap-px overflow-hidden rounded-[1.8rem] border border-border bg-primary/10 md:grid-cols-2 lg:grid-cols-4">
            {SCAN_LAYERS.map((layer, index) => {
              const Icon = LAYER_ICONS[layer.key];
              return (
                <div key={layer.key} className="bg-card p-7 sm:p-8">
                  <span className="flex size-11 items-center justify-center rounded-full bg-[#aebcff]/15 text-primary">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="mt-8 block font-mono text-xs text-muted-foreground">
                    0{index + 1} / 04
                  </span>
                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.035em]">
                    {layer.name}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                    {layer.blurb}
                  </p>
                </div>
              );
            })}
          </div>
          <p className="mt-6 max-w-3xl text-sm leading-relaxed text-muted-foreground">
            These checks can flag concerns, but they cannot guarantee safety or
            confirm how a recipe will behave in your environment. Review the
            files and grant only the access your agent needs.
          </p>
          <Link
            href="/security"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          >
            See how vetting works <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>

      <section className="bg-background px-5 py-24 sm:px-8 lg:py-32">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div>
              <p className="editorial-kicker text-primary">
                The curated collection
              </p>
              <h2 className="mt-4 max-w-2xl text-balance text-4xl font-semibold leading-tight tracking-[-0.05em] sm:text-5xl">
                Find your next useful recipe.
              </h2>
              <p className="mt-4 max-w-xl text-base text-muted-foreground">
                Browse the current collection across categories, including
                marketing, sales and technology.
              </p>
            </div>
            <Button
              size="lg"
              asChild
              className="brand-button h-11 rounded-full px-6"
            >
              <Link href="/skills">
                Browse all recipes <ArrowRight className="size-4" aria-hidden />
              </Link>
            </Button>
          </div>
          {featured.length > 0 && (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((skill) => (
                <SkillCard key={skill.id} skill={skill} />
              ))}
            </div>
          )}
          {exampleCount > 0 && (
            <div className="mt-8 max-w-3xl">
              <DemoDataNotice>
                Example recipes in this preview have not been submitted, scanned,
                or installed.
              </DemoDataNotice>
            </div>
          )}
        </div>
      </section>

      <section className="bg-background px-5 py-20 sm:px-8">
        <div className="mx-auto max-w-7xl">
          {exampleCount > 0 && (
            <div className="mb-5 max-w-3xl">
              <DemoDataNotice>{`${exampleCount} curated preview example is shown separately. Catalog metrics exclude examples.`}</DemoDataNotice>
            </div>
          )}
          <div className="grid grid-cols-2 gap-8 border-t border-border pt-10 lg:grid-cols-4">
            <Stat value={String(realSkills.length)} label="Catalog recipes" />
            <Stat
              value={String(coveredCategories)}
              label="Covered categories"
            />
            <Stat
              value={String(WORKFLOW_TEMPLATES.length)}
              label="Workflow templates"
            />
            <Stat
              value={String(
                realSkills.reduce((sum, skill) => sum + skill.installs, 0),
              )}
              label="Recorded download requests"
            />
          </div>
        </div>
      </section>

      <section className="brand-hero dark-surface px-5 py-24 text-center text-foreground sm:px-8 lg:py-32">
        <div className="mx-auto max-w-3xl">
          <BadgeCheck className="mx-auto size-11 text-primary" aria-hidden />
          <h2 className="mt-6 text-balance text-4xl font-semibold leading-[1.08] tracking-[-0.05em] sm:text-6xl">
            Have a workflow worth sharing?
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-muted-foreground">
            Submit a recipe for review. If approved, it can join the public
            catalog for other builders to explore.
          </p>
          <Link
            href="/publish"
            className="brand-button mt-9 inline-flex h-13 items-center justify-center gap-2 rounded-full px-8 text-sm font-semibold"
          >
            Publish a recipe <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </section>
      <FaqSection items={HOME_FAQ} groupName="home" />
    </main>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <p className="text-3xl font-semibold tracking-[-0.05em] sm:text-4xl">
        {value}
      </p>
      <p className="mt-2 text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
