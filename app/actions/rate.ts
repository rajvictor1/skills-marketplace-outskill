"use server";
import { createId } from "@paralleldrive/cuid2";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getViewer, isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import {
  communityRating,
  skill,
  skillDownload,
  skillSubmission,
} from "@/lib/db/schema";
export type RatingState = { message: string; ok?: boolean };
export async function rateSkill(
  _state: RatingState,
  form: FormData,
): Promise<RatingState> {
  try {
    const session = await getViewer();
    if (!session?.user) return { message: "Sign in before leaving a review." };
    const target = String(form.get("target") ?? "");
    const stars = Number(form.get("stars"));
    const comment = String(form.get("comment") ?? "").trim();
    if (
      !Number.isInteger(stars) ||
      stars < 1 ||
      stars > 5 ||
      comment.length > 800
    )
      return {
        message: "Choose 1–5 stars and keep your review within 800 characters.",
      };
    let recipePath: string | null = null;
    if (target === "marketplace") {
      if (await isAdmin(session.user.id))
        return {
          message: "Marketplace administrators cannot rate their own platform.",
        };
    } else {
      const [listing] = await db
        .select()
        .from(skill)
        .where(and(eq(skill.id, target), eq(skill.status, "published")))
        .limit(1);
      if (!listing)
        return { message: "This recipe is not available for review." };
      recipePath = `/skills/${listing.slug}`;
      const [approval] = await db
        .select({ id: skillSubmission.id })
        .from(skillSubmission)
        .where(
          and(
            eq(skillSubmission.versionId, listing.currentVersionId ?? ""),
            eq(skillSubmission.status, "approved"),
          ),
        )
        .limit(1);
      if (!approval)
        return { message: "This version is not approved for review." };
      if (listing.authorId === session.user.id)
        return { message: "Creators cannot rate their own recipes." };
      const [download] = await db
        .select({ id: skillDownload.id })
        .from(skillDownload)
        .where(
          and(
            eq(skillDownload.skillId, target),
            eq(skillDownload.userId, session.user.id),
          ),
        )
        .limit(1);
      if (!download)
        return {
          message:
            "Download the recipe before reviewing it. This keeps reviews tied to real downloads.",
        };
    }
    const [existing] = await db
      .select()
      .from(communityRating)
      .where(
        and(
          eq(communityRating.target, target),
          eq(communityRating.userId, session.user.id),
        ),
      )
      .limit(1);
    if (existing?.hidden)
      return {
        message:
          "Your review was moderated. Contact the administrator before resubmitting.",
      };
    await db
      .insert(communityRating)
      .values({
        id: createId(),
        target,
        userId: session.user.id,
        stars,
        comment,
      })
      .onConflictDoUpdate({
        target: [communityRating.userId, communityRating.target],
        set: { stars, comment, updatedAt: new Date() },
      });
    try {
      revalidatePath(recipePath ?? "/reviews");
      revalidatePath("/");
    } catch (error) {
      console.error(
        "Review was saved but page refresh failed:",
        error instanceof Error ? error.message : "Unknown error",
      );
    }
    return {
      message: "Your review is saved. Thank you for sharing your experience.",
      ok: true,
    };
  } catch (error) {
    console.error(
      "Review submission failed:",
      error instanceof Error ? error.message : "Unknown error",
    );
    return { message: "We could not save your review. Please try again." };
  }
}
