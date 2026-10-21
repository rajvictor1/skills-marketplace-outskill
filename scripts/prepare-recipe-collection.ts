/** Read-only QC by default. Splits a prepared multi-recipe envelope into
 * independent packages; never executes supplied adapters or scripts.
 * Usage: node --import tsx scripts/prepare-recipe-collection.ts INPUT.json [OUTPUT_DIR]
 */
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { posix } from "node:path";
import { load, JSON_SCHEMA } from "js-yaml";
import {
  inspectRecipePackage,
  MAX_PACKAGE_BYTES,
  type PackageEnvelope,
} from "../lib/recipes/package";

type SourceFile = PackageEnvelope["files"][number];
async function main() {
const sourcePath = process.argv[2];
const outputDir = process.argv[3];
if (!sourcePath) throw new Error("Provide a prepared recipe collection JSON file.");

const bytes = await readFile(sourcePath);
if (bytes.byteLength > MAX_PACKAGE_BYTES)
  throw new Error("Collection exceeds the 1 MB preparation limit.");
const source = JSON.parse(bytes.toString("utf8")) as PackageEnvelope;
if (!Array.isArray(source.files) || source.files.length > 256)
  throw new Error("Expected 1–256 source text files.");
const byPath = new Map<string, SourceFile>();
for (const file of source.files) {
  if (typeof file.path !== "string" || typeof file.content !== "string" || byPath.has(file.path))
    throw new Error("Collection has an invalid or duplicate file path.");
  byPath.set(file.path, file);
}
const manifestPaths = [...byPath.keys()]
  .filter((path) => path === "recipe.yaml" || path.endsWith("/recipe.yaml"))
  .sort();
if (!manifestPaths.length || manifestPaths.length > 64)
  throw new Error("Expected 1–64 recipe.yaml manifests.");

function referencedSchemas(value: unknown, found: Set<string>) {
  if (Array.isArray(value)) return value.forEach((v) => referencedSchemas(v, found));
  if (!value || typeof value !== "object") return;
  for (const [key, nested] of Object.entries(value)) {
    if (key === "$ref" && typeof nested === "string") {
      const path = nested.split("#")[0];
      if (path) found.add(path);
    } else referencedSchemas(nested, found);
  }
}

const rows = [];
const ids = new Set<string>();
for (const manifestPath of manifestPaths) {
  const manifestFile = byPath.get(manifestPath)!;
  const directory = posix.dirname(manifestPath);
  const selected = new Set<string>([manifestPath]);
  const manifest = load(manifestFile.content, { schema: JSON_SCHEMA }) as Record<string, unknown>;
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest))
    throw new Error(`Invalid manifest object: ${manifestPath}`);

  // Local documentation and adapter source belongs to this recipe. Shared
  // schemas are included only when referenced by this recipe or its schemas.
  for (const path of byPath.keys()) {
    if (directory === "." ? !path.includes("/") : path.startsWith(`${directory}/`))
      selected.add(path);
  }
  if (byPath.has("SKILL.md")) selected.add("SKILL.md");
  const declaredSchema = posix.join(directory, "schemas/recipe-manifest.schema.json");
  if (byPath.has(declaredSchema)) selected.add(declaredSchema);
  else if (byPath.has("schemas/recipe-manifest.schema.json"))
    selected.add("schemas/recipe-manifest.schema.json");

  const queue: { path: string; from: string }[] = [];
  for (const key of ["input_schema", "output_schema"]) {
    const ref = manifest[key];
    if (typeof ref === "string" && ref) queue.push({ path: ref, from: manifestPath });
  }
  const visited = new Set<string>();
  while (queue.length) {
    const next = queue.shift()!;
    const resolved = byPath.has(next.path)
      ? next.path
      : posix.normalize(posix.join(posix.dirname(next.from), next.path));
    if (!byPath.has(resolved) || visited.has(resolved)) continue;
    visited.add(resolved);
    selected.add(resolved);
    if (!resolved.endsWith(".json")) continue;
    let schema: unknown;
    try { schema = JSON.parse(byPath.get(resolved)!.content); } catch { continue; }
    const refs = new Set<string>();
    referencedSchemas(schema, refs);
    for (const ref of refs) queue.push({ path: ref, from: resolved });
  }

  const packageFiles = [...selected].sort().map((path) => byPath.get(path)!);
  const envelope: PackageEnvelope = { files: packageFiles, manifestPath };
  const report = await inspectRecipePackage(envelope);
  const identity = report.recipeId ? `${report.recipeId}@${report.version ?? "unknown"}` : manifestPath;
  const duplicateIdentity = ids.has(identity);
  if (duplicateIdentity)
    report.issues.push({
      file: manifestPath, path: "id", code: "duplicate_identity",
      message: "Another manifest in this collection declares the same recipe ID and version.",
    });
  ids.add(identity);
  if (outputDir && report.recipeId && report.version && !duplicateIdentity) {
    const filename = `${report.recipeId.replace(/[^a-z0-9._-]/g, "_")}--${report.version.replace(/[^a-zA-Z0-9._-]/g, "_")}.json`;
    await mkdir(outputDir, { recursive: true });
    await writeFile(posix.join(outputDir, filename), JSON.stringify(envelope, null, 2));
  }
  rows.push({
    manifestPath,
    recipeId: report.recipeId,
    version: report.version,
    fileCount: packageFiles.length,
    structuralValid: report.structuralValid && !report.issues.some((i) => i.code === "duplicate_identity"),
    security: report.security.status,
    findingCount: report.security.findings.length,
    issues: report.issues,
    runtimeBlockers: report.runtimeBlockers,
  });
}
process.stdout.write(JSON.stringify({
  manifestCount: rows.length,
  structurallyValid: rows.filter((r) => r.structuralValid).length,
  securityReviewRequired: rows.filter((r) => r.security === "review_required").length,
  runtimeVerified: false,
  published: false,
  recipes: rows,
}, null, 2) + "\n");
}
main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Collection preparation failed.");
  process.exitCode = 1;
});
