import "server-only";

import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { skill, skillVersion } from "@/lib/db/schema";

export type CreatorSkillRow = {
  id: string;
  slug: string;
  name: string;
  summary: string | null;
  category: string;
  subcategory: string | null;
  status: "draft" | "published" | "blocked";
  trustTier: "verified_safe" | "caution" | "blocked" | "pending";
  version: string | null;
  riskScore: number | null;
  installs: number;
  updatedAt: Date;
};

export type CreatorWorkspace =
  | { status: "no_database"; email?: string; skills: [] }
  | { status: "signed_out"; skills: [] }
  | { status: "ready"; email: string; skills: CreatorSkillRow[] }
  | { status: "unavailable"; email?: string; skills: [] };

export async function getCreatorWorkspace(): Promise<CreatorWorkspace> {
  if (!process.env.DATABASE_URL) return { status: "no_database", skills: [] };
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return { status: "signed_out", skills: [] };
    const rows = await db
      .select({
        id: skill.id,
        slug: skill.slug,
        name: skill.name,
        summary: skill.summary,
        category: skill.category,
        subcategory: skill.subcategory,
        status: skill.status,
        trustTier: skill.latestTrustTier,
        version: skillVersion.versionLabel,
        riskScore: skillVersion.riskScore,
        installs: skill.downloadCount,
        updatedAt: skill.updatedAt,
      })
      .from(skill)
      .leftJoin(skillVersion, eq(skill.currentVersionId, skillVersion.id))
      .where(eq(skill.authorId, session.user.id))
      .orderBy(desc(skill.updatedAt));
    return { status: "ready", email: session.user.email, skills: rows };
  } catch {
    return { status: "unavailable", skills: [] };
  }
}
