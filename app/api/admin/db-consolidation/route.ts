import postgres from "postgres";
import { requireAdmin } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const tables = [
  "user",
  "account",
  "session",
  "verification",
  "marketplace_admin",
  "marketplace_admin_invite",
  "skill",
  "skill_version",
  "skill_file",
  "scan_result",
  "finding",
  "skill_submission",
  "review_event",
  "skill_download",
  "community_rating",
] as const;

async function counts(connectionString: string, schema: string) {
  const sql = postgres(connectionString, {
    max: 1,
    prepare: false,
    ssl: "require",
    connect_timeout: 10,
  });
  try {
    const existing = await sql<{ tablename: string }[]>`
      select tablename from pg_tables where schemaname=${schema}
    `;
    const names = new Set(existing.map((row) => row.tablename));
    const result: Record<string, number | "missing"> = {};
    for (const table of tables) {
      if (!names.has(table)) {
        result[table] = "missing";
        continue;
      }
      const [row] = await sql.unsafe<{ total: number }[]>(
        `select count(*)::int as total from "${schema}"."${table}"`,
      );
      result[table] = row.total;
    }
    if (schema === "public") return result;
    for (const table of ["package_versions", "package_reviews", "review_events", "package_listing_drafts"]) {
      if (!names.has(table)) continue;
      const [row] = await sql.unsafe<{ total: number }[]>(
        `select count(*)::int as total from "${schema}"."${table}"`,
      );
      result[table] = row.total;
    }
    return result;
  } finally {
    await sql.end();
  }
}

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview")
    return Response.json({ error: "Preview only" }, { status: 404 });
  try {
    await requireAdmin();
    const [neon, supabase, privateRecipes] = await Promise.all([
      counts(process.env.DATABASE_URL ?? "", "public"),
      counts(process.env.RECIPE_DEV_POSTGRES_URL ?? "", "public"),
      counts(process.env.RECIPE_DEV_POSTGRES_URL ?? "", "recipe_private"),
    ]);
    return Response.json({ neon, supabase, privateRecipes }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return Response.json({ error: "Unable to inspect Preview databases" }, { status: 503 });
  }
}
