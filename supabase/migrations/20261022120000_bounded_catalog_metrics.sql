CREATE TABLE IF NOT EXISTS marketplace_counter (
  key text PRIMARY KEY,
  value integer NOT NULL DEFAULT 0,
  updated_at timestamp NOT NULL DEFAULT now()
);
ALTER TABLE marketplace_counter ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON marketplace_counter FROM PUBLIC, anon, authenticated;

CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS skill_published_catalog_idx
  ON skill (status, category, subcategory, updated_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS skill_published_popular_idx
  ON skill (status, download_count DESC, updated_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS skill_author_created_idx
  ON skill (author_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS skill_submission_skill_created_idx
  ON skill_submission (skill_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS skill_submission_status_created_idx
  ON skill_submission (status, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS skill_file_version_idx ON skill_file (skill_version_id);
CREATE INDEX IF NOT EXISTS finding_scan_result_idx ON finding (scan_result_id);
CREATE INDEX IF NOT EXISTS user_created_id_idx ON "user" (created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS user_name_search_idx ON "user" USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS user_email_search_idx ON "user" USING gin (email gin_trgm_ops);
CREATE INDEX IF NOT EXISTS skill_name_search_idx ON skill USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS skill_description_search_idx ON skill USING gin (description gin_trgm_ops);
CREATE INDEX IF NOT EXISTS skill_summary_search_idx ON skill USING gin (summary gin_trgm_ops);
CREATE INDEX IF NOT EXISTS skill_tags_search_idx ON skill USING gin ((tags::text) gin_trgm_ops);
CREATE INDEX IF NOT EXISTS recipe_versions_created_idx
  ON recipe_private.package_versions (created_at DESC, id DESC);

INSERT INTO marketplace_counter (key, value) VALUES
  ('published_skills', (SELECT count(*)::integer FROM skill WHERE status = 'published')),
  ('published_downloads', (SELECT coalesce(sum(download_count), 0)::integer FROM skill WHERE status = 'published')),
  ('users', (SELECT count(*)::integer FROM "user")),
  ('pending_submissions', (SELECT count(*)::integer FROM skill_submission WHERE status = 'pending')),
  ('blocked_submissions', (SELECT count(*)::integer FROM skill_submission WHERE status = 'blocked'))
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now();

CREATE OR REPLACE FUNCTION sb_adjust_marketplace_counter(counter_key text, delta integer)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO marketplace_counter (key, value, updated_at)
  VALUES (counter_key, greatest(delta, 0), now())
  ON CONFLICT (key) DO UPDATE
    SET value = greatest(0, marketplace_counter.value + delta), updated_at = now();
$$;
REVOKE ALL ON FUNCTION sb_adjust_marketplace_counter(text, integer) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION sb_track_skill_counters()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  old_published boolean := false;
  new_published boolean := false;
  old_downloads integer := 0;
  new_downloads integer := 0;
BEGIN
  IF TG_OP <> 'INSERT' THEN
    old_published := OLD.status = 'published';
    old_downloads := OLD.download_count;
  END IF;
  IF TG_OP <> 'DELETE' THEN
    new_published := NEW.status = 'published';
    new_downloads := NEW.download_count;
  END IF;
  IF old_published IS DISTINCT FROM new_published THEN
    PERFORM sb_adjust_marketplace_counter('published_skills', CASE WHEN new_published THEN 1 ELSE -1 END);
  END IF;
  IF old_published OR new_published THEN
    PERFORM sb_adjust_marketplace_counter(
      'published_downloads',
      CASE
        WHEN old_published AND new_published THEN new_downloads - old_downloads
        WHEN new_published THEN new_downloads
        ELSE -old_downloads
      END
    );
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION sb_track_skill_counters() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION sb_track_submission_counters()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  old_status text;
  new_status text;
BEGIN
  IF TG_OP <> 'INSERT' THEN old_status := OLD.status; END IF;
  IF TG_OP <> 'DELETE' THEN new_status := NEW.status; END IF;
  IF old_status IS DISTINCT FROM new_status THEN
    IF old_status = 'pending' THEN PERFORM sb_adjust_marketplace_counter('pending_submissions', -1); END IF;
    IF new_status = 'pending' THEN PERFORM sb_adjust_marketplace_counter('pending_submissions', 1); END IF;
    IF old_status = 'blocked' THEN PERFORM sb_adjust_marketplace_counter('blocked_submissions', -1); END IF;
    IF new_status = 'blocked' THEN PERFORM sb_adjust_marketplace_counter('blocked_submissions', 1); END IF;
  END IF;
  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION sb_track_submission_counters() FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION sb_track_user_counter()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM sb_adjust_marketplace_counter('users', 1);
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    PERFORM sb_adjust_marketplace_counter('users', -1);
    RETURN OLD;
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION sb_track_user_counter() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS skill_marketplace_counter_trigger ON skill;
CREATE TRIGGER skill_marketplace_counter_trigger
  AFTER INSERT OR UPDATE OF status, download_count OR DELETE ON skill
  FOR EACH ROW EXECUTE FUNCTION sb_track_skill_counters();
DROP TRIGGER IF EXISTS submission_marketplace_counter_trigger ON skill_submission;
CREATE TRIGGER submission_marketplace_counter_trigger
  AFTER INSERT OR UPDATE OF status OR DELETE ON skill_submission
  FOR EACH ROW EXECUTE FUNCTION sb_track_submission_counters();
DROP TRIGGER IF EXISTS user_marketplace_counter_trigger ON "user";
CREATE TRIGGER user_marketplace_counter_trigger
  AFTER INSERT OR DELETE ON "user"
  FOR EACH ROW EXECUTE FUNCTION sb_track_user_counter();
