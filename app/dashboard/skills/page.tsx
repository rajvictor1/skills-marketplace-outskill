export const dynamic = "force-dynamic";
import type { Metadata } from "next";
import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { getViewer, isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { skill, skillSubmission, skillVersion } from "@/lib/db/schema";
import { TrustBadge } from "@/components/trust-badge";
export const metadata: Metadata = {
  title: "My skills",
  robots: { index: false },
};
export default async function MySkillsPage() {
  const session = await getViewer();
  if (!session?.user)
    return (
      <main className="p-10">
        <h1 className="text-3xl font-semibold">Your creator workspace</h1>
        <p className="mt-4">
          Sign in to see your private submissions and review decisions.
        </p>
        <Link
          href="/auth/sign-in"
          className="mt-5 inline-block text-primary underline"
        >
          Sign in
        </Link>
      </main>
    );
  const [rows, admin] = await Promise.all([
    db
      .select({
        listing: skill,
        submission: skillSubmission,
        version: skillVersion,
      })
      .from(skill)
      .leftJoin(skillSubmission, eq(skillSubmission.skillId, skill.id))
      .leftJoin(skillVersion, eq(skillSubmission.versionId, skillVersion.id))
      .where(eq(skill.authorId, session.user.id))
      .orderBy(desc(skillSubmission.createdAt)),
    isAdmin(session.user.id),
  ]);
  const unique = [
    ...new Map(rows.map((row) => [row.listing.id, row.listing])).values(),
  ];
  return (
    <main className="mx-auto max-w-6xl px-5 py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="editorial-kicker text-primary">Creator workspace</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            Your skills, from draft to discovery.
          </h1>
          <p className="mt-4 max-w-2xl text-sm text-muted-foreground">
            New skills and updates are private until an administrator approves
            the exact version. For an update, upload the same skill ID with a
            new version number.
          </p>
        </div>
        <div className="flex gap-3">
          {admin && (
            <Link
              href="/admin"
              className="rounded-full border border-primary px-5 py-3 text-sm font-semibold text-primary"
            >
              Admin review desk
            </Link>
          )}
          <Link
            href="/publish"
            className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            Submit a skill
          </Link>
        </div>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          [unique.length, "Skills"],
          [unique.filter((s) => s.status === "published").length, "Published"],
          [
            rows.filter((r) => r.submission?.status === "pending").length,
            "Pending reviews",
          ],
        ].map(([value, label]) => (
          <div
            key={label}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <p className="text-3xl font-semibold">{value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>
      <div className="mt-8 space-y-4">
        {rows.map(({ listing, submission, version }) => (
          <article
            key={submission?.id ?? listing.id}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">
                  {submission?.snapshot.name ?? listing.name}
                </h2>
                <p className="mt-2 text-sm text-muted-foreground">
                  {submission?.snapshot.category ?? listing.category} · v
                  {version?.versionLabel ?? "—"}
                </p>
              </div>
              <div>
                <p className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold capitalize text-primary">
                  {submission?.status === "pending"
                    ? "Pending admin review"
                    : (submission?.status.replaceAll("_", " ") ??
                      listing.status)}
                </p>
                {version && (
                  <div className="mt-2">
                    <TrustBadge tier={version.trustTier} />
                  </div>
                )}
              </div>
            </div>
            <p className="mt-4 text-sm">
              {submission?.snapshot.summary ?? listing.summary}
            </p>
            {submission?.reviewNote && (
              <p className="mt-4 rounded-xl bg-[#f2edff] p-4 text-sm">
                <strong>Admin feedback:</strong> {submission.reviewNote}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              {submission && (
                <Link
                  href={`/dashboard/submissions/${submission.id}`}
                  className="font-semibold text-primary underline"
                >
                  Inspect your submission
                </Link>
              )}
              {listing.status === "published" && (
                <Link
                  href={`/skills/${listing.slug}`}
                  className="font-semibold text-primary underline"
                >
                  View approved public version
                </Link>
              )}
              <span className="text-muted-foreground">
                {listing.downloadCount} recorded downloads
              </span>
            </div>
          </article>
        ))}
      </div>
      {!rows.length && (
        <div className="mt-8 rounded-2xl border border-dashed border-border p-10">
          <h2 className="text-xl font-semibold">
            Start with one useful skill.
          </h2>
          <p className="mt-3 text-muted-foreground">
            Upload your SKILL.md, choose a category, and send it for review.
          </p>
        </div>
      )}
    </main>
  );
}
