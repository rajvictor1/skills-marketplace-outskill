import { afterEach, describe, expect, it } from "vitest";

import { getDatabaseUrl } from "./connection";

const originalEnv = {
  VERCEL_ENV: process.env.VERCEL_ENV,
  DATABASE_URL: process.env.DATABASE_URL,
  POSTGRES_URL: process.env.POSTGRES_URL,
  RECIPE_DEV_POSTGRES_URL: process.env.RECIPE_DEV_POSTGRES_URL,
};

afterEach(() => {
  for (const [key, value] of Object.entries(originalEnv)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("getDatabaseUrl", () => {
  it("uses the Vercel integration URL in production", () => {
    process.env.VERCEL_ENV = "production";
    delete process.env.DATABASE_URL;
    process.env.POSTGRES_URL = "postgresql://production.invalid/app";
    process.env.RECIPE_DEV_POSTGRES_URL = "postgresql://preview.invalid/app";

    expect(getDatabaseUrl()).toBe(process.env.POSTGRES_URL);
  });

  it("keeps Preview on its separate database", () => {
    process.env.VERCEL_ENV = "preview";
    process.env.POSTGRES_URL = "postgresql://production.invalid/app";
    process.env.RECIPE_DEV_POSTGRES_URL = "postgresql://preview.invalid/app";

    expect(getDatabaseUrl()).toBe(process.env.RECIPE_DEV_POSTGRES_URL);
  });
});
