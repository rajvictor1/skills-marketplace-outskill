import "server-only";
import { and, avg, count, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { communityRating, user } from "@/lib/db/schema";

export async function getRatings(target: string) {
  if (!process.env.DATABASE_URL)
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
