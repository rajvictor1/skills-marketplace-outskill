/** Offline QC and optional package export. Never executes supplied code.
 * Usage: node --import tsx scripts/prepare-recipe-collection.ts INPUT.json [OUTPUT_DIR]
 */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { posix } from "node:path";
import { prepareRecipeCollection } from "../lib/recipes/collection";
import { MAX_PACKAGE_BYTES, type PackageEnvelope } from "../lib/recipes/package";

async function main() {
  const sourcePath = process.argv[2];
  const outputDir = process.argv[3];
  if (!sourcePath) throw new Error("Provide a prepared recipe collection JSON file.");
  const bytes = await readFile(sourcePath);
  if (bytes.byteLength > MAX_PACKAGE_BYTES)
    throw new Error("Collection exceeds the 1 MB preparation limit.");
  const collection = JSON.parse(bytes.toString("utf8")) as PackageEnvelope;
  const recipes = await prepareRecipeCollection(collection);
  if (outputDir) await mkdir(outputDir, { recursive: true });
  for (const recipe of recipes) {
    const { recipeId, version } = recipe.report;
    if (!outputDir || !recipeId || !version || !recipe.report.structuralValid) continue;
    const filename = `${recipeId.replace(/[^a-z0-9._-]/g, "_")}--${version.replace(/[^a-zA-Z0-9._-]/g, "_")}.json`;
    await writeFile(posix.join(outputDir, filename), JSON.stringify(recipe.envelope, null, 2));
  }
  process.stdout.write(JSON.stringify({
    manifestCount: recipes.length,
    structurallyValid: recipes.filter((r) => r.report.structuralValid).length,
    securityReviewRequired: recipes.filter((r) => r.report.security.status === "review_required").length,
    runtimeVerified: false,
    published: false,
    recipes: recipes.map(({ manifestPath, envelope, report }) => ({
      manifestPath,
      recipeId: report.recipeId,
      version: report.version,
      fileCount: envelope.files.length,
      structuralValid: report.structuralValid,
      security: report.security.status,
      findingCount: report.security.findings.length,
      issues: report.issues,
      runtimeBlockers: report.runtimeBlockers,
    })),
  }, null, 2) + "\n");
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Collection preparation failed.");
  process.exitCode = 1;
});
