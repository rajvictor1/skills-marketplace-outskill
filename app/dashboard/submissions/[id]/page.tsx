import Link from "next/link";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";
import { getViewer, isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { finding, skill, skillSubmission, skillVersion } from "@/lib/db/schema";
import { Markdown } from "@/components/markdown";
export default async function SubmissionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getViewer();
  if (!session?.user) redirect("/auth/sign-in");
  const { id } = await params;
  const [row] = await db
    .select({
      submission: skillSubmission,
      version: skillVersion,
      authorId: skill.authorId,
    })
    .from(skillSubmission)
    .innerJoin(skillVersion, eq(skillSubmission.versionId, skillVersion.id))
    .innerJoin(skill, eq(skillSubmission.skillId, skill.id))
    .where(eq(skillSubmission.id, id))
    .limit(1);
  if (
    !row ||
    (row.authorId !== session.user.id && !(await isAdmin(session.user.id)))
  )
    notFound();
  const findings = await db
    .select()
    .from(finding)
    .where(eq(finding.scanResultId, row.version.scanResultId ?? ""));
  return (
    <main className="mx-auto max-w-4xl p-6 sm:p-10">
      <Link href="/dashboard/skills" className="text-primary underline">
        Back to My skills
      </Link>
      <p className="mt-7 text-sm font-semibold capitalize text-primary">
        {row.submission.status.replaceAll("_", " ")}
      </p>
      <h1 className="mt-3 text-3xl font-semibold">
        {row.submission.snapshot.name} · v{row.version.versionLabel}
      </h1>
      <p className="mt-3">{row.submission.snapshot.summary}</p>
      <p className="mt-5 rounded-xl bg-safe/10 p-4 text-sm">
        Risk score {row.version.riskScore}/100 · {findings.length} findings.{" "}
        {row.submission.reviewNote || "Administrator decision pending."}
      </p>
      {findings.map((item) => (
        <div key={item.id} className="mt-4 rounded-xl border border-border p-4">
          <p className="font-semibold">
            {item.severity}: {item.title}
          </p>
          <p className="mt-2 text-sm">{item.description}</p>
        </div>
      ))}
      <div className="mt-7 rounded-2xl border border-border bg-card p-6">
        <Markdown>{row.version.skillMdBody}</Markdown>
      </div>
      <Link
        href="/publish"
        className="cta-primary mt-7 inline-block rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
      >
        Submit a revised version
      </Link>
    </main>
  );
}
