import "server-only";
import { getCuratedExamples } from "@/lib/curated-examples";
import { cache } from "react";

import { and, asc, desc, eq, ilike, inArray, avg, count, or, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { hasDatabaseConnection } from "@/lib/db/connection";
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
import { getMarketplaceCounters } from "@/lib/db/marketplace-counters";

export type CatalogState = {
  skills: SampleSkill[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
  source: "demo" | "database" | "unavailable";
  hasSampleContent: boolean;
};
export type CatalogPageOptions = {
  page?: number;
  pageSize?: number;
  category?: string;
  categories?: string[];
  subcategory?: string;
  search?: string;
  sort?: "popular" | "recent" | "safest";
  slug?: string;
};
export type CatalogIndexEntry = Pick<SampleSkill, "slug" | "category" | "subcategory" | "updatedAt" | "adminApproved" | "metadata">;
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

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 48;
const MAX_FILES_PER_VERSION = 512;
const MAX_FINDINGS_PER_VERSION = 500;

function normalizePageOptions(options: CatalogPageOptions = {}) {
  const page = Math.min(10_000, Math.max(0, Math.floor(Number(options.page) || 0)));
  const pageSize = Math.min(MAX_PAGE_SIZE, Math.max(1, Math.floor(Number(options.pageSize) || DEFAULT_PAGE_SIZE)));
  const search = (options.search ?? "").trim().slice(0, 100);
  return { ...options, page, pageSize, search };
}

async function loadPublishedSkills(
  options: CatalogPageOptions = {},
): Promise<{ skills: SampleSkill[]; total: number; hasMore: boolean }> {
  const normalized = normalizePageOptions(options);
  const filters = [eq(skill.status, "published")];
  if (normalized.category) filters.push(eq(skill.category, normalized.category));
  if (normalized.categories?.length) filters.push(inArray(skill.category, normalized.categories));
  if (normalized.subcategory) filters.push(eq(skill.subcategory, normalized.subcategory));
  if (normalized.slug) filters.push(eq(skill.slug, normalized.slug));
  if (normalized.search) {
    const pattern = `%${normalized.search.replace(/[\\%_]/g, "\\$&")}%`;
    filters.push(or(
      ilike(skill.name, pattern),
      ilike(skill.description, pattern),
      ilike(skill.summary, pattern),
      sql`${skill.tags}::text ILIKE ${pattern}`,
      ilike(user.name, pattern),
    )!);
  }
  const where = and(...filters);
  const totalPromise = async () => {
    if (!normalized.category && !normalized.categories?.length && !normalized.subcategory && !normalized.search && !normalized.slug) {
      return (await getMarketplaceCounters()).published;
    }
    const [row] = await db.select({ total: count() })
      .from(skill)
      .innerJoin(user, eq(skill.authorId, user.id))
      .where(where);
    return Number(row?.total ?? 0);
  };
  const order = normalized.sort === "recent"
    ? [desc(skill.updatedAt), desc(skill.id)]
    : normalized.sort === "safest"
      ? [asc(skillVersion.riskScore), desc(skill.updatedAt), desc(skill.id)]
      : [desc(skill.downloadCount), desc(skill.updatedAt), desc(skill.id)];
  const [rows, total] = await Promise.all([db
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
    .where(where)
    .orderBy(...order)
    .limit(normalized.pageSize + 1)
    .offset(normalized.page * normalized.pageSize), totalPromise()]);

  const hasMore = rows.length > normalized.pageSize;
  rows.splice(normalized.pageSize);
  if (rows.length === 0) return { skills: [], total, hasMore };
  const versionIds = rows.map((row) => row.currentVersionId);
  const files = await db
    .select({
      versionId: skillFile.skillVersionId,
      path: skillFile.path,
      sizeBytes: skillFile.sizeBytes,
      isExecutable: skillFile.isExecutable,
    })
    .from(skillFile)
    .where(inArray(skillFile.skillVersionId, versionIds))
    .limit(versionIds.length * MAX_FILES_PER_VERSION);
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
        .limit(scanIds.length * MAX_FINDINGS_PER_VERSION)
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
    .groupBy(communityRating.target)
    .limit(rows.length);
  const skills = rows
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
  return { skills, total, hasMore };
}

export const getCatalogState = cache(
  async function getCatalogState(options: CatalogPageOptions = {}): Promise<CatalogState> {
    const normalized = normalizePageOptions(options);
    if (!hasDatabaseConnection()) {
      const examples = filterExamples(previewExamples(), normalized);
      return examples.length || previewExamples().length
        ? {
            skills: examples.slice(normalized.page * normalized.pageSize, (normalized.page + 1) * normalized.pageSize),
            total: examples.length,
            page: normalized.page,
            pageSize: normalized.pageSize,
            hasMore: (normalized.page + 1) * normalized.pageSize < examples.length,
            source: "unavailable",
            hasSampleContent: true,
          }
        : { skills: [], total: 0, page: normalized.page, pageSize: normalized.pageSize, hasMore: false, source: "unavailable", hasSampleContent: false };
    }
    try {
      const result = await loadPublishedSkills(normalized);
      const slugs = new Set(result.skills.map((item) => item.slug));
      const examples = filterExamples(previewExamples(), normalized).filter(
        (item) => !slugs.has(item.slug),
      );
      const visibleExamples = result.skills.length < normalized.pageSize
        ? examples.slice(0, normalized.pageSize - result.skills.length)
        : [];
      return {
        skills: [...result.skills, ...visibleExamples],
        total: result.total + examples.length,
        page: normalized.page,
        pageSize: normalized.pageSize,
        hasMore: result.hasMore || (normalized.page + 1) * normalized.pageSize < result.total + examples.length,
        source: "database",
        hasSampleContent: examples.length > 0 || result.skills.some((item) => item.metadata?.isSample),
      };
    } catch {
      const examples = filterExamples(previewExamples(), normalized);
      return {
        skills: examples.slice(normalized.page * normalized.pageSize, (normalized.page + 1) * normalized.pageSize),
        total: examples.length,
        page: normalized.page,
        pageSize: normalized.pageSize,
        hasMore: (normalized.page + 1) * normalized.pageSize < examples.length,
        source: "unavailable",
        hasSampleContent: examples.length > 0,
      };
    }
  },
);

export const getCatalogSkillBySlug = cache(async function getCatalogSkillBySlug(
  slug: string,
): Promise<CatalogSkillLookup> {
  if (!hasDatabaseConnection()) {
    const sample = previewExample(slug);
    return sample
      ? { status: "found", skill: sample, source: "demo" }
      : { status: "not_found" };
  }
  try {
    const result = (await loadPublishedSkills({ slug, pageSize: 1 })).skills[0];
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

function filterExamples(items: SampleSkill[], options: CatalogPageOptions) {
  return items.filter((item) =>
    (!options.category || item.category === options.category) &&
    (!options.categories?.length || options.categories.includes(item.category)) &&
    (!options.subcategory || item.subcategory === options.subcategory) &&
    (!options.search || `${item.name} ${item.summary} ${item.description} ${item.author.name} ${(item.tags ?? []).join(" ")}`.toLowerCase().includes(options.search.toLowerCase()))
  );
}

export async function getCatalogCounters() {
  if (!hasDatabaseConnection()) return { published: 0, downloads: 0, categories: 0, available: false };
  try {
    const [counters, [categoryRow]] = await Promise.all([
      getMarketplaceCounters(),
      db.select({ total: sql<number>`count(distinct ${skill.category})` })
        .from(skill)
        .where(eq(skill.status, "published")),
    ]);
    return {
      published: counters.published,
      downloads: counters.downloads,
      categories: Number(categoryRow?.total ?? 0),
      available: true,
    };
  } catch {
    return { published: 0, downloads: 0, categories: 0, available: false };
  }
}

export async function getPublishedCatalogIndex(page = 0, pageSize = 500) {
  const boundedSize = Math.min(500, Math.max(1, Math.floor(pageSize) || 500));
  const boundedPage = Math.min(100_000, Math.max(0, Math.floor(page) || 0));
  if (!hasDatabaseConnection()) {
    const fallback = previewExamples().map((item) => ({
      slug: item.slug, category: item.category, subcategory: item.subcategory,
      updatedAt: item.updatedAt, adminApproved: item.adminApproved,
      metadata: item.metadata,
    }));
    const entries = fallback.slice(boundedPage * boundedSize, (boundedPage + 1) * boundedSize);
    return { entries, hasMore: (boundedPage + 1) * boundedSize < fallback.length, source: "unavailable" as const };
  }
  try {
    const rows = await db.select({
      slug: skill.slug,
      category: skill.category,
      subcategory: skill.subcategory,
      updatedAt: skill.updatedAt,
      metadata: skill.metadata,
    })
      .from(skill)
      .where(eq(skill.status, "published"))
      .orderBy(desc(skill.updatedAt), desc(skill.id))
      .limit(boundedSize + 1)
      .offset(boundedPage * boundedSize);
    return {
      entries: rows.slice(0, boundedSize).map((row) => ({
        ...row,
        subcategory: row.subcategory ?? undefined,
        updatedAt: row.updatedAt.toISOString().slice(0, 10),
        adminApproved: true,
      })),
      hasMore: rows.length > boundedSize,
      source: "database" as const,
    };
  } catch {
    return { entries: [], hasMore: false, source: "unavailable" as const };
  }
}

export function getCatalogPage(options: CatalogPageOptions = {}) {
  return getCatalogState(options);
}
