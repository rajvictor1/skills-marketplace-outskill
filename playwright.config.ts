import { defineConfig } from "@playwright/test";
import { randomBytes } from "node:crypto";

const databaseUrl = process.env.TEST_DATABASE_URL ?? "";
const parsed = databaseUrl ? new URL(databaseUrl) : null;
if (
  !parsed ||
  !["127.0.0.1", "localhost"].includes(parsed.hostname) ||
  parsed.pathname !== "/skillbuffet_e2e"
) {
  throw new Error("Set TEST_DATABASE_URL to the isolated local skillbuffet_e2e database.");
}

const baseURL = "http://localhost:3100";

export default defineConfig({
  testDir: "./tests/e2e",
  timeout: 180_000,
  workers: 1,
  globalSetup: "./tests/e2e/global-setup.ts",
  use: { baseURL, channel: "chrome", headless: true },
  webServer: {
    command: "pnpm dev --port 3100",
    url: `${baseURL}/api/health`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: databaseUrl,
      RECIPE_DEV_POSTGRES_URL: "",
      BETTER_AUTH_URL: baseURL,
      BETTER_AUTH_SECRET: randomBytes(32).toString("hex"),
      VERCEL_ENV: "",
    },
  },
});
