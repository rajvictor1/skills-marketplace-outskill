begin;
create table recipe_private.package_listing_drafts (
  version_id uuid primary key references recipe_private.package_versions(id),
  title text not null check (length(title) between 3 and 100),
  summary text not null check (length(summary) between 10 and 500),
  category text not null check (length(category) between 2 and 100),
  subcategory text not null check (length(subcategory) between 2 and 100),
  updated_by text not null,
  updated_at timestamptz not null default now()
);
alter table recipe_private.package_listing_drafts enable row level security;
revoke all on recipe_private.package_listing_drafts from public, anon, authenticated;
-- Owner/team access is enforced by the authenticated server before any direct SQL.
-- No public catalog or runtime grant is created by this migration.
commit;
