import { createId } from "@paralleldrive/cuid2";
import { and, eq, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  skill,
  skillDownload,
  skillFile,
  skillSubmission,
} from "@/lib/db/schema";
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json(
      { error: "Same-origin request required." },
      { status: 403 },
    );
  if (!process.env.DATABASE_URL)
    return Response.json(
      { error: "Downloads are temporarily unavailable." },
      { status: 503 },
    );
  try {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user)
      return Response.redirect(new URL("/auth/sign-in", request.url), 303);
    const { slug } = await params;
    const result = await db.transaction(async (tx) => {
      const [listing] = await tx
        .select()
        .from(skill)
        .where(and(eq(skill.slug, slug), eq(skill.status, "published")))
        .for("update")
        .limit(1);
      if (!listing?.currentVersionId) return null;
      const [review] = await tx
        .select()
        .from(skillSubmission)
        .where(
          and(
            eq(skillSubmission.versionId, listing.currentVersionId),
            eq(skillSubmission.status, "approved"),
          ),
        )
        .limit(1);
      if (!review) return null;
      const [file] = await tx
        .select()
        .from(skillFile)
        .where(
          and(
            eq(skillFile.skillVersionId, listing.currentVersionId),
            eq(skillFile.path, "SKILL.md"),
          ),
        )
        .limit(1);
      if (!file) return null;
      // The author can retrieve their file without inflating community adoption.
      if (listing.authorId !== session.user.id) {
        const recorded = await tx
          .insert(skillDownload)
          .values({
            id: createId(),
            skillId: listing.id,
            versionId: listing.currentVersionId,
            userId: session.user.id,
          })
          .onConflictDoNothing()
          .returning({ id: skillDownload.id });
        if (recorded.length)
          await tx
            .update(skill)
            .set({ downloadCount: sql`${skill.downloadCount} + 1` })
            .where(eq(skill.id, listing.id));
      }
      return file.content;
    });
    if (result === null)
      return Response.json(
        { error: "Approved recipe not found." },
        { status: 404 },
      );
    return new Response(result, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": 'attachment; filename="SKILL.md"',
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return Response.json(
      { error: "Download failed. Please try again." },
      { status: 503 },
    );
  }
}
