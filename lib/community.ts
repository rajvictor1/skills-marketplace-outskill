import "server-only";
import { and, avg, count, eq } from "drizzle-orm";
import { getViewer } from "@/lib/admin";
import { db } from "@/lib/db";
import { hasDatabaseConnection } from "@/lib/db/connection";
import { communityRating, skill, skillDownload, user } from "@/lib/db/schema";

export type RecipeReviewAccess =
  | "signed_out"
  | "creator"
  | "download_required"
  | "ready"
  | "unavailable";

export async function getRecipeReviewAccess(
  skillId: string,
): Promise<RecipeReviewAccess> {
  if (!hasDatabaseConnection()) return "unavailable";
  try {
    const session = await getViewer();
    if (!session?.user) return "signed_out";
    const [listing] = await db
      .select({ authorId: skill.authorId })
      .from(skill)
      .where(eq(skill.id, skillId))
      .limit(1);
    if (!listing) return "unavailable";
    if (listing.authorId === session.user.id) return "creator";
    const [download] = await db
      .select({ id: skillDownload.id })
      .from(skillDownload)
      .where(
        and(
          eq(skillDownload.skillId, skillId),
          eq(skillDownload.userId, session.user.id),
        ),
      )
      .limit(1);
    return download ? "ready" : "download_required";
  } catch {
    return "unavailable";
  }
}

export async function getRatings(target: string) {
  if (!hasDatabaseConnection())
    return { average: 0, count: 0, reviews: [], available: false };
  try {
    const [summary] = await db
      .select({ average: avg(communityRating.stars), count: count() })
      .from(communityRating)
      .where(
        and(
          eq(communityRating.target, target),
          eq(communityRating.hidden, false),
        ),
      );
    const reviews = await db
      .select({
        id: communityRating.id,
        stars: communityRating.stars,
        comment: communityRating.comment,
        name: user.name,
        createdAt: communityRating.createdAt,
      })
      .from(communityRating)
      .innerJoin(user, eq(communityRating.userId, user.id))
      .where(
        and(
          eq(communityRating.target, target),
          eq(communityRating.hidden, false),
        ),
      )
      .orderBy(communityRating.createdAt)
      .limit(30);
    return {
      average: Number(summary.average ?? 0),
      count: summary.count,
      reviews,
      available: true,
    };
  } catch {
    return { average: 0, count: 0, reviews: [], available: false };
  }
}
