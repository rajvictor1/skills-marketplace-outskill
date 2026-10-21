"use server";

import { createHash } from "node:crypto";
import { createId } from "@paralleldrive/cuid2";
import Anthropic from "@anthropic-ai/sdk";
import { desc, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  finding,
  scanResult,
  skill,
  skillFile,
  skillVersion,
} from "@/lib/db/schema";
import { scanSkill, type AnthropicLike } from "@/lib/scanner";
import { parseSkill, SkillParseError } from "@/lib/skills/parse";
import { getSubcategories, isSkillCategory } from "@/lib/skills/taxonomy";

const MAX_SKILL_BYTES = 256 * 1024;
const MAX_SUMMARY = 280;
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const LICENSES = new Set(["MIT", "Apache-2.0", "CC-BY-4.0", "Proprietary", "Other"]);
const COMPATIBILITY = new Set(["Claude Code", "Claude Desktop", "Cursor", "Windsurf", "Other agent"]);
const PERMISSIONS = new Set([
  "Read local files",
  "Write or modify files",
  "Use the internet or network",
  "Run shell commands",
  "Connect to external apps or APIs",
  "Request human approval before actions",
]);

export type PublishState =
  | { status: "idle" }
  | { status: "error" | "unauthorized"; message: string; issues?: string[] }
  | {
      status: "blocked";
      message: string;
      findingCount: number;
      existingVersionKept: boolean;
      findings: { severity: string; title: string; description: string; filePath: string | null; evidence?: string }[];
    }
  | {
      status: "published";
      skillName: string;
      slug: string;
      trustTier: "verified_safe" | "caution";
    };

function field(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}

function getMultiValue(formData: FormData, key: string, limit: number): string[] {
  return [...new Set(formData.getAll(key).map(String).map((value) => value.trim()).filter(Boolean))].slice(0, limit);
}

async function readGitHubSkill(repositoryUrl: string): Promise<string> {
  let url: URL;
  try {
    url = new URL(repositoryUrl);
  } catch {
    throw new Error("Enter a valid public GitHub repository URL.");
  }

  if (
    url.protocol !== "https:" ||
    url.hostname !== "github.com" ||
    url.username ||
    url.password ||
    url.port
  ) {
    throw new Error("Only public repositories on github.com are supported.");
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length !== 2 || !parts.every((part) => /^[A-Za-z0-9_.-]+$/.test(part))) {
    throw new Error("Use a repository URL in the format github.com/owner/repository.");
  }

  const [owner, repository] = parts;
  const requestOptions = {
    signal: AbortSignal.timeout(8_000),
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "Skillbuffet-Publisher",
    },
  };

  const repositoryResponse = await fetch(
    `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}`,
    requestOptions,
  );
  if (!repositoryResponse.ok) {
    throw new Error("We could not read that public repository. Check the URL and try again.");
  }

  const repositoryData: unknown = await repositoryResponse.json();
  const branch =
    typeof repositoryData === "object" && repositoryData !== null &&
    "default_branch" in repositoryData && typeof repositoryData.default_branch === "string"
      ? repositoryData.default_branch
      : "main";
  const branchPath = branch.split("/").map(encodeURIComponent).join("/");
  const rawUrl = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/${branchPath}/SKILL.md`;
  const skillResponse = await fetch(rawUrl, {
    signal: AbortSignal.timeout(8_000),
    redirect: "error",
    headers: { "User-Agent": "Skillbuffet-Publisher" },
  });

  if (!skillResponse.ok) {
    throw new Error("The repository must contain a SKILL.md file in its root folder.");
  }

  const contentLength = Number(skillResponse.headers.get("content-length") ?? 0);
  if (contentLength > MAX_SKILL_BYTES) {
    throw new Error("SKILL.md is larger than the 256 KB upload limit.");
  }

  const reader = skillResponse.body?.getReader();
  if (!reader) throw new Error("We could not read SKILL.md from that repository.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_SKILL_BYTES) {
        await reader.cancel();
        throw new Error("SKILL.md is larger than the 256 KB upload limit.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new Error("SKILL.md must be a UTF-8 text file.");
  }
}

async function readSubmission(formData: FormData): Promise<{
  raw: string;
  source: "upload" | "github";
  sourceUrl?: string;
}> {
  const sourceType = field(formData, "sourceType");

  if (sourceType === "github") {
    const sourceUrl = field(formData, "repositoryUrl");
    if (!sourceUrl) throw new Error("Enter a public GitHub repository URL.");
    return { raw: await readGitHubSkill(sourceUrl), source: "github", sourceUrl };
  }

  if (sourceType === "upload") {
    const file = formData.get("skillFile");
    if (!(file instanceof File) || file.size === 0) {
      throw new Error("Choose a SKILL.md file to upload.");
    }
    if (file.name.toLowerCase() !== "skill.md" || file.size > MAX_SKILL_BYTES) {
      throw new Error("Upload a UTF-8 SKILL.md file smaller than 256 KB.");
    }
    const bytes = new Uint8Array(await file.arrayBuffer());
    try {
      return {
        raw: new TextDecoder("utf-8", { fatal: true }).decode(bytes),
        source: "upload",
      };
    } catch {
      throw new Error("SKILL.md must be a UTF-8 text file.");
    }
  }

  if (sourceType !== "paste") throw new Error("Choose how you want to submit the skill.");
  const raw = field(formData, "skillMd");
  if (!raw) throw new Error("Paste the contents of your SKILL.md file.");
  if (Buffer.byteLength(raw, "utf8") > MAX_SKILL_BYTES) {
    throw new Error("SKILL.md is larger than the 256 KB upload limit.");
  }
  return { raw, source: "upload" };
}

function validateDetails(formData: FormData) {
  const issues: string[] = [];
  const displayName = field(formData, "displayName");
  const summary = field(formData, "summary");
  const category = field(formData, "category");
  const subcategory = field(formData, "subcategory");
  const versionLabel = field(formData, "versionLabel");
  const license = field(formData, "license");
  const tags = field(formData, "tags")
    .split(",")
    .map((tag) => tag.trim().toLowerCase())
    .filter(Boolean);
  const compatibility = getMultiValue(formData, "compatibility", 8);
  const requestedPermissions = getMultiValue(formData, "permission", 8);
  const documentationUrl = field(formData, "documentationUrl");
  const supportUrl = field(formData, "supportUrl");

  if (displayName.length < 3 || displayName.length > 80) {
    issues.push("Skill title must be between 3 and 80 characters.");
  }
  if (summary.length < 20 || summary.length > MAX_SUMMARY) {
    issues.push("Marketplace summary must be between 20 and 280 characters.");
  }
  if (!isSkillCategory(category)) {
    issues.push("Choose one of the listed marketplace categories.");
  } else if (!getSubcategories(category).includes(subcategory)) {
    issues.push("Choose a subcategory that belongs to the selected category.");
  }
  if (!VERSION_PATTERN.test(versionLabel)) {
    issues.push("Version must use a format such as 1.0.0.");
  }
  if (!LICENSES.has(license)) issues.push("Choose a license from the list.");
  if (tags.length > 8 || tags.some((tag) => tag.length > 30)) {
    issues.push("Use up to 8 tags, each 30 characters or fewer.");
  }
  if (compatibility.some((item) => !COMPATIBILITY.has(item))) {
    issues.push("Choose compatibility values from the list.");
  }
  if (requestedPermissions.some((item) => !PERMISSIONS.has(item))) {
    issues.push("Choose declared permissions from the list.");
  }
  for (const [label, value] of [["Documentation", documentationUrl], ["Support", supportUrl]] as const) {
    if (value.length > 500) issues.push(`${label} URL must be 500 characters or fewer.`);
    if (value) {
      try {
        const url = new URL(value);
        if (url.protocol !== "https:" || url.username || url.password) {
          issues.push(`${label} URL must use HTTPS and must not include sign-in credentials.`);
        }
      } catch {
        issues.push(`${label} URL must be a valid HTTPS address.`);
      }
    }
  }
  if (formData.get("rightsConfirmed") !== "on") {
    issues.push("Confirm that you have the right to publish this skill and its files.");
  }

  if (issues.length) return { issues } as const;

  return {
    value: {
      displayName,
      summary,
      category,
      subcategory,
      versionLabel,
      license,
      tags,
      compatibility,
      requestedPermissions,
      inputs: field(formData, "inputs").slice(0, 1000),
      outputs: field(formData, "outputs").slice(0, 1000),
      dataHandling: field(formData, "dataHandling").slice(0, 1000),
      documentationUrl,
      supportUrl,
    },
  } as const;
}

export async function publishSkill(
  _previousState: PublishState,
  formData: FormData,
): Promise<PublishState> {
  if (!process.env.DATABASE_URL) {
    return {
      status: "error",
      message: "Publishing needs a Postgres database. Configure DATABASE_URL, then sign in to save a skill.",
    };
  }

  let session;
  try {
    session = await auth.api.getSession({ headers: await headers() });
  } catch {
    return {
      status: "error",
      message: "The publishing database is unavailable. Check DATABASE_URL and database migrations.",
    };
  }
  if (!session?.user) {
    return {
      status: "unauthorized",
      message: "Sign in first. Your skill is not stored until you are signed in.",
    };
  }

  const details = validateDetails(formData);
  if ("issues" in details) {
    return { status: "error", message: "Check the publishing details below.", issues: details.issues };
  }

  let submission: Awaited<ReturnType<typeof readSubmission>>;
  try {
    submission = await readSubmission(formData);
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "We could not read that submission.",
    };
  }

  let bundle;
  try {
    bundle = parseSkill(submission.raw, [], {
      source: submission.source,
      sourceUrl: submission.sourceUrl,
    });
  } catch (error) {
    if (error instanceof SkillParseError) {
      return { status: "error", message: error.message, issues: error.issues };
    }
    return { status: "error", message: "SKILL.md frontmatter could not be read." };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const anthropic: AnthropicLike | undefined = apiKey
    ? (new Anthropic({ apiKey }) as unknown as AnthropicLike)
    : undefined;
  let scan;
  try {
    scan = await scanSkill(bundle, { anthropic, timeoutMs: 12_000 });
  } catch {
    return { status: "error", message: "The security scan failed. Nothing was saved; try again." };
  }

  const skillId = createId();
  const versionId = createId();
  const scanId = createId();
  const file = bundle.files[0];
  const metadata = {
    license: details.value.license,
    compatibility: details.value.compatibility,
    requestedPermissions: details.value.requestedPermissions,
    inputs: details.value.inputs,
    outputs: details.value.outputs,
    dataHandling: details.value.dataHandling,
    documentationUrl: details.value.documentationUrl,
    supportUrl: details.value.supportUrl,
  };

  try {
    const saved = await db.transaction(async (tx) => {
      const [existing] = await tx
        .select()
        .from(skill)
        .where(eq(skill.slug, bundle.skillMd.frontmatter.name))
        .limit(1);

      if (existing && existing.authorId !== session.user.id) {
        throw new Error("SKILL_ID_IN_USE");
      }

      const targetSkillId = existing?.id ?? skillId;
      const [latestVersion] = existing
        ? await tx
            .select({ version: skillVersion.version })
            .from(skillVersion)
            .where(eq(skillVersion.skillId, existing.id))
            .orderBy(desc(skillVersion.version))
            .limit(1)
        : [];
      const nextVersion = (latestVersion?.version ?? 0) + 1;

      if (!existing) {
        await tx.insert(skill).values({
          id: skillId,
          slug: bundle.skillMd.frontmatter.name,
          authorId: session.user.id,
          name: details.value.displayName,
          description: bundle.skillMd.frontmatter.description,
          summary: details.value.summary,
          category: details.value.category,
          subcategory: details.value.subcategory,
          tags: details.value.tags,
          metadata,
          status: scan.trustTier === "blocked" ? "blocked" : "draft",
          latestTrustTier: scan.trustTier,
          currentVersionId: null,
          source: submission.source,
          sourceUrl: submission.sourceUrl,
        });
      }

      await tx.insert(skillVersion).values({
        id: versionId,
        skillId: targetSkillId,
        version: nextVersion,
        versionLabel: details.value.versionLabel,
        contentHash: scan.contentHash,
        frontmatterName: bundle.skillMd.frontmatter.name,
        frontmatterDescription: bundle.skillMd.frontmatter.description,
        skillMdBody: bundle.skillMd.body,
        trustTier: scan.trustTier,
        riskScore: scan.riskScore,
        scannerVersion: scan.scannerVersion,
        scanResultId: scanId,
      });

      await tx.insert(skillFile).values({
        id: createId(),
        skillVersionId: versionId,
        path: file.path,
        content: file.content,
        contentType: file.contentType,
        sizeBytes: file.sizeBytes,
        sha256: createHash("sha256").update(file.content, "utf8").digest("hex"),
        isExecutable: false,
      });

      await tx.insert(scanResult).values({
        id: scanId,
        skillVersionId: versionId,
        overallRiskScore: scan.riskScore,
        trustTier: scan.trustTier,
        scannerVersion: scan.scannerVersion,
        classifierModel: scan.llm?.model ?? null,
        status: "completed",
        startedAt: new Date(scan.startedAt),
        finishedAt: new Date(scan.finishedAt),
        durationMs: scan.durationMs,
        summary: scan.summary,
        layerStatus: scan.layerStatus,
      });

      if (scan.findings.length) {
        await tx.insert(finding).values(
          scan.findings.map((item) => ({
            id: createId(),
            scanResultId: scanId,
            layer: item.layer,
            severity: item.severity,
            category: item.category,
            title: item.title,
            description: item.description,
            filePath: item.filePath,
            location: item.location ?? null,
            evidence: item.evidence ?? null,
            confidence: item.confidence ?? null,
            source: item.source,
          })),
        );
      }

      if (scan.trustTier !== "blocked") {
        await tx
          .update(skill)
          .set({
            name: details.value.displayName,
            description: bundle.skillMd.frontmatter.description,
            summary: details.value.summary,
            category: details.value.category,
            subcategory: details.value.subcategory,
            tags: details.value.tags,
            metadata,
            status: "published",
            latestTrustTier: scan.trustTier,
            currentVersionId: versionId,
            source: submission.source,
            sourceUrl: submission.sourceUrl,
            updatedAt: new Date(),
          })
          .where(eq(skill.id, targetSkillId));
      }

      return { existingVersionKept: Boolean(existing && scan.trustTier === "blocked") };
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/skills");
    revalidatePath("/skills");

    if (scan.trustTier === "blocked") {
      return {
        status: "blocked",
        message: saved.existingVersionKept
          ? "Blocked by the scanner. The previously published version remains current."
          : "Blocked by the scanner and saved to your private review history. It was not published.",
        findingCount: scan.findings.length,
        existingVersionKept: saved.existingVersionKept,
        findings: scan.findings.slice(0, 12).map((item) => ({
          severity: item.severity,
          title: item.title,
          description: item.description,
          filePath: item.filePath,
          evidence: item.evidence,
        })),
      };
    }

    return {
      status: "published",
      skillName: details.value.displayName,
      slug: bundle.skillMd.frontmatter.name,
      trustTier: scan.trustTier,
    };
  } catch (error) {
    if (error instanceof Error && error.message === "SKILL_ID_IN_USE") {
      return {
        status: "error",
        message: "That SKILL.md name is already used by another creator. Choose a unique name in its frontmatter.",
      };
    }
    return {
      status: "error",
      message: "We could not save this skill. Check that the database migration has been applied, then try again.",
    };
  }
}
