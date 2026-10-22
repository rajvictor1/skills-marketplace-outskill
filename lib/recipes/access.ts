import "server-only";
import { createId } from "@paralleldrive/cuid2";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { hasDatabaseConnection } from "@/lib/db/connection";
import { reviewEvent } from "@/lib/db/schema";

export async function recipeInspectionAccess(request: Request) {
  if (!hasDatabaseConnection())
    return {
      status: 503,
      error: "Recipe inspection requires the configured account database.",
    } as const;
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session?.user)
    return {
      status: 401,
      error: "Sign in to inspect recipe packages.",
    } as const;
  if (!(await isAdmin(session.user.id)))
    return {
      status: 403,
      error:
        "Recipe package inspection is restricted to the platform owner/team.",
    } as const;
  // Cookie-authenticated mutations must originate from this app.
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return { status: 403, error: "Use a same-origin request." } as const;
  const allowed = await consumeRecipeInspectionLimit(session.user.id);
  if (!allowed)
    return {
      status: 429,
      error: "Recipe inspection limit reached. Try again in one minute.",
    } as const;
  return { userId: session.user.id } as const;
}

export async function consumeRecipeInspectionLimit(userId: string) {
  const configured = Number(process.env.RECIPE_VALIDATIONS_PER_MINUTE ?? 6);
  const limit =
    Number.isInteger(configured) && configured >= 1 && configured <= 60
      ? configured
      : 6;
  const allowed = await db.transaction(async (tx) => {
    // Database lock makes the limit consistent across Vercel instances.
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`recipe-inspect:${userId}`}))`,
    );
    const [usage] = await tx
      .select({ count: count() })
      .from(reviewEvent)
      .where(
        and(
          eq(reviewEvent.actorId, userId),
          eq(reviewEvent.action, "recipe_inspection_requested"),
          gte(reviewEvent.createdAt, new Date(Date.now() - 60000)),
        ),
      );
    if ((usage?.count ?? 0) >= limit) return false;
    await tx.insert(reviewEvent).values({
      id: createId(),
      actorId: userId,
      action: "recipe_inspection_requested",
      note: "Private static package inspection requested; content and inputs are not logged.",
    });
    return true;
  });
  return allowed;
}
