-- Add two more learning paths for Sara Neer
-- This script adds TypeScript Fundamentals and Node.js Backend Development skills gaps and courses

-- =====================================================
-- 1. Add Skills Gaps for Sara Neer
-- =====================================================

-- TypeScript Fundamentals Skills Gap
INSERT INTO skills_gap (
    gap_id,
    user_id,
    company_id,
    company_name,
    user_name,
    skills_raw_data,
    exam_status,
    competency_target_name
) VALUES (
    'f9a0b1c2-d3e4-5678-9012-345678901234',
    'b2c3d4e5-f6a7-8901-2345-678901234567',
    'c1d2e3f4-5678-9012-3456-789012345678',
    'TechCorp Inc.',
    'Sara Neer',
    '{
        "Competency_TypeScript": [
            "MGS_Type_Annotations",
            "MGS_Interfaces",
            "MGS_Generics",
            "MGS_Type_Guards"
        ],
        "Competency_TypeScript_Advanced": [
            "MGS_Utility_Types",
            "MGS_Decorators"
        ]
    }'::jsonb,
    'fail',
    'TypeScript Fundamentals'
)
ON CONFLICT DO NOTHING;

-- Node.js Backend Development Skills Gap
INSERT INTO skills_gap (
    gap_id,
    user_id,
    company_id,
    company_name,
    user_name,
    skills_raw_data,
    exam_status,
    competency_target_name
) VALUES (
    'a0b1c2d3-e4f5-6789-0123-456789012345',
    'b2c3d4e5-f6a7-8901-2345-678901234567',
    'c1d2e3f4-5678-9012-3456-789012345678',
    'TechCorp Inc.',
    'Sara Neer',
    '{
        "Competency_Node_js": [
            "MGS_Express_Framework",
            "MGS_REST_API_Design",
            "MGS_Middleware_Concepts",
            "MGS_Error_Handling"
        ],
        "Competency_Database_Integration": [
            "MGS_ORM_Usage",
            "MGS_Query_Optimization"
        ]
    }'::jsonb,
    'fail',
    'Node.js Backend Development'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 2. Add Courses (Learning Paths) for Sara Neer
-- =====================================================

-- TypeScript Fundamentals Course
INSERT INTO courses (
    competency_target_name,
    user_id,
    learning_path,
    approved
) VALUES (
    'TypeScript Fundamentals',
    'b2c3d4e5-f6a7-8901-2345-678901234567',
    '{
        "pathSteps": [
            {
                "stepId": "step-012",
                "title": "TypeScript Basics",
                "description": "Type annotations and interfaces",
                "duration": 3,
                "order": 1,
                "skills": ["micro-018", "micro-019"]
            },
            {
                "stepId": "step-013",
                "title": "Advanced TypeScript",
                "description": "Generics and utility types",
                "duration": 4,
                "order": 2,
                "skills": ["micro-020", "micro-021"]
            },
            {
                "stepId": "step-014",
                "title": "TypeScript with React",
                "description": "Using TypeScript in React projects",
                "duration": 3,
                "order": 3,
                "skills": ["micro-022"]
            }
        ],
        "pathTitle": "TypeScript Fundamentals",
        "totalDurationHours": 10,
        "learningModules": [
            {"moduleId": "module-011", "name": "TypeScript Basics", "duration": 3},
            {"moduleId": "module-012", "name": "Advanced Types", "duration": 4},
            {"moduleId": "module-013", "name": "React Integration", "duration": 3}
        ],
        "metadata": {
            "generatedAt": "2025-11-06T10:00:00Z",
            "version": "1.0",
            "competencies": ["TypeScript", "TypeScript Advanced"]
        },
        "companyId": "c1d2e3f4-5678-9012-3456-789012345678",
        "competencyTargetName": "TypeScript Fundamentals",
        "status": "pending"
    }'::jsonb,
    false
)
ON CONFLICT (competency_target_name) DO UPDATE
SET learning_path = EXCLUDED.learning_path,
    user_id = EXCLUDED.user_id;

-- Node.js Backend Development Course
INSERT INTO courses (
    competency_target_name,
    user_id,
    learning_path,
    approved
) VALUES (
    'Node.js Backend Development',
    'b2c3d4e5-f6a7-8901-2345-678901234567',
    '{
        "pathSteps": [
            {
                "stepId": "step-015",
                "title": "Express Framework",
                "description": "Building REST APIs with Express",
                "duration": 5,
                "order": 1,
                "skills": ["micro-015", "micro-016"]
            },
            {
                "stepId": "step-016",
                "title": "Middleware & Best Practices",
                "description": "Advanced Express patterns",
                "duration": 4,
                "order": 2,
                "skills": ["micro-017", "micro-023"]
            },
            {
                "stepId": "step-017",
                "title": "Database Integration",
                "description": "Connecting to databases and ORM usage",
                "duration": 4,
                "order": 3,
                "skills": ["micro-024", "micro-025"]
            }
        ],
        "pathTitle": "Node.js Backend Development",
        "totalDurationHours": 13,
        "learningModules": [
            {"moduleId": "module-014", "name": "Express Framework", "duration": 5},
            {"moduleId": "module-015", "name": "Advanced Patterns", "duration": 4},
            {"moduleId": "module-016", "name": "Database Integration", "duration": 4}
        ],
        "metadata": {
            "generatedAt": "2025-11-06T14:00:00Z",
            "version": "1.0",
            "competencies": ["Node.js", "Database Integration"]
        },
        "companyId": "c1d2e3f4-5678-9012-3456-789012345678",
        "competencyTargetName": "Node.js Backend Development",
        "status": "pending"
    }'::jsonb,
    false
)
ON CONFLICT (competency_target_name) DO UPDATE
SET learning_path = EXCLUDED.learning_path,
    user_id = EXCLUDED.user_id;

-- =====================================================
-- Verify the data
-- =====================================================
SELECT 
    gap_id,
    user_name,
    competency_target_name,
    exam_status
FROM skills_gap
WHERE user_id = 'b2c3d4e5-f6a7-8901-2345-678901234567'
ORDER BY competency_target_name;

SELECT 
    competency_target_name,
    user_id,
    (learning_path->>'pathTitle') as path_title,
    (learning_path->>'totalDurationHours') as total_hours
FROM courses
WHERE user_id = 'b2c3d4e5-f6a7-8901-2345-678901234567'
ORDER BY competency_target_name;

