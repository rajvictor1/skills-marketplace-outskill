"use server";

import { createHash } from "node:crypto";
import { createId } from "@paralleldrive/cuid2";
import { and, desc, eq, sql } from "drizzle-orm";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { hasDatabaseConnection } from "@/lib/db/connection";
import {
  finding, reviewEvent, scanResult, skill, skillFile, skillSubmission,
  skillVersion, type ListingSnapshot,
} from "@/lib/db/schema";
import { consumeRecipeInspectionLimit } from "@/lib/recipes/access";
import { prepareRecipeCollection, type PreparedRecipe } from "@/lib/recipes/collection";
import { RecipePackageError } from "@/lib/recipes/package";
import { MAX_RECIPE_ZIP_BYTES, readRecipeZip } from "@/lib/recipes/zip";
import { getSubcategories, isSkillCategory } from "@/lib/skills/taxonomy";

export type ZipRecipeRow = {
  manifestPath: string;
  id: string | null;
  version: string | null;
  title: string;
  description: string;
  packageHash: string;
  valid: boolean;
  issueCount: number;
  issues: string[];
  security: string;
  fileCount: number;
  warnings: string[];
};
export type ZipInspectResult = { ok: true; recipes: ZipRecipeRow[] } | { ok: false; message: string };
export type ZipSubmitResult = {
  ok: boolean;
  message: string;
  submitted?: { id: string; slug: string }[];
  failed?: { id: string; reason: string }[];
};
const MAX_RECIPE_YAML_BYTES = 32 * 1024;
const LEGACY_INTAKE_ENABLED = false;
const LEGACY_INTAKE_PAUSED = "YAML and ZIP uploads are paused. Submit recipe.md with its separate validation-report.md instead.";
type Selection = {
  manifestPath: string;
  packageHash: string;
  title: string;
  category: string;
  subcategory: string;
};

async function signedInUser() {
  if (!hasDatabaseConnection())
    throw new RecipePackageError("Publishing is unavailable until the account database is configured.");
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new RecipePackageError("Sign in before checking or submitting a recipe.");
  return session.user;
}
async function readPreparedZip(form: FormData) {
  const archive = form.get("archive");
  if (!(archive instanceof File) || !archive.name.toLowerCase().endsWith(".zip") ||
      !archive.size || archive.size > MAX_RECIPE_ZIP_BYTES)
    throw new RecipePackageError("Choose a recipe ZIP smaller than 1.5 MB.");
  return prepareRecipeCollection(readRecipeZip(new Uint8Array(await archive.arrayBuffer())));
}
async function readPreparedYaml(form: FormData) {
  const upload = form.get("recipe");
  if (!(upload instanceof File) || !/\.ya?ml$/i.test(upload.name) || !upload.size ||
      upload.size > MAX_RECIPE_YAML_BYTES)
    throw new RecipePackageError("Choose one recipe.yaml file no larger than 32 KB.");
  let content: string;
  try {
    content = new TextDecoder("utf-8", { fatal: true }).decode(await upload.arrayBuffer()).replace(/^\uFEFF/, "");
  } catch {
    throw new RecipePackageError("recipe.yaml must be a UTF-8 text file.");
  }
  return prepareRecipeCollection({ files: [{ path: "recipe.yaml", content }] });
}
function message(error: unknown) {
  return error instanceof RecipePackageError ? error.message : "Could not process this recipe ZIP. Try again.";
}

function toRecipeRow({ manifestPath, envelope, report }: PreparedRecipe): ZipRecipeRow {
  return {
    manifestPath,
    id: report.recipeId,
    version: report.version,
    title: report.title ?? report.recipeId?.split(".").slice(-2).join(" ").replaceAll("_", " ") ?? "Untitled recipe",
    description: report.description ?? "Recipe package",
    packageHash: report.packageHash,
    valid: report.valid,
    issueCount: report.issues.length,
    issues: report.issues.slice(0, 8).map((issue) => `${issue.path || issue.file}: ${issue.message}`),
    security: report.security.status,
    fileCount: envelope.files.length,
    warnings: report.warnings.filter((warning) =>
      warning.includes("same recipe ID") ||
      warning.includes("conceptual authoring example") ||
      warning.includes("manager's required recipe.md") ||
      warning.includes("Adapter registration")),
  };
}

export async function inspectRecipeZip(form: FormData): Promise<ZipInspectResult> {
  if (!LEGACY_INTAKE_ENABLED) return { ok: false, message: LEGACY_INTAKE_PAUSED };
  try {
    const user = await signedInUser();
    if (!(await consumeRecipeInspectionLimit(user.id)))
      throw new RecipePackageError("Inspection limit reached. Try again in one minute.");
    const recipes = await readPreparedZip(form);
    return { ok: true, recipes: recipes.map(toRecipeRow) };
  } catch (error) { return { ok: false, message: message(error) }; }
}

export async function inspectRecipeYaml(form: FormData): Promise<ZipInspectResult> {
  if (!LEGACY_INTAKE_ENABLED) return { ok: false, message: LEGACY_INTAKE_PAUSED };
  try {
    const user = await signedInUser();
    if (!(await consumeRecipeInspectionLimit(user.id)))
      throw new RecipePackageError("Inspection limit reached. Try again in one minute.");
    const recipes = await readPreparedYaml(form);
    return { ok: true, recipes: recipes.map(toRecipeRow) };
  } catch (error) {
    const fallback = "Could not process this recipe.yaml. Try again.";
    return { ok: false, message: error instanceof RecipePackageError ? error.message : fallback };
  }
}

function readSelections(form: FormData): Selection[] {
  let value: unknown;
  try { value = JSON.parse(String(form.get("selections") ?? "")); }
  catch { throw new RecipePackageError("Choose recipes to submit."); }
  if (!Array.isArray(value) || value.length !== 1)
    throw new RecipePackageError("Choose one recipe per submission.");
  const seen = new Set<string>();
  return value.map((entry): Selection => {
    if (!entry || typeof entry !== "object" ||
        typeof entry.manifestPath !== "string" || typeof entry.packageHash !== "string" ||
        typeof entry.title !== "string" || typeof entry.category !== "string" ||
        typeof entry.subcategory !== "string" || seen.has(entry.manifestPath))
      throw new RecipePackageError("Recipe selections are incomplete or duplicated.");
    seen.add(entry.manifestPath);
    const title = entry.title.trim();
    if (title.length < 3 || title.length > 100 || !isSkillCategory(entry.category) ||
        !getSubcategories(entry.category).includes(entry.subcategory))
      throw new RecipePackageError("Each recipe needs a title, category and matching subcategory.");
    return { manifestPath: entry.manifestPath, packageHash: entry.packageHash,
      title, category: entry.category, subcategory: entry.subcategory };
  });
}

function recipeReadme(recipe: PreparedRecipe, title: string, license: string) {
  const report = recipe.report;
  return [
    `# ${title}`,
    `Recipe ID: ${report.recipeId}\nVersion: ${report.version}\nManifest: ${recipe.manifestPath}`,
    `## Description\n${report.description ?? "Read recipe.yaml and the bundled schemas for the complete contract."}`,
    `## Inputs\n${report.inputFields.map((field) => `- ${field.name}${field.required ? " (required)" : ""}`).join("\n") || "See bundled input schema."}`,
    `## Permissions\n${report.permissions.map((permission) => `- ${permission}`).join("\n") || "None declared."}`,
    `## Runtime status\nAdapter binding, installation and execution have not been verified. Downloading this package does not activate it.`,
    `## License\n${license}`,
    `## Integrity\nSHA-256: ${report.packageHash}`,
  ].join("\n\n");
}

async function saveSubmission(recipe: PreparedRecipe, selection: Selection, userId: string, license: string) {
  const report = recipe.report;
  if (!report.recipeId || !report.version || !report.valid || report.packageHash !== selection.packageHash)
    throw new RecipePackageError("This recipe changed or has validation findings. Inspect the ZIP again.");
  const recipeId = report.recipeId;
  const recipeVersion = report.version;
  const slug = `${recipeId.replace(/[._]/g, "-")}-${createHash("sha256").update(recipeId).digest("hex").slice(0, 8)}`;
  const readme = recipeReadme(recipe, selection.title, license);
  const metadata = {
    format: "recipe_package" as const,
    recipeId: report.recipeId,
    packageHash: report.packageHash,
    manifestPath: recipe.manifestPath,
    runtimeVerified: false as const,
    license,
    requestedPermissions: report.permissions,
    inputs: report.inputFields.map((field) => field.name).join(", "),
    outputs: "See bundled output schema.",
    dataHandling: "Runtime data handling depends on the eventual adapter and provider permissions.",
  };
  const snapshot: ListingSnapshot = {
    name: selection.title,
    description: report.description ?? selection.title,
    summary: (report.description ?? selection.title).slice(0, 280),
    category: selection.category,
    subcategory: selection.subcategory,
    tags: ["structured-recipe"],
    metadata,
    source: "upload",
  };
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`recipe-upload:${recipeId}`}))`);
    const [existing] = await tx.select().from(skill).where(eq(skill.slug, slug)).for("update").limit(1);
    if (existing && (existing.authorId !== userId || existing.metadata.format !== "recipe_package"))
      throw new RecipePackageError("This recipe ID is already owned by another publisher.");
    if (existing) {
      const [sameVersion] = await tx.select({ id: skillVersion.id })
        .from(skillVersion).where(and(eq(skillVersion.skillId, existing.id), eq(skillVersion.versionLabel, recipeVersion)));
      if (sameVersion)
        throw new RecipePackageError("This recipe version already exists. Increase its version before submitting changed files.");
    }
    const [last] = existing
      ? await tx.select({ version: skillVersion.version }).from(skillVersion)
          .where(eq(skillVersion.skillId, existing.id)).orderBy(desc(skillVersion.version)).limit(1)
      : [];
    const skillId = existing?.id ?? createId();
    const versionId = createId();
    const scanId = createId();
    // Passing static checks does not establish runtime or integration safety.
    const trustTier = "caution" as const;
    if (!existing) await tx.insert(skill).values({ id: skillId, slug, authorId: userId,
      ...snapshot, status: "draft", latestTrustTier: trustTier });
    await tx.insert(skillVersion).values({ id: versionId, skillId, version: (last?.version ?? 0) + 1,
      versionLabel: recipeVersion, contentHash: report.packageHash,
      frontmatterName: recipeId, frontmatterDescription: report.description ?? selection.title,
      skillMdBody: readme, trustTier, riskScore: report.riskScore,
      scannerVersion: report.security.scannerVersion, scanResultId: scanId });
    const files = [
      { path: "recipe-package.json", content: JSON.stringify(recipe.envelope, null, 2), contentType: "application/json" },
      { path: "README.md", content: readme, contentType: "text/markdown" },
    ];
    await tx.insert(skillFile).values(files.map((file) => ({ id: createId(), skillVersionId: versionId,
      ...file, sizeBytes: Buffer.byteLength(file.content),
      sha256: createHash("sha256").update(file.content).digest("hex"), isExecutable: false })));
    await tx.insert(scanResult).values({ id: scanId, skillVersionId: versionId,
      overallRiskScore: report.riskScore, trustTier, scannerVersion: report.security.scannerVersion,
      status: "completed", finishedAt: new Date(), layerStatus: report.security.layers,
      summary: { findings: report.security.findings.length, scope: "Static source inspection; runtime unverified" } });
    if (report.security.findings.length)
      await tx.insert(finding).values(report.security.findings.map((item) => ({ id: createId(), scanResultId: scanId,
        ...item, description: item.title, source: "deterministic" as const })));
    await tx.insert(skillSubmission).values({ id: createId(), skillId, versionId, status: "pending", snapshot });
    await tx.insert(reviewEvent).values({ id: createId(), actorId: userId, skillId,
      action: "recipe_package_submitted", note: `Structured recipe ${recipeId} v${recipeVersion} submitted from ZIP; awaiting admin review.` });
    if (existing) await tx.update(skill).set({ updatedAt: new Date() }).where(eq(skill.id, skillId));
    return { id: recipeId, slug };
  });
}

export async function submitRecipeZip(form: FormData): Promise<ZipSubmitResult> {
  if (!LEGACY_INTAKE_ENABLED) return { ok: false, message: LEGACY_INTAKE_PAUSED };
  try {
    const user = await signedInUser();
    if (!(await consumeRecipeInspectionLimit(user.id)))
      throw new RecipePackageError("Submission limit reached. Try again in one minute.");
    if (form.get("rights") !== "on")
      throw new RecipePackageError("Confirm you have permission to submit every selected recipe file.");
    const license = String(form.get("license") ?? "").trim();
    if (!["MIT", "Apache-2.0", "CC-BY-4.0", "Proprietary", "Other"].includes(license))
      throw new RecipePackageError("Choose reuse terms for the selected recipes.");
    const selections = readSelections(form);
    const prepared = await readPreparedZip(form);
    const byManifest = new Map(prepared.map((recipe) => [recipe.manifestPath, recipe]));
    const submitted: { id: string; slug: string }[] = [];
    const failed: { id: string; reason: string }[] = [];
    for (const selection of selections) {
      const recipe = byManifest.get(selection.manifestPath);
      if (!recipe) { failed.push({ id: selection.manifestPath, reason: "Recipe not found in ZIP." }); continue; }
      try { submitted.push(await saveSubmission(recipe, selection, user.id, license)); }
      catch (error) { failed.push({ id: recipe.report.recipeId ?? selection.manifestPath, reason: message(error) }); }
    }
    if (submitted.length) {
      revalidatePath("/dashboard/skills"); revalidatePath("/admin"); revalidatePath("/skills");
    }
    return { ok: submitted.length > 0, message: `${submitted.length} recipe${submitted.length === 1 ? "" : "s"} submitted for admin review. ${failed.length} need attention. Nothing was published or installed.`, submitted, failed };
  } catch (error) { return { ok: false, message: message(error) }; }
}

export async function submitRecipeYaml(form: FormData): Promise<ZipSubmitResult> {
  if (!LEGACY_INTAKE_ENABLED) return { ok: false, message: LEGACY_INTAKE_PAUSED };
  try {
    const user = await signedInUser();
    if (!(await consumeRecipeInspectionLimit(user.id)))
      throw new RecipePackageError("Submission limit reached. Try again in one minute.");
    if (form.get("rights") !== "on")
      throw new RecipePackageError("Confirm you have permission to submit this recipe file.");
    const license = String(form.get("license") ?? "").trim();
    if (!["MIT", "Apache-2.0", "CC-BY-4.0", "Proprietary", "Other"].includes(license))
      throw new RecipePackageError("Choose reuse terms for this recipe.");
    const title = String(form.get("title") ?? "").trim();
    const category = String(form.get("category") ?? "");
    const subcategory = String(form.get("subcategory") ?? "");
    if (title.length < 3 || title.length > 100 || !isSkillCategory(category) ||
        !getSubcategories(category).includes(subcategory))
      throw new RecipePackageError("Choose a title, category and matching subcategory.");
    const [recipe] = await readPreparedYaml(form);
    if (!recipe?.report.valid) {
      const issues = recipe?.report.issues.slice(0, 3).map((item) => item.message).join(" ");
      throw new RecipePackageError(`This recipe did not pass the required file checks.${issues ? ` ${issues}` : ""}`);
    }
    const submitted = await saveSubmission(recipe, {
      manifestPath: recipe.manifestPath,
      packageHash: recipe.report.packageHash,
      title,
      category,
      subcategory,
    }, user.id, license);
    revalidatePath("/dashboard/skills");
    revalidatePath("/admin");
    revalidatePath("/skills");
    return {
      ok: true,
      message: "1 recipe submitted for admin review. Nothing was published or installed.",
      submitted: [submitted],
    };
  } catch (error) {
    const fallback = "Could not process this recipe.yaml. Try again.";
    return { ok: false, message: error instanceof RecipePackageError ? error.message : fallback };
  }
}
