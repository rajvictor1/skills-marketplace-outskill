/** Offline, read-only inspection. This never invokes supplied adapters or test scripts. */
import { readFile, stat } from "node:fs/promises";
import {
  inspectRecipePackage,
  MAX_PACKAGE_BYTES,
  type PackageEnvelope,
} from "../lib/recipes/package";
async function main() {
  const path = process.argv[2];
  if (!path) throw new Error("Provide a prepared package JSON file.");
  if ((await stat(path)).size > MAX_PACKAGE_BYTES)
    throw new Error("Prepared package exceeds 1 MB.");
  const bytes = await readFile(path);
  if (bytes.byteLength > MAX_PACKAGE_BYTES)
    throw new Error("Prepared package exceeds 1 MB.");
  const envelope: PackageEnvelope = JSON.parse(bytes.toString("utf8"));
  if (!process.argv.includes("--all")) {
    process.stdout.write(
      JSON.stringify(await inspectRecipePackage(envelope), null, 2) + "\n",
    );
    return;
  }
  const paths = envelope.files
    .filter(
      (file) =>
        file.path === "recipe.yaml" || file.path.endsWith("/recipe.yaml"),
    )
    .map((file) => file.path);
  if (!paths.length || paths.length > 64)
    throw new Error("Expected 1–64 recipe manifests.");
  const reports = [];
  const ids = new Set<string>();
  for (const manifestPath of paths) {
    const report = await inspectRecipePackage({ ...envelope, manifestPath });
    if (report.recipeId && ids.has(report.recipeId))
      report.issues.push({
        file: manifestPath,
        path: "id",
        code: "duplicate_id",
        message: "Duplicate recipe ID in collection.",
      });
    if (report.recipeId) ids.add(report.recipeId);
    reports.push({
      manifestPath,
      recipeId: report.recipeId,
      version: report.version,
      structuralValid:
        report.structuralValid &&
        !report.issues.some((i) => i.code === "duplicate_id"),
      issues: report.issues,
      inputFields: report.inputFields,
      dependencies: report.dependencies,
      runtimeBlockers: report.runtimeBlockers,
      security: {
        status: report.security.status,
        findingCount: report.security.findings.length,
      },
      readiness: report.readiness,
    });
  }
  // Cycle detection applies to declared dependencies inside this collection only.
  const graph = new Map(
    reports.filter((r) => r.recipeId).map((r) => [r.recipeId!, r.dependencies]),
  );
  const active = new Set<string>();
  const done = new Set<string>();
  const cycles: string[] = [];
  function visit(id: string) {
    if (active.has(id)) {
      cycles.push(id);
      return;
    }
    if (done.has(id)) return;
    active.add(id);
    for (const next of graph.get(id) ?? []) if (graph.has(next)) visit(next);
    active.delete(id);
    done.add(id);
  }
  for (const id of graph.keys()) visit(id);
  const unresolved = [
    ...new Set(
      reports.flatMap((r) => r.dependencies.filter((id) => !graph.has(id))),
    ),
  ];
  process.stdout.write(
    JSON.stringify(
      {
        manifestCount: reports.length,
        structurallyValid: reports.filter((r) => r.structuralValid).length,
        dependencyCycles: [...new Set(cycles)],
        unresolvedDependencies: unresolved,
        runtimeVerified: false,
        published: false,
        reports,
      },
      null,
      2,
    ) + "\n",
  );
}
main().catch(() => {
  console.error(
    "Package inspection failed. Check the envelope and supported import profile.",
  );
  process.exitCode = 1;
});
