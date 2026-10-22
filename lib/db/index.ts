import "server-only";

import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import * as schema from "./schema";
import { getDatabaseUrl } from "./connection";

// Reuse one postgres-js client across hot reloads in development.
const globalForDb = globalThis as unknown as {
  __pgClient?: ReturnType<typeof postgres>;
  __db?: ReturnType<typeof drizzle<typeof schema>>;
};

function createDb() {
  const connectionString = getDatabaseUrl();
  if (!connectionString) {
    // Deferred to first use so importing this module never throws — the app
    // can build and render sample-data pages without a live database.
    throw new Error(
      "No Postgres connection is configured. Set RECIPE_DEV_POSTGRES_URL " +
        "for Preview, or DATABASE_URL for local development.",
    );
  }
  const client =
    globalForDb.__pgClient ??
    postgres(connectionString, {
      max: process.env.VERCEL ? 1 : 10,
      prepare: false,
      connect_timeout: 10,
      ssl:
        connectionString === process.env.RECIPE_DEV_POSTGRES_URL
          ? "require"
          : undefined,
    });
  if (process.env.NODE_ENV !== "production") {
    globalForDb.__pgClient = client;
  }
  return drizzle(client, { schema });
}

/**
 * Lazy database handle. The connection is created on first property access, so
 * modules can import `db` freely; only an actual query requires DATABASE_URL.
 */
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop, receiver) {
    if (!globalForDb.__db) globalForDb.__db = createDb();
    return Reflect.get(globalForDb.__db, prop, receiver);
  },
});

export type Database = ReturnType<typeof drizzle<typeof schema>>;
