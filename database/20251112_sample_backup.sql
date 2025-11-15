-- =====================================================
-- Sample Data Backup
-- File: 20251112_sample_backup.sql
-- Description: Sample INSERT statements for testing
-- Run this in Supabase SQL Editor after running init_schema_migration.sql
-- =====================================================

-- =====================================================
-- 1. Companies
-- =====================================================
INSERT INTO companies (company_id, company_name, decision_maker_policy, decision_maker) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'TechCorp Solutions', 'auto', '{"employee_id": "550e8400-e29b-41d4-a716-446655440010", "employee_name": "John Manager", "employee_email": "john.manager@techcorp.com"}'),
('550e8400-e29b-41d4-a716-446655440002', 'DataFlow Inc', 'manual', '{"employee_id": "550e8400-e29b-41d4-a716-446655440011", "employee_name": "Sarah Director", "employee_email": "sarah.director@dataflow.com"}'),
('550e8400-e29b-41d4-a716-446655440003', 'CloudTech Systems', 'auto', '{"employee_id": "550e8400-e29b-41d4-a716-446655440012", "employee_name": "Mike Admin", "employee_email": "mike.admin@cloudtech.com"}');

-- =====================================================
-- 2. Learners
-- =====================================================
INSERT INTO learners (user_id, company_id, company_name, user_name) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'TechCorp Solutions', 'Alice Johnson'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'DataFlow Inc', 'Sara Neer'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'TechCorp Solutions', 'Bob Smith');

-- =====================================================
-- 3. Skills Gap
-- =====================================================
INSERT INTO skills_gap (gap_id, user_id, company_id, company_name, user_name, skills_raw_data, exam_status, competency_target_name) VALUES
('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'TechCorp Solutions', 'Alice Johnson', 
'{"identifiedGaps": [{"skill": "JavaScript ES6+ Syntax", "level": "beginner", "priority": "high", "microSkills": [{"id": "micro-001", "name": "Arrow functions", "description": "Understanding arrow function syntax"}], "nanoSkills": [{"id": "nano-001", "name": "Basic arrow function", "description": "Write simple arrow functions"}]}], "assessmentDate": "2025-11-12", "assessmentMethod": "technical_test"}',
'fail',
'JavaScript Basics'),
('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'DataFlow Inc', 'Sara Neer',
'{"identifiedGaps": [{"skill": "Advanced SQL Queries", "level": "intermediate", "priority": "high", "microSkills": [{"id": "micro-002", "name": "Window functions", "description": "Using window functions for analytics"}], "nanoSkills": [{"id": "nano-002", "name": "ROW_NUMBER() function", "description": "Implement ROW_NUMBER() in queries"}]}], "assessmentDate": "2025-11-12", "assessmentMethod": "technical_interview"}',
'fail',
'Advanced SQL'),
('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'TechCorp Solutions', 'Bob Smith',
'{"identifiedGaps": [{"skill": "React Hooks", "level": "beginner", "priority": "medium", "microSkills": [{"id": "micro-003", "name": "useState hook", "description": "Managing component state"}], "nanoSkills": [{"id": "nano-003", "name": "Basic useState", "description": "Initialize state with useState"}]}], "assessmentDate": "2025-11-12", "assessmentMethod": "code_review"}',
'pass',
'React Fundamentals');

-- =====================================================
-- 4. Skills Expansions
-- =====================================================
INSERT INTO skills_expansions (expansion_id, prompt_1_output, prompt_2_output) VALUES
('880e8400-e29b-41d4-a716-446655440001',
'{"expandedSkills": ["TypeScript", "Async/Await", "Promises", "Modules"], "reasoning": "These skills complement JavaScript ES6+ and are essential for modern development"}',
'{"competencies": [{"name": "TypeScript Fundamentals", "priority": "high"}, {"name": "Asynchronous Programming", "priority": "medium"}]}'),
('880e8400-e29b-41d4-a716-446655440002',
'{"expandedSkills": ["Database Optimization", "Query Performance", "Indexing Strategies"], "reasoning": "Advanced SQL requires understanding of performance optimization"}',
'{"competencies": [{"name": "Database Performance", "priority": "high"}, {"name": "Query Optimization", "priority": "high"}]}');

-- =====================================================
-- 5. Courses
-- =====================================================
INSERT INTO courses (competency_target_name, user_id, learning_path, approved) VALUES
('JavaScript Basics', '660e8400-e29b-41d4-a716-446655440001',
'{"steps": [{"step": 1, "title": "Introduction to ES6", "duration": "2 weeks", "resources": ["ES6 Guide", "Practice Exercises"]}, {"step": 2, "title": "Arrow Functions", "duration": "1 week", "resources": ["Arrow Functions Tutorial"]}, {"step": 3, "title": "Destructuring", "duration": "1 week", "resources": ["Destructuring Guide"]}], "estimatedCompletion": "4 weeks"}',
true),
('Advanced SQL', '660e8400-e29b-41d4-a716-446655440002',
'{"steps": [{"step": 1, "title": "Window Functions Overview", "duration": "2 weeks", "resources": ["Window Functions Guide"]}, {"step": 2, "title": "ROW_NUMBER() and RANK()", "duration": "1 week", "resources": ["Ranking Functions Tutorial"]}, {"step": 3, "title": "Advanced Analytics", "duration": "2 weeks", "resources": ["SQL Analytics Guide"]}], "estimatedCompletion": "5 weeks"}',
false),
('React Fundamentals', '660e8400-e29b-41d4-a716-446655440003',
'{"steps": [{"step": 1, "title": "React Basics", "duration": "1 week", "resources": ["React Documentation"]}, {"step": 2, "title": "useState Hook", "duration": "1 week", "resources": ["Hooks Guide"]}, {"step": 3, "title": "Component Lifecycle", "duration": "1 week", "resources": ["Lifecycle Tutorial"]}], "estimatedCompletion": "3 weeks"}',
true);

-- =====================================================
-- 6. Recommendations
-- =====================================================
INSERT INTO recommendations (recommendation_id, user_id, base_course_name, suggested_courses, sent_to_rag) VALUES
('990e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', 'JavaScript Basics',
'{"suggestions": [{"courseName": "TypeScript Fundamentals", "reason": "Natural progression from JavaScript", "priority": "high"}, {"courseName": "Node.js Basics", "reason": "Backend JavaScript development", "priority": "medium"}]}',
false),
('990e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', 'Advanced SQL',
'{"suggestions": [{"courseName": "Database Design", "reason": "Complement to SQL skills", "priority": "high"}, {"courseName": "Data Warehousing", "reason": "Advanced data management", "priority": "medium"}]}',
true),
('990e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', 'React Fundamentals',
'{"suggestions": [{"courseName": "React Advanced Patterns", "reason": "Build on fundamentals", "priority": "high"}, {"courseName": "State Management", "reason": "Redux and Context API", "priority": "medium"}]}',
false);

-- =====================================================
-- 7. Jobs
-- =====================================================
INSERT INTO jobs (id, user_id, company_id, competency_target_name, type, status, progress, current_stage) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'JavaScript Basics', 'path-generation', 'completed', 100, 'path-creation'),
('aa0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Advanced SQL', 'path-generation', 'processing', 70, 'path-creation'),
('aa0e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'React Fundamentals', 'course-suggestion', 'completed', 100, 'suggestion-generation');

-- =====================================================
-- Sample Data Insertion Complete
-- =====================================================
-- Summary:
-- - 3 companies (TechCorp, DataFlow, CloudTech)
-- - 3 learners (Alice, Sara, Bob)
-- - 3 skills gaps (linked to learners and courses)
-- - 2 skills expansions
-- - 3 courses (JavaScript Basics, Advanced SQL, React Fundamentals)
-- - 3 recommendations (linked to courses)
-- - 3 jobs (various statuses)
--
-- Relationships demonstrated:
-- - Alice → TechCorp → JavaScript Basics
-- - Sara → DataFlow → Advanced SQL
-- - Bob → TechCorp → React Fundamentals

