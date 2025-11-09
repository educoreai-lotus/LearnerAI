-- LearnerAI Database Schema
-- Supabase PostgreSQL Database
-- Run this script in Supabase SQL Editor

-- ============================================
-- 1. Cache Skills Table
-- ============================================
-- Stores Micro/Nano Skill divisions for each learner
-- Updated whenever a new gap is received from Skills Engine
CREATE TABLE IF NOT EXISTS cache_skills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learner_id VARCHAR(255) NOT NULL,
    skill_id VARCHAR(255) NOT NULL,
    skill_type VARCHAR(50) NOT NULL CHECK (skill_type IN ('micro', 'nano')),
    competency_name TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    skill_description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(learner_id, skill_id, skill_type)
);

-- Indexes for cache_skills
CREATE INDEX IF NOT EXISTS idx_cache_skills_learner_id ON cache_skills(learner_id);
CREATE INDEX IF NOT EXISTS idx_cache_skills_skill_id ON cache_skills(skill_id);
CREATE INDEX IF NOT EXISTS idx_cache_skills_learner_skill ON cache_skills(learner_id, skill_id);

-- ============================================
-- 2. Learning Paths Table
-- ============================================
-- Stores generated learning paths with versioning and auditability
CREATE TABLE IF NOT EXISTS learning_paths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    company_id VARCHAR(255) NOT NULL,
    course_id VARCHAR(255),
    gap_id VARCHAR(255) NOT NULL,
    path_version INTEGER DEFAULT 1,
    path_data JSONB NOT NULL, -- Complete learning path structure
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'superseded')),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for learning_paths
CREATE INDEX IF NOT EXISTS idx_learning_paths_user_id ON learning_paths(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_company_id ON learning_paths(company_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_course_id ON learning_paths(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_user_company ON learning_paths(user_id, company_id);
CREATE INDEX IF NOT EXISTS idx_learning_paths_gap_id ON learning_paths(gap_id);

-- ============================================
-- 3. Jobs Table
-- ============================================
-- Tracks background job processing status for async operations
CREATE TABLE IF NOT EXISTS jobs (
    job_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    job_type VARCHAR(100) NOT NULL CHECK (job_type IN ('path_generation', 'course_suggestion', 'path_distribution')),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    input_data JSONB,
    output_data JSONB,
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    max_retries INTEGER DEFAULT 3,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for jobs
CREATE INDEX IF NOT EXISTS idx_jobs_job_id ON jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_user_status ON jobs(user_id, status);
CREATE INDEX IF NOT EXISTS idx_jobs_type_status ON jobs(job_type, status);

-- ============================================
-- 4. Course Suggestions Table
-- ============================================
-- Stores RAG-generated course suggestions after completion
CREATE TABLE IF NOT EXISTS course_suggestions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255) NOT NULL,
    completed_course_id VARCHAR(255) NOT NULL,
    suggestion_data JSONB NOT NULL, -- RAG-generated suggestions
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'viewed', 'accepted', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for course_suggestions
CREATE INDEX IF NOT EXISTS idx_course_suggestions_user_id ON course_suggestions(user_id);
CREATE INDEX IF NOT EXISTS idx_course_suggestions_course_id ON course_suggestions(completed_course_id);
CREATE INDEX IF NOT EXISTS idx_course_suggestions_status ON course_suggestions(status);

-- ============================================
-- 5. Prompt Registry Table
-- ============================================
-- Tracks which version of each prompt is currently active
CREATE TABLE IF NOT EXISTS prompt_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_name VARCHAR(100) NOT NULL UNIQUE,
    prompt_file_path TEXT NOT NULL,
    version VARCHAR(50) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for prompt_registry
CREATE INDEX IF NOT EXISTS idx_prompt_registry_name ON prompt_registry(prompt_name);
CREATE INDEX IF NOT EXISTS idx_prompt_registry_active ON prompt_registry(is_active);

-- ============================================
-- 6. Audit Log Table
-- ============================================
-- Tracks all changes to learning_paths and cache_skills for auditability
CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_data JSONB,
    new_data JSONB,
    changed_by VARCHAR(255), -- user_id or service name
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_table_record ON audit_log(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_changed_at ON audit_log(changed_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);

-- ============================================
-- 7. AI Execution Logs Table
-- ============================================
-- Tracks AI prompt executions for performance monitoring and cost tracking
CREATE TABLE IF NOT EXISTS ai_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    prompt_name VARCHAR(100) NOT NULL,
    prompt_version VARCHAR(50),
    user_id VARCHAR(255),
    job_id UUID REFERENCES jobs(job_id),
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER,
    execution_time_ms INTEGER,
    cost_usd DECIMAL(10, 6),
    status VARCHAR(50) NOT NULL CHECK (status IN ('success', 'failed', 'timeout')),
    error_message TEXT,
    response_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for ai_execution_logs
CREATE INDEX IF NOT EXISTS idx_ai_logs_prompt_name ON ai_execution_logs(prompt_name);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON ai_execution_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_job_id ON ai_execution_logs(job_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON ai_execution_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_logs_status ON ai_execution_logs(status);

-- ============================================
-- Triggers for Updated At
-- ============================================
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to cache_skills
CREATE TRIGGER update_cache_skills_updated_at
    BEFORE UPDATE ON cache_skills
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to learning_paths
CREATE TRIGGER update_learning_paths_updated_at
    BEFORE UPDATE ON learning_paths
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to jobs
CREATE TRIGGER update_jobs_updated_at
    BEFORE UPDATE ON jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to course_suggestions
CREATE TRIGGER update_course_suggestions_updated_at
    BEFORE UPDATE ON course_suggestions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to prompt_registry
CREATE TRIGGER update_prompt_registry_updated_at
    BEFORE UPDATE ON prompt_registry
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Initial Data: Prompt Registry
-- ============================================
-- Insert initial prompt registry entries
INSERT INTO prompt_registry (prompt_name, prompt_file_path, version, description, is_active)
VALUES
    ('skill_expansion', 'ai/prompts/prompt1-skill-expansion.txt', '1.0.0', 'Expands skills gap with additional competencies', true),
    ('competency_identification', 'ai/prompts/prompt2-competency-identification.txt', '1.0.0', 'Identifies and extracts expanded competencies', true),
    ('path_creation', 'ai/prompts/prompt3-path-creation.txt', '1.0.0', 'Creates detailed learning path from gap and expansion', true),
    ('course_suggestions', 'ai/prompts/prompt4-course-suggestions.txt', '1.0.0', 'Generates follow-up course suggestions after completion', true)
ON CONFLICT (prompt_name) DO NOTHING;

-- ============================================
-- Comments for Documentation
-- ============================================
COMMENT ON TABLE cache_skills IS 'Stores Micro/Nano Skill divisions for each learner. Updated whenever a new gap is received.';
COMMENT ON TABLE learning_paths IS 'Stores generated learning paths with versioning and auditability.';
COMMENT ON TABLE jobs IS 'Tracks background job processing status for async operations.';
COMMENT ON TABLE course_suggestions IS 'Stores RAG-generated course suggestions after completion.';
COMMENT ON TABLE prompt_registry IS 'Tracks which version of each prompt is currently active.';
COMMENT ON TABLE audit_log IS 'Tracks all changes to learning_paths and cache_skills for auditability.';
COMMENT ON TABLE ai_execution_logs IS 'Tracks AI prompt executions for performance monitoring and cost tracking.';

