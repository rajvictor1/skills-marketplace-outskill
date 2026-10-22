import postgres from "postgres";
import { createHash } from "node:crypto";
import { requireAdmin } from "@/lib/admin";
import { previewMigrationSql } from "@/lib/db/preview-migration-sql";

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

const migrationTimes = [
  1783873546784,
  1792488707146,
  1792570384251,
  1792598053000,
] as const;

const primaryKeys: Record<(typeof tables)[number], string> = {
  user: "id",
  account: "id",
  session: "id",
  verification: "id",
  marketplace_admin: "user_id",
  marketplace_admin_invite: "token_hash",
  skill: "id",
  skill_version: "id",
  skill_file: "id",
  scan_result: "id",
  finding: "id",
  skill_submission: "id",
  review_event: "id",
  skill_download: "id",
  community_rating: "id",
};

function connection(url: string) {
  return postgres(url, {
    max: 1,
    prepare: false,
    ssl: "require",
    connect_timeout: 10,
  });
}

function canonical(value: unknown): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, canonical(item)]),
    );
  return value;
}

function digest(rows: Record<string, unknown>[], key: string) {
  const ordered = [...rows].sort((a, b) =>
    String(a[key]).localeCompare(String(b[key])),
  );
  return createHash("sha256")
    .update(JSON.stringify(canonical(ordered)))
    .digest("hex");
}

function changedColumns(
  sourceRows: Record<string, unknown>[],
  targetRows: Record<string, unknown>[],
  key: string,
) {
  const targetById = new Map(targetRows.map((row) => [String(row[key]), row]));
  const changed = new Set<string>();
  for (const sourceRow of sourceRows) {
    const targetRow = targetById.get(String(sourceRow[key]));
    if (!targetRow) {
      changed.add("missing_record");
      continue;
    }
    for (const column of Object.keys(sourceRow)) {
      if (JSON.stringify(canonical(sourceRow[column])) !== JSON.stringify(canonical(targetRow[column])))
        changed.add(column);
    }
  }
  return [...changed].sort();
}

async function counts(connectionString: string, schema: string) {
  const sql = connection(connectionString);
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

async function audit() {
  const [neon, supabase, privateRecipes] = await Promise.all([
    counts(process.env.DATABASE_URL ?? "", "public"),
    counts(process.env.RECIPE_DEV_POSTGRES_URL ?? "", "public"),
    counts(process.env.RECIPE_DEV_POSTGRES_URL ?? "", "recipe_private"),
  ]);
  return { neon, supabase, privateRecipes };
}

function page(data: Awaited<ReturnType<typeof audit>>) {
  const summary = JSON.stringify(data, null, 2).replaceAll("<", "&lt;");
  return new Response(
    `<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><title>Preview database consolidation</title></head><body style="font-family:system-ui;max-width:960px;margin:3rem auto;padding:0 1rem"><h1>Preview database consolidation</h1><p>Administrator-only migration. Prepare creates protected tables in Supabase. Copy moves the existing Preview records without exposing them in this page.</p><pre style="overflow:auto;background:#eee;padding:1rem">${summary}</pre><form method="post"><button name="mode" value="prepare" style="padding:.8rem">1. Prepare Supabase schema</button></form><form method="post" style="margin-top:1rem"><button name="mode" value="copy" style="padding:.8rem">2. Copy and verify Neon records</button></form><p><a href="/admin/users">View Users tab</a></p></body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
  );
}

export async function GET() {
  if (process.env.VERCEL_ENV !== "preview")
    return Response.json({ error: "Preview only" }, { status: 404 });
  try {
    await requireAdmin();
    return page(await audit());
  } catch {
    return Response.json({ error: "Unable to inspect Preview databases" }, { status: 503 });
  }
}

async function prepare() {
  const sql = connection(process.env.RECIPE_DEV_POSTGRES_URL ?? "");
  try {
    return await sql.begin(async (tx) => {
      const [existing] = await tx`
        select count(*)::int as total from pg_tables
        where schemaname='public' and tablename='user'
      `;
      if (existing.total) return { alreadyPrepared: true };
      for (let index = 0; index < previewMigrationSql.length; index++) {
        const source = previewMigrationSql[index];
        const statements = source
          .split(/\s*--> statement-breakpoint\s*/)
          .map((statement) => statement.trim())
          .filter(Boolean);
        for (const statement of statements) await tx.unsafe(statement);
        await tx`create schema if not exists drizzle`;
        await tx`create table if not exists drizzle.__drizzle_migrations (
          id serial primary key, hash text not null, created_at bigint
        )`;
        await tx`insert into drizzle.__drizzle_migrations (hash, created_at)
          values (${createHash("sha256").update(source).digest("hex")}, ${migrationTimes[index]})`;
      }
      // Better Auth and marketplace tables are server-only, even though Drizzle
      // uses the public schema. Supabase anon/authenticated roles get no access.
      for (const table of tables) {
        await tx.unsafe(`alter table public."${table}" enable row level security`);
        await tx.unsafe(`revoke all on table public."${table}" from public, anon, authenticated`);
      }
      return { prepared: true, protectedTables: tables.length };
    });
  } finally {
    await sql.end();
  }
}

async function copy() {
  const source = connection(process.env.DATABASE_URL ?? "");
  const destination = connection(process.env.RECIPE_DEV_POSTGRES_URL ?? "");
  try {
    return await source.begin(async (src) => {
      await src`set transaction isolation level repeatable read read only`;
      return destination.begin(async (dst) => {
        await dst`select pg_advisory_xact_lock(62814012)`;
        const copied: Record<string, number> = {};
        for (const table of tables) {
          const key = primaryKeys[table];
          const rows = await src.unsafe<Record<string, unknown>[]>(
            `select * from public."${table}"`,
          );
          for (let offset = 0; offset < rows.length; offset += 100) {
            const batch = rows.slice(offset, offset + 100);
            const columns = Object.keys(batch[0]);
            const values: unknown[] = [];
            const tuples = batch.map((row) =>
              `(${columns
                .map((column) => {
                  const value = row[column];
                  values.push(
                    value && typeof value === "object" && !(value instanceof Date)
                      ? dst.json(value as postgres.JSONValue)
                      : value,
                  );
                  return `$${values.length}`;
                })
                .join(",")})`,
            );
            const columnNames = columns.map((name) => `"${name}"`).join(",");
            const updates = columns
              .filter((name) => name !== key)
              .map((name) => `"${name}"=excluded."${name}"`)
              .join(",");
            await dst.unsafe(
              `insert into public."${table}" (${columnNames}) values ${tuples.join(",")}` +
                ` on conflict ("${key}") do update set ${updates}`,
              values as postgres.ParameterOrJSON<never>[],
            );
          }
          const targetRows = await dst.unsafe<Record<string, unknown>[]>(
            `select * from public."${table}"`,
          );
          if (rows.length !== targetRows.length || digest(rows, key) !== digest(targetRows, key))
            throw new Error(`Integrity check failed for ${table}: ${changedColumns(rows, targetRows, key).join(",")}`);
          copied[table] = rows.length;
        }
        return { copied, verified: true };
      });
    });
  } finally {
    await Promise.all([source.end(), destination.end()]);
  }
}

export async function POST(request: Request) {
  if (process.env.VERCEL_ENV !== "preview")
    return Response.json({ error: "Preview only" }, { status: 404 });
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json({ error: "Same-origin request required" }, { status: 403 });
  try {
    await requireAdmin();
    const form = await request.formData();
    const mode = form.get("mode");
    const result = mode === "prepare" ? await prepare() : mode === "copy" ? await copy() : null;
    if (!result) return Response.json({ error: "Unknown migration step" }, { status: 400 });
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    const safeDetail =
      error instanceof Error && /^Integrity check failed for [a-z_]+: [a-z_,]*$/.test(error.message)
        ? error.message
        : error && typeof error === "object" && "code" in error
          ? String(error.code)
          : error instanceof Error
            ? error.name
            : "Unknown error";
    console.error("Preview migration step failed", safeDetail);
    return Response.json(
      { error: "Migration step failed. No cutover was made.", diagnostic: safeDetail },
      { status: 500 },
    );
  }
}
