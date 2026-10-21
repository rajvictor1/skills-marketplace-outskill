begin;
create schema if not exists recipe_private;
revoke all on schema recipe_private from public, anon, authenticated;

create table recipe_private.package_versions (
  id uuid primary key default gen_random_uuid(),
  recipe_id text not null check (recipe_id ~ '^[a-z0-9][a-z0-9._-]{0,159}$'),
  version text not null check (length(version) <= 80),
  owner_id text not null,
  identity_provider text not null default 'better_auth' check (identity_provider = 'better_auth'),
  manifest_path text not null,
  package_hash text not null check (package_hash ~ '^[a-f0-9]{64}$'),
  payload jsonb not null check (jsonb_typeof(payload) = 'object' and octet_length(payload::text) <= 2097152),
  inspection jsonb not null check (jsonb_typeof(inspection) = 'object'),
  created_at timestamptz not null default now(),
  unique (recipe_id, version)
);
create table recipe_private.package_reviews (
  version_id uuid primary key references recipe_private.package_versions(id),
  status text not null default 'draft' check (status in ('draft', 'pending_review', 'approved', 'rejected')),
  reviewer_id text,
  review_note text not null default '' check (length(review_note) <= 2000),
  updated_at timestamptz not null default now()
);
create table recipe_private.review_events (
  id uuid primary key default gen_random_uuid(),
  version_id uuid not null references recipe_private.package_versions(id),
  actor_id text not null,
  action text not null check (action in ('saved', 'submitted', 'approved', 'rejected')),
  note text not null default '' check (length(note) <= 2000),
  created_at timestamptz not null default now()
);
create index recipe_versions_owner_created_idx on recipe_private.package_versions(owner_id, created_at desc);
create index recipe_review_status_idx on recipe_private.package_reviews(status, updated_at desc);
create index recipe_review_events_version_idx on recipe_private.review_events(version_id, created_at);
alter table recipe_private.package_versions enable row level security;
alter table recipe_private.package_reviews enable row level security;
alter table recipe_private.review_events enable row level security;
revoke all on all tables in schema recipe_private from public, anon, authenticated;
-- This schema is server-only and is not added to PostgREST's exposed schemas.
-- Application requests must pass the existing server-side administrator checks.
-- Better Auth IDs remain opaque strings; they are not presented as Supabase auth.uid().
create function recipe_private.reject_immutable_change() returns trigger
language plpgsql security invoker set search_path = pg_catalog as $$
begin
  raise exception 'Saved recipe versions and review events are immutable. Submit a new version.';
end;
$$;
revoke all on function recipe_private.reject_immutable_change() from public, anon, authenticated;
create trigger recipe_version_immutable before update or delete on recipe_private.package_versions
for each row execute function recipe_private.reject_immutable_change();
create trigger recipe_review_event_immutable before update or delete on recipe_private.review_events
for each row execute function recipe_private.reject_immutable_change();
commit;
