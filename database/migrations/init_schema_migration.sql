-- =====================================================
-- LearnerAI Database Schema Migration
-- File: init_schema_migration.sql
-- Description: Initial schema for LearnerAI platform
-- Compatible with: PostgreSQL / Supabase
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- Table: learners
-- Description: Stores learner/user information
-- =====================================================
CREATE TABLE IF NOT EXISTS learners (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL,
    company_name TEXT NOT NULL,
    user_name TEXT NOT NULL,
    decision_maker_policy TEXT NOT NULL CHECK (decision_maker_policy IN ('auto', 'manual')),
    decision_maker_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- =====================================================
-- Table: courses
-- Description: Stores learning paths/courses for learners
-- =====================================================
CREATE TABLE IF NOT EXISTS courses (
    course_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    learning_path JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    approved BOOLEAN DEFAULT FALSE NOT NULL,
    CONSTRAINT fk_courses_user FOREIGN KEY (user_id) REFERENCES learners(user_id) ON DELETE CASCADE
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
    test_status TEXT CHECK (test_status IN ('pass', 'fail')),
    course_id UUID,
    decision_maker_id UUID,
    decision_maker_policy TEXT CHECK (decision_maker_policy IN ('auto', 'manual')),
    CONSTRAINT fk_skills_gap_user FOREIGN KEY (user_id) REFERENCES learners(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_skills_gap_course FOREIGN KEY (course_id) REFERENCES courses(course_id) ON DELETE SET NULL
);

-- =====================================================
-- Table: skills_expansions
-- Description: Stores AI-generated skill expansions
-- =====================================================
CREATE TABLE IF NOT EXISTS skills_expansions (
    expansion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    prompt_1_output JSONB,
    prompt_2_output JSONB
);

-- =====================================================
-- Table: recommendations
-- Description: Stores course recommendations for learners
-- =====================================================
CREATE TABLE IF NOT EXISTS recommendations (
    recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    base_course_id UUID,
    suggested_courses JSONB NOT NULL,
    sent_to_rag BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_recommendations_user FOREIGN KEY (user_id) REFERENCES learners(user_id) ON DELETE CASCADE,
    CONSTRAINT fk_recommendations_base_course FOREIGN KEY (base_course_id) REFERENCES courses(course_id) ON DELETE SET NULL
);

-- =====================================================
-- Indexes for Performance
-- =====================================================

-- Learners indexes
CREATE INDEX IF NOT EXISTS idx_learners_company_id ON learners(company_id);
CREATE INDEX IF NOT EXISTS idx_learners_decision_maker_id ON learners(decision_maker_id);

-- Skills gap indexes
CREATE INDEX IF NOT EXISTS idx_skills_gap_user_id ON skills_gap(user_id);
CREATE INDEX IF NOT EXISTS idx_skills_gap_company_id ON skills_gap(company_id);
CREATE INDEX IF NOT EXISTS idx_skills_gap_course_id ON skills_gap(course_id);
CREATE INDEX IF NOT EXISTS idx_skills_gap_test_status ON skills_gap(test_status);
CREATE INDEX IF NOT EXISTS idx_skills_gap_skills_data ON skills_gap USING GIN(skills_raw_data);

-- Courses indexes
CREATE INDEX IF NOT EXISTS idx_courses_user_id ON courses(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_approved ON courses(approved);
CREATE INDEX IF NOT EXISTS idx_courses_learning_path ON courses USING GIN(learning_path);

-- Recommendations indexes
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_base_course_id ON recommendations(base_course_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_sent_to_rag ON recommendations(sent_to_rag);
CREATE INDEX IF NOT EXISTS idx_recommendations_suggested_courses ON recommendations USING GIN(suggested_courses);

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

-- Apply trigger to all tables with last_modified_at
CREATE TRIGGER trigger_learners_last_modified
    BEFORE UPDATE ON learners
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified_at();

CREATE TRIGGER trigger_skills_gap_last_modified
    BEFORE UPDATE ON skills_gap
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified_at();

CREATE TRIGGER trigger_skills_expansions_last_modified
    BEFORE UPDATE ON skills_expansions
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified_at();

CREATE TRIGGER trigger_courses_last_modified
    BEFORE UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified_at();

CREATE TRIGGER trigger_recommendations_last_modified
    BEFORE UPDATE ON recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_last_modified_at();

-- =====================================================
-- Migration Complete
-- =====================================================
-- Run this file in Supabase SQL Editor to create the schema
-- All tables, indexes, constraints, and triggers are now set up

