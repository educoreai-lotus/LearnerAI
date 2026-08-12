-- =====================================================
-- LearnerAI Stage 2A — additive UNIQUE(user_id, competency_target_name)
-- File: stage_2a_add_user_target_unique.sql
-- Status: REVIEW ONLY — DO NOT AUTO-RUN
--
-- Deploy STEP 1 of Stage 2 (manual, before Stage 2 app deploy).
-- Compatible with currently deployed Stage 1 app:
--   - competency_target_name stays PRIMARY KEY
--   - existing FKs stay in place
--   - save still uses onConflict competency_target_name until app deploy
--
-- This file contains NO DELETE, TRUNCATE, DROP TABLE,
-- DROP COLUMN, DROP CONSTRAINT (except it adds one UNIQUE),
-- PK change, or data rewrite.
-- =====================================================
--
-- READ-ONLY PRE-CHECK (run before this file):
--
-- SELECT user_id, competency_target_name, count(*) AS row_count
-- FROM courses
-- GROUP BY user_id, competency_target_name
-- HAVING count(*) > 1;
--
-- Expected: 0 rows. If any row is returned, do NOT run this migration.
-- =====================================================

BEGIN;

DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM courses
        GROUP BY user_id, competency_target_name
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Stage 2A aborted: duplicate (user_id, competency_target_name) rows exist';
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'courses_user_id_competency_target_name_unique'
          AND conrelid = 'courses'::regclass
    ) THEN
        ALTER TABLE courses
            ADD CONSTRAINT courses_user_id_competency_target_name_unique
            UNIQUE (user_id, competency_target_name);
    END IF;
END
$$;

COMMIT;
