-- =====================================================
-- Insert Test Approval Data
-- File: insert_test_approvals.sql
-- Description: Inserts test approval requests for testing the Approvals page
-- Run this in Supabase SQL Editor
-- =====================================================

-- First, ensure we have the necessary data:
-- 1. A company with the decision maker
-- 2. A learner
-- 3. A course (learning path)

-- Insert company if it doesn't exist
INSERT INTO companies (company_id, company_name, decision_maker_policy, decision_maker) 
VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'TechCorp Solutions',
  'manual',
  '{"employee_id": "550e8400-e29b-41d4-a716-446655440010", "employee_name": "John Manager", "employee_email": "john.manager@techcorp.com"}'
)
ON CONFLICT (company_id) DO NOTHING;

-- Insert learner if it doesn't exist
INSERT INTO learners (user_id, company_id, company_name, user_name)
VALUES (
  '660e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440001',
  'TechCorp Solutions',
  'Alice Johnson'
)
ON CONFLICT (user_id) DO NOTHING;

-- IMPORTANT: learning_path_id in path_approvals references courses.competency_target_name (TEXT)
-- We'll use existing courses from the sample data:
-- - 'JavaScript Basics' (for Alice Johnson)
-- - 'Advanced SQL' (for Sara Neer) 
-- - 'React Fundamentals' (for Bob Smith)

-- Make sure these courses exist and are NOT approved (so they need approval)
-- Update existing courses to be unapproved if needed
UPDATE courses 
SET approved = false 
WHERE competency_target_name IN ('JavaScript Basics', 'Advanced SQL', 'React Fundamentals')
AND approved = true;

-- Now insert test approval requests
-- IMPORTANT: learning_path_id = courses.competency_target_name (TEXT, not UUID)
-- We'll create approvals for existing courses from the sample data

-- Approval 1: Pending approval for JavaScript Basics (Alice Johnson's course)
-- This course belongs to TechCorp Solutions, so John Manager (550e8400-e29b-41d4-a716-446655440010) is the decision maker
INSERT INTO path_approvals (
  id,
  learning_path_id,  -- This is 'JavaScript Basics' (TEXT from courses.competency_target_name)
  company_id,
  decision_maker_id,
  status,
  feedback,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  'JavaScript Basics',  -- References courses.competency_target_name
  '550e8400-e29b-41d4-a716-446655440001',  -- TechCorp Solutions
  '550e8400-e29b-41d4-a716-446655440010',  -- John Manager (decision maker)
  'pending',
  NULL,
  NOW(),
  NOW()
WHERE EXISTS (
  SELECT 1 FROM courses 
  WHERE competency_target_name = 'JavaScript Basics'
)
AND NOT EXISTS (
  SELECT 1 FROM path_approvals 
  WHERE learning_path_id = 'JavaScript Basics' 
  AND decision_maker_id = '550e8400-e29b-41d4-a716-446655440010'
);

-- Approval 2: Pending approval for React Fundamentals (Bob Smith's course)
-- This course also belongs to TechCorp Solutions
INSERT INTO path_approvals (
  id,
  learning_path_id,  -- This is 'React Fundamentals' (TEXT from courses.competency_target_name)
  company_id,
  decision_maker_id,
  status,
  feedback,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  'React Fundamentals',  -- References courses.competency_target_name
  '550e8400-e29b-41d4-a716-446655440001',  -- TechCorp Solutions
  '550e8400-e29b-41d4-a716-446655440010',  -- John Manager (decision maker)
  'pending',
  NULL,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
WHERE EXISTS (
  SELECT 1 FROM courses 
  WHERE competency_target_name = 'React Fundamentals'
)
AND NOT EXISTS (
  SELECT 1 FROM path_approvals 
  WHERE learning_path_id = 'React Fundamentals' 
  AND decision_maker_id = '550e8400-e29b-41d4-a716-446655440010'
);

-- Approval 3: Changes requested for Advanced SQL (Sara Neer's course)
-- Note: This course belongs to DataFlow Inc, but we'll create an approval for TechCorp's decision maker
-- OR we can create it for DataFlow's decision maker (Sarah Director: 550e8400-e29b-41d4-a716-446655440011)
-- For testing, let's create one for TechCorp's decision maker using Advanced SQL course
-- (This is just for testing - in reality, each company would have their own decision maker)

-- First, let's check if we should use Advanced SQL or create a simpler test
-- Since Advanced SQL belongs to DataFlow Inc, we'll skip it and just use the two TechCorp courses above

-- If you want a third approval, you can manually create one or use this:
-- (Uncomment if you want to test with DataFlow's decision maker)
/*
INSERT INTO path_approvals (
  id,
  learning_path_id,
  company_id,
  decision_maker_id,
  status,
  feedback,
  created_at,
  updated_at
)
SELECT
  gen_random_uuid(),
  'Advanced SQL',
  '550e8400-e29b-41d4-a716-446655440002',  -- DataFlow Inc
  '550e8400-e29b-41d4-a716-446655440011',  -- Sarah Director (DataFlow's decision maker)
  'pending',
  'Please add more practical examples',
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
WHERE EXISTS (
  SELECT 1 FROM courses 
  WHERE competency_target_name = 'Advanced SQL'
)
AND NOT EXISTS (
  SELECT 1 FROM path_approvals 
  WHERE learning_path_id = 'Advanced SQL' 
  AND decision_maker_id = '550e8400-e29b-41d4-a716-446655440011'
);
*/

-- Verify the data was inserted
-- This query shows the relationship: path_approvals.learning_path_id = courses.competency_target_name
-- Note: This is a SELECT query for verification - run it separately if needed
/*
SELECT 
  pa.id,
  pa.learning_path_id,
  co.competency_target_name,
  pa.status,
  pa.feedback,
  pa.created_at,
  c.company_name,
  l.user_name,
  l.user_id
FROM path_approvals pa
INNER JOIN companies c ON pa.company_id = c.company_id
INNER JOIN courses co ON pa.learning_path_id = co.competency_target_name
INNER JOIN learners l ON co.user_id = l.user_id
WHERE pa.decision_maker_id = '550e8400-e29b-41d4-a716-446655440010'
ORDER BY pa.created_at DESC;
*/

