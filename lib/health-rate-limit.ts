import "server-only";

import { createId } from "@paralleldrive/cuid2";
import { and, count, eq, gte, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { reviewEvent } from "@/lib/db/schema";

/** Shared global cap for the anonymous database probe; backstop to an edge rate rule. */
export async function consumeHealthDbCheckLimit() {
  const configured = Number(process.env.HEALTH_DB_CHECKS_PER_MINUTE ?? 30);
  const limit =
    Number.isInteger(configured) && configured >= 1 && configured <= 120
      ? configured
      : 30;
  return db.transaction(async (tx) => {
    // Serialize checks across instances, as the recipe inspection limiter does.
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext('health-db-check'))`);
    const [usage] = await tx
      .select({ count: count() })
      .from(reviewEvent)
      .where(
        and(
          eq(reviewEvent.action, "health_db_check_requested"),
          gte(reviewEvent.createdAt, new Date(Date.now() - 60000)),
        ),
      );
    if ((usage?.count ?? 0) >= limit) return false;
    await tx.insert(reviewEvent).values({
      id: createId(),
      action: "health_db_check_requested",
      note: "Anonymous database readiness probe; no request identity stored.",
    });
    return true;
  });
}
