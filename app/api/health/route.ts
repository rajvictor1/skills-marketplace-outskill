import { sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { hasDatabaseConnection } from "@/lib/db/connection";

/** Lightweight liveness probe for deployment monitoring. No configuration is exposed. */
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  if (new URL(request.url).searchParams.get("check") === "db") {
    try {
      if (!hasDatabaseConnection()) throw new Error("Database is not configured.");
      await db.execute(sql`select 1`);
      return Response.json(
        { status: "ok" },
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
