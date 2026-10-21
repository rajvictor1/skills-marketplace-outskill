"use server";
import { createId } from "@paralleldrive/cuid2";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import {
  communityRating,
  finding,
  reviewEvent,
  skill,
  skillSubmission,
  skillVersion,
} from "@/lib/db/schema";
export type AdminState = { message: string; ok?: boolean };
export async function reviewSubmission(
  _state: AdminState,
  form: FormData,
): Promise<AdminState> {
  try {
    const admin = await requireAdmin();
    const id = String(form.get("submissionId") ?? "");
    const decision = String(form.get("decision") ?? "");
    const note = String(form.get("note") ?? "").trim();
    if (!["approved", "changes_requested", "rejected"].includes(decision))
      return { message: "Choose a valid review decision." };
    if (note.length > 2000 || (decision !== "approved" && note.length < 10))
      return {
        message:
          "For changes or rejection, explain the reason in 10–2,000 characters.",
      };
    await db.transaction(async (tx) => {
      const [target] = await tx
        .select({ skillId: skillSubmission.skillId })
        .from(skillSubmission)
        .where(eq(skillSubmission.id, id))
        .limit(1);
      if (!target) throw new Error("This submission no longer exists.");
      // Lock the listing first, matching upload/download/unpublish lock order.
      const [listing] = await tx
        .select()
        .from(skill)
        .where(eq(skill.id, target.skillId))
        .for("update")
        .limit(1);
      if (!listing) throw new Error("Recipe no longer exists.");
      const [row] = await tx
        .select({ review: skillSubmission, version: skillVersion })
        .from(skillSubmission)
        .innerJoin(skillVersion, eq(skillSubmission.versionId, skillVersion.id))
        .where(eq(skillSubmission.id, id))
        .for("update")
        .limit(1);
      if (!row || row.review.status !== "pending")
        throw new Error(
          "This submission is no longer pending. Refresh the queue.",
        );
      const critical = await tx
        .select({ id: finding.id })
        .from(finding)
        .where(
          and(
            eq(finding.scanResultId, row.version.scanResultId ?? ""),
            eq(finding.severity, "critical"),
          ),
        )
        .limit(1);
      if (
        row.version.trustTier === "blocked" ||
        row.version.trustTier === "pending" ||
        critical.length
      )
        throw new Error("A blocked or incomplete scan cannot be approved.");
      if (decision === "approved") {
        const snapshot = row.review.snapshot;
        await tx
          .update(skill)
          .set({
            ...snapshot,
            sourceUrl: snapshot.sourceUrl ?? null,
            currentVersionId: row.version.id,
            latestTrustTier: row.version.trustTier,
            status: "published",
            updatedAt: new Date(),
          })
          .where(eq(skill.id, listing.id));
      }
      await tx
        .update(skillSubmission)
        .set({
          status: decision as "approved" | "changes_requested" | "rejected",
          reviewerId: admin.id,
          reviewNote: note || "Approved for publication.",
          reviewedAt: new Date(),
        })
        .where(eq(skillSubmission.id, id));
      await tx.insert(reviewEvent).values({
        id: createId(),
        actorId: admin.id,
        skillId: listing.id,
        action: decision,
        note: `v${row.version.versionLabel}: ${note || "Approved for publication."}`,
      });
    });
    revalidatePath("/", "layout");
    return {
      message:
        decision === "approved"
          ? "Approved and published. The reviewed version is now public."
          : "Decision saved. The creator can read your feedback.",
      ok: true,
    };
  } catch (error) {
    return {
      message:
        error instanceof Error ? error.message : "Review could not be saved.",
    };
  }
}
export async function unpublishSkill(
  _state: AdminState,
  form: FormData,
): Promise<AdminState> {
  try {
    const admin = await requireAdmin();
    const id = String(form.get("skillId") ?? "");
    const note = String(form.get("note") ?? "").trim();
    if (note.length < 10 || note.length > 2000)
      return { message: "Give an unpublishing reason (10–2,000 characters)." };
    await db.transaction(async (tx) => {
      const [row] = await tx
        .select()
        .from(skill)
        .where(eq(skill.id, id))
        .for("update")
        .limit(1);
      if (!row || row.status !== "published")
        throw new Error("This recipe is not currently published.");
      await tx
        .update(skill)
        .set({ status: "draft", currentVersionId: null, updatedAt: new Date() })
        .where(eq(skill.id, id));
      // An explicit new review is required to restore this version.
      if (row.currentVersionId)
        await tx
          .update(skillSubmission)
          .set({
            status: "pending",
            reviewerId: null,
            reviewedAt: null,
            reviewNote: `Unpublished: ${note}`,
          })
          .where(eq(skillSubmission.versionId, row.currentVersionId));
      await tx.insert(reviewEvent).values({
        id: createId(),
        actorId: admin.id,
        skillId: id,
        action: "unpublished",
        note,
      });
    });
    revalidatePath("/", "layout");
    return {
      message: "Recipe removed from the public catalog and returned to review.",
      ok: true,
    };
  } catch (error) {
    return {
      message: error instanceof Error ? error.message : "Unpublishing failed.",
    };
  }
}
export async function moderateRating(
  _state: AdminState,
  form: FormData,
): Promise<AdminState> {
  try {
    const admin = await requireAdmin();
    const id = String(form.get("ratingId") ?? "");
    const note = String(form.get("note") ?? "").trim();
    if (note.length < 10 || note.length > 2000)
      return {
        message: "Explain the moderation reason (10–2,000 characters).",
      };
    await db.transaction(async (tx) => {
      await tx
        .update(communityRating)
        .set({ hidden: true })
        .where(eq(communityRating.id, id));
      await tx.insert(reviewEvent).values({
        id: createId(),
        actorId: admin.id,
        action: "review_hidden",
        note: `Rating ${id}: ${note}`,
      });
    });
    revalidatePath("/", "layout");
    return { message: "Review hidden and decision recorded.", ok: true };
  } catch {
    return {
      message: "Review moderation failed or administrator access is missing.",
    };
  }
}
