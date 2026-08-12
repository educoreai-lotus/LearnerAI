-- =====================================================
-- LearnerAI Phase A — additive course_id identity
-- File: phase_a_add_course_id.sql
-- Status: REVIEW ONLY — DO NOT AUTO-RUN
--
-- Adds an internal UUID identity (course_id) beside the
-- existing competency_target_name PRIMARY KEY.
--
-- MUST remain compatible with the currently deployed app:
--   - competency_target_name stays PRIMARY KEY
--   - existing FKs stay in place
--   - new course inserts that omit course_id still succeed
--     (DEFAULT gen_random_uuid())
--   - new approval / recommendation inserts that omit
--     course_id still succeed (new columns are nullable)
--
-- This file contains NO DELETE, TRUNCATE, DROP TABLE,
-- DROP COLUMN, or table rebuild.
-- =====================================================

BEGIN;

-- -----------------------------------------------------
-- 1. courses.course_id
-- -----------------------------------------------------

ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS course_id UUID;

-- Preserve last_modified_at: the existing BEFORE UPDATE
-- trigger would otherwise stamp NOW() during backfill.
ALTER TABLE courses DISABLE TRIGGER trigger_courses_last_modified;

UPDATE courses
SET course_id = gen_random_uuid()
WHERE course_id IS NULL;

ALTER TABLE courses ENABLE TRIGGER trigger_courses_last_modified;

-- Required so current app INSERT/UPSERT (which do not send
-- course_id) continue to succeed after NOT NULL is applied.
ALTER TABLE courses
    ALTER COLUMN course_id SET DEFAULT gen_random_uuid();

ALTER TABLE courses
    ALTER COLUMN course_id SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'courses_course_id_unique'
          AND conrelid = 'courses'::regclass
    ) THEN
        ALTER TABLE courses
            ADD CONSTRAINT courses_course_id_unique UNIQUE (course_id);
    END IF;
END
$$;

-- -----------------------------------------------------
-- 2. path_approvals.course_id (nullable; old FK kept)
-- Existing reference: learning_path_id -> courses.competency_target_name
-- -----------------------------------------------------

ALTER TABLE path_approvals
    ADD COLUMN IF NOT EXISTS course_id UUID;

ALTER TABLE path_approvals DISABLE TRIGGER trigger_path_approvals_updated_at;

UPDATE path_approvals AS pa
SET course_id = c.course_id
FROM courses AS c
WHERE pa.course_id IS NULL
  AND pa.learning_path_id = c.competency_target_name;

ALTER TABLE path_approvals ENABLE TRIGGER trigger_path_approvals_updated_at;

CREATE INDEX IF NOT EXISTS idx_path_approvals_course_id
    ON path_approvals (course_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_path_approvals_course_id'
          AND conrelid = 'path_approvals'::regclass
    ) THEN
        ALTER TABLE path_approvals
            ADD CONSTRAINT fk_path_approvals_course_id
            FOREIGN KEY (course_id)
            REFERENCES courses (course_id)
            ON DELETE CASCADE;
    END IF;
END
$$;

-- -----------------------------------------------------
-- 3. recommendations.course_id (nullable; old FK kept)
-- Existing reference: base_course_name -> courses.competency_target_name
-- -----------------------------------------------------

ALTER TABLE recommendations
    ADD COLUMN IF NOT EXISTS course_id UUID;

ALTER TABLE recommendations DISABLE TRIGGER trigger_recommendations_last_modified;

UPDATE recommendations AS r
SET course_id = c.course_id
FROM courses AS c
WHERE r.course_id IS NULL
  AND r.base_course_name = c.competency_target_name;

ALTER TABLE recommendations ENABLE TRIGGER trigger_recommendations_last_modified;

CREATE INDEX IF NOT EXISTS idx_recommendations_course_id
    ON recommendations (course_id);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'fk_recommendations_course_id'
          AND conrelid = 'recommendations'::regclass
    ) THEN
        ALTER TABLE recommendations
            ADD CONSTRAINT fk_recommendations_course_id
            FOREIGN KEY (course_id)
            REFERENCES courses (course_id)
            ON DELETE CASCADE;
    END IF;
END
$$;

COMMIT;
