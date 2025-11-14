-- =====================================================
-- LearnerAI Database Schema Migration
-- File: init_schema_migration.sql
-- Description: Initial schema for LearnerAI platform
-- Compatible with: PostgreSQL / Supabase
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: companies
-- Description: Stores company information from Directory microservice
-- =====================================================
CREATE TABLE IF NOT EXISTS companies (
    company_id UUID PRIMARY KEY,
    company_name TEXT NOT NULL,
    decision_maker_policy TEXT NOT NULL CHECK (decision_maker_policy IN ('auto', 'manual')) DEFAULT 'auto',
    decision_maker JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- Table: learners
-- Description: Stores learner/user information
-- =====================================================
CREATE TABLE IF NOT EXISTS learners (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    company_name TEXT NOT NULL,
    user_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_learners_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);

-- =====================================================
-- Table: skills_gap
-- Description: Stores identified skills gaps for learners
-- =====================================================
CREATE TABLE IF NOT EXISTS skills_gap (
    gap_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_id UUID NOT NULL,
    company_name TEXT NOT NULL,
    user_name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    skills_raw_data JSONB NOT NULL,
    exam_status TEXT CHECK (exam_status IN ('pass', 'fail')),
    competency_target_name TEXT NOT NULL,
    CONSTRAINT fk_skills_gap_user FOREIGN KEY (user_id) REFERENCES learners(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_skills_gap_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
);

-- =====================================================
-- Table: skills_expansions
-- Description: Stores AI expansion outputs from prompts
-- =====================================================
CREATE TABLE IF NOT EXISTS skills_expansions (
    expansion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    prompt_1_output JSONB,
    prompt_2_output JSONB
);

-- =====================================================
-- Table: courses
-- Description: Stores learning paths/courses for learners
-- =====================================================
CREATE TABLE IF NOT EXISTS courses (
    competency_target_name TEXT PRIMARY KEY NOT NULL,
    user_id UUID NOT NULL,
    learning_path JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    approved BOOLEAN DEFAULT FALSE NOT NULL,
    CONSTRAINT fk_courses_user FOREIGN KEY (user_id) REFERENCES learners(user_id) ON DELETE CASCADE
);

-- =====================================================
-- Table: recommendations
-- Description: Stores course recommendations for learners
-- =====================================================
CREATE TABLE IF NOT EXISTS recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    base_course_name TEXT NOT NULL,
    suggested_courses JSONB NOT NULL,
    sent_to_rag BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_recommendations_user FOREIGN KEY (user_id) REFERENCES learners(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_recommendations_course FOREIGN KEY (base_course_name) REFERENCES courses(competency_target_name) ON DELETE CASCADE
);

-- =====================================================
-- Table: jobs
-- Description: Stores background job processing status
-- =====================================================
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    company_id UUID,
    competency_target_name TEXT,
    type VARCHAR(100) NOT NULL CHECK (type IN ('path-generation', 'course-suggestion', 'path-distribution')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    current_stage VARCHAR(100),
    result JSONB,
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_jobs_user FOREIGN KEY (user_id) REFERENCES learners(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_jobs_competency FOREIGN KEY (competency_target_name) REFERENCES courses(competency_target_name) ON DELETE SET NULL
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Companies indexes
CREATE INDEX IF NOT EXISTS idx_companies_company_id ON companies(company_id);
CREATE INDEX IF NOT EXISTS idx_companies_decision_maker_policy ON companies(decision_maker_policy);

-- Learners indexes
CREATE INDEX IF NOT EXISTS idx_learners_company_id ON learners(company_id);
CREATE INDEX IF NOT EXISTS idx_learners_user_id ON learners(user_id);

-- Skills gap indexes
CREATE INDEX IF NOT EXISTS idx_skills_gap_user_id ON skills_gap(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_gap_company_id ON skills_gap(company_id);
CREATE INDEX IF NOT EXISTS idx_skills_gap_competency_target_name ON skills_gap(competency_target_name);
CREATE INDEX IF NOT EXISTS idx_skills_gap_exam_status ON skills_gap(exam_status);
CREATE INDEX IF NOT EXISTS idx_skills_gap_skills_data ON skills_gap USING GIN(skills_raw_data);

-- Courses indexes
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_competency_target_name ON courses(competency_target_name);
CREATE INDEX IF NOT EXISTS idx_courses_approved ON courses(approved);
CREATE INDEX IF NOT EXISTS idx_courses_learning_path ON courses USING GIN(learning_path);

-- Recommendations indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_base_course_name ON recommendations(base_course_name);
CREATE INDEX IF NOT EXISTS idx_recommendations_sent_to_rag ON recommendations(sent_to_rag);
CREATE INDEX IF NOT EXISTS idx_recommendations_suggested_courses ON recommendations USING GIN(suggested_courses);

    -- Jobs indexes
    CREATE INDEX IF NOT EXISTS idx_jobs_id ON jobs(id);
    CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
    CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
    CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON jobs(user_id, status);
    CREATE INDEX IF NOT EXISTS idx_jobs_type_status ON jobs(type, status);
    CREATE INDEX IF NOT EXISTS idx_jobs_competency_target_name ON jobs(competency_target_name);

-- =====================================================
-- Trigger Function: Update last_modified_at
-- Description: Automatically updates last_modified_at on row update
-- =====================================================
CREATE OR REPLACE FUNCTION update_last_modified_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_modified_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Trigger Function: Update updated_at (for jobs table)
-- Description: Automatically updates updated_at on row update
-- =====================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- Apply Triggers
-- =====================================================

-- Drop triggers if they exist first (idempotent)
DROP TRIGGER IF EXISTS trigger_companies_last_modified ON companies;
CREATE TRIGGER trigger_companies_last_modified
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified_at();

DROP TRIGGER IF EXISTS trigger_learners_last_modified ON learners;
CREATE TRIGGER trigger_learners_last_modified
    BEFORE UPDATE ON learners
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified_at();

DROP TRIGGER IF EXISTS trigger_skills_gap_last_modified ON skills_gap;
CREATE TRIGGER trigger_skills_gap_last_modified
    BEFORE UPDATE ON skills_gap
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified_at();

DROP TRIGGER IF EXISTS trigger_skills_expansions_last_modified ON skills_expansions;
CREATE TRIGGER trigger_skills_expansions_last_modified
    BEFORE UPDATE ON skills_expansions
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified_at();

DROP TRIGGER IF EXISTS trigger_courses_last_modified ON courses;
CREATE TRIGGER trigger_courses_last_modified
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified_at();

DROP TRIGGER IF EXISTS trigger_recommendations_last_modified ON recommendations;
CREATE TRIGGER trigger_recommendations_last_modified
    BEFORE UPDATE ON recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified_at();

DROP TRIGGER IF EXISTS trigger_jobs_updated_at ON jobs;
CREATE TRIGGER trigger_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Migration Complete
-- =====================================================
-- Run this file in Supabase SQL Editor to create the schema
-- All tables, indexes, constraints, and triggers are now set up
--
-- Tables created:
-- 1. companies - Company information from Directory
-- 2. learners - User/learner information
-- 3. skills_gap - Skills gaps data (skills_raw_data JSONB)
-- 4. skills_expansions - AI expansion outputs
-- 5. courses - Learning paths/courses (competency_target_name as primary key)
-- 6. recommendations - Course recommendations
-- 7. jobs - Background job processing status
--
-- Total: 7 tables

