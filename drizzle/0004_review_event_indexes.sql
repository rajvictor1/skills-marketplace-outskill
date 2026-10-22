CREATE INDEX IF NOT EXISTS "review_event_created_at_idx" ON "review_event" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "review_event_action_created_at_idx" ON "review_event" USING btree ("action","created_at");
