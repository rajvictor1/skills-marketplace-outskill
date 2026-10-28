"use server";

import "server-only";
import { createHash } from "node:crypto";
import { createId } from "@paralleldrive/cuid2";
import { and, desc, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasDatabaseConnection } from "@/lib/db/connection";
import { finding, reviewEvent, scanResult, skill, skillFile, skillSubmission, skillVersion, type ListingSnapshot } from "@/lib/db/schema";
import { consumeRecipeInspectionLimit } from "@/lib/recipes/access";
import { MAX_RECIPE_MARKDOWN_BYTES, MAX_VALIDATION_REPORT_BYTES, validateMarkdownRecipePair } from "@/lib/recipes/markdown";
import { scanSkill, type ParsedSkillBundle } from "@/lib/scanner";
import { getSubcategories, isSkillCategory } from "@/lib/skills/taxonomy";

type Inspection = {
  ok: boolean;
  message: string;
  valid?: boolean;
  issues?: string[];
  scannerStatus?: string;
  riskScore?: number;
  contentHash?: string;
};
type Submission = { ok: boolean; message: string; slug?: string };
const stableId = /^[a-z0-9][a-z0-9._-]{1,159}$/;
const semver = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/;
const licenses = ["MIT", "Apache-2.0", "CC-BY-4.0", "Proprietary", "Other"];

class MarkdownRecipeError extends Error {}

async function signedInUser() {
  if (!hasDatabaseConnection()) throw new MarkdownRecipeError("Publishing is unavailable until the account database is configured.");
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new MarkdownRecipeError("Sign in before checking or submitting a recipe.");
  return session.user;
}

function textField(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

async function readTextFile(form: FormData, key: string, expectedName: string, maxBytes: number) {
  const file = form.get(key);
  if (!(file instanceof File) || file.size === 0 || file.name.toLowerCase() !== expectedName)
    throw new MarkdownRecipeError(`Choose a file named ${expectedName}.`);
  if (file.size > maxBytes) throw new MarkdownRecipeError(`${expectedName} is larger than the ${Math.floor(maxBytes / 1024)} KB limit.`);
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(await file.arrayBuffer()).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  } catch {
    throw new MarkdownRecipeError(`${expectedName} must be a UTF-8 text file.`);
  }
}

function readDetails(form: FormData) {
  const title = textField(form, "title");
  const recipeId = textField(form, "recipeId");
  const version = textField(form, "version");
  const summary = textField(form, "summary");
  const category = textField(form, "category");
  const subcategory = textField(form, "subcategory");
  const license = textField(form, "license");
  if (title.length < 3 || title.length > 100) throw new MarkdownRecipeError("Title must be 3–100 characters.");
  if (!stableId.test(recipeId)) throw new MarkdownRecipeError("Recipe ID must be lowercase and use letters, numbers, dots, underscores or hyphens.");
  if (!semver.test(version)) throw new MarkdownRecipeError("Version must use a format such as 1.0.0.");
  if (summary.length < 30 || summary.length > 500) throw new MarkdownRecipeError("Summary must be 30–500 characters.");
  if (!isSkillCategory(category) || !getSubcategories(category).includes(subcategory)) throw new MarkdownRecipeError("Choose a category and matching subcategory.");
  if (!licenses.includes(license)) throw new MarkdownRecipeError("Choose reuse terms for the recipe.");
  return { title, recipeId, version, summary, category, subcategory, license };
}

async function prepare(form: FormData) {
  const details = readDetails(form);
  const recipe = await readTextFile(form, "recipe", "recipe.md", MAX_RECIPE_MARKDOWN_BYTES);
  const validationReport = await readTextFile(form, "validationReport", "validation-report.md", MAX_VALIDATION_REPORT_BYTES);
  const issues = validateMarkdownRecipePair(recipe, validationReport);
  const bundle: ParsedSkillBundle = {
    skillMd: { frontmatter: { name: details.recipeId, description: details.summary }, body: recipe },
    files: [
      { path: "recipe.md", content: recipe, contentType: "text/markdown", isScript: false, sizeBytes: Buffer.byteLength(recipe) },
      { path: "validation-report.md", content: validationReport, contentType: "text/markdown", isScript: false, sizeBytes: Buffer.byteLength(validationReport) },
    ],
    meta: { source: "upload" },
  };
  const scan = await scanSkill(bundle);
  const contentHash = createHash("sha256").update(`${recipe}\n\0${validationReport}`).digest("hex");
  return { details, recipe, validationReport, issues, scan, contentHash, valid: issues.length === 0 && scan.trustTier !== "blocked" };
}

function safeMessage(error: unknown) {
  return error instanceof MarkdownRecipeError ? error.message : "Could not process these Markdown files. Check they are valid UTF-8 and try again.";
}

export async function inspectRecipeMarkdown(form: FormData): Promise<Inspection> {
  try {
    const user = await signedInUser();
    if (!(await consumeRecipeInspectionLimit(user.id))) throw new MarkdownRecipeError("Inspection limit reached. Try again in one minute.");
    const result = await prepare(form);
    const messages = result.issues.map((issue) => `${issue.file}: ${issue.message}`);
    if (result.scan.trustTier === "blocked") messages.push("The static security scanner blocked this submission. Review its findings with an administrator.");
    return {
      ok: true,
      message: result.valid ? "The files passed format and static security checks. This does not verify external evidence or execute the recipe." : "Fix the findings before submitting for administrator review.",
      valid: result.valid,
      issues: [...messages, ...result.scan.findings.slice(0, 8).map((finding) => `${finding.severity}: ${finding.title}`)],
      scannerStatus: result.scan.trustTier,
      riskScore: result.scan.riskScore,
      contentHash: result.contentHash,
    };
  } catch (error) {
    return { ok: false, message: safeMessage(error) };
  }
}

export async function submitRecipeMarkdown(form: FormData): Promise<Submission> {
  try {
    const user = await signedInUser();
    if (!(await consumeRecipeInspectionLimit(user.id))) throw new MarkdownRecipeError("Submission limit reached. Try again in one minute.");
    if (form.get("rights") !== "on") throw new MarkdownRecipeError("Confirm you have permission to submit these files and removed private data and credentials.");
    const prepared = await prepare(form);
    if (!prepared.valid) throw new MarkdownRecipeError("This recipe and its report must pass the required format and static checks before submission.");
    const { details, recipe, validationReport, scan, contentHash } = prepared;
    const slug = `${details.recipeId.replace(/[._]/g, "-")}-${createHash("sha256").update(details.recipeId).digest("hex").slice(0, 8)}`;
    const metadata = {
      format: "recipe_markdown" as const,
      recipeId: details.recipeId,
      packageHash: contentHash,
      runtimeVerified: false as const,
      license: details.license,
      requestedPermissions: ["See creator-declared permissions in recipe.md"],
      inputs: "See recipe.md",
      outputs: "See recipe.md",
      dataHandling: "Creator-declared; see recipe.md and validation-report.md. Runtime handling is not verified.",
    };
    const snapshot: ListingSnapshot = {
      name: details.title,
      description: details.summary,
      summary: details.summary,
      category: details.category,
      subcategory: details.subcategory,
      tags: ["recipe-markdown"],
      metadata,
      source: "upload",
    };
    await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`recipe-upload:${details.recipeId}`}))`);
      const [existing] = await tx.select().from(skill).where(eq(skill.slug, slug)).for("update").limit(1);
      if (existing && (existing.authorId !== user.id || existing.metadata.format !== "recipe_markdown"))
        throw new MarkdownRecipeError("This recipe ID is already owned by another publisher.");
      if (existing) {
        const [sameVersion] = await tx.select({ id: skillVersion.id }).from(skillVersion)
          .where(and(eq(skillVersion.skillId, existing.id), eq(skillVersion.versionLabel, details.version))).limit(1);
        if (sameVersion) throw new MarkdownRecipeError("This recipe version already exists. Increase its version before submitting changes.");
      }
      const [last] = existing ? await tx.select({ version: skillVersion.version }).from(skillVersion)
        .where(eq(skillVersion.skillId, existing.id)).orderBy(desc(skillVersion.version)).limit(1) : [];
      const skillId = existing?.id ?? createId();
      const versionId = createId();
      const scanId = createId();
      if (!existing) await tx.insert(skill).values({ id: skillId, slug, authorId: user.id, ...snapshot, status: scan.trustTier === "blocked" ? "blocked" : "draft", latestTrustTier: scan.trustTier });
      await tx.insert(skillVersion).values({
        id: versionId, skillId, version: (last?.version ?? 0) + 1, versionLabel: details.version,
        contentHash, frontmatterName: details.recipeId, frontmatterDescription: details.summary,
        skillMdBody: recipe, trustTier: scan.trustTier, riskScore: scan.riskScore,
        scannerVersion: scan.scannerVersion, scanResultId: scanId,
      });
      const storedFiles = [
        { path: "recipe.md", content: recipe },
        { path: "validation-report.md", content: validationReport },
      ];
      await tx.insert(skillFile).values(storedFiles.map((file) => ({
        id: createId(), skillVersionId: versionId, ...file, contentType: "text/markdown",
        sizeBytes: Buffer.byteLength(file.content), sha256: createHash("sha256").update(file.content).digest("hex"), isExecutable: false,
      })));
      await tx.insert(scanResult).values({
        id: scanId, skillVersionId: versionId, overallRiskScore: scan.riskScore,
        trustTier: scan.trustTier, scannerVersion: scan.scannerVersion, classifierModel: scan.llm?.model ?? null,
        status: "completed", startedAt: new Date(scan.startedAt), finishedAt: new Date(scan.finishedAt),
        durationMs: scan.durationMs, summary: { ...scan.summary, scope: "Static source inspection; evidence and runtime unverified" }, layerStatus: scan.layerStatus,
      });
      if (scan.findings.length) await tx.insert(finding).values(scan.findings.map((item) => ({
        id: createId(), scanResultId: scanId, layer: item.layer, severity: item.severity,
        category: item.category, title: item.title, description: item.description, filePath: item.filePath,
        location: item.location ?? null, evidence: item.evidence ?? null, confidence: item.confidence ?? null, source: item.source,
      })));
      await tx.insert(skillSubmission).values({ id: createId(), skillId, versionId, status: scan.trustTier === "blocked" ? "blocked" : "pending", snapshot });
      await tx.insert(reviewEvent).values({ id: createId(), actorId: user.id, skillId,
        action: scan.trustTier === "blocked" ? "scan_blocked" : "recipe_markdown_submitted",
        note: `Recipe ${details.recipeId} v${details.version} submitted as Markdown with a separate validation report; awaiting admin review.` });
      if (existing) await tx.update(skill).set({ updatedAt: new Date() }).where(eq(skill.id, skillId));
    });
    revalidatePath("/dashboard/skills"); revalidatePath("/admin"); revalidatePath("/skills");
    return { ok: true, message: "Recipe Markdown and its separate validation report were submitted for administrator review. Nothing was published or run.", slug };
  } catch (error) {
    return { ok: false, message: safeMessage(error) };
  }
}
