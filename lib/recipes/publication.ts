import "server-only";
import { createHash } from "node:crypto";
import { createId } from "@paralleldrive/cuid2";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import {
  skill,
  skillVersion,
  skillFile,
  skillSubmission,
  scanResult,
  finding,
  reviewEvent,
  type ListingSnapshot,
} from "@/lib/db/schema";
import { getPrivateRecipeVersion } from "@/lib/recipes/storage";
import {
  inspectRecipePackage,
  RecipePackageError,
} from "@/lib/recipes/package";
import { isSkillCategory, getSubcategories } from "@/lib/skills/taxonomy";

const detailsSchema = z.object({
  name: z.string().trim().min(3).max(100),
  summary: z.string().trim().min(30).max(500),
  category: z.string().refine(isSkillCategory),
  subcategory: z.string().max(100),
  license: z.string().trim().min(2).max(120),
  rights: z.literal("on"),
});
export async function prepareRecipePublication(id: string, raw: unknown) {
  const admin = await requireAdmin();
  const parsed = detailsSchema.safeParse(raw);
  if (!parsed.success)
    throw new RecipePackageError(
      "Provide a title, 30–500 character summary, category, license and confirmation of redistribution rights.",
    );
  const details = parsed.data;
  if (!getSubcategories(details.category).includes(details.subcategory))
    throw new RecipePackageError(
      "Choose a subcategory belonging to the selected category.",
    );
  const source = await getPrivateRecipeVersion(id);
  if (!source || source.status !== "approved")
    throw new RecipePackageError(
      "Approve this private recipe version before preparing a marketplace submission.",
    );
  const report = await inspectRecipePackage(source.payload);
  if (!report.valid || report.packageHash !== source.package_hash)
    throw new RecipePackageError(
      "The source package failed current inspection or integrity validation.",
    );
  const slug = `${source.recipe_id.replace(/[._]/g, "-")}-${createHash("sha256").update(source.recipe_id).digest("hex").slice(0, 8)}`;
  // A readable summary accompanies the original multi-file package; it is not executable SKILL.md.
  const readme = [
    `# ${details.name}`,
    details.summary,
    `## Package identity\nRecipe: ${source.recipe_id}\n\nVersion: ${source.version}\n\nManifest: ${source.manifest_path}`,
    `## Runtime status\nThis package is available for inspection and integration work. Runtime execution, provider connections, installation and activation have not been verified.`,
    `## Required inputs\n${report.inputFields.map((f) => `- ${f.name}${f.required ? " (required)" : " (optional)"}`).join("\n") || "Consult the bundled input schema."}`,
    `## Declared permissions\n${report.permissions.map((p) => `- ${p}`).join("\n") || "None declared."}`,
    `## Dependencies\n${report.dependencies.map((d) => `- ${d}`).join("\n") || "None declared."}`,
    `## Integration steps\n1. Download recipe-package.json.\n2. Inspect its files and the selected recipe.yaml manifest.\n3. Resolve the declared dependencies, permissions and runtime adapter with your implementation team.\n4. Validate inputs and outputs against the bundled schemas in an isolated environment.\n5. Confirm provider consent and runtime readiness before activation.`,
    `## Known runtime blockers\n${report.runtimeBlockers.map((b) => `- ${b}`).join("\n")}`,
    `## License\n${details.license}`,
    `## Integrity\nCanonical source-files SHA-256: ${report.packageHash}`,
  ].join("\n\n");
  const snapshot: ListingSnapshot = {
    name: details.name,
    description: details.summary,
    summary: details.summary,
    category: details.category,
    subcategory: details.subcategory,
    tags: ["structured-recipe"],
    source: "upload",
    metadata: {
      license: details.license,
      requestedPermissions: report.permissions,
      format: "recipe_package",
      recipeId: source.recipe_id,
      packageVersionId: id,
      packageHash: report.packageHash,
      manifestPath: source.manifest_path,
      runtimeVerified: false,
      compatibility: [
        "Recipe manifest and JSON Schema; runtime integration required",
      ],
      inputs: report.inputFields.map((f) => f.name).join(", "),
      outputs: "See the bundled output schema.",
      dataHandling:
        "Source package only; runtime data handling depends on the implementation and provider permissions.",
    },
  };
  return db.transaction(async (tx) => {
    await tx.execute(
      sql`select pg_advisory_xact_lock(hashtext(${`recipe-publication:${source.recipe_id}`}))`,
    );
    const [existing] = await tx
      .select()
      .from(skill)
      .where(eq(skill.slug, slug))
      .for("update")
      .limit(1);
    if (
      existing &&
      (existing.metadata.recipeId !== source.recipe_id ||
        existing.authorId !== admin.id)
    )
      throw new RecipePackageError(
        "This recipe listing belongs to another publisher. Contact its owner before updating it.",
      );
    if (existing) {
      const [previous] = await tx
        .select({ id: skillVersion.id })
        .from(skillVersion)
        .where(
          and(
            eq(skillVersion.skillId, existing.id),
            eq(skillVersion.versionLabel, source.version),
          ),
        )
        .limit(1);
      if (previous) return { slug, existing: true };
    }
    const skillId = existing?.id ?? createId(),
      versionId = createId(),
      scanId = createId();
    const [last] = existing
      ? await tx
          .select({ version: skillVersion.version })
          .from(skillVersion)
          .where(eq(skillVersion.skillId, skillId))
          .orderBy(desc(skillVersion.version))
          .limit(1)
      : [];
    if (!existing)
      await tx.insert(skill).values({
        id: skillId,
        slug,
        authorId: admin.id,
        ...snapshot,
        status: "draft",
        latestTrustTier: "caution",
      });
    await tx.insert(skillVersion).values({
      id: versionId,
      skillId,
      version: (last?.version ?? 0) + 1,
      versionLabel: source.version,
      contentHash: report.packageHash,
      frontmatterName: source.recipe_id,
      frontmatterDescription: details.summary,
      skillMdBody: readme,
      trustTier: "caution",
      riskScore: report.riskScore,
      scannerVersion: report.security.scannerVersion,
      scanResultId: scanId,
    });
    const files = [
      {
        path: "recipe-package.json",
        content: JSON.stringify(source.payload, null, 2),
        contentType: "application/json",
      },
      { path: "README.md", content: readme, contentType: "text/markdown" },
    ];
    await tx.insert(skillFile).values(
      files.map((f) => ({
        id: createId(),
        skillVersionId: versionId,
        ...f,
        sizeBytes: Buffer.byteLength(f.content),
        sha256: createHash("sha256").update(f.content).digest("hex"),
        isExecutable: false,
      })),
    );
    await tx.insert(scanResult).values({
      id: scanId,
      skillVersionId: versionId,
      overallRiskScore: report.riskScore,
      trustTier: "caution",
      scannerVersion: report.security.scannerVersion,
      status: "completed",
      finishedAt: new Date(),
      layerStatus: report.security.layers,
      summary: {
        findings: report.security.findings.length,
        scope: "Static source inspection; runtime not verified",
      },
    });
    if (report.security.findings.length)
      await tx.insert(finding).values(
        report.security.findings.map((f) => ({
          id: createId(),
          scanResultId: scanId,
          ...f,
          description: f.title,
          source: "deterministic" as const,
        })),
      );
    await tx.insert(skillSubmission).values({
      id: createId(),
      skillId,
      versionId,
      status: "pending",
      snapshot,
    });
    await tx.insert(reviewEvent).values({
      id: createId(),
      actorId: admin.id,
      skillId,
      action: "recipe_package_submitted",
      note: `Private package ${id}, v${source.version}, hash ${report.packageHash}; redistribution rights confirmed by publisher. Awaiting public publication review.`,
    });
    return { slug, existing: false };
  });
}
