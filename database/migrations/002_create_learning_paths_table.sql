-- Migration: 002_create_learning_paths_table.sql
-- Description: Creates learning_paths table that the backend code expects
-- This table is required by SupabaseRepository.js

-- ============================================
-- Learning Paths Table
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
CREATE INDEX IF NOT EXISTS idx_learning_paths_path_data ON learning_paths USING GIN(path_data);

-- Trigger function for updated_at (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER update_learning_paths_updated_at
    BEFORE UPDATE ON learning_paths
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE learning_paths IS 'Stores generated learning paths with versioning and auditability.';

