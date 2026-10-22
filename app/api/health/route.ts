import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { hasDatabaseConnection } from "@/lib/db/connection";
import { consumeHealthDbCheckLimit } from "@/lib/health-rate-limit";

/** Lightweight liveness probe for deployment monitoring. No configuration is exposed. */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (new URL(request.url).searchParams.get("check") === "db") {
    try {
      if (!hasDatabaseConnection()) throw new Error("Database is not configured.");
      // This shared limit is a backstop to an edge rate rule, not a monitor quota.
      if (!(await consumeHealthDbCheckLimit()))
        return Response.json(
          { status: "rate_limited" },
          {
            status: 429,
            headers: { "Cache-Control": "no-store", "Retry-After": "60" },
          },
        );
      await db.execute(sql`select 1`);
      return Response.json(
        { status: "healthy" },
        { headers: { "Cache-Control": "no-store" } },
      );
    } catch {
      return Response.json(
        { status: "unhealthy" },
        { status: 503, headers: { "Cache-Control": "no-store" } },
      );
    }
  }
  return Response.json(
    { status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
