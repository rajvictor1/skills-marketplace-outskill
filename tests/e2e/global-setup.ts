import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const databaseUrl = process.env.TEST_DATABASE_URL!;

export default async function prepareE2EDatabase() {
  const sql = postgres(databaseUrl, { max: 1, prepare: false });
  try {
    await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  } finally {
    await sql.end();
  }
}
