-- =====================================================
-- LearnerAI Sample Data Backup
-- File: 20251112_sample_backup.sql
-- Description: Sample data for testing and development
-- Date: 2025-11-12
-- =====================================================

-- IMPORTANT: Run init_schema_migration.sql FIRST before this file
-- This file contains INSERT statements with sample data

-- =====================================================
-- Clear existing data (optional - comment out if you want to keep existing data)
-- =====================================================
-- TRUNCATE TABLE recommendations CASCADE;
-- TRUNCATE TABLE courses CASCADE;
-- TRUNCATE TABLE skills_gap CASCADE;
-- TRUNCATE TABLE skills_expansions CASCADE;
-- TRUNCATE TABLE learners CASCADE;

-- =====================================================
-- Table: learners
-- Sample learners: Alice and Wajdan
-- =====================================================

INSERT INTO learners (user_id, company_id, company_name, user_name, decision_maker_policy, decision_maker_id, created_at, last_modified_at) VALUES
(
    'a1b2c3d4-e5f6-4789-a012-345678901234'::UUID,
    'c1d2e3f4-5678-9012-3456-789012345678'::UUID,
    'TechCorp Inc.',
    'Alice Johnson',
    'auto',
    NULL,
    '2025-11-01 10:00:00+00'::TIMESTAMP WITH TIME ZONE,
    '2025-11-01 10:00:00+00'::TIMESTAMP WITH TIME ZONE
),
(
    'b2c3d4e5-f6a7-8901-2345-678901234567'::UUID,
    'c1d2e3f4-5678-9012-3456-789012345678'::UUID,
    'TechCorp Inc.',
    'Wajdan Al-Mansouri',
    'manual',
    'd3e4f5a6-7890-1234-5678-901234567890'::UUID,
    '2025-11-02 14:30:00+00'::TIMESTAMP WITH TIME ZONE,
    '2025-11-02 14:30:00+00'::TIMESTAMP WITH TIME ZONE
),
(
    'c3d4e5f6-a7b8-9012-3456-789012345678'::UUID,
    'e4f5a6b7-8901-2345-6789-012345678901'::UUID,
    'DataSolutions Ltd.',
    'Sarah Chen',
    'auto',
    NULL,
    '2025-11-03 09:15:00+00'::TIMESTAMP WITH TIME ZONE,
    '2025-11-03 09:15:00+00'::TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- Table: courses
-- Sample courses: JavaScript Basics, Advanced SQL
-- =====================================================

INSERT INTO courses (course_id, user_id, learning_path, created_at, last_modified_at, approved) VALUES
(
    'f4a5b6c7-d8e9-0123-4567-890123456789'::UUID,
    'a1b2c3d4-e5f6-4789-a012-345678901234'::UUID, -- Alice
    '{
        "title": "JavaScript Basics",
        "description": "Learn fundamental JavaScript concepts",
        "modules": [
            {
                "id": "mod1",
                "title": "Variables and Data Types",
                "duration": "2 hours",
                "completed": false
            },
            {
                "id": "mod2",
                "title": "Functions and Scope",
                "duration": "3 hours",
                "completed": false
            },
            {
                "id": "mod3",
                "title": "Arrays and Objects",
                "duration": "2.5 hours",
                "completed": false
            }
        ],
        "estimatedDuration": "7.5 hours",
        "difficulty": "beginner"
    }'::JSONB,
    '2025-11-05 11:00:00+00'::TIMESTAMP WITH TIME ZONE,
    '2025-11-05 11:00:00+00'::TIMESTAMP WITH TIME ZONE,
    TRUE
),
(
    'a5b6c7d8-e9f0-1234-5678-901234567890'::UUID,
    'b2c3d4e5-f6a7-8901-2345-678901234567'::UUID, -- Wajdan
    '{
        "title": "Advanced SQL",
        "description": "Master complex SQL queries and database optimization",
        "modules": [
            {
                "id": "mod1",
                "title": "Window Functions",
                "duration": "4 hours",
                "completed": false
            },
            {
                "id": "mod2",
                "title": "Query Optimization",
                "duration": "3 hours",
                "completed": false
            },
            {
                "id": "mod3",
                "title": "Advanced Joins",
                "duration": "2.5 hours",
                "completed": false
            }
        ],
        "estimatedDuration": "9.5 hours",
        "difficulty": "advanced"
    }'::JSONB,
    '2025-11-06 15:30:00+00'::TIMESTAMP WITH TIME ZONE,
    '2025-11-06 15:30:00+00'::TIMESTAMP WITH TIME ZONE,
    TRUE
),
(
    'b6c7d8e9-f0a1-2345-6789-012345678901'::UUID,
    'a1b2c3d4-e5f6-4789-a012-345678901234'::UUID, -- Alice (second course)
    '{
        "title": "React Fundamentals",
        "description": "Build modern web applications with React",
        "modules": [
            {
                "id": "mod1",
                "title": "Components and Props",
                "duration": "3 hours",
                "completed": false
            },
            {
                "id": "mod2",
                "title": "State Management",
                "duration": "4 hours",
                "completed": false
            }
        ],
        "estimatedDuration": "7 hours",
        "difficulty": "intermediate"
    }'::JSONB,
    '2025-11-07 10:00:00+00'::TIMESTAMP WITH TIME ZONE,
    '2025-11-07 10:00:00+00'::TIMESTAMP WITH TIME ZONE,
    FALSE
);

-- =====================================================
-- Table: skills_gap
-- Sample skills gaps linked to learners and courses
-- =====================================================

INSERT INTO skills_gap (gap_id, user_id, company_id, company_name, user_name, created_at, last_modified_at, skills_raw_data, test_status, course_id, decision_maker_id, decision_maker_policy) VALUES
(
    'd7e8f9a0-b1c2-3456-7890-123456789012'::UUID,
    'a1b2c3d4-e5f6-4789-a012-345678901234'::UUID, -- Alice
    'c1d2e3f4-5678-9012-3456-789012345678'::UUID,
    'TechCorp Inc.',
    'Alice Johnson',
    '2025-11-04 09:00:00+00'::TIMESTAMP WITH TIME ZONE,
    '2025-11-04 09:00:00+00'::TIMESTAMP WITH TIME ZONE,
    '{
        "identifiedGaps": [
            {
                "skill": "JavaScript ES6+ Syntax",
                "level": "beginner",
                "priority": "high",
                "microSkills": [
                    "Arrow functions",
                    "Destructuring",
                    "Template literals",
                    "Spread operator"
                ]
            },
            {
                "skill": "Async/Await Patterns",
                "level": "intermediate",
                "priority": "medium",
                "microSkills": [
                    "Promise handling",
                    "Error handling in async functions",
                    "Parallel vs sequential execution"
                ]
            }
        ],
        "assessmentDate": "2025-11-04",
        "assessmentMethod": "technical_interview"
    }'::JSONB,
    'fail',
    'f4a5b6c7-d8e9-0123-4567-890123456789'::UUID, -- JavaScript Basics course
    NULL,
    'auto'
),
(
    'e8f9a0b1-c2d3-4567-8901-234567890123'::UUID,
    'b2c3d4e5-f6a7-8901-2345-678901234567'::UUID, -- Wajdan
    'c1d2e3f4-5678-9012-3456-789012345678'::UUID,
    'TechCorp Inc.',
    'Wajdan Al-Mansouri',
    '2025-11-05 10:30:00+00'::TIMESTAMP WITH TIME ZONE,
    '2025-11-05 10:30:00+00'::TIMESTAMP WITH TIME ZONE,
    '{
        "identifiedGaps": [
            {
                "skill": "Complex SQL Queries",
                "level": "advanced",
                "priority": "high",
                "microSkills": [
                    "Window functions (ROW_NUMBER, RANK, DENSE_RANK)",
                    "CTEs (Common Table Expressions)",
                    "Recursive queries",
                    "Pivot operations"
                ]
            },
            {
                "skill": "Database Performance Tuning",
                "level": "advanced",
                "priority": "medium",
                "microSkills": [
                    "Index optimization",
                    "Query execution plans",
                    "Partitioning strategies"
                ]
            }
        ],
        "assessmentDate": "2025-11-05",
        "assessmentMethod": "skills_assessment_test"
    }'::JSONB,
    'pass',
    'a5b6c7d8-e9f0-1234-5678-901234567890'::UUID, -- Advanced SQL course
    'd3e4f5a6-7890-1234-5678-901234567890'::UUID,
    'manual'
),
(
    'f9a0b1c2-d3e4-5678-9012-345678901234'::UUID,
    'c3d4e5f6-a7b8-9012-3456-789012345678'::UUID, -- Sarah
    'e4f5a6b7-8901-2345-6789-012345678901'::UUID,
    'DataSolutions Ltd.',
    'Sarah Chen',
    '2025-11-06 13:00:00+00'::TIMESTAMP WITH TIME ZONE,
    '2025-11-06 13:00:00+00'::TIMESTAMP WITH TIME ZONE,
    '{
        "identifiedGaps": [
            {
                "skill": "Data Visualization",
                "level": "intermediate",
                "priority": "high",
                "microSkills": [
                    "Chart creation with D3.js",
                    "Interactive dashboards",
                    "Data storytelling"
                ]
            }
        ],
        "assessmentDate": "2025-11-06",
        "assessmentMethod": "peer_review"
    }'::JSONB,
    NULL,
    NULL,
    NULL,
    'auto'
);

-- =====================================================
-- Table: skills_expansions
-- Sample AI-generated skill expansions
-- =====================================================

INSERT INTO skills_expansions (expansion_id, created_at, last_modified_at, prompt_1_output, prompt_2_output) VALUES
(
    'a0b1c2d3-e4f5-6789-0123-456789012345'::UUID,
    '2025-11-04 09:30:00+00'::TIMESTAMP WITH TIME ZONE,
    '2025-11-04 09:30:00+00'::TIMESTAMP WITH TIME ZONE,
    '{
        "expandedSkills": [
            {
                "originalSkill": "JavaScript ES6+ Syntax",
                "expandedTo": [
                    "Arrow Functions: Function expressions with concise syntax",
                    "Destructuring: Extracting values from arrays/objects",
                    "Template Literals: String interpolation with backticks",
                    "Spread Operator: Expanding iterables",
                    "Rest Parameters: Collecting remaining arguments",
                    "Default Parameters: Function parameter defaults"
                ]
            }
        ],
        "expansionDate": "2025-11-04",
        "model": "gemini-2.5-flash"
    }'::JSONB,
    '{
        "competencies": [
            {
                "competency": "Modern JavaScript Syntax Mastery",
                "level": "intermediate",
                "relatedSkills": [
                    "Arrow functions",
                    "Destructuring",
                    "Template literals"
                ],
                "learningObjectives": [
                    "Write clean, modern JavaScript code",
                    "Understand ES6+ features",
                    "Apply syntax improvements in real projects"
                ]
            }
        ],
        "generatedDate": "2025-11-04"
    }'::JSONB
),
(
    'b1c2d3e4-f5a6-7890-1234-567890123456'::UUID,
    '2025-11-05 11:00:00+00'::TIMESTAMP WITH TIME ZONE,
    '2025-11-05 11:00:00+00'::TIMESTAMP WITH TIME ZONE,
    '{
        "expandedSkills": [
            {
                "originalSkill": "Complex SQL Queries",
                "expandedTo": [
                    "Window Functions: ROW_NUMBER, RANK, DENSE_RANK, LAG, LEAD",
                    "CTEs: Recursive and non-recursive common table expressions",
                    "Subqueries: Correlated and non-correlated",
                    "Advanced Joins: Self-joins, cross joins, full outer joins",
                    "Aggregate Functions: GROUP BY, HAVING, ROLLUP, CUBE"
                ]
            }
        ],
        "expansionDate": "2025-11-05",
        "model": "gemini-2.5-flash"
    }'::JSONB,
    '{
        "competencies": [
            {
                "competency": "Advanced SQL Query Writing",
                "level": "expert",
                "relatedSkills": [
                    "Window functions",
                    "CTEs",
                    "Complex joins"
                ],
                "learningObjectives": [
                    "Write efficient complex queries",
                    "Optimize query performance",
                    "Handle large datasets effectively"
                ]
            }
        ],
        "generatedDate": "2025-11-05"
    }'::JSONB
);

-- =====================================================
-- Table: recommendations
-- Sample course recommendations
-- =====================================================

INSERT INTO recommendations (recommendation_id, user_id, base_course_id, suggested_courses, sent_to_rag, created_at, last_modified_at) VALUES
(
    'c2d3e4f5-a6b7-8901-2345-678901234567'::UUID,
    'a1b2c3d4-e5f6-4789-a012-345678901234'::UUID, -- Alice
    'f4a5b6c7-d8e9-0123-4567-890123456789'::UUID, -- JavaScript Basics
    '{
        "recommendations": [
            {
                "courseId": "rec1",
                "title": "JavaScript Advanced Patterns",
                "reason": "Builds on JavaScript Basics with design patterns",
                "estimatedDuration": "10 hours",
                "difficulty": "intermediate",
                "matchScore": 0.85
            },
            {
                "courseId": "rec2",
                "title": "Async JavaScript Deep Dive",
                "reason": "Addresses identified gap in async/await patterns",
                "estimatedDuration": "8 hours",
                "difficulty": "intermediate",
                "matchScore": 0.92
            },
            {
                "courseId": "rec3",
                "title": "Modern JavaScript Projects",
                "reason": "Hands-on practice with ES6+ features",
                "estimatedDuration": "12 hours",
                "difficulty": "intermediate",
                "matchScore": 0.78
            }
        ],
        "generatedDate": "2025-11-08",
        "generationMethod": "rag_enhanced"
    }'::JSONB,
    TRUE,
    '2025-11-08 14:00:00+00'::TIMESTAMP WITH TIME ZONE,
    '2025-11-08 14:00:00+00'::TIMESTAMP WITH TIME ZONE
),
(
    'd3e4f5a6-b7c8-9012-3456-789012345678'::UUID,
    'b2c3d4e5-f6a7-8901-2345-678901234567'::UUID, -- Wajdan
    'a5b6c7d8-e9f0-1234-5678-901234567890'::UUID, -- Advanced SQL
    '{
        "recommendations": [
            {
                "courseId": "rec4",
                "title": "PostgreSQL Performance Tuning",
                "reason": "Complements Advanced SQL with optimization techniques",
                "estimatedDuration": "14 hours",
                "difficulty": "advanced",
                "matchScore": 0.88
            },
            {
                "courseId": "rec5",
                "title": "Database Design Patterns",
                "reason": "Advanced database architecture concepts",
                "estimatedDuration": "16 hours",
                "difficulty": "advanced",
                "matchScore": 0.75
            }
        ],
        "generatedDate": "2025-11-09",
        "generationMethod": "rag_enhanced"
    }'::JSONB,
    TRUE,
    '2025-11-09 10:30:00+00'::TIMESTAMP WITH TIME ZONE,
    '2025-11-09 10:30:00+00'::TIMESTAMP WITH TIME ZONE
),
(
    'e4f5a6b7-c8d9-0123-4567-890123456789'::UUID,
    'a1b2c3d4-e5f6-4789-a012-345678901234'::UUID, -- Alice
    'b6c7d8e9-f0a1-2345-6789-012345678901'::UUID, -- React Fundamentals
    '{
        "recommendations": [
            {
                "courseId": "rec6",
                "title": "React Hooks and Context",
                "reason": "Next step after React Fundamentals",
                "estimatedDuration": "9 hours",
                "difficulty": "intermediate",
                "matchScore": 0.90
            }
        ],
        "generatedDate": "2025-11-10",
        "generationMethod": "rag_enhanced"
    }'::JSONB,
    FALSE,
    '2025-11-10 16:00:00+00'::TIMESTAMP WITH TIME ZONE,
    '2025-11-10 16:00:00+00'::TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- Sample Data Load Complete
-- =====================================================
-- Summary:
-- - 3 learners (Alice, Wajdan, Sarah)
-- - 3 courses (JavaScript Basics, Advanced SQL, React Fundamentals)
-- - 3 skills gaps (linked to learners and courses)
-- - 2 skill expansions (AI-generated)
-- - 3 recommendations (course suggestions)
-- 
-- All relationships are properly linked:
-- - Alice → JavaScript Basics + React Fundamentals
-- - Wajdan → Advanced SQL
-- - Skills gaps reference both learners and courses
-- - Recommendations reference base courses and suggest next steps

