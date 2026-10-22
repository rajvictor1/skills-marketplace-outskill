import { privateRobots } from "@/lib/seo/site";
export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getViewer, isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import {
  communityRating,
  finding,
  reviewEvent,
  scanResult,
  skill,
  skillFile,
  skillSubmission,
  skillVersion,
  user,
} from "@/lib/db/schema";
import { getMarketplaceCounters } from "@/lib/db/marketplace-counters";
import { AdminReviewForm } from "@/components/admin-review-form";
import { AdminTabs } from "@/components/admin-tabs";
import { Markdown } from "@/components/markdown";
export const metadata: Metadata = {
  robots: privateRobots,
  alternates: { canonical: null },
  title: "Admin review desk",
};
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; publishedPage?: string }>;
}) {
  const params = await searchParams;
  const page = Math.min(10_000, Math.max(0, Math.floor(Number(params.page) || 0)));
  const publishedPage = Math.min(10_000, Math.max(0, Math.floor(Number(params.publishedPage) || 0)));
  const session = await getViewer();
  if (!session?.user) redirect("/auth/sign-in");
  if (!(await isAdmin(session.user.id))) notFound();
  const [submissions, published, events, ratings, blocked, counters] =
    await Promise.all([
      db
        .select({
          review: skillSubmission,
          version: skillVersion,
          creator: user.name,
          email: user.email,
          scan: scanResult,
        })
        .from(skillSubmission)
        .innerJoin(skillVersion, eq(skillSubmission.versionId, skillVersion.id))
        .innerJoin(skill, eq(skillSubmission.skillId, skill.id))
        .innerJoin(user, eq(skill.authorId, user.id))
        .leftJoin(scanResult, eq(skillVersion.scanResultId, scanResult.id))
        .where(eq(skillSubmission.status, "pending"))
        .orderBy(desc(skillSubmission.createdAt))
        .limit(20)
        .offset(page * 20),
      db.select({
        id: skill.id,
        slug: skill.slug,
        name: skill.name,
        category: skill.category,
        downloadCount: skill.downloadCount,
      })
        .from(skill)
        .where(eq(skill.status, "published"))
        .orderBy(desc(skill.updatedAt), desc(skill.id))
        .limit(20)
        .offset(publishedPage * 20),
      db
        .select({ event: reviewEvent, actor: user.name })
        .from(reviewEvent)
        .leftJoin(user, eq(reviewEvent.actorId, user.id))
        .orderBy(desc(reviewEvent.createdAt))
        .limit(100),
      db
        .select({ rating: communityRating, name: user.name })
        .from(communityRating)
        .innerJoin(user, eq(communityRating.userId, user.id))
        .where(eq(communityRating.hidden, false))
        .orderBy(desc(communityRating.createdAt))
        .limit(30),
      db
        .select({ id: skillSubmission.id, snapshot: skillSubmission.snapshot })
        .from(skillSubmission)
        .where(eq(skillSubmission.status, "blocked"))
        .orderBy(desc(skillSubmission.createdAt))
        .limit(20),
      getMarketplaceCounters(),
    ]);
  const pending = submissions;
  const pendingCount = counters.pending;
  const [allFindings, allFiles] = pending.length
    ? await Promise.all([
        db
          .select()
          .from(finding)
        .where(
            inArray(
              finding.scanResultId,
              pending.flatMap((row) => (row.scan ? [row.scan.id] : [])),
          ),
        )
        .limit(20 * 500),
        db
          .select()
          .from(skillFile)
          .where(
            and(
              inArray(
                skillFile.skillVersionId,
                pending.map((row) => row.version.id),
              ),
              inArray(skillFile.path, ["SKILL.md", "recipe-package.json"]),
          ),
        )
        .limit(20 * 2),
      ])
    : [[], []];
  return (
    <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <AdminTabs active="submissions" />
      <div className="rounded-3xl bg-category-violet p-8 text-foreground">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-safe">
          Skillbuffet / Admin
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Your review desk.
        </h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Inspect the exact version, review the scan and publisher declarations,
          then decide what reaches the public catalog.
        </p>
        <div className="mt-7 flex flex-wrap gap-8">
          <span>
            <strong className="text-3xl">{pendingCount}</strong> awaiting review
          </span>
          <span>
            <strong className="text-3xl">{counters.published}</strong> published
          </span>
          <span>
            <strong className="text-3xl">
              {counters.blocked}
            </strong>{" "}
            scan blocked
          </span>
        </div>
      </div>
      <div className="mt-6">
        <Link
          href="/admin/recipes"
          className="inline-flex min-h-11 items-center rounded-xl bg-category-teal px-5 py-3 text-sm font-semibold"
        >
          Open private recipe workbench →
        </Link>
      </div>
      <section id="submissions" className="mt-10 scroll-mt-24">
        <h2 className="text-2xl font-semibold">Review queue</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          20 pending submissions per page. Scan-blocked versions cannot be
          approved.
        </p>
        {!pending.length && (
          <p className="mt-5 rounded-2xl border border-border bg-card p-7">
            Your queue is clear. New submissions will appear here.
          </p>
        )}
        <div className="mt-5 space-y-5">
          {pending.map((row) => (
            <ReviewCard
              key={row.review.id}
              row={row}
              findings={allFindings.filter(
                (item) => item.scanResultId === row.scan?.id,
              )}
              raw={
                allFiles.find((item) => item.skillVersionId === row.version.id)
                  ?.content ?? row.version.skillMdBody
              }
            />
          ))}
        </div>
      </section>
      <div className="mt-5 flex gap-5 text-sm font-semibold text-primary">
        {page > 0 && (
          <Link href={`/admin?page=${page - 1}`}>← Previous page</Link>
        )}
        {(page + 1) * 20 < pendingCount && (
          <Link href={`/admin?page=${page + 1}`}>Next page →</Link>
        )}
      </div>
      <section className="mt-10 rounded-2xl bg-category-peach p-6">
        <h2 className="text-xl font-semibold">Scanner-blocked submissions</h2>
        <p className="mt-2 text-sm">
          These versions cannot be approved. Creators must correct the findings
          and submit a new version.
        </p>
        <ul className="mt-3 grid gap-2">
          {blocked.map((item) => (
            <li key={item.id}>
              <Link
                href={`/dashboard/submissions/${item.id}`}
                className="text-sm text-primary underline"
              >
                {item.snapshot.name} · Inspect findings
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">Published catalog controls</h2>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {published.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <Link
                href={`/skills/${item.slug}`}
                className="text-lg font-semibold text-primary"
              >
                {item.name}
              </Link>
              <p className="mt-1 text-sm text-muted-foreground">
                {item.category} · {item.downloadCount} recorded downloads
              </p>
              <AdminReviewForm id={item.id} mode="unpublish" />
            </article>
          ))}
        </div>
        <nav className="mt-5 flex gap-5 text-sm font-semibold text-primary" aria-label="Published recipes">
          {publishedPage > 0 && <Link href={`/admin?publishedPage=${publishedPage - 1}`}>← Previous page</Link>}
          {(publishedPage + 1) * 20 < counters.published && <Link href={`/admin?publishedPage=${publishedPage + 1}`}>Next page →</Link>}
        </nav>
      </section>
      <section id="reviews" className="mt-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold">Community review moderation</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Hide abuse, personal information or irrelevant content. Do not remove
          reviews merely for being negative.
        </p>
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {ratings.map(({ rating, name }) => (
            <article
              key={rating.id}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <p className="font-semibold">
                {name} · {rating.stars}/5
              </p>
              <p className="mt-1 break-all text-xs text-muted-foreground">
                Target: {rating.target}
              </p>
              <p className="mt-3 whitespace-pre-wrap text-sm">
                {rating.comment || "Star rating only"}
              </p>
              <AdminReviewForm id={rating.id} mode="rating" />
            </article>
          ))}
        </div>
      </section>
      <section id="activity" className="mt-12 scroll-mt-24">
        <h2 className="text-2xl font-semibold">Review history</h2>
        <div className="mt-5 overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="p-4">Action</th>
                <th className="p-4">Actor</th>
                <th className="p-4">Reason</th>
                <th className="p-4">Time</th>
              </tr>
            </thead>
            <tbody>
              {events.map(({ event, actor }) => (
                <tr
                  key={event.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="p-4">{event.action.replaceAll("_", " ")}</td>
                  <td className="p-4">{actor ?? "System"}</td>
                  <td className="max-w-lg break-words p-4">{event.note}</td>
                  <td className="whitespace-nowrap p-4">
                    {event.createdAt
                      .toISOString()
                      .slice(0, 16)
                      .replace("T", " ")}{" "}
                    UTC
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
type Row = {
  review: typeof skillSubmission.$inferSelect;
  version: typeof skillVersion.$inferSelect;
  creator: string;
  email: string;
  scan: typeof scanResult.$inferSelect | null;
};
function ReviewCard({
  row,
  findings,
  raw,
}: {
  row: Row;
  findings: (typeof finding.$inferSelect)[];
  raw: string;
}) {
  const data = row.review.snapshot;
  return (
    <article className="rounded-3xl border border-border bg-card p-6 sm:p-8">
      <div className="flex flex-wrap justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">
            Pending admin review
          </p>
          <h3 className="mt-2 text-2xl font-semibold">
            {data.name}{" "}
            <span className="text-base text-muted-foreground">
              v{row.version.versionLabel}
            </span>
          </h3>
          <p className="mt-2 text-sm">
            {row.creator} · {row.email}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {data.category} / {data.subcategory}
          </p>
        </div>
        <div className="rounded-xl bg-category-teal p-4 text-sm">
          <p className="font-semibold">
            Risk {row.version.riskScore}/100 ·{" "}
            {row.version.trustTier.replaceAll("_", " ")}
          </p>
          <p className="mt-1">
            AI classifier: {row.scan?.classifierModel ?? "Not used"}
          </p>
        </div>
      </div>
      <p className="mt-5 text-sm">{data.summary}</p>
      <dl className="mt-5 grid gap-4 rounded-xl bg-background/70 p-5 text-sm sm:grid-cols-2">
        <div>
          <dt className="font-semibold">Compatibility</dt>
          <dd>{data.metadata.compatibility?.join(", ") || "Not specified"}</dd>
        </div>
        <div>
          <dt className="font-semibold">License</dt>
          <dd>{data.metadata.license || "Not specified"}</dd>
        </div>
        <div>
          <dt className="font-semibold">Declared permissions</dt>
          <dd>
            {data.metadata.requestedPermissions?.join(", ") || "None declared"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold">GitHub source</dt>
          <dd className="break-all">
            {data.metadata.githubUrl ||
              data.sourceUrl ||
              "Not provided (optional)"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Inputs → Outputs</dt>
          <dd>
            {data.metadata.inputs || "Not specified"} →{" "}
            {data.metadata.outputs || "Not specified"}
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Data handling</dt>
          <dd>{data.metadata.dataHandling || "Not specified"}</dd>
        </div>
      </dl>
      <details className="mt-5">
        <summary className="cursor-pointer text-sm font-semibold">
          Scanner layers and {findings.length} findings
        </summary>
        <pre className="mt-3 overflow-auto rounded-xl bg-background/70 p-4 text-xs">
          {JSON.stringify(row.scan?.layerStatus, null, 2)}
        </pre>
        {findings.map((item) => (
          <div
            key={item.id}
            className="mt-3 rounded-xl border border-caution/30 p-4"
          >
            <p className="text-sm font-semibold">
              {item.severity}: {item.title}
            </p>
            <p className="mt-2 text-sm">{item.description}</p>
            {item.evidence && (
              <pre className="mt-2 overflow-auto whitespace-pre-wrap text-xs">
                {item.evidence}
              </pre>
            )}
          </div>
        ))}
      </details>
      <details className="mt-5">
        <summary className="cursor-pointer text-sm font-semibold">
          {data.metadata.format === "recipe_package" ? "Inspect package files and content hash" : "Inspect instructions and content hash"}
        </summary>
        <p className="mt-2 break-all font-mono text-xs">
          SHA-256 {row.version.contentHash}
        </p>
        <div className="mt-4 max-h-[36rem] overflow-auto rounded-xl border border-border p-5">
          {data.metadata.format === "recipe_package"
            ? <pre className="whitespace-pre-wrap break-words text-xs">{raw}</pre>
            : <Markdown>{raw}</Markdown>}
        </div>
      </details>
      {data.metadata.format === "recipe_package" && (
        <div className="mt-5 rounded-xl bg-category-teal p-4 text-sm">
          <p>
            This is a structured recipe package. Approval publishes the listing
            and enables authenticated download of all bundled files. Runtime is
            not verified.
          </p>
          {data.metadata.packageVersionId && <a
            className="mt-2 inline-block font-semibold text-primary underline"
            href={`/api/v1/recipes/packages/${data.metadata.packageVersionId}`}
          >
            Inspect original private package and full validation report
          </a>}
        </div>
      )}
      <AdminReviewForm id={row.review.id} />
    </article>
  );
}
