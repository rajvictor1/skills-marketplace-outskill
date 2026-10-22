CREATE TABLE "community_rating" (
	"id" text PRIMARY KEY NOT NULL,
	"target" text NOT NULL,
	"user_id" text NOT NULL,
	"stars" integer NOT NULL,
	"comment" text DEFAULT '' NOT NULL,
	"hidden" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_admin" (
	"user_id" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_event" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text,
	"skill_id" text,
	"action" text NOT NULL,
	"note" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_download" (
	"id" text PRIMARY KEY NOT NULL,
	"skill_id" text NOT NULL,
	"version_id" text NOT NULL,
	"user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "skill_submission" (
	"id" text PRIMARY KEY NOT NULL,
	"skill_id" text NOT NULL,
	"version_id" text NOT NULL,
	"snapshot" jsonb NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"reviewer_id" text,
	"review_note" text,
	"reviewed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "skill_submission_version_id_unique" UNIQUE("version_id")
);
--> statement-breakpoint
DROP INDEX "skill_version_skill_hash_idx";--> statement-breakpoint
ALTER TABLE "community_rating" ADD CONSTRAINT "community_rating_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_admin" ADD CONSTRAINT "marketplace_admin_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_event" ADD CONSTRAINT "review_event_actor_id_user_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_event" ADD CONSTRAINT "review_event_skill_id_skill_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skill"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_download" ADD CONSTRAINT "skill_download_skill_id_skill_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_download" ADD CONSTRAINT "skill_download_version_id_skill_version_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."skill_version"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_download" ADD CONSTRAINT "skill_download_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_submission" ADD CONSTRAINT "skill_submission_skill_id_skill_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skill"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_submission" ADD CONSTRAINT "skill_submission_version_id_skill_version_id_fk" FOREIGN KEY ("version_id") REFERENCES "public"."skill_version"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_submission" ADD CONSTRAINT "skill_submission_reviewer_id_user_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "community_rating_user_target_idx" ON "community_rating" USING btree ("user_id","target");--> statement-breakpoint
CREATE UNIQUE INDEX "skill_download_user_version_idx" ON "skill_download" USING btree ("user_id","version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "skill_version_skill_label_idx" ON "skill_version" USING btree ("skill_id","version_label");
--> statement-breakpoint
ALTER TABLE community_rating ADD CONSTRAINT community_rating_stars_check CHECK (stars BETWEEN 1 AND 5);
--> statement-breakpoint
ALTER TABLE skill_submission ADD CONSTRAINT skill_submission_status_check CHECK (status IN ('pending','approved','changes_requested','rejected','blocked'));
--> statement-breakpoint
-- Remove only explicit fixtures. Creator uploads and curated workflow JSON are preserved.
DELETE FROM skill WHERE metadata->>'isSample' = 'true';
--> statement-breakpoint
-- Previously auto-published uploads must receive an explicit admin review.
INSERT INTO skill_submission (id, skill_id, version_id, snapshot, status)
SELECT 'legacy-review-' || v.id, s.id, v.id,
 jsonb_build_object('name',s.name,'description',s.description,'summary',COALESCE(s.summary,s.description),'category',s.category,'subcategory',COALESCE(s.subcategory,'General'),'tags',s.tags,'metadata',s.metadata,'source',s.source,'sourceUrl',s.source_url),
 CASE WHEN v.trust_tier = 'blocked' THEN 'blocked' ELSE 'pending' END
FROM skill s JOIN skill_version v ON v.skill_id = s.id
ON CONFLICT (version_id) DO NOTHING;
--> statement-breakpoint
INSERT INTO review_event (id, skill_id, action, note)
SELECT 'review-required-' || id, id, 'review_required', 'Existing auto-published skill moved to private admin review.' FROM skill WHERE status = 'published';
--> statement-breakpoint
UPDATE skill SET status = 'draft', current_version_id = NULL WHERE status = 'published';
