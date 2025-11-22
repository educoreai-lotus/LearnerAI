-- =====================================================
-- Complete Database Migration - Sample Data
-- File: 20251112_sample_backup.sql
-- Description: Complete, general-purpose sample data migration for LearnerAI platform
-- 
-- This is a FULL migration file that includes ALL sample data:
-- - Companies (with decision makers)
-- - Learners
-- - Skills Gaps
-- - Skills Expansions
-- - Courses (Learning Paths)
-- - Recommendations
-- - Jobs
-- - Path Approvals (for approval workflow testing)
--
-- NOTE: This file contains SPECIFIC TEST DATA (company names, user names, etc.)
-- This is intentional - it provides realistic sample data for testing.
-- The file is "general-purpose" meaning it can be run on any database,
-- but it will insert the same test data each time.
--
-- Prerequisites:
-- 1. Run init_schema_migration.sql first to create all tables
-- 2. Run this file in Supabase SQL Editor to populate all test data
--
-- Usage:
-- This file can be run on any fresh database to set up complete test data.
-- All relationships are properly maintained (foreign keys, references).
-- Safe to run multiple times (uses ON CONFLICT DO NOTHING where applicable).
--
-- Test Data Includes:
-- - Companies: TechCorp Solutions, DataFlow Inc, CloudTech Systems
-- - Learners: Alice Johnson, Sara Neer, Bob Smith
-- - Courses: JavaScript Basics, Advanced SQL, React Fundamentals
-- - Approvals: 3 pending approvals linked to existing courses
-- =====================================================

-- =====================================================
-- 1. Companies
-- =====================================================
INSERT INTO companies (company_id, company_name, decision_maker_policy, decision_maker) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'TechCorp Solutions', 'auto', '{"employee_id": "550e8400-e29b-41d4-a716-446655440010", "employee_name": "John Manager", "employee_email": "john.manager@techcorp.com"}'),
('550e8400-e29b-41d4-a716-446655440002', 'DataFlow Inc', 'manual', '{"employee_id": "550e8400-e29b-41d4-a716-446655440011", "employee_name": "Sarah Director", "employee_email": "sarah.director@dataflow.com"}'),
('550e8400-e29b-41d4-a716-446655440003', 'CloudTech Systems', 'auto', '{"employee_id": "550e8400-e29b-41d4-a716-446655440012", "employee_name": "Mike Admin", "employee_email": "mike.admin@cloudtech.com"}')
ON CONFLICT (company_id) DO UPDATE SET 
  company_name = EXCLUDED.company_name,
  decision_maker_policy = EXCLUDED.decision_maker_policy,
  decision_maker = EXCLUDED.decision_maker;

-- =====================================================
-- 2. Learners
-- =====================================================
INSERT INTO learners (user_id, company_id, company_name, user_name) VALUES
('660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'TechCorp Solutions', 'Alice Johnson'),
('660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'DataFlow Inc', 'Sara Neer'),
('660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'TechCorp Solutions', 'Bob Smith'),
('660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'CloudTech Systems', 'Charlie Brown')
ON CONFLICT (user_id) DO UPDATE SET 
  company_id = EXCLUDED.company_id,
  company_name = EXCLUDED.company_name,
  user_name = EXCLUDED.user_name;

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
'React Fundamentals'),
('770e8400-e29b-41d4-a716-446655440004', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'TechCorp Solutions', 'Alice Johnson',
'{"identifiedGaps": [{"skill": "TypeScript Type System", "level": "intermediate", "priority": "high", "microSkills": [{"id": "micro-004", "name": "Type annotations", "description": "Understanding TypeScript type syntax"}], "nanoSkills": [{"id": "nano-004", "name": "Basic types", "description": "Use string, number, boolean types"}]}], "assessmentDate": "2025-11-12", "assessmentMethod": "technical_test"}',
'fail',
'TypeScript Fundamentals'),
('770e8400-e29b-41d4-a716-446655440005', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'TechCorp Solutions', 'Alice Johnson',
'{"identifiedGaps": [{"skill": "Node.js Server Development", "level": "intermediate", "priority": "high", "microSkills": [{"id": "micro-005", "name": "Express.js routing", "description": "Creating RESTful APIs with Express"}], "nanoSkills": [{"id": "nano-005", "name": "Basic routes", "description": "Define GET and POST routes"}]}], "assessmentDate": "2025-11-12", "assessmentMethod": "code_review"}',
'fail',
'Node.js Backend Development'),
('770e8400-e29b-41d4-a716-446655440006', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'DataFlow Inc', 'Sara Neer',
'{"identifiedGaps": [{"skill": "Python Data Analysis", "level": "intermediate", "priority": "high", "microSkills": [{"id": "micro-006", "name": "Pandas DataFrames", "description": "Working with data structures"}], "nanoSkills": [{"id": "nano-006", "name": "DataFrame operations", "description": "Filter and transform data"}]}], "assessmentDate": "2025-11-12", "assessmentMethod": "technical_test"}',
'fail',
'Python Data Science'),
('770e8400-e29b-41d4-a716-446655440007', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'TechCorp Solutions', 'Bob Smith',
'{"identifiedGaps": [{"skill": "Container Orchestration", "level": "advanced", "priority": "medium", "microSkills": [{"id": "micro-007", "name": "Kubernetes Pods", "description": "Understanding container orchestration"}], "nanoSkills": [{"id": "nano-007", "name": "Deploy pods", "description": "Create and manage Kubernetes pods"}]}], "assessmentDate": "2025-11-12", "assessmentMethod": "technical_interview"}',
'fail',
'Docker & Kubernetes'),
('770e8400-e29b-41d4-a716-446655440008', '660e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'CloudTech Systems', 'Charlie Brown',
'{"identifiedGaps": [{"skill": "Cloud Infrastructure", "level": "intermediate", "priority": "high", "microSkills": [{"id": "micro-008", "name": "AWS Services", "description": "Understanding AWS core services"}], "nanoSkills": [{"id": "nano-008", "name": "EC2 instances", "description": "Launch and configure EC2 instances"}]}], "assessmentDate": "2025-11-12", "assessmentMethod": "technical_test"}',
'fail',
'AWS Cloud Architecture')
ON CONFLICT (gap_id) DO UPDATE SET 
  user_id = EXCLUDED.user_id,
  company_id = EXCLUDED.company_id,
  company_name = EXCLUDED.company_name,
  user_name = EXCLUDED.user_name,
  skills_raw_data = EXCLUDED.skills_raw_data,
  exam_status = EXCLUDED.exam_status,
  competency_target_name = EXCLUDED.competency_target_name;

-- =====================================================
-- 4. Skills Expansions
-- =====================================================
INSERT INTO skills_expansions (expansion_id, gap_id, user_id, prompt_1_output, prompt_2_output) VALUES
('880e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001',
'{"expandedSkills": ["TypeScript", "Async/Await", "Promises", "Modules"], "reasoning": "These skills complement JavaScript ES6+ and are essential for modern development"}',
'{"competencies": [{"name": "TypeScript Fundamentals", "priority": "high"}, {"name": "Asynchronous Programming", "priority": "medium"}]}'),
('880e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002',
'{"expandedSkills": ["Database Optimization", "Query Performance", "Indexing Strategies"], "reasoning": "Advanced SQL requires understanding of performance optimization"}',
'{"competencies": [{"name": "Database Performance", "priority": "high"}, {"name": "Query Optimization", "priority": "high"}]}')
ON CONFLICT (expansion_id) DO UPDATE SET 
  gap_id = EXCLUDED.gap_id,
  user_id = EXCLUDED.user_id,
  prompt_1_output = EXCLUDED.prompt_1_output,
  prompt_2_output = EXCLUDED.prompt_2_output;

-- =====================================================
-- 5. Courses
-- =====================================================
INSERT INTO courses (competency_target_name, user_id, gap_id, learning_path, approved) VALUES
('JavaScript Basics', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440001',
'{"steps": [{"step": 1, "title": "Introduction to ES6", "duration": "2 weeks", "resources": ["ES6 Guide", "Practice Exercises"]}, {"step": 2, "title": "Arrow Functions", "duration": "1 week", "resources": ["Arrow Functions Tutorial"]}, {"step": 3, "title": "Destructuring", "duration": "1 week", "resources": ["Destructuring Guide"]}], "estimatedCompletion": "4 weeks"}',
true),
('Advanced SQL', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440002',
'{"steps": [{"step": 1, "title": "Window Functions Overview", "duration": "2 weeks", "resources": ["Window Functions Guide"]}, {"step": 2, "title": "ROW_NUMBER() and RANK()", "duration": "1 week", "resources": ["Ranking Functions Tutorial"]}, {"step": 3, "title": "Advanced Analytics", "duration": "2 weeks", "resources": ["SQL Analytics Guide"]}], "estimatedCompletion": "5 weeks"}',
false),
('React Fundamentals', '660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440003',
'{"steps": [{"step": 1, "title": "React Basics", "duration": "1 week", "resources": ["React Documentation"]}, {"step": 2, "title": "useState Hook", "duration": "1 week", "resources": ["Hooks Guide"]}, {"step": 3, "title": "Component Lifecycle", "duration": "1 week", "resources": ["Lifecycle Tutorial"]}], "estimatedCompletion": "3 weeks"}',
true),
('TypeScript Fundamentals', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440004',
'{"pathTitle": "TypeScript Fundamentals", "pathGoal": "Master TypeScript type system and advanced features", "pathDescription": "Comprehensive guide to TypeScript for JavaScript developers", "totalDurationHours": 30, "difficulty": "Intermediate", "audience": "JavaScript Developers", "learning_modules": [{"module_title": "Type System Basics", "module_description": "Understanding TypeScript types and annotations", "subtopics": [{"title": "Primitive Types"}, {"title": "Object Types"}, {"title": "Union Types"}, {"title": "Type Inference"}]}, {"module_title": "Advanced Types", "module_description": "Exploring advanced TypeScript type features", "subtopics": [{"title": "Generics"}, {"title": "Utility Types"}, {"title": "Conditional Types"}, {"title": "Mapped Types"}]}, {"module_title": "TypeScript with React", "module_description": "Using TypeScript in React applications", "subtopics": [{"title": "Component Types"}, {"title": "Props and State"}, {"title": "Hooks with Types"}]}], "estimatedCompletion": "6 weeks"}',
false),
('Node.js Backend Development', '660e8400-e29b-41d4-a716-446655440001', '770e8400-e29b-41d4-a716-446655440005',
'{"pathTitle": "Node.js Backend Development", "pathGoal": "Develop RESTful APIs with Node.js and Express", "pathDescription": "Learn to build scalable backend services using Node.js", "totalDurationHours": 40, "difficulty": "Intermediate", "audience": "Fullstack Developers", "learning_modules": [{"module_title": "Express.js Basics", "module_description": "Set up an Express server and define routes", "subtopics": [{"title": "Server Setup"}, {"title": "Routing"}, {"title": "Middleware"}, {"title": "Request/Response"}]}, {"module_title": "Database Integration", "module_description": "Connect Node.js with PostgreSQL/Supabase", "subtopics": [{"title": "Database Connections"}, {"title": "Query Builders"}, {"title": "Migrations"}, {"title": "ORM Basics"}]}, {"module_title": "API Best Practices", "module_description": "RESTful API design and security", "subtopics": [{"title": "REST Principles"}, {"title": "Authentication"}, {"title": "Error Handling"}, {"title": "API Documentation"}]}], "estimatedCompletion": "8 weeks"}',
false),
('Python Data Science', '660e8400-e29b-41d4-a716-446655440002', '770e8400-e29b-41d4-a716-446655440006',
'{"pathTitle": "Python Data Science", "pathGoal": "Master data analysis and visualization with Python", "pathDescription": "Comprehensive course on data science using Python libraries", "totalDurationHours": 50, "difficulty": "Intermediate", "audience": "Data Analysts", "learning_modules": [{"module_title": "Pandas Fundamentals", "module_description": "Working with DataFrames and data manipulation", "subtopics": [{"title": "DataFrames"}, {"title": "Data Cleaning"}, {"title": "Grouping and Aggregation"}, {"title": "Merging Data"}]}, {"module_title": "Data Visualization", "module_description": "Creating visualizations with Matplotlib and Seaborn", "subtopics": [{"title": "Matplotlib Basics"}, {"title": "Seaborn Charts"}, {"title": "Custom Visualizations"}, {"title": "Interactive Plots"}]}, {"module_title": "Statistical Analysis", "module_description": "Statistical methods and hypothesis testing", "subtopics": [{"title": "Descriptive Statistics"}, {"title": "Correlation Analysis"}, {"title": "Hypothesis Testing"}, {"title": "Regression Analysis"}]}], "estimatedCompletion": "10 weeks"}',
false),
('Docker & Kubernetes', '660e8400-e29b-41d4-a716-446655440003', '770e8400-e29b-41d4-a716-446655440007',
'{"pathTitle": "Docker & Kubernetes", "pathGoal": "Master containerization and orchestration", "pathDescription": "Learn to containerize applications and deploy with Kubernetes", "totalDurationHours": 35, "difficulty": "Advanced", "audience": "DevOps Engineers", "learning_modules": [{"module_title": "Docker Basics", "module_description": "Containerization with Docker", "subtopics": [{"title": "Docker Images"}, {"title": "Dockerfiles"}, {"title": "Docker Compose"}, {"title": "Volume Management"}]}, {"module_title": "Kubernetes Fundamentals", "module_description": "Container orchestration with Kubernetes", "subtopics": [{"title": "Pods and Deployments"}, {"title": "Services"}, {"title": "ConfigMaps and Secrets"}, {"title": "Scaling Applications"}]}, {"module_title": "Production Deployment", "module_description": "Deploying applications to production", "subtopics": [{"title": "Cluster Setup"}, {"title": "Monitoring"}, {"title": "Logging"}, {"title": "Security Best Practices"}]}], "estimatedCompletion": "7 weeks"}',
false),
('AWS Cloud Architecture', '660e8400-e29b-41d4-a716-446655440004', '770e8400-e29b-41d4-a716-446655440008',
'{"pathTitle": "AWS Cloud Architecture", "pathGoal": "Design and deploy scalable cloud solutions on AWS", "pathDescription": "Comprehensive guide to AWS services and cloud architecture patterns", "totalDurationHours": 45, "difficulty": "Advanced", "audience": "Cloud Architects", "learning_modules": [{"module_title": "Core AWS Services", "module_description": "Understanding essential AWS services", "subtopics": [{"title": "EC2 Instances"}, {"title": "S3 Storage"}, {"title": "RDS Databases"}, {"title": "Lambda Functions"}]}, {"module_title": "Networking & Security", "module_description": "VPC, security groups, and IAM", "subtopics": [{"title": "VPC Configuration"}, {"title": "Security Groups"}, {"title": "IAM Roles"}, {"title": "CloudWatch Monitoring"}]}, {"module_title": "Scalable Architecture", "module_description": "Designing for scale and high availability", "subtopics": [{"title": "Load Balancing"}, {"title": "Auto Scaling"}, {"title": "Multi-AZ Deployment"}, {"title": "Disaster Recovery"}]}], "estimatedCompletion": "9 weeks"}',
false)
ON CONFLICT (competency_target_name) DO UPDATE SET 
  user_id = EXCLUDED.user_id,
  gap_id = EXCLUDED.gap_id,
  learning_path = EXCLUDED.learning_path,
  approved = EXCLUDED.approved;

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
false)
ON CONFLICT (recommendation_id) DO UPDATE SET 
  user_id = EXCLUDED.user_id,
  base_course_name = EXCLUDED.base_course_name,
  suggested_courses = EXCLUDED.suggested_courses,
  sent_to_rag = EXCLUDED.sent_to_rag;

-- =====================================================
-- 7. Jobs
-- =====================================================
INSERT INTO jobs (id, user_id, company_id, competency_target_name, type, status, progress, current_stage) VALUES
('aa0e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'JavaScript Basics', 'path-generation', 'completed', 100, 'path-creation'),
('aa0e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Advanced SQL', 'path-generation', 'processing', 70, 'path-creation'),
('aa0e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'React Fundamentals', 'course-suggestion', 'completed', 100, 'suggestion-generation')
ON CONFLICT (id) DO UPDATE SET 
  user_id = EXCLUDED.user_id,
  company_id = EXCLUDED.company_id,
  competency_target_name = EXCLUDED.competency_target_name,
  type = EXCLUDED.type,
  status = EXCLUDED.status,
  progress = EXCLUDED.progress,
  current_stage = EXCLUDED.current_stage;

-- =====================================================
-- 8. Path Approvals
-- =====================================================
-- IMPORTANT: learning_path_id references courses.competency_target_name (TEXT, not UUID)
-- Each approval links a course to a decision maker for manual approval workflow

-- Approval 1: JavaScript Basics - Pending approval for TechCorp Solutions
-- Decision Maker: John Manager (550e8400-e29b-41d4-a716-446655440010)
-- Course: JavaScript Basics (belongs to Alice Johnson at TechCorp)
INSERT INTO path_approvals (
  id,
  learning_path_id,  -- References courses.competency_target_name (TEXT)
  company_id,
  decision_maker_id,  -- UUID from companies.decision_maker JSONB
  status,
  feedback,
  approved_at,
  rejected_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'JavaScript Basics',  -- Must match courses.competency_target_name
  '550e8400-e29b-41d4-a716-446655440001',  -- TechCorp Solutions
  '550e8400-e29b-41d4-a716-446655440010',  -- John Manager (from TechCorp's decision_maker JSONB)
  'pending',
  NULL,
  NULL,
  NULL,
  NOW() - INTERVAL '3 days',
  NOW() - INTERVAL '3 days'
)
ON CONFLICT DO NOTHING;

-- Approval 2: React Fundamentals - Pending approval for TechCorp Solutions
-- Decision Maker: John Manager (550e8400-e29b-41d4-a716-446655440010)
-- Course: React Fundamentals (belongs to Bob Smith at TechCorp)
INSERT INTO path_approvals (
  id,
  learning_path_id,
  company_id,
  decision_maker_id,
  status,
  feedback,
  approved_at,
  rejected_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'React Fundamentals',  -- Must match courses.competency_target_name
  '550e8400-e29b-41d4-a716-446655440001',  -- TechCorp Solutions
  '550e8400-e29b-41d4-a716-446655440010',  -- John Manager
  'pending',
  NULL,
  NULL,
  NULL,
  NOW() - INTERVAL '2 days',
  NOW() - INTERVAL '2 days'
)
ON CONFLICT DO NOTHING;

-- Approval 3: Advanced SQL - Pending approval for DataFlow Inc
-- Decision Maker: Sarah Director (550e8400-e29b-41d4-a716-446655440011)
-- Course: Advanced SQL (belongs to Sara Neer at DataFlow)
INSERT INTO path_approvals (
  id,
  learning_path_id,
  company_id,
  decision_maker_id,
  status,
  feedback,
  approved_at,
  rejected_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Advanced SQL',  -- Must match courses.competency_target_name
  '550e8400-e29b-41d4-a716-446655440002',  -- DataFlow Inc
  '550e8400-e29b-41d4-a716-446655440011',  -- Sarah Director (from DataFlow's decision_maker JSONB)
  'pending',
  NULL,
  NULL,
  NULL,
  NOW() - INTERVAL '1 day',
  NOW() - INTERVAL '1 day'
)
ON CONFLICT DO NOTHING;

-- Approval 4: TypeScript Fundamentals - Pending approval for TechCorp Solutions
-- Decision Maker: John Manager (550e8400-e29b-41d4-a716-446655440010)
-- Course: TypeScript Fundamentals (belongs to Alice Johnson at TechCorp)
INSERT INTO path_approvals (
  id,
  learning_path_id,
  company_id,
  decision_maker_id,
  status,
  feedback,
  approved_at,
  rejected_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'TypeScript Fundamentals',  -- Must match courses.competency_target_name
  '550e8400-e29b-41d4-a716-446655440001',  -- TechCorp Solutions
  '550e8400-e29b-41d4-a716-446655440010',  -- John Manager
  'pending',
  NULL,
  NULL,
  NULL,
  NOW() - INTERVAL '4 days',
  NOW() - INTERVAL '4 days'
)
ON CONFLICT DO NOTHING;

-- Approval 5: Node.js Backend Development - Pending approval for TechCorp Solutions
-- Decision Maker: John Manager (550e8400-e29b-41d4-a716-446655440010)
-- Course: Node.js Backend Development (belongs to Alice Johnson at TechCorp)
INSERT INTO path_approvals (
  id,
  learning_path_id,
  company_id,
  decision_maker_id,
  status,
  feedback,
  approved_at,
  rejected_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Node.js Backend Development',  -- Must match courses.competency_target_name
  '550e8400-e29b-41d4-a716-446655440001',  -- TechCorp Solutions
  '550e8400-e29b-41d4-a716-446655440010',  -- John Manager
  'pending',
  NULL,
  NULL,
  NULL,
  NOW() - INTERVAL '6 days',
  NOW() - INTERVAL '6 days'
)
ON CONFLICT DO NOTHING;

-- Approval 6: Python Data Science - Pending approval for DataFlow Inc
-- Decision Maker: Sarah Director (550e8400-e29b-41d4-a716-446655440011)
-- Course: Python Data Science (belongs to Sara Neer at DataFlow)
INSERT INTO path_approvals (
  id,
  learning_path_id,
  company_id,
  decision_maker_id,
  status,
  feedback,
  approved_at,
  rejected_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Python Data Science',  -- Must match courses.competency_target_name
  '550e8400-e29b-41d4-a716-446655440002',  -- DataFlow Inc
  '550e8400-e29b-41d4-a716-446655440011',  -- Sarah Director
  'pending',
  NULL,
  NULL,
  NULL,
  NOW() - INTERVAL '7 days',
  NOW() - INTERVAL '7 days'
)
ON CONFLICT DO NOTHING;

-- Approval 7: Docker & Kubernetes - Pending approval for TechCorp Solutions
-- Decision Maker: John Manager (550e8400-e29b-41d4-a716-446655440010)
-- Course: Docker & Kubernetes (belongs to Bob Smith at TechCorp)
INSERT INTO path_approvals (
  id,
  learning_path_id,
  company_id,
  decision_maker_id,
  status,
  feedback,
  approved_at,
  rejected_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Docker & Kubernetes',  -- Must match courses.competency_target_name
  '550e8400-e29b-41d4-a716-446655440001',  -- TechCorp Solutions
  '550e8400-e29b-41d4-a716-446655440010',  -- John Manager
  'pending',
  NULL,
  NULL,
  NULL,
  NOW() - INTERVAL '8 days',
  NOW() - INTERVAL '8 days'
)
ON CONFLICT DO NOTHING;

-- Approval 8: AWS Cloud Architecture - Pending approval for CloudTech Systems
-- Decision Maker: Mike Admin (550e8400-e29b-41d4-a716-446655440012)
-- Course: AWS Cloud Architecture (belongs to Charlie Brown at CloudTech)
INSERT INTO path_approvals (
  id,
  learning_path_id,
  company_id,
  decision_maker_id,
  status,
  feedback,
  approved_at,
  rejected_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'AWS Cloud Architecture',  -- Must match courses.competency_target_name
  '550e8400-e29b-41d4-a716-446655440003',  -- CloudTech Systems
  '550e8400-e29b-41d4-a716-446655440012',  -- Mike Admin (from CloudTech's decision_maker JSONB)
  'pending',
  NULL,
  NULL,
  NULL,
  NOW() - INTERVAL '5 days',
  NOW() - INTERVAL '5 days'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- Migration Complete - All Sample Data Inserted
-- =====================================================
-- 
-- This is a COMPLETE, GENERAL-PURPOSE migration file.
-- It includes ALL necessary sample data for testing the LearnerAI platform.
--
-- Data Summary:
-- ✅ 3 companies (TechCorp, DataFlow, CloudTech) with decision makers
-- ✅ 4 learners (Alice, Sara, Bob, Charlie) across companies
-- ✅ 8 skills gaps (linked to learners and courses)
-- ✅ 2 skills expansions (AI-generated expansions)
-- ✅ 8 courses/learning paths (JavaScript Basics, Advanced SQL, React Fundamentals, TypeScript Fundamentals, Node.js Backend Development, Python Data Science, Docker & Kubernetes, AWS Cloud Architecture)
-- ✅ 3 recommendations (course suggestions)
-- ✅ 3 jobs (background processing jobs)
-- ✅ 8 path approvals (pending approvals for approval workflow testing)
--
-- Complete Data Relationships:
-- - Alice Johnson → TechCorp Solutions → JavaScript Basics → Approval (John Manager)
-- - Alice Johnson → TechCorp Solutions → TypeScript Fundamentals → Approval (John Manager)
-- - Alice Johnson → TechCorp Solutions → Node.js Backend Development → Approval (John Manager)
-- - Sara Neer → DataFlow Inc → Advanced SQL → Approval (Sarah Director)
-- - Sara Neer → DataFlow Inc → Python Data Science → Approval (Sarah Director)
-- - Bob Smith → TechCorp Solutions → React Fundamentals → Approval (John Manager)
-- - Bob Smith → TechCorp Solutions → Docker & Kubernetes → Approval (John Manager)
-- - Charlie Brown → CloudTech Systems → AWS Cloud Architecture → Approval (Mike Admin)
--
-- Key Relationships Explained:
-- - path_approvals.learning_path_id (TEXT) = courses.competency_target_name (TEXT PRIMARY KEY)
-- - path_approvals.decision_maker_id (UUID) = companies.decision_maker.employee_id (from JSONB)
-- - path_approvals.company_id (UUID) = companies.company_id
--
-- This migration is:
-- - ✅ Complete (includes all tables with sample data)
-- - ✅ General-purpose (works for any fresh database setup)
-- - ✅ Safe to re-run (uses ON CONFLICT DO NOTHING)
-- - ✅ Well-documented (clear relationships and structure)
--
-- Ready for testing all LearnerAI features including:
-- - Learning path generation
-- - Approval workflow
-- - Course recommendations
-- - Skills gap analysis

