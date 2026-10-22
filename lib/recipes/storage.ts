import "server-only";
import postgres from "postgres";
import { requireAdmin } from "@/lib/admin";
import { getDatabaseUrl } from "@/lib/db/connection";
import {
  inspectRecipePackage,
  RecipePackageError,
  type PackageEnvelope,
} from "@/lib/recipes/package";
import { SCANNER_VERSION } from "@/lib/scanner/types";
import { isSkillCategory, getSubcategories } from "@/lib/skills/taxonomy";

type Inspection = Awaited<ReturnType<typeof inspectRecipePackage>>;
type ReviewStatus = "draft" | "pending_review" | "approved" | "rejected";
export type PrivateRecipeVersion = {
  listing_draft: {
    title: string;
    summary: string;
    category: string;
    subcategory: string;
  } | null;
  id: string;
  recipe_id: string;
  version: string;
  manifest_path: string;
  package_hash: string;
  created_at: Date;
  status: ReviewStatus;
  review_note: string;
  inspection: Inspection;
};
let pool: ReturnType<typeof postgres> | undefined;
function database() {
  if (process.env.VERCEL_ENV === "production")
    throw new RecipePackageError(
      "Development recipe storage is restricted to Preview.",
    );
  const connectionString = getDatabaseUrl();
  if (!connectionString)
    throw new RecipePackageError(
      "Private recipe storage is not configured for this environment.",
    );
  return (pool ??= postgres(connectionString, {
    max: process.env.VERCEL ? 1 : 3,
    prepare: false,
    connect_timeout: 10,
    idle_timeout: 20,
    ssl: "require",
  }));
}
export async function listPrivateRecipeVersions(page = 0, requestedPageSize = 20) {
  await requireAdmin();
  const pageSize = Math.min(40, Math.max(1, Math.floor(requestedPageSize) || 20));
  const offset = Math.min(10_000_000, Math.max(0, Math.floor(page) || 0)) * pageSize;
  const rows = await database()<PrivateRecipeVersion[]>`
    select v.id, v.recipe_id, v.version, v.manifest_path, v.package_hash,
      v.created_at, r.status, r.review_note, v.inspection,
      case when d.version_id is null then null else jsonb_build_object('title',d.title,'summary',d.summary,'category',d.category,'subcategory',d.subcategory) end as listing_draft
    from recipe_private.package_versions v
    join recipe_private.package_reviews r on r.version_id=v.id
    left join recipe_private.package_listing_drafts d on d.version_id=v.id
    order by v.created_at desc, v.id desc limit ${pageSize + 1} offset ${offset}`;
  return { items: rows.slice(0, pageSize), hasMore: rows.length > pageSize, pageSize };
}
export async function getPrivateRecipeVersion(id: string) {
  await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const [row] = await database()<
    (PrivateRecipeVersion & { payload: PackageEnvelope })[]
  >`
    select v.*, r.status, r.review_note,
      case when d.version_id is null then null else jsonb_build_object('title',d.title,'summary',d.summary,'category',d.category,'subcategory',d.subcategory) end as listing_draft
    from recipe_private.package_versions v
    join recipe_private.package_reviews r on r.version_id=v.id
    left join recipe_private.package_listing_drafts d on d.version_id=v.id where v.id=${id}`;
  return row ?? null;
}
export async function savePrivateRecipeVersion(raw: unknown, submit: boolean) {
  const admin = await requireAdmin();
  // Runtime form input may contain personal data. Never persist it with source packages.
  if (!raw || typeof raw !== "object" || Array.isArray(raw))
    throw new RecipePackageError(
      "Supply a prepared recipe package JSON object.",
    );
  const source = raw as Record<string, unknown>;
  const payload = { files: source.files, manifestPath: source.manifestPath };
  const report = await inspectRecipePackage(payload);
  if (
    !report.recipeId ||
    !/^[a-z0-9][a-z0-9._-]{0,159}$/.test(report.recipeId) ||
    !report.version ||
    !/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(report.version) ||
    report.version.length > 80
  )
    throw new RecipePackageError(
      "A valid recipe ID and semantic version are required to save a draft.",
    );
  if (submit && !report.valid)
    throw new RecipePackageError(
      "Correct the structural or blocked security findings before submitting. You can save a private draft.",
    );
  const manifestPath =
    typeof source.manifestPath === "string"
      ? source.manifestPath
      : "recipe.yaml";
  const storedPayload: PackageEnvelope = {
    files: (source.files as PackageEnvelope["files"]).map(
      ({ path, content }) => ({ path, content }),
    ),
    manifestPath,
  };
  return database().begin(async (tx) => {
    await tx`select pg_advisory_xact_lock(hashtext(${report.recipeId}))`;
    const [existing] = await tx<
      { id: string; package_hash: string; manifest_path: string }[]
    >`
      select id, package_hash, manifest_path from recipe_private.package_versions
      where recipe_id=${report.recipeId!} and version=${report.version!}`;
    if (existing) {
      if (
        existing.package_hash !== report.packageHash ||
        existing.manifest_path !== manifestPath
      )
        throw new RecipePackageError(
          "This ID/version already contains different files. Increase the recipe version to save changes.",
        );
      return { id: existing.id, existing: true };
    }
    const [row] = await tx<{ id: string }[]>`
      insert into recipe_private.package_versions
      (recipe_id, version, owner_id, manifest_path, package_hash, payload, inspection)
      values (${report.recipeId!}, ${report.version!}, ${admin.id}, ${manifestPath}, ${report.packageHash},
        ${tx.json(storedPayload as unknown as postgres.JSONValue)}, ${tx.json(report as unknown as postgres.JSONValue)}) returning id`;
    await tx`insert into recipe_private.package_reviews (version_id,status)
      values (${row.id}, ${submit ? "pending_review" : "draft"})`;
    await tx`insert into recipe_private.review_events (version_id,actor_id,action,note)
      values (${row.id},${admin.id},'saved','Immutable source package saved privately; no runtime inputs retained.')`;
    if (submit)
      await tx`insert into recipe_private.review_events (version_id,actor_id,action,note)
      values (${row.id},${admin.id},'submitted','Submitted for private registry review.')`;
    return { id: row.id, existing: false };
  });
}
export async function reviewPrivateRecipeVersion(
  id: string,
  decision: string,
  note: string,
) {
  const admin = await requireAdmin();
  if (
    !/^[0-9a-f-]{36}$/i.test(id) ||
    !["submitted", "approved", "rejected"].includes(decision)
  )
    throw new RecipePackageError("Choose a valid recipe and review decision.");
  note = note.trim();
  if (note.length < 10 || note.length > 2000)
    throw new RecipePackageError("Add a review note of 10–2,000 characters.");
  return database().begin(async (tx) => {
    const [row] = await tx<{ status: ReviewStatus; inspection: Inspection }[]>`
      select r.status, v.inspection from recipe_private.package_reviews r
      join recipe_private.package_versions v on v.id=r.version_id
      where r.version_id=${id} for update of r`;
    if (
      !row ||
      (decision === "submitted"
        ? row.status !== "draft"
        : row.status !== "pending_review")
    )
      throw new RecipePackageError(
        "This version has moved to another review stage. Refresh the page.",
      );
    if (
      decision !== "rejected" &&
      (!row.inspection.valid ||
        row.inspection.security.status === "blocked" ||
        row.inspection.security.scannerVersion !== SCANNER_VERSION)
    )
      throw new RecipePackageError(
        "This version needs corrected files or a current security inspection. Submit a new version.",
      );
    const status = decision === "submitted" ? "pending_review" : decision;
    await tx`update recipe_private.package_reviews set status=${status}, reviewer_id=${admin.id},
      review_note=${note}, updated_at=now() where version_id=${id}`;
    await tx`insert into recipe_private.review_events (version_id, actor_id, action, note)
      values (${id},${admin.id},${decision},${note})`;
  });
}

export async function savePrivateListingDraft(
  id: string,
  raw: Record<string, string>,
) {
  const admin = await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(id))
    throw new RecipePackageError("Choose a valid private recipe version.");
  const title = raw.title?.trim(),
    summary = raw.summary?.trim(),
    category = raw.category,
    subcategory = raw.subcategory;
  if (
    !title ||
    title.length < 3 ||
    title.length > 100 ||
    !summary ||
    summary.length < 10 ||
    summary.length > 500
  )
    throw new RecipePackageError(
      "Use a title of 3–100 characters and a summary of 10–500 characters.",
    );
  if (
    !isSkillCategory(category) ||
    !getSubcategories(category).includes(subcategory)
  )
    throw new RecipePackageError(
      "Choose a valid category and matching subcategory.",
    );
  return database().begin(async (tx) => {
    const [version] = await tx<
      { id: string }[]
    >`select id from recipe_private.package_versions where id=${id}`;
    if (!version)
      throw new RecipePackageError("Private recipe version not found.");
    await tx`insert into recipe_private.package_listing_drafts
      (version_id,title,summary,category,subcategory,updated_by)
      values (${id},${title},${summary},${category},${subcategory},${admin.id})
      on conflict (version_id) do update set title=excluded.title, summary=excluded.summary,
        category=excluded.category, subcategory=excluded.subcategory, updated_by=excluded.updated_by, updated_at=now()`;
  });
}
