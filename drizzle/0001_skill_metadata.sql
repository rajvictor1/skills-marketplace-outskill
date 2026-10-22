ALTER TABLE "skill" ADD COLUMN "category" text DEFAULT 'Other' NOT NULL;--> statement-breakpoint
ALTER TABLE "skill" ADD COLUMN "subcategory" text;--> statement-breakpoint
ALTER TABLE "skill" ADD COLUMN "tags" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "skill" ADD COLUMN "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "skill_version" ADD COLUMN "version_label" text DEFAULT '1.0.0' NOT NULL;
--> statement-breakpoint
UPDATE "skill" SET "category" = CASE
  WHEN "slug" = 'month-end-close' THEN 'Finance & Accounting'
  WHEN "slug" IN ('seo-content-brief', 'growth-autopilot') THEN 'Marketing'
  ELSE 'Other'
END
WHERE "category" = 'Other';
--> statement-breakpoint
UPDATE "skill"
SET "metadata" = '{"isSample": true}'::jsonb, "download_count" = 0
WHERE "slug" IN ('month-end-close', 'seo-content-brief', 'growth-autopilot');
