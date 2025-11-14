-- =====================================================
-- Drop All Tables and Related Objects
-- File: drop_all_tables.sql
-- Description: Safely drops all tables, triggers, functions, and related objects
-- Compatible with: PostgreSQL / Supabase
-- 
-- WARNING: This will delete ALL data and schema objects!
-- Use this before running init_schema_migration.sql to start fresh
-- =====================================================

-- =====================================================
-- Step 1: Drop All Triggers
-- =====================================================

DROP TRIGGER IF EXISTS trigger_companies_last_modified ON companies;
DROP TRIGGER IF EXISTS trigger_learners_last_modified ON learners;
DROP TRIGGER IF EXISTS trigger_skills_gap_last_modified ON skills_gap;
DROP TRIGGER IF EXISTS trigger_skills_expansions_last_modified ON skills_expansions;
DROP TRIGGER IF EXISTS trigger_courses_last_modified ON courses;
DROP TRIGGER IF EXISTS trigger_recommendations_last_modified ON recommendations;
DROP TRIGGER IF EXISTS trigger_jobs_updated_at ON jobs;

-- =====================================================
-- Step 2: Drop All Tables (in reverse dependency order)
-- =====================================================

-- Drop tables that have foreign keys first (child tables)
DROP TABLE IF EXISTS recommendations CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS skills_expansions CASCADE;
DROP TABLE IF EXISTS skills_gap CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;
DROP TABLE IF EXISTS learners CASCADE;

-- Drop parent tables last
DROP TABLE IF EXISTS companies CASCADE;

-- =====================================================
-- Step 3: Drop All Functions
-- =====================================================

DROP FUNCTION IF EXISTS update_last_modified_at() CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- =====================================================
-- Step 4: Drop All Sequences (if any were created explicitly)
-- =====================================================

-- Note: Sequences are usually auto-created with SERIAL/BIGSERIAL columns
-- They will be dropped automatically when tables are dropped
-- But we can explicitly drop them if needed:
-- DROP SEQUENCE IF EXISTS <sequence_name> CASCADE;

-- =====================================================
-- Step 5: Drop All Views (if any exist)
-- =====================================================

-- Add any views here if they exist
-- DROP VIEW IF EXISTS <view_name> CASCADE;

-- =====================================================
-- Step 6: Drop All Indexes (if any were created explicitly)
-- =====================================================

-- Note: Indexes are usually dropped automatically with tables
-- But we can explicitly drop them if needed:
-- DROP INDEX IF EXISTS <index_name> CASCADE;

-- =====================================================
-- Step 7: Drop Extensions (optional - usually keep these)
-- =====================================================

-- Uncomment if you want to remove UUID extension
-- DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

-- =====================================================
-- Verification: List remaining tables
-- =====================================================

-- Uncomment to verify all tables are dropped:
-- SELECT table_name 
-- FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- AND table_type = 'BASE TABLE'
-- ORDER BY table_name;

-- =====================================================
-- Drop Complete
-- =====================================================
-- All tables, triggers, functions, and related objects have been dropped
-- You can now run init_schema_migration.sql to create a fresh schema
-- =====================================================

