import { posix } from "node:path";
import { load, JSON_SCHEMA } from "js-yaml";
import {
  inspectRecipePackage,
  RecipePackageError,
  type PackageEnvelope,
} from "@/lib/recipes/package";
import { validateMarkdownRecipePair } from "@/lib/recipes/markdown";

export type PreparedRecipe = {
  manifestPath: string;
  envelope: PackageEnvelope;
  report: Awaited<ReturnType<typeof inspectRecipePackage>>;
};

function collectRefs(value: unknown, found: Set<string>): void {
  if (Array.isArray(value)) return value.forEach((item) => collectRefs(item, found));
  if (!value || typeof value !== "object") return;
  for (const [key, item] of Object.entries(value)) {
    if (key === "$ref" && typeof item === "string") {
      const path = item.split("#")[0];
      if (path) found.add(path);
    } else collectRefs(item, found);
  }
}

/** One source archive may contain many independent recipes. Keep each report
 * and eventual publication scoped to its own manifest and referenced files. */
export async function prepareRecipeCollection(source: PackageEnvelope): Promise<PreparedRecipe[]> {
  if (!Array.isArray(source.files) || source.files.length < 1 || source.files.length > 512)
    throw new RecipePackageError("Expected 1–512 supported source files.");
  const byPath = new Map<string, PackageEnvelope["files"][number]>();
  const foldedPaths = new Set<string>();
  for (const file of source.files) {
    if (typeof file.path !== "string" || typeof file.content !== "string" ||
        !/^[A-Za-z0-9_./-]+$/.test(file.path) || file.path.startsWith("/") ||
        file.path.split("/").some((part) => !part || part === "." || part === "..") ||
        Buffer.byteLength(file.content) > 256 * 1024 ||
        foldedPaths.has(file.path.toLowerCase()))
      throw new RecipePackageError("The collection has a duplicate or invalid file path.");
    foldedPaths.add(file.path.toLowerCase());
    byPath.set(file.path, file);
  }
  const manifests = [...byPath.keys()]
    .filter((path) => path === "recipe.yaml" || path.endsWith("/recipe.yaml"))
    .sort();
  if (!manifests.length || manifests.length > 64)
    throw new RecipePackageError("Expected 1–64 recipe.yaml manifests in the archive.");
  const prepared: PreparedRecipe[] = [];
  const identities = new Set<string>();
  for (const manifestPath of manifests) {
    const directory = posix.dirname(manifestPath);
    const selected = new Set<string>([manifestPath]);
    for (const path of byPath.keys()) {
      if (directory === "." ? !path.includes("/") : path.startsWith(`${directory}/`))
        selected.add(path);
    }
    if (byPath.has("SKILL.md")) selected.add("SKILL.md");
    const declaredSchema = posix.join(directory, "schemas/recipe-manifest.schema.json");
    if (byPath.has(declaredSchema)) selected.add(declaredSchema);
    else if (byPath.has("schemas/recipe-manifest.schema.json"))
      selected.add("schemas/recipe-manifest.schema.json");
    let manifest: Record<string, unknown> = {};
    try {
      const parsed = load(byPath.get(manifestPath)!.content, { schema: JSON_SCHEMA });
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed))
        manifest = parsed as Record<string, unknown>;
    } catch {
      // The shared inspector returns the canonical manifest error below.
    }
    const queue: { path: string; from: string }[] = [];
    for (const key of ["input_schema", "output_schema"]) {
      const path = manifest[key];
      if (typeof path === "string" && path) queue.push({ path, from: manifestPath });
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
      collectRefs(schema, refs);
      for (const ref of refs) queue.push({ path: ref, from: resolved });
    }
    const envelope: PackageEnvelope = {
      files: [...selected].sort().map((path) => byPath.get(path)!),
      manifestPath,
    };
    const report = await inspectRecipePackage(envelope);
    const recipeDoc = byPath.get(posix.join(directory, "recipe.md"));
    const validationDoc = byPath.get(posix.join(directory, "validation-report.md"));
    if (!recipeDoc)
      report.issues.push({
        file: posix.join(directory, "recipe.md"),
        path: "",
        code: "manager_recipe_markdown_missing",
        message: "The manager's standard requires a human-readable recipe.md alongside this structured package.",
      });
    if (!validationDoc)
      report.issues.push({
        file: posix.join(directory, "validation-report.md"),
        path: "",
        code: "manager_validation_report_missing",
        message: "The manager's standard requires a separate validation-report.md alongside this structured package.",
      });
    if (recipeDoc && validationDoc) {
      for (const markdownIssue of validateMarkdownRecipePair(recipeDoc.content, validationDoc.content))
        report.issues.push({
          file: posix.join(directory, markdownIssue.file),
          path: "",
          code: "manager_standard_markdown",
          message: markdownIssue.message,
        });
    }
    if (report.issues.length) {
      report.valid = false;
      report.structuralValid = false;
    }
    const identity = `${report.recipeId ?? manifestPath}@${report.version ?? "unknown"}`;
    if (identities.has(identity))
      report.warnings.push("Another manifest in this ZIP uses the same recipe ID and version. Select only one variant for submission.");
    identities.add(identity);
    prepared.push({ manifestPath, envelope, report });
  }
  return prepared;
}
