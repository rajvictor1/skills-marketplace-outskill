-- Keep administrator review and recipe inspection history for 12 months.
-- Indexes are also represented in the Drizzle schema for local Postgres installs.
create index if not exists review_event_created_at_idx
  on public.review_event (created_at);
create index if not exists review_event_action_created_at_idx
  on public.review_event (action, created_at);

-- Supabase Cron (pg_cron) runs this once a day at 03:00 UTC. Re-scheduling
-- with the same name updates the existing job instead of creating duplicates.
create extension if not exists pg_cron with schema pg_catalog;
select cron.schedule(
  'skillbuffet-review-event-retention',
  '0 3 * * *',
  $$delete from public.review_event where created_at < now() - interval '12 months'$$
);
