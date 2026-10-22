import "server-only";

/** Preview and local recipe work use one Supabase Postgres database. */
export function getDatabaseUrl() {
  if (process.env.VERCEL_ENV === "production") return process.env.DATABASE_URL;
  return process.env.RECIPE_DEV_POSTGRES_URL || process.env.DATABASE_URL;
}

export function hasDatabaseConnection() {
  return Boolean(getDatabaseUrl());
}
