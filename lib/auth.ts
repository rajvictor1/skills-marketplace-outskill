import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { db } from "@/lib/db";
import * as schema from "@/lib/db/auth-schema";

const configuredSecret = process.env.BETTER_AUTH_SECRET;
if (process.env.NODE_ENV === "production" && !configuredSecret) {
  throw new Error("BETTER_AUTH_SECRET must be configured before running SkillPort in production.");
}

export const auth = betterAuth({
  // In development a fixed fallback keeps local setup simple. Production must
  // use a private random value supplied through the deployment environment.
  secret: configuredSecret ?? "dev-only-insecure-secret-set-BETTER_AUTH_SECRET-in-prod",
  baseURL: process.env.BETTER_AUTH_URL,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  emailAndPassword: {
    enabled: true,
    // Kept simple for the beta — no email round-trip required to sign in.
    requireEmailVerification: false,
    minPasswordLength: 8,
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // refresh once per day
  },
  // NOTE (future CLI seam): when the install CLI is built, add the `bearer`
  // plugin here plus an `api_key` table so `npx <cli> add <skill>` can present
  // a per-user token that the registry validates against purchase entitlements.
});

export type Session = typeof auth.$Infer.Session;
