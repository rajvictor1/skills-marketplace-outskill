import { createHash, randomBytes } from "node:crypto";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: process.env.INVITE_ENV_FILE ?? ".env.local" });

const ownerEmail = process.argv[2]?.trim().toLowerCase();
if (!ownerEmail || !process.env.DATABASE_URL) {
  throw new Error("Provide an existing admin email and DATABASE_URL.");
}

const sql = postgres(process.env.DATABASE_URL, { max: 1, prepare: false });
try {
  const [owner] = await sql`
    SELECT u.id FROM "user" u
    INNER JOIN marketplace_admin a ON a.user_id = u.id
    WHERE lower(u.email) = ${ownerEmail}
    LIMIT 1
  `;
  if (!owner) throw new Error("The supplied email is not an existing admin.");

  const token = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  await sql`
    INSERT INTO marketplace_admin_invite (token_hash, created_by, expires_at)
    VALUES (${tokenHash}, ${owner.id}, ${expiresAt})
  `;
  // Show only once. The database retains the hash, never this bearer token.
  process.stdout.write(`${token}\n`);
} finally {
  await sql.end();
}
