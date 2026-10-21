import "server-only";
import { getCuratedExamples } from "@/lib/curated-examples";
import { cache } from "react";

import { and, eq, inArray, avg, count } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  finding,
  scanResult,
  skill,
  skillFile,
  skillVersion,
  skillSubmission,
  communityRating,
  user,
} from "@/lib/db/schema";
import {
  SAMPLE_SKILLS,
  type SampleFinding,
  type SampleSkill,
} from "@/lib/sample-data";
import { demoCatalogEnabled } from "@/lib/demo-mode";

export type CatalogState = {
  skills: SampleSkill[];
  source: "demo" | "database" | "unavailable";
  hasSampleContent: boolean;
};
export type CatalogSkillLookup =
  | { status: "found"; skill: SampleSkill; source: "demo" | "database" }
  | { status: "not_found" }
  | { status: "unavailable" };

const DEMO_SKILLS = SAMPLE_SKILLS.filter((item) => item.status === "published");
function previewExamples() {
  return [
    ...(demoCatalogEnabled() ? DEMO_SKILLS : []),
    ...getCuratedExamples(),
  ];
}
function previewExample(slug: string) {
  return previewExamples().find((item) => item.slug === slug);
}

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "SC"
  );
}

function handle(name: string, id: string) {
  const normalized = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return normalized || id.slice(0, 8);
}

function sizeLabel(bytes: number) {
  return bytes >= 1024 ? `${(bytes / 1024).toFixed(1)} KB` : `${bytes} B`;
}

async function loadPublishedSkills(slug?: string): Promise<SampleSkill[]> {
  const rows = await db
    .select({
      id: skill.id,
      slug: skill.slug,
      name: skill.name,
      description: skill.description,
      summary: skill.summary,
      category: skill.category,
      subcategory: skill.subcategory,
      tags: skill.tags,
      metadata: skill.metadata,
      status: skill.status,
      trustTier: skill.latestTrustTier,
      installs: skill.downloadCount,
      updatedAt: skill.updatedAt,
      authorId: user.id,
      authorName: user.name,
      currentVersionId: skillVersion.id,
      version: skillVersion.versionLabel,
      riskScore: skillVersion.riskScore,
      skillMdBody: skillVersion.skillMdBody,
      scannerVersion: skillVersion.scannerVersion,
      scanResultId: scanResult.id,
      classifierModel: scanResult.classifierModel,
    })
    .from(skill)
    .innerJoin(skillVersion, eq(skill.currentVersionId, skillVersion.id))
    .innerJoin(
      skillSubmission,
      and(
        eq(skillSubmission.versionId, skillVersion.id),
        eq(skillSubmission.status, "approved"),
      ),
    )
    .innerJoin(user, eq(skill.authorId, user.id))
    .leftJoin(scanResult, eq(skillVersion.scanResultId, scanResult.id))
    .where(
      slug
        ? and(eq(skill.status, "published"), eq(skill.slug, slug))
        : eq(skill.status, "published"),
    );

  if (rows.length === 0) return [];
  const versionIds = rows.map((row) => row.currentVersionId);
  const files = await db
    .select({
      versionId: skillFile.skillVersionId,
      path: skillFile.path,
      sizeBytes: skillFile.sizeBytes,
      isExecutable: skillFile.isExecutable,
    })
    .from(skillFile)
    .where(inArray(skillFile.skillVersionId, versionIds));
  const scanIds = rows.flatMap((row) =>
    row.scanResultId ? [row.scanResultId] : [],
  );
  const findings = scanIds.length
    ? await db
        .select({
          id: finding.id,
          scanId: finding.scanResultId,
          layer: finding.layer,
          severity: finding.severity,
          category: finding.category,
          title: finding.title,
          description: finding.description,
          filePath: finding.filePath,
          evidence: finding.evidence,
          confidence: finding.confidence,
        })
        .from(finding)
        .where(inArray(finding.scanResultId, scanIds))
    : [];

  const ratings = await db
    .select({
      target: communityRating.target,
      average: avg(communityRating.stars),
      count: count(),
    })
    .from(communityRating)
    .where(
      and(
        inArray(
          communityRating.target,
          rows.map((row) => row.id),
        ),
        eq(communityRating.hidden, false),
      ),
    )
    .groupBy(communityRating.target);
  return rows
    .filter((row) => !row.metadata.isSample)
    .map((row) => {
      const displayName = row.authorName;
      const rowFiles = files.filter(
        (file) => file.versionId === row.currentVersionId,
      );
      const rowFindings = findings.filter(
        (item) => item.scanId === row.scanResultId,
      );
      return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        description: row.description,
        summary: row.summary ?? row.description,
        category: row.category,
        subcategory: row.subcategory ?? undefined,
        tags: row.tags,
        metadata: row.metadata,
        version: row.version,
        trustTier: row.trustTier,
        riskScore: row.riskScore,
        status: "published" as const,
        installs: row.installs,
        adminApproved: true,
        ratingAverage: Number(
          ratings.find((r) => r.target === row.id)?.average ?? 0,
        ),
        ratingCount: ratings.find((r) => r.target === row.id)?.count ?? 0,
        updatedAt: row.updatedAt.toISOString().slice(0, 10),
        author: {
          name: displayName,
          handle: handle(displayName, row.authorId),
          role: "Community creator",
          initials: initials(displayName),
        },
        files: rowFiles.map((file) => ({
          path: file.path,
          sizeLabel: sizeLabel(file.sizeBytes),
          isScript: file.isExecutable,
        })),
        skillMd: row.skillMdBody,
        findings: rowFindings.map(
          (item) =>
            ({
              id: item.id,
              layer: item.layer,
              severity: item.severity,
              category: item.category,
              title: item.title,
              description: item.description,
              filePath: item.filePath,
              evidence: item.evidence ?? undefined,
              confidence: item.confidence ?? undefined,
            }) satisfies SampleFinding,
        ),
        scannerVersion: row.scannerVersion,
        classifierModel: row.classifierModel ?? "Not used",
      } satisfies SampleSkill;
    });
}

export const getCatalogState = cache(
  async function getCatalogState(): Promise<CatalogState> {
    if (!process.env.DATABASE_URL) {
      return previewExamples().length
        ? {
            skills: previewExamples(),
            source: "unavailable",
            hasSampleContent: true,
          }
        : { skills: [], source: "unavailable", hasSampleContent: false };
    }
    try {
      const published = await loadPublishedSkills();
      const slugs = new Set(published.map((item) => item.slug));
      const examples = previewExamples().filter(
        (item) => !slugs.has(item.slug),
      );
      return {
        skills: [...published, ...examples],
        source: "database",
        hasSampleContent:
          examples.length > 0 ||
          published.some((item) => item.metadata?.isSample),
      };
    } catch {
      return {
        skills: previewExamples(),
        source: "unavailable",
        hasSampleContent: previewExamples().length > 0,
      };
    }
  },
);

export const getCatalogSkillBySlug = cache(async function getCatalogSkillBySlug(
  slug: string,
): Promise<CatalogSkillLookup> {
  if (!process.env.DATABASE_URL) {
    const sample = previewExample(slug);
    return sample
      ? { status: "found", skill: sample, source: "demo" }
      : { status: "not_found" };
  }
  try {
    const result = (await loadPublishedSkills(slug))[0];
    if (result) return { status: "found", skill: result, source: "database" };
    const sample = previewExample(slug);
    return sample
      ? { status: "found", skill: sample, source: "demo" }
      : { status: "not_found" };
  } catch {
    const sample = previewExample(slug);
    return sample
      ? { status: "found", skill: sample, source: "demo" }
      : { status: "unavailable" };
  }
});
