-- =====================================================
-- LearnerAI Stage 2B — course identity cutover
-- File: stage_2b_course_identity_cutover.sql
-- Status: REVIEW ONLY — DO NOT AUTO-RUN
--
-- Deploy STEP 3 of Stage 2 (manual, AFTER Stage 2 app is live).
--
-- End state:
--   courses.course_id              = PRIMARY KEY
--   UNIQUE(user_id, competency_target_name) kept
--   courses_course_id_unique       KEPT (existing FKs depend on it)
--   legacy FKs on target name      DROPPED
--   path_approvals.learning_path_id  remains TEXT (not an FK)
--   recommendations.base_course_name remains TEXT (not an FK)
--
-- Collision guard in the app STILL blocks User B + same target.
--
-- This file contains NO DELETE, TRUNCATE, DROP TABLE,
-- DROP COLUMN, or learning_path rewrite.
-- =====================================================

BEGIN;

-- -----------------------------------------------------
-- 0. Fail-safe pre-checks
-- -----------------------------------------------------

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM courses WHERE course_id IS NULL) THEN
        RAISE EXCEPTION 'Stage 2B aborted: courses.course_id contains NULL';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM courses
        GROUP BY course_id
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION 'Stage 2B aborted: duplicate courses.course_id values exist';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM courses
        GROUP BY user_id, competency_target_name
        HAVING count(*) > 1
    ) THEN
        RAISE EXCEPTION
            'Stage 2B aborted: duplicate (user_id, competency_target_name) rows exist';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'courses_user_id_competency_target_name_unique'
          AND conrelid = 'courses'::regclass
    ) THEN
        RAISE EXCEPTION
            'Stage 2B aborted: UNIQUE(user_id, competency_target_name) is missing — run Stage 2A first';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'courses_course_id_unique'
          AND conrelid = 'courses'::regclass
    ) THEN
        RAISE EXCEPTION
            'Stage 2B aborted: courses_course_id_unique is missing — existing course_id FKs require it';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM path_approvals
        WHERE course_id IS NULL
    ) THEN
        RAISE EXCEPTION
            'Stage 2B aborted: path_approvals.course_id is NULL on one or more rows';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM path_approvals pa
        LEFT JOIN courses c ON c.course_id = pa.course_id
        WHERE c.course_id IS NULL
    ) THEN
        RAISE EXCEPTION
            'Stage 2B aborted: path_approvals.course_id has orphan values';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM recommendations
        WHERE course_id IS NULL
    ) THEN
        RAISE EXCEPTION
            'Stage 2B aborted: recommendations.course_id is NULL on one or more rows';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM recommendations r
        LEFT JOIN courses c ON c.course_id = r.course_id
        WHERE c.course_id IS NULL
    ) THEN
        RAISE EXCEPTION
            'Stage 2B aborted: recommendations.course_id has orphan values';
    END IF;
END
$$;

-- -----------------------------------------------------
-- 1. Drop legacy target-name FKs
--    (PostgreSQL FKs cannot remain after the target PK is dropped)
-- -----------------------------------------------------

ALTER TABLE path_approvals
    DROP CONSTRAINT IF EXISTS fk_path_approvals_learning_path;

ALTER TABLE recommendations
    DROP CONSTRAINT IF EXISTS fk_recommendations_course;

-- -----------------------------------------------------
-- 2. Drop PRIMARY KEY on competency_target_name
-- -----------------------------------------------------

DO $$
DECLARE
    pk_name text;
    pk_column text;
BEGIN
    SELECT c.conname, a.attname
    INTO pk_name, pk_column
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid
     AND a.attnum = c.conkey[1]
    WHERE c.conrelid = 'courses'::regclass
      AND c.contype = 'p';

    IF pk_name IS NULL THEN
        RAISE EXCEPTION 'Stage 2B aborted: courses has no primary key';
    END IF;

    IF pk_column <> 'competency_target_name' THEN
        RAISE EXCEPTION
            'Stage 2B aborted: current courses PK is % on %, expected competency_target_name',
            pk_name, pk_column;
    END IF;

    IF (
        SELECT array_length(c.conkey, 1)
        FROM pg_constraint c
        WHERE c.conrelid = 'courses'::regclass
          AND c.contype = 'p'
    ) <> 1 THEN
        RAISE EXCEPTION 'Stage 2B aborted: courses PK is composite, expected competency_target_name only';
    END IF;

    EXECUTE format('ALTER TABLE courses DROP CONSTRAINT %I', pk_name);
END
$$;

-- -----------------------------------------------------
-- 3. Make course_id the PRIMARY KEY
--    Keep courses_course_id_unique so existing FKs stay valid.
-- -----------------------------------------------------

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conrelid = 'courses'::regclass
          AND contype = 'p'
    ) THEN
        ALTER TABLE courses
            ADD CONSTRAINT courses_course_id_pkey
            PRIMARY KEY (course_id);
    END IF;
END
$$;

COMMIT;
