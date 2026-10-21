CREATE TABLE "marketplace_admin_invite" (
  "token_hash" text PRIMARY KEY NOT NULL,
  "created_by" text NOT NULL REFERENCES "public"."user"("id") ON DELETE cascade,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "expires_at" timestamp NOT NULL,
  "used_at" timestamp,
  "used_by" text REFERENCES "public"."user"("id") ON DELETE set null
);
