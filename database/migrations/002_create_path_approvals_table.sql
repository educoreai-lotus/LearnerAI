-- =====================================================
-- Migration: Create path_approvals table
-- File: 002_create_path_approvals_table.sql
-- Description: Table for storing learning path approval requests
-- =====================================================

-- Table: path_approvals
-- Description: Stores approval requests for learning paths when manual approval is required
CREATE TABLE IF NOT EXISTS path_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    learning_path_id TEXT NOT NULL, -- References courses.competency_target_name (TEXT, not UUID)
    company_id UUID NOT NULL,
    decision_maker_id UUID NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
    feedback TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejected_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_path_approvals_company FOREIGN KEY (company_id) REFERENCES companies(company_id) ON DELETE CASCADE
    -- Note: No FK constraint on learning_path_id because it references courses.competency_target_name (TEXT)
    -- The learning_path_id is actually the competency_target_name from the courses table
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_path_approvals_id ON path_approvals(id);
CREATE INDEX IF NOT EXISTS idx_path_approvals_learning_path_id ON path_approvals(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_path_approvals_company_id ON path_approvals(company_id);
CREATE INDEX IF NOT EXISTS idx_path_approvals_decision_maker_id ON path_approvals(decision_maker_id);
CREATE INDEX IF NOT EXISTS idx_path_approvals_status ON path_approvals(status);
CREATE INDEX IF NOT EXISTS idx_path_approvals_pending ON path_approvals(decision_maker_id, status) WHERE status = 'pending';

-- Trigger: Update updated_at on row update
DROP TRIGGER IF EXISTS trigger_path_approvals_updated_at ON path_approvals;
CREATE TRIGGER trigger_path_approvals_updated_at
    BEFORE UPDATE ON path_approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Migration Complete
-- =====================================================
-- Run this file in Supabase SQL Editor after init_schema_migration.sql
-- This creates the path_approvals table for the approval workflow

