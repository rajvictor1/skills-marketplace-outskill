import { skillFaq } from "@/lib/seo/content";
import { pageMetadata, absoluteUrl } from "@/lib/seo/site";
import { PageSeo, Breadcrumbs, FaqSection } from "@/components/seo/page-seo";
import { categorySlug } from "@/lib/skills/taxonomy";
import { SkillCard } from "@/components/skill-card";
import { getCatalogState } from "@/lib/skills/catalog";
import type { Metadata } from "next";
import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Download,
  FileText,
  TerminalSquare,
  Clock,
  Package,
} from "lucide-react";

import { TrustBadge } from "@/components/trust-badge";
import { FindingsList } from "@/components/findings-list";
import { Markdown } from "@/components/markdown";
import { RatingSummary, ReviewForm } from "@/components/community-reviews";
import { getRatings, getRecipeReviewAccess } from "@/lib/community";
import { DemoDataNotice } from "@/components/dashboard/demo-data-notice";
import { SEVERITY_META } from "@/lib/trust";
import { getCatalogSkillBySlug } from "@/lib/skills/catalog";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const lookup = await getCatalogSkillBySlug(slug);
  if (lookup.status !== "found")
    return {
      robots: { index: false, follow: true },
      alternates: { canonical: null },
      title:
        lookup.status === "unavailable"
          ? "Catalog unavailable"
          : "Recipe not found",
    };
  const { skill } = lookup;
  return pageMetadata(
    `/skills/${slug}`,
    `${skill.name}: ${skill.category} AI Recipe`,
    skill.summary,
    lookup.source !== "demo" && !skill.metadata?.isSample,
  );
}

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await headers();
  const { slug } = await params;
  const lookup = await getCatalogSkillBySlug(slug);
  // Keep this check outside loading/Suspense boundaries so missing recipes
  // send an HTTP 404 before Next.js starts streaming the response.
  if (lookup.status === "not_found") notFound();
  if (lookup.status === "unavailable")
    return (
      <main className="mx-auto max-w-4xl px-4 py-16 sm:px-6">
        <DemoDataNotice>
          The catalog database is currently unavailable, so this listing could
          not be confirmed. Check the database connection and migrations, then
          try again.
        </DemoDataNotice>
      </main>
    );
  const { skill } = lookup;
  const isPackage = skill.metadata?.format === "recipe_package";
  const isMarkdownRecipe = skill.metadata?.format === "recipe_markdown";
  const [ratings, catalog, reviewAccess] = await Promise.all([
    getRatings(skill.id),
    getCatalogState(),
    getRecipeReviewAccess(skill.id),
  ]);
  const related = catalog.skills
    .filter(
      (s) =>
        s.slug !== skill.slug &&
        s.category === skill.category &&
        !s.metadata?.isSample,
    )
    .slice(0, 3);
  const path = `/skills/${slug}`;
  const crumbs = [
    { name: "All recipes", path: "/skills" },
    {
      name: skill.category,
      path: `/skills/categories/${categorySlug(skill.category)}`,
    },
    { name: skill.name, path },
  ];
  const isExample =
    lookup.source === "demo" || Boolean(skill.metadata?.isSample);

  const severityCounts = skill.findings.reduce<Record<string, number>>(
    (acc, f) => {
      acc[f.severity] = (acc[f.severity] ?? 0) + 1;
      return acc;
    },
    {},
  );

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <PageSeo
        path={path}
        title={skill.name}
        description={skill.summary}
        crumbs={crumbs}
        faq={skillFaq(skill.name, isPackage)}
        entities={
          isExample
            ? []
            : [
                {
                  "@type": "SoftwareApplication",
                  "@id": absoluteUrl(`${path}#skill`),
                  name: skill.name,
                  description: skill.summary,
                  url: absoluteUrl(path),
                  applicationCategory: skill.category,
                  softwareVersion: skill.version,
                  dateModified: skill.updatedAt,
                  author: { "@type": "Person", name: skill.author.name },
                  ...(ratings.count > 0
                    ? {
                        aggregateRating: {
                          "@type": "AggregateRating",
                          ratingValue: ratings.average,
                          ratingCount: ratings.count,
                          bestRating: 5,
                          worstRating: 1,
                        },
                      }
                    : {}),
                },
              ]
        }
      />
      <Breadcrumbs items={crumbs} />
      <Link
        href="/skills"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden />
        Back to catalog
      </Link>

      {/* header */}
      <div className="mt-6 flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="rounded-md bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
              {skill.category}
            </span>
            {skill.subcategory && (
              <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground">
                {skill.subcategory}
              </span>
            )}
            {isExample ? (
              <span className="rounded-full border border-primary/20 bg-primary/[0.07] px-2.5 py-1 text-xs font-semibold text-primary">
                Example recipe
              </span>
            ) : (
              <TrustBadge tier={skill.trustTier} />
            )}
            {isPackage && (
              <span className="rounded-md bg-caution/10 px-2 py-1 text-xs font-semibold text-caution">
                Package reviewed · Runtime not verified
              </span>
            )}
            {isMarkdownRecipe && (
              <span className="rounded-md bg-category-blue px-2 py-1 text-xs font-semibold text-primary">
                Recipe Markdown · validation report included
              </span>
            )}
            <span className="font-mono text-xs text-muted-foreground">
              v{skill.version}
            </span>
          </div>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {skill.name}
          </h1>
          <p className="mt-2 max-w-2xl text-base text-muted-foreground">
            {skill.summary}
          </p>
          {skill.tags?.length ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {skill.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          ) : null}

          <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-2">
              <span className="flex size-7 items-center justify-center rounded-full bg-secondary text-[11px] font-medium text-secondary-foreground">
                {skill.author.initials}
              </span>
              <span className="text-foreground">{skill.author.name}</span>
              <span>· {skill.author.role}</span>
            </span>
            {!isExample && (
              <span className="flex items-center gap-1.5">
                <Download className="size-4" aria-hidden />
                {skill.installs.toLocaleString()} recorded download requests
              </span>
            )}
            {!isExample && (
              <span className="flex items-center gap-1.5">
                <Clock className="size-4" aria-hidden />
                Updated{" "}
                <time dateTime={skill.updatedAt}>{skill.updatedAt}</time>
              </span>
            )}
          </div>
        </div>
      </div>

      {isExample && (
        <div className="mt-6">
          <DemoDataNotice>
            This is an example for the marketplace preview. It is not a creator
            submission and has not been security scanned or execution tested.
            Download the example instructions for inspection; it is not an
            n8n-importable workflow.
          </DemoDataNotice>
        </div>
      )}

      {!isExample && (
        <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-safe/25 bg-category-teal px-5 py-4">
          <span className="text-sm font-semibold text-safe">
            ✓ Admin approved version {skill.version}
          </span>
          <RatingSummary average={ratings.average} count={ratings.count} />
        </div>
      )}
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_20rem] lg:gap-12">
        {/* main column */}
        <div className="min-w-0 space-y-10">
          <section>
            <h2 className="text-xl font-semibold">How to use this recipe</h2>
            <ol className="mt-4 list-decimal space-y-3 pl-5 leading-7 text-muted-foreground">
              <li>
                Read the complete instructions, license, creator-declared
                compatibility and access declarations for version {skill.version}.
              </li>
              <li>
                {isExample
                  ? "Download the example SKILL.md for inspection. Review and adapt it in an isolated environment before use."
                  : isPackage
                    ? "Sign in and download the reviewed recipe package. Inspect its manifest and bundled schemas before integration."
                    : isMarkdownRecipe
                      ? "Download the approved recipe Markdown and its separate validation report. Review the evidence and limitations before adapting it."
                    : "Sign in and download the approved SKILL.md. Follow your agent application’s instructions for loading SKILL.md."}
              </li>
              <li>
                {isPackage
                  ? "Arrange a compatible adapter and provider access before attempting execution. The downloaded contract does not activate itself."
                  : "Use the creator’s declared inputs, check the result, and keep sensitive data out until you understand the workflow."}
              </li>
            </ol>
            <p className="mt-4 leading-7 text-muted-foreground">
              Skillbuffet does not execute this recipe. Approval and scanning
              cannot guarantee safety, compatibility or output quality.{" "}
              {skill.metadata?.inputs
                ? `Declared input: ${skill.metadata.inputs}`
                : "The creator has not supplied a separate input example."}{" "}
              {skill.metadata?.outputs
                ? `Declared output: ${skill.metadata.outputs}`
                : "The creator has not supplied a separate output example."}{" "}
              These declarations are not independently tested outputs.
            </p>
            <Link
              href="/how-it-works"
              className="mt-4 inline-block text-primary underline"
            >
              Read the installation and review guide
            </Link>
          </section>
          {/* scan report */}
          {!isExample && (
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-foreground">
                  Security scan report
                </h2>
                <span className="font-mono text-xs text-muted-foreground">
                  {skill.scannerVersion}
                </span>
              </div>

              <div className="mt-4">
                <TrustBadge tier={skill.trustTier} showBlurb />
              </div>

              {/* severity summary */}
              {skill.findings.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {(["critical", "high", "medium", "low", "info"] as const)
                    .filter((s) => severityCounts[s])
                    .map((s) => (
                      <span
                        key={s}
                        className={
                          "rounded-full px-2.5 py-0.5 text-xs font-medium " +
                          SEVERITY_META[s].surface
                        }
                      >
                        {severityCounts[s]}{" "}
                        {SEVERITY_META[s].label.toLowerCase()}
                      </span>
                    ))}
                </div>
              )}

              <div className="mt-5">
                <FindingsList findings={skill.findings} />
              </div>

              <p className="mt-4 text-xs text-muted-foreground">
                Classifier: {skill.classifierModel}. Static checks can flag
                some patterns but cannot establish overall safety. Review a
                recipe before trusting it with sensitive data.
              </p>
            </section>
          )}

          {!isExample && (
            <section
              id="reviews"
              className="rounded-2xl border border-border bg-caution/10 p-6"
            >
              <h2 className="text-xl font-semibold">Community reviews</h2>
              <div className="mt-3">
                <RatingSummary
                  average={ratings.average}
                  count={ratings.count}
                />
              </div>
              {!ratings.count && (
                <p className="mt-3 text-sm text-muted-foreground">
                  No reviews yet. Download and try this recipe, then share your
                  experience.
                </p>
              )}
              {ratings.reviews.map((review) => (
                <article
                  key={review.id}
                  className="mt-5 border-t border-border pt-4"
                >
                  <p className="text-sm font-semibold">
                    {review.name} · {review.stars}/5{" "}
                    <span className="font-normal text-muted-foreground">
                      · Account with a recorded download request
                    </span>
                  </p>
                  <p className="mt-2 whitespace-pre-wrap text-sm">
                    {review.comment || "Star rating only"}
                  </p>
                </article>
              ))}
              <ReviewForm target={skill.id} access={reviewAccess} />
            </section>
          )}
          {/* SKILL.md */}
          <section>
            <h2 className="text-lg font-semibold text-foreground">
              {isPackage ? "Recipe integration guide" : "SKILL.md"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {isExample
                ? "Illustrative instructions for this preview listing. Adapt and review them before submitting a real recipe."
                : isPackage
                  ? "A guide to the reviewed source package. Runtime execution and activation have not been verified."
                  : "The saved instruction file for you to inspect and add to a compatible agent. Review it before installation."}
            </p>
            <div className="mt-4 rounded-2xl border border-border bg-card p-6">
              <Markdown>
                {isExample
                  ? skill.skillMd.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, "")
                  : skill.skillMd}
              </Markdown>
            </div>
          </section>
        </div>

        {/* sidebar */}
        <aside className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <MarketplaceDetails metadata={skill.metadata} />
          {isExample ? (
            <div className="rounded-2xl border border-border bg-card p-5">
              <h2 className="text-sm font-semibold text-foreground">
                Inspect this example
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
                Original Markdown adaptation inspired by Mutasem’s RSS-to-email
                recipe. The source workflow JSON is not included.
              </p>
              <a
                href="/examples/rss-email/SKILL.md"
                download="SKILL.md"
                className="cta-primary mt-4 inline-flex rounded-full px-4 py-3 text-sm font-semibold"
              >
                Download example SKILL.md
              </a>
              <a
                href={skill.metadata?.documentationUrl}
                className="mt-4 block text-xs text-primary underline"
              >
                Source recipe by Mutasem on n8n
              </a>
            </div>
          ) : (
            <div
              id="download-recipe"
              className="rounded-2xl border border-border bg-card p-5"
            >
              <h2 className="text-lg font-semibold text-foreground">
                Make it part of your toolkit.
              </h2>
              <p className="mt-3 text-sm text-muted-foreground">
                {isPackage
                  ? "Download the original multi-file recipe package as JSON. Runtime adapter implementation and provider setup are still required."
                  : isMarkdownRecipe
                    ? "Download the two approved Markdown deliverables separately. The report is creator-provided and its evidence is not independently verified."
                    : "Download the approved SKILL.md, read its instructions, and add it to your agent’s skills folder."}
              </p>
              {isMarkdownRecipe ? (
                <div className="mt-5 flex flex-wrap gap-3">
                  {([ ["recipe.md", "Download recipe.md"], ["validation-report.md", "Download validation report"] ] as const).map(([file, label]) => (
                    <form key={file} action={`/api/skills/${skill.slug}/download`} method="post">
                      <input type="hidden" name="file" value={file} />
                      <button className="cta-primary inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
                        <Download className="size-4" aria-hidden />{label}
                      </button>
                    </form>
                  ))}
                </div>
              ) : (
                <form action={`/api/skills/${skill.slug}/download`} method="post" className="mt-5">
                  <button className="cta-primary inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground">
                    <Download className="size-4" aria-hidden />
                    {isPackage ? "Download recipe package" : "Download SKILL.md"}
                  </button>
                </form>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Sign-in required. A download request is recorded when the
                server starts sending the saved file. Repeat requests for the
                same version count once per account; this does not confirm a
                complete transfer or use. Creator downloads do not increase the
                counter.
              </p>
            </div>
          )}

          <div className="rounded-2xl border border-border bg-card p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Package className="size-4 text-muted-foreground" aria-hidden />
              Bundle contents
            </h2>
            <ul className="mt-3 grid gap-2">
              {skill.files.map((f) => (
                <li key={f.path} className="flex items-center gap-2 text-sm">
                  {f.isScript ? (
                    <TerminalSquare
                      className="size-4 shrink-0 text-caution"
                      aria-hidden
                    />
                  ) : (
                    <FileText
                      className="size-4 shrink-0 text-muted-foreground"
                      aria-hidden
                    />
                  )}
                  <span className="truncate font-mono text-xs text-foreground">
                    {f.path}
                  </span>
                  <span className="ml-auto font-mono text-xs text-muted-foreground">
                    {f.sizeLabel}
                  </span>
                </li>
              ))}
            </ul>
            {!isExample && (
              <p className="mt-3 text-xs text-muted-foreground">
                Scripts are analyzed statically. We never execute a submitted
                recipe.
              </p>
            )}
          </div>
        </aside>
      </div>
      {related.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-semibold">
            Related {skill.category.toLowerCase()} recipes
          </h2>
          <div className="mt-6 grid gap-5 md:grid-cols-3">
            {related.map((s) => (
              <SkillCard key={s.slug} skill={s} />
            ))}
          </div>
        </section>
      )}
      <FaqSection
        items={skillFaq(skill.name, isPackage)}
        groupName={`skill-${skill.slug}`}
      />
    </main>
  );
}

function MarketplaceDetails({
  metadata,
}: {
  metadata?: import("@/lib/sample-data").SkillMarketplaceMetadata;
}) {
  if (!metadata) return null;
  const permissions = metadata.requestedPermissions ?? [];
  const compatibility = metadata.compatibility ?? [];
  const hasDetails =
    metadata.license ||
    permissions.length ||
    compatibility.length ||
    metadata.inputs ||
    metadata.outputs ||
    metadata.dataHandling ||
    metadata.documentationUrl ||
    metadata.supportUrl;
  if (!hasDetails) return null;
  const documentationUrl = safeHttpsUrl(metadata.documentationUrl);
  const supportUrl = safeHttpsUrl(metadata.supportUrl);
  const githubUrl = safeHttpsUrl(metadata.githubUrl);
  return (
    <section
      className="rounded-2xl border border-border bg-card p-5"
      aria-labelledby="skill-profile-title"
    >
      <h2 id="skill-profile-title" className="text-sm font-semibold">
        Recipe profile
      </h2>
      {metadata.license && (
        <DetailField label="License" value={metadata.license} />
      )}
      <DetailField
        label="Creator-declared compatibility"
        value={
          compatibility.length ? compatibility.join(", ") : "Not specified"
        }
      />
      <div className="mt-4">
        <p className="text-xs font-medium text-muted-foreground">
          Declared access needs
        </p>
        {permissions.length ? (
          <ul className="mt-2 grid gap-1.5">
            {permissions.map((permission) => (
              <li
                key={permission}
                className="flex items-start gap-2 text-xs leading-relaxed"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-caution" />
                {permission}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-xs text-foreground">
            No extra access declared
          </p>
        )}
      </div>
      {metadata.inputs && (
        <DetailField label="Expected inputs" value={metadata.inputs} />
      )}
      {metadata.outputs && (
        <DetailField label="Expected outputs" value={metadata.outputs} />
      )}
      {metadata.dataHandling && (
        <DetailField label="Data handling" value={metadata.dataHandling} />
      )}
      {githubUrl && (
        <p className="mt-4 text-xs">
          <a
            href={githubUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            GitHub source repository ↗
          </a>
          <span className="mt-1 block text-muted-foreground">
            Source link supplied by the creator and reviewed with this version.
          </span>
        </p>
      )}
      {documentationUrl && (
        <p className="mt-4 text-xs">
          <a
            href={documentationUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            Documentation ↗
          </a>
        </p>
      )}
      {supportUrl && (
        <p className="mt-2 text-xs">
          <a
            href={supportUrl}
            target="_blank"
            rel="noreferrer"
            className="text-primary hover:underline"
          >
            Support ↗
          </a>
        </p>
      )}
      <p className="mt-4 border-t border-border pt-3 text-[10px] leading-relaxed text-muted-foreground">
        Creator declarations are informational. The scan report is a separate
        automated review.
      </p>
    </section>
  );
}

function DetailField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mt-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 break-words text-xs leading-relaxed text-foreground">
        {value}
      </p>
    </div>
  );
}

function safeHttpsUrl(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !url.username && !url.password
      ? url.toString()
      : undefined;
  } catch {
    return undefined;
  }
}
