import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  real,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

import { user } from "./auth-schema";

export interface SkillMetadata {
  format?: "recipe_package";
  recipeId?: string;
  packageVersionId?: string;
  packageHash?: string;
  manifestPath?: string;
  runtimeVerified?: false;
  /** Internal marker for catalog fixtures inserted by the optional seed script. */
  isSample?: boolean;
  license?: string;
  compatibility?: string[];
  requestedPermissions?: string[];
  inputs?: string;
  outputs?: string;
  dataHandling?: string;
  documentationUrl?: string;
  supportUrl?: string;
  githubUrl?: string;
}

// Re-export the Better Auth tables so a single `schema` module holds everything
// (the drizzle client and drizzle-kit both point here).
export * from "./auth-schema";

/* ---------------------------------------------------------------- enums -- */

export const skillStatus = pgEnum("skill_status", [
  "draft",
  "published",
  "blocked",
]);

export const trustTier = pgEnum("trust_tier", [
  "verified_safe",
  "caution",
  "blocked",
  "pending",
]);

export const skillSource = pgEnum("skill_source", ["upload", "github"]);

export const scanStatus = pgEnum("scan_status", ["completed", "failed"]);

export const scanLayer = pgEnum("scan_layer", [
  "hidden_text",
  "dangerous_pattern",
  "script_analysis",
  "llm_injection",
]);

export const findingSeverity = pgEnum("finding_severity", [
  "info",
  "low",
  "medium",
  "high",
  "critical",
]);

export const findingSource = pgEnum("finding_source", ["deterministic", "llm"]);

/* --------------------------------------------------------------- tables -- */

export const skill = pgTable("skill", {
  id: text("id").primaryKey(),
  slug: text("slug").notNull().unique(),
  authorId: text("author_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  // The always-loaded frontmatter description — the highest-value attack
  // surface, which is why we scan and display it prominently.
  description: text("description").notNull(),
  summary: text("summary"),
  category: text("category").notNull().default("Other"),
  subcategory: text("subcategory"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  metadata: jsonb("metadata").$type<SkillMetadata>().notNull().default({}),
  status: skillStatus("status").notNull().default("draft"),
  latestTrustTier: trustTier("latest_trust_tier").notNull().default("pending"),
  // The published version. Blocked versions are persisted but never set here.
  currentVersionId: text("current_version_id"),
  source: skillSource("source").notNull().default("upload"),
  sourceUrl: text("source_url"),
  downloadCount: integer("download_count").notNull().default(0),
  // Payments seam (unused in v1 / free beta).
  priceCents: integer("price_cents"),
  isPaid: boolean("is_paid").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const skillVersion = pgTable(
  "skill_version",
  {
    id: text("id").primaryKey(),
    skillId: text("skill_id")
      .notNull()
      .references(() => skill.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    versionLabel: text("version_label").notNull().default("1.0.0"),
    // sha256 of the canonical bundle — immutable version identity.
    contentHash: text("content_hash").notNull(),
    frontmatterName: text("frontmatter_name").notNull(),
    frontmatterDescription: text("frontmatter_description").notNull(),
    skillMdBody: text("skill_md_body").notNull(),
    trustTier: trustTier("trust_tier").notNull().default("pending"),
    riskScore: integer("risk_score").notNull().default(0),
    scannerVersion: text("scanner_version").notNull(),
    scanResultId: text("scan_result_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("skill_version_skill_label_idx").on(t.skillId, t.versionLabel),
    uniqueIndex("skill_version_skill_version_idx").on(t.skillId, t.version),
  ],
);

export const skillFile = pgTable("skill_file", {
  id: text("id").primaryKey(),
  skillVersionId: text("skill_version_id")
    .notNull()
    .references(() => skillVersion.id, { onDelete: "cascade" }),
  path: text("path").notNull(),
  // File body. base64 for binary; UTF-8 text otherwise.
  content: text("content").notNull(),
  contentType: text("content_type").notNull().default("text/markdown"),
  sizeBytes: integer("size_bytes").notNull().default(0),
  sha256: text("sha256").notNull(),
  isExecutable: boolean("is_executable").notNull().default(false),
  // R2 seam: when object storage lands, content moves out and this points to it.
  storageKey: text("storage_key"),
});

export const scanResult = pgTable("scan_result", {
  id: text("id").primaryKey(),
  skillVersionId: text("skill_version_id")
    .notNull()
    .references(() => skillVersion.id, { onDelete: "cascade" }),
  overallRiskScore: integer("overall_risk_score").notNull().default(0),
  trustTier: trustTier("trust_tier").notNull().default("pending"),
  scannerVersion: text("scanner_version").notNull(),
  classifierModel: text("classifier_model"),
  status: scanStatus("status").notNull().default("completed"),
  startedAt: timestamp("started_at").notNull().defaultNow(),
  finishedAt: timestamp("finished_at"),
  durationMs: integer("duration_ms"),
  // { critical, high, medium, low, info } severity counts.
  summary: jsonb("summary"),
  // Per-layer status: { hidden_text: "ok", llm_injection: "error", ... }.
  layerStatus: jsonb("layer_status"),
});

export const finding = pgTable("finding", {
  id: text("id").primaryKey(),
  scanResultId: text("scan_result_id")
    .notNull()
    .references(() => scanResult.id, { onDelete: "cascade" }),
  layer: scanLayer("layer").notNull(),
  severity: findingSeverity("severity").notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  // null => the finding is in the SKILL.md description/body itself.
  filePath: text("file_path"),
  location: jsonb("location"),
  // Matched snippet OR the DECODED hidden payload — the headline evidence.
  evidence: text("evidence"),
  confidence: real("confidence"),
  source: findingSource("source").notNull().default("deterministic"),
});

/* ------------------------------------------------------------ relations -- */

export const skillRelations = relations(skill, ({ one, many }) => ({
  author: one(user, {
    fields: [skill.authorId],
    references: [user.id],
  }),
  versions: many(skillVersion),
  currentVersion: one(skillVersion, {
    fields: [skill.currentVersionId],
    references: [skillVersion.id],
  }),
}));

export const skillVersionRelations = relations(
  skillVersion,
  ({ one, many }) => ({
    skill: one(skill, {
      fields: [skillVersion.skillId],
      references: [skill.id],
    }),
    files: many(skillFile),
    scanResult: one(scanResult, {
      fields: [skillVersion.scanResultId],
      references: [scanResult.id],
    }),
  }),
);

export const skillFileRelations = relations(skillFile, ({ one }) => ({
  version: one(skillVersion, {
    fields: [skillFile.skillVersionId],
    references: [skillVersion.id],
  }),
}));

export const scanResultRelations = relations(scanResult, ({ one, many }) => ({
  version: one(skillVersion, {
    fields: [scanResult.skillVersionId],
    references: [skillVersion.id],
  }),
  findings: many(finding),
}));

export const findingRelations = relations(finding, ({ one }) => ({
  scanResult: one(scanResult, {
    fields: [finding.scanResultId],
    references: [scanResult.id],
  }),
}));

/* ---------------------------------------------------------------- types -- */

export type Skill = typeof skill.$inferSelect;
export type NewSkill = typeof skill.$inferInsert;
export type SkillVersion = typeof skillVersion.$inferSelect;
export type SkillFile = typeof skillFile.$inferSelect;
export type ScanResultRow = typeof scanResult.$inferSelect;
export type Finding = typeof finding.$inferSelect;

export interface ListingSnapshot {
  name: string;
  description: string;
  summary: string;
  category: string;
  subcategory: string;
  tags: string[];
  metadata: SkillMetadata;
  source: "upload" | "github";
  sourceUrl?: string;
}

// Administrator privileges are provisioned by the operator, never at sign-up.
export const marketplaceAdmin = pgTable("marketplace_admin", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Bearer invitations are stored only as hashes and can be redeemed once.
export const marketplaceAdminInvite = pgTable("marketplace_admin_invite", {
  tokenHash: text("token_hash").primaryKey(),
  createdBy: text("created_by")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  usedAt: timestamp("used_at"),
  usedBy: text("used_by").references(() => user.id, { onDelete: "set null" }),
});

export const skillSubmission = pgTable("skill_submission", {
  id: text("id").primaryKey(),
  skillId: text("skill_id")
    .notNull()
    .references(() => skill.id, { onDelete: "cascade" }),
  versionId: text("version_id")
    .notNull()
    .unique()
    .references(() => skillVersion.id, { onDelete: "cascade" }),
  snapshot: jsonb("snapshot").$type<ListingSnapshot>().notNull(),
  status: text("status")
    .$type<
      "pending" | "approved" | "changes_requested" | "rejected" | "blocked"
    >()
    .notNull()
    .default("pending"),
  reviewerId: text("reviewer_id").references(() => user.id, {
    onDelete: "set null",
  }),
  reviewNote: text("review_note"),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const reviewEvent = pgTable("review_event", {
  id: text("id").primaryKey(),
  actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
  skillId: text("skill_id").references(() => skill.id, {
    onDelete: "set null",
  }),
  action: text("action").notNull(),
  note: text("note").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (table) => [
  index("review_event_created_at_idx").on(table.createdAt),
  index("review_event_action_created_at_idx").on(table.action, table.createdAt),
]);

export const skillDownload = pgTable(
  "skill_download",
  {
    id: text("id").primaryKey(),
    skillId: text("skill_id")
      .notNull()
      .references(() => skill.id, { onDelete: "cascade" }),
    versionId: text("version_id")
      .notNull()
      .references(() => skillVersion.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("skill_download_user_version_idx").on(t.userId, t.versionId),
  ],
);

export const communityRating = pgTable(
  "community_rating",
  {
    id: text("id").primaryKey(),
    target: text("target").notNull(), // "marketplace" or a published skill id
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    stars: integer("stars").notNull(),
    comment: text("comment").notNull().default(""),
    hidden: boolean("hidden").notNull().default(false),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("community_rating_user_target_idx").on(t.userId, t.target),
  ],
);
