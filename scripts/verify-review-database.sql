BEGIN;
-- All QA records are rolled back: no fake reviews or adoption counts survive.
INSERT INTO "user" (id,name,email) VALUES ('qa-review-owner','QA owner','qa-review-owner@example.invalid'),('qa-review-reader','QA reader','qa-review-reader@example.invalid');
INSERT INTO skill (id,slug,author_id,name,description,status) VALUES ('qa-review-skill','qa-review-skill','qa-review-owner','QA fixture','Temporary database contract test','draft');
INSERT INTO skill_version (id,skill_id,version,version_label,content_hash,frontmatter_name,frontmatter_description,skill_md_body,trust_tier,scanner_version) VALUES ('qa-review-version','qa-review-skill',1,'1.0.0','qa-hash','qa-review-skill','QA fixture','# QA fixture','verified_safe','qa-test');
INSERT INTO skill_submission (id,skill_id,version_id,snapshot,status) VALUES ('qa-review-submission','qa-review-skill','qa-review-version','{"name":"QA fixture","description":"QA fixture","summary":"Temporary test","category":"Research","subcategory":"Academic research","tags":[],"metadata":{},"source":"upload"}','pending');
DO $$ DECLARE first_count integer; second_count integer; BEGIN
  IF EXISTS (SELECT 1 FROM skill s JOIN skill_submission r ON r.version_id=s.current_version_id AND r.status='approved' WHERE s.id='qa-review-skill' AND s.status='published') THEN RAISE EXCEPTION 'Pending skill leaked'; END IF;
  UPDATE skill_submission SET status='approved', reviewed_at=now() WHERE id='qa-review-submission';
  UPDATE skill SET status='published', current_version_id='qa-review-version' WHERE id='qa-review-skill';
  IF NOT EXISTS (SELECT 1 FROM skill s JOIN skill_submission r ON r.version_id=s.current_version_id AND r.status='approved' WHERE s.id='qa-review-skill' AND s.status='published') THEN RAISE EXCEPTION 'Approved skill missing'; END IF;
  INSERT INTO skill_download(id,skill_id,version_id,user_id) VALUES ('qa-download-1','qa-review-skill','qa-review-version','qa-review-reader') ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS first_count=ROW_COUNT;
  INSERT INTO skill_download(id,skill_id,version_id,user_id) VALUES ('qa-download-2','qa-review-skill','qa-review-version','qa-review-reader') ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS second_count=ROW_COUNT;
  IF first_count<>1 OR second_count<>0 THEN RAISE EXCEPTION 'Duplicate download counted'; END IF;
  INSERT INTO community_rating(id,target,user_id,stars) VALUES ('qa-rating','qa-review-skill','qa-review-reader',4);
  BEGIN
    INSERT INTO community_rating(id,target,user_id,stars) VALUES ('qa-rating-duplicate','qa-review-skill','qa-review-reader',5);
    RAISE EXCEPTION 'Duplicate rating accepted';
  EXCEPTION WHEN unique_violation THEN NULL; END;
  BEGIN
    INSERT INTO community_rating(id,target,user_id,stars) VALUES ('qa-invalid-rating','marketplace','qa-review-reader',7);
    RAISE EXCEPTION 'Invalid rating accepted';
  EXCEPTION WHEN check_violation THEN NULL; END;
END $$;
SELECT 'PASS: pending privacy, approved visibility, unique downloads, unique ratings, star bounds' AS result;
ROLLBACK;
SELECT count(*) AS qa_records_remaining FROM skill WHERE id='qa-review-skill';
