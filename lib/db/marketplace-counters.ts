import "server-only";
import { inArray } from "drizzle-orm";
import { db } from "@/lib/db";
import { marketplaceCounter } from "@/lib/db/schema";

export type MarketplaceCounters = {
  published: number;
  downloads: number;
  users: number;
  pending: number;
  blocked: number;
};

const COUNTER_KEYS = [
  "published_skills",
  "published_downloads",
  "users",
  "pending_submissions",
  "blocked_submissions",
] as const;

/** Reads the trigger-maintained summary in a single, bounded lookup. */
export async function getMarketplaceCounters(): Promise<MarketplaceCounters> {
  const rows = await db
    .select({ key: marketplaceCounter.key, value: marketplaceCounter.value })
    .from(marketplaceCounter)
    .where(inArray(marketplaceCounter.key, [...COUNTER_KEYS]))
    .limit(COUNTER_KEYS.length);
  const values = new Map(rows.map((row) => [row.key, row.value]));
  return {
    published: values.get("published_skills") ?? 0,
    downloads: values.get("published_downloads") ?? 0,
    users: values.get("users") ?? 0,
    pending: values.get("pending_submissions") ?? 0,
    blocked: values.get("blocked_submissions") ?? 0,
  };
}
