-- =====================================================
-- Complete Workflow Example: Skills Gap → Learning Path → Approval
-- File: complete_workflow_example.sql
-- Description: Simulates the entire process from receiving a skills gap
--              through AI processing, learning path generation, and approval request
-- =====================================================
-- 
-- This file demonstrates the complete workflow:
-- 1. Skills Gap received (from Skills Engine)
-- 2. Skills Expansion (Prompt 1 & 2 outputs saved)
-- 3. Learning Path generated (Prompt 3 output)
-- 4. Job tracking the process
-- 5. Approval request created (for manual approval companies)
--
-- Run this in Supabase SQL Editor after running init_schema_migration.sql
--
-- IMPORTANT: Before running this file, update the company to manual approval:
-- UPDATE companies SET 
--   decision_maker_policy = 'manual',
--   decision_maker = '{"employee_id": "550e8400-e29b-41d4-a716-446655440010", "employee_name": "John Manager", "employee_email": "john.manager@techcorp.com"}'::jsonb,
--   last_modified_at = NOW()
-- WHERE company_id = 'c1d2e3f4-5678-9012-3456-789012345678';
-- =====================================================

-- =====================================================
-- STEP 1: Skills Gaps Received
-- =====================================================
-- This simulates skills gaps received from the Skills Engine microservice
-- Learner: Alice Johnson (TechCorp Inc.)
-- Exam Status: FAIL for all gaps
-- 
-- Total: 6 skills gaps
-- 1. GraphQL API Development (processed through full workflow)
-- 2. Microservices Architecture
-- 3. CI/CD Pipeline Development
-- 4. Database Design & Optimization
-- 5. Cloud Security Fundamentals
-- 6. API Gateway Patterns

INSERT INTO skills_gap (
  gap_id,
  user_id,
  company_id,
  company_name,
  user_name,
  skills_raw_data,
  exam_status,
  competency_target_name,
  created_at,
  last_modified_at
) VALUES (
  'aa11bb22-cc33-dd44-ee55-ff6677889900',  -- New gap ID
  'a1b2c3d4-e5f6-4789-a012-345678901234',  -- Alice Johnson (from your database)
  'c1d2e3f4-5678-9012-3456-789012345678',  -- TechCorp Inc. (from your database)
  'TechCorp Inc.',
  'Alice Johnson',
  '{
    "Competency_GraphQL_Fundamentals": [
      "MGS_GraphQL_Schema_Definition",
      "MGS_GraphQL_Queries",
      "MGS_GraphQL_Mutations",
      "MGS_GraphQL_Subscriptions"
    ],
    "Competency_GraphQL_Server_Implementation": [
      "MGS_Apollo_Server_Setup",
      "MGS_Resolver_Functions",
      "MGS_Data_Loaders",
      "MGS_Error_Handling_GraphQL"
    ],
    "Competency_GraphQL_Advanced": [
      "MGS_GraphQL_Federation",
      "MGS_GraphQL_Caching",
      "MGS_GraphQL_Security"
    ]
  }'::jsonb,
  'fail',
  'GraphQL API Development',
  NOW() - INTERVAL '2 hours',  -- Gap received 2 hours ago
  NOW() - INTERVAL '2 hours'
)
ON CONFLICT (gap_id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  company_id = EXCLUDED.company_id,
  company_name = EXCLUDED.company_name,
  user_name = EXCLUDED.user_name,
  skills_raw_data = EXCLUDED.skills_raw_data,
  exam_status = EXCLUDED.exam_status,
  competency_target_name = EXCLUDED.competency_target_name,
  last_modified_at = EXCLUDED.last_modified_at;

-- Gap 2: Microservices Architecture
INSERT INTO skills_gap (
  gap_id,
  user_id,
  company_id,
  company_name,
  user_name,
  skills_raw_data,
  exam_status,
  competency_target_name,
  created_at,
  last_modified_at
) VALUES (
  'dd22ee33-ff44-aa55-bb66-cc7788990011',  -- New gap ID
  'a1b2c3d4-e5f6-4789-a012-345678901234',  -- Alice Johnson
  'c1d2e3f4-5678-9012-3456-789012345678',  -- TechCorp Inc.
  'TechCorp Inc.',
  'Alice Johnson',
  '{
    "Competency_Microservices_Fundamentals": [
      "MGS_Service_Decomposition",
      "MGS_Service_Communication",
      "MGS_API_Gateway_Patterns",
      "MGS_Service_Discovery"
    ],
    "Competency_Microservices_Architecture": [
      "MGS_Domain_Driven_Design",
      "MGS_Event_Driven_Architecture",
      "MGS_Distributed_Systems",
      "MGS_Container_Orchestration"
    ],
    "Competency_Microservices_Operations": [
      "MGS_Distributed_Tracing",
      "MGS_Circuit_Breaker_Pattern",
      "MGS_Service_Mesh"
    ]
  }'::jsonb,
  'fail',
  'Microservices Architecture',
  NOW() - INTERVAL '1 day 12 hours',  -- Gap received 1.5 days ago
  NOW() - INTERVAL '1 day 12 hours'
)
ON CONFLICT (gap_id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  company_id = EXCLUDED.company_id,
  company_name = EXCLUDED.company_name,
  user_name = EXCLUDED.user_name,
  skills_raw_data = EXCLUDED.skills_raw_data,
  exam_status = EXCLUDED.exam_status,
  competency_target_name = EXCLUDED.competency_target_name,
  last_modified_at = EXCLUDED.last_modified_at;

-- Gap 3: CI/CD Pipeline Development
INSERT INTO skills_gap (
  gap_id,
  user_id,
  company_id,
  company_name,
  user_name,
  skills_raw_data,
  exam_status,
  competency_target_name,
  created_at,
  last_modified_at
) VALUES (
  'ee33ff44-aa55-bb66-cc77-dd8899001122',  -- New gap ID
  'a1b2c3d4-e5f6-4789-a012-345678901234',  -- Alice Johnson
  'c1d2e3f4-5678-9012-3456-789012345678',  -- TechCorp Inc.
  'TechCorp Inc.',
  'Alice Johnson',
  '{
    "Competency_CI_CD_Fundamentals": [
      "MGS_Continuous_Integration",
      "MGS_Continuous_Deployment",
      "MGS_Pipeline_Automation",
      "MGS_Build_Automation"
    ],
    "Competency_CI_CD_Tools": [
      "MGS_Jenkins_Pipeline",
      "MGS_GitHub_Actions",
      "MGS_GitLab_CI",
      "MGS_Docker_Integration"
    ],
    "Competency_DevOps_Practices": [
      "MGS_Infrastructure_as_Code",
      "MGS_Deployment_Strategies",
      "MGS_Rollback_Procedures"
    ]
  }'::jsonb,
  'fail',
  'CI/CD Pipeline Development',
  NOW() - INTERVAL '3 days',  -- Gap received 3 days ago
  NOW() - INTERVAL '3 days'
)
ON CONFLICT (gap_id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  company_id = EXCLUDED.company_id,
  company_name = EXCLUDED.company_name,
  user_name = EXCLUDED.user_name,
  skills_raw_data = EXCLUDED.skills_raw_data,
  exam_status = EXCLUDED.exam_status,
  competency_target_name = EXCLUDED.competency_target_name,
  last_modified_at = EXCLUDED.last_modified_at;

-- Gap 4: Database Design & Optimization
INSERT INTO skills_gap (
  gap_id,
  user_id,
  company_id,
  company_name,
  user_name,
  skills_raw_data,
  exam_status,
  competency_target_name,
  created_at,
  last_modified_at
) VALUES (
  'ff44aa55-bb66-cc77-dd88-ee9900112233',  -- New gap ID
  'a1b2c3d4-e5f6-4789-a012-345678901234',  -- Alice Johnson
  'c1d2e3f4-5678-9012-3456-789012345678',  -- TechCorp Inc.
  'TechCorp Inc.',
  'Alice Johnson',
  '{
    "Competency_Database_Design": [
      "MGS_Relational_Database_Design",
      "MGS_Normalization",
      "MGS_Entity_Relationship_Modeling",
      "MGS_Database_Schema_Design"
    ],
    "Competency_Database_Optimization": [
      "MGS_Query_Optimization",
      "MGS_Index_Design",
      "MGS_Performance_Tuning",
      "MGS_Query_Execution_Plans"
    ],
    "Competency_Database_Advanced": [
      "MGS_Transaction_Management",
      "MGS_Concurrency_Control",
      "MGS_Database_Scaling"
    ]
  }'::jsonb,
  'fail',
  'Database Design & Optimization',
  NOW() - INTERVAL '4 days',  -- Gap received 4 days ago
  NOW() - INTERVAL '4 days'
)
ON CONFLICT (gap_id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  company_id = EXCLUDED.company_id,
  company_name = EXCLUDED.company_name,
  user_name = EXCLUDED.user_name,
  skills_raw_data = EXCLUDED.skills_raw_data,
  exam_status = EXCLUDED.exam_status,
  competency_target_name = EXCLUDED.competency_target_name,
  last_modified_at = EXCLUDED.last_modified_at;

-- Gap 5: Cloud Security Fundamentals
INSERT INTO skills_gap (
  gap_id,
  user_id,
  company_id,
  company_name,
  user_name,
  skills_raw_data,
  exam_status,
  competency_target_name,
  created_at,
  last_modified_at
) VALUES (
  'aa55bb66-cc77-dd88-ee99-ff0011223344',  -- New gap ID
  'a1b2c3d4-e5f6-4789-a012-345678901234',  -- Alice Johnson
  'c1d2e3f4-5678-9012-3456-789012345678',  -- TechCorp Inc.
  'TechCorp Inc.',
  'Alice Johnson',
  '{
    "Competency_Cloud_Security_Basics": [
      "MGS_Identity_Access_Management",
      "MGS_Encryption_At_Rest",
      "MGS_Encryption_In_Transit",
      "MGS_Security_Groups"
    ],
    "Competency_Cloud_Security_Advanced": [
      "MGS_VPC_Security",
      "MGS_Network_Security",
      "MGS_Security_Monitoring",
      "MGS_Compliance_Frameworks"
    ],
    "Competency_Threat_Management": [
      "MGS_Vulnerability_Assessment",
      "MGS_Penetration_Testing",
      "MGS_Incident_Response"
    ]
  }'::jsonb,
  'fail',
  'Cloud Security Fundamentals',
  NOW() - INTERVAL '5 days',  -- Gap received 5 days ago
  NOW() - INTERVAL '5 days'
)
ON CONFLICT (gap_id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  company_id = EXCLUDED.company_id,
  company_name = EXCLUDED.company_name,
  user_name = EXCLUDED.user_name,
  skills_raw_data = EXCLUDED.skills_raw_data,
  exam_status = EXCLUDED.exam_status,
  competency_target_name = EXCLUDED.competency_target_name,
  last_modified_at = EXCLUDED.last_modified_at;

-- Gap 6: API Gateway Patterns
INSERT INTO skills_gap (
  gap_id,
  user_id,
  company_id,
  company_name,
  user_name,
  skills_raw_data,
  exam_status,
  competency_target_name,
  created_at,
  last_modified_at
) VALUES (
  'bb66cc77-dd88-ee99-ff00-aa1122334455',  -- New gap ID
  'a1b2c3d4-e5f6-4789-a012-345678901234',  -- Alice Johnson
  'c1d2e3f4-5678-9012-3456-789012345678',  -- TechCorp Inc.
  'TechCorp Inc.',
  'Alice Johnson',
  '{
    "Competency_API_Gateway_Fundamentals": [
      "MGS_API_Gateway_Concepts",
      "MGS_Routing_Strategies",
      "MGS_Request_Response_Transformation",
      "MGS_Load_Balancing"
    ],
    "Competency_API_Gateway_Advanced": [
      "MGS_Rate_Limiting",
      "MGS_Caching_Strategies",
      "MGS_Circuit_Breaker",
      "MGS_API_Versioning"
    ],
    "Competency_API_Security": [
      "MGS_Authentication_Authorization",
      "MGS_OAuth_JWT",
      "MGS_API_Key_Management"
    ]
  }'::jsonb,
  'fail',
  'API Gateway Patterns',
  NOW() - INTERVAL '6 days',  -- Gap received 6 days ago
  NOW() - INTERVAL '6 days'
)
ON CONFLICT (gap_id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  company_id = EXCLUDED.company_id,
  company_name = EXCLUDED.company_name,
  user_name = EXCLUDED.user_name,
  skills_raw_data = EXCLUDED.skills_raw_data,
  exam_status = EXCLUDED.exam_status,
  competency_target_name = EXCLUDED.competency_target_name,
  last_modified_at = EXCLUDED.last_modified_at;

-- =====================================================
-- STEP 2: Job Created for Learning Path Generation
-- =====================================================
-- A background job is created to track the learning path generation process

INSERT INTO jobs (
  id,
  user_id,
  company_id,
  competency_target_name,
  type,
  status,
  progress,
  current_stage,
  result,
  error,
  created_at,
  updated_at
) VALUES (
  'bb22cc33-dd44-ee55-ff66-aa7788990011',  -- Job ID
  'a1b2c3d4-e5f6-4789-a012-345678901234',  -- Alice Johnson
  'c1d2e3f4-5678-9012-3456-789012345678',  -- TechCorp Inc.
  'GraphQL API Development',
  'path-generation',
  'completed',  -- Job completed successfully
  100,
  'path-creation',
  jsonb_build_object(
    'learningPathId', 'GraphQL API Development',
    'generatedAt', (NOW())::text,
    'stepsCount', 4,
    'totalDuration', 35
  ),
  NULL,
  NOW() - INTERVAL '1 hour 50 minutes',  -- Job started 1h50m ago
  NOW() - INTERVAL '10 minutes'  -- Job completed 10 minutes ago
)
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  company_id = EXCLUDED.company_id,
  competency_target_name = EXCLUDED.competency_target_name,
  type = EXCLUDED.type,
  status = EXCLUDED.status,
  progress = EXCLUDED.progress,
  current_stage = EXCLUDED.current_stage,
  result = EXCLUDED.result,
  error = EXCLUDED.error,
  updated_at = EXCLUDED.updated_at;

-- =====================================================
-- STEP 3: Skills Expansion (Prompt 1 & 2 Outputs)
-- =====================================================
-- After Prompt 1 (Skill Expansion) and Prompt 2 (Competency Identification)
-- The outputs are saved to skills_expansions table

INSERT INTO skills_expansions (
  expansion_id,
  gap_id,
  user_id,
  prompt_1_output,
  prompt_2_output,
  created_at,
  last_modified_at
) VALUES (
  'cc33dd44-ee55-ff66-aa77-bb8899001122',  -- Expansion ID
  'aa11bb22-cc33-dd44-ee55-ff6677889900',  -- Links to skills gap above
  'a1b2c3d4-e5f6-4789-a012-345678901234',  -- Alice Johnson
  -- Prompt 1 Output: Skill Expansion
  jsonb_build_object(
    'expanded_competencies_list', jsonb_build_array(
      jsonb_build_object(
        'competency_name', 'GraphQL Fundamentals',
        'justification', 'Essential foundation for building GraphQL APIs. Covers schema definition, queries, mutations, and subscriptions which are core to GraphQL development.'
      ),
      jsonb_build_object(
        'competency_name', 'GraphQL Server Implementation',
        'justification', 'Critical for backend development. Includes Apollo Server setup, resolver functions, data loaders for N+1 problem, and proper error handling in GraphQL context.'
      ),
      jsonb_build_object(
        'competency_name', 'GraphQL Advanced Patterns',
        'justification', 'Advanced topics needed for production-ready GraphQL APIs. Covers federation for microservices, caching strategies, and security best practices.'
      ),
      jsonb_build_object(
        'competency_name', 'REST to GraphQL Migration',
        'justification', 'Practical skill for transitioning existing REST APIs to GraphQL, understanding when and how to migrate effectively.'
      ),
      jsonb_build_object(
        'competency_name', 'GraphQL Performance Optimization',
        'justification', 'Important for scalable applications. Includes query complexity analysis, depth limiting, and efficient data fetching strategies.'
      )
    ),
    'generatedAt', (NOW() - INTERVAL '1 hour 30 minutes')::text
  ),
  -- Prompt 2 Output: Competency Identification (for Skills Engine)
  jsonb_build_object(
    'competencies_for_skills_engine_processing', jsonb_build_array(
      'GraphQL Fundamentals',
      'GraphQL Server Implementation',
      'GraphQL Advanced Patterns'
    ),
    'reasoning', 'These three competencies directly address the identified gaps in GraphQL schema definition, server implementation, and advanced patterns. They form a comprehensive learning path for GraphQL API development.',
    'generatedAt', (NOW() - INTERVAL '1 hour 20 minutes')::text
  ),
  NOW() - INTERVAL '1 hour 30 minutes',  -- Created when Prompt 1 completed
  NOW() - INTERVAL '1 hour 20 minutes'  -- Updated when Prompt 2 completed
)
ON CONFLICT (expansion_id) DO UPDATE SET
  gap_id = EXCLUDED.gap_id,
  user_id = EXCLUDED.user_id,
  prompt_1_output = EXCLUDED.prompt_1_output,
  prompt_2_output = EXCLUDED.prompt_2_output,
  last_modified_at = EXCLUDED.last_modified_at;

-- =====================================================
-- STEP 4: Learning Path Generated (Prompt 3 Output)
-- =====================================================
-- After Prompt 3 (Path Creation), the learning path is saved to courses table
-- This learning path was generated using:
-- - Initial skills gap data
-- - Expanded competencies from Prompt 1
-- - Skills breakdown from Skills Engine (micro/nano skills)

INSERT INTO courses (
  competency_target_name,
  user_id,
  gap_id,
  learning_path,
  approved,
  created_at,
  last_modified_at
) VALUES (
  'GraphQL API Development',  -- Must match competency_target_name from skills_gap
  'a1b2c3d4-e5f6-4789-a012-345678901234',  -- Alice Johnson
  'aa11bb22-cc33-dd44-ee55-ff6677889900',  -- Links to skills gap
  -- Learning Path (Prompt 3 Output)
  '{
    "pathTitle": "GraphQL API Development",
    "pathGoal": "Master GraphQL API development from fundamentals to advanced patterns",
    "pathDescription": "Comprehensive learning path covering GraphQL schema design, server implementation with Apollo, resolver patterns, and production-ready practices for building scalable GraphQL APIs.",
    "totalDurationHours": 35,
    "difficulty": "Intermediate",
    "audience": "Backend Developers, Fullstack Engineers",
    "learning_modules": [
      {
        "module_title": "GraphQL Fundamentals",
        "module_description": "Learn the core concepts of GraphQL including schema definition, type system, queries, mutations, and subscriptions.",
        "subtopics": [
          {
            "title": "GraphQL Schema Definition",
            "description": "Understanding GraphQL schema syntax, types, and directives"
          },
          {
            "title": "Queries and Mutations",
            "description": "Writing and executing queries and mutations in GraphQL"
          },
          {
            "title": "Subscriptions",
            "description": "Real-time data with GraphQL subscriptions"
          },
          {
            "title": "Type System",
            "description": "Scalars, objects, interfaces, unions, and enums in GraphQL"
          }
        ]
      },
      {
        "module_title": "GraphQL Server Implementation",
        "module_description": "Build GraphQL servers using Apollo Server, implement resolvers, handle data loading, and manage errors effectively.",
        "subtopics": [
          {
            "title": "Apollo Server Setup",
            "description": "Setting up Apollo Server with Express and configuring the GraphQL endpoint"
          },
          {
            "title": "Resolver Functions",
            "description": "Implementing resolvers for queries, mutations, and field resolvers"
          },
          {
            "title": "Data Loaders",
            "description": "Solving N+1 query problems with DataLoader pattern"
          },
          {
            "title": "Error Handling",
            "description": "Proper error handling and custom error types in GraphQL"
          }
        ]
      },
      {
        "module_title": "GraphQL Advanced Patterns",
        "module_description": "Advanced GraphQL patterns including federation, caching strategies, and security best practices.",
        "subtopics": [
          {
            "title": "GraphQL Federation",
            "description": "Building distributed GraphQL APIs with Apollo Federation"
          },
          {
            "title": "Caching Strategies",
            "description": "Implementing caching for GraphQL queries and responses"
          },
          {
            "title": "Security Best Practices",
            "description": "Authentication, authorization, query depth limiting, and complexity analysis"
          },
          {
            "title": "Performance Optimization",
            "description": "Query optimization, batching, and efficient data fetching"
          }
        ]
      },
      {
        "module_title": "Production Deployment",
        "module_description": "Deploying GraphQL APIs to production with monitoring, logging, and best practices.",
        "subtopics": [
          {
            "title": "Deployment Strategies",
            "description": "Deploying GraphQL servers to cloud platforms"
          },
          {
            "title": "Monitoring and Logging",
            "description": "Setting up monitoring and logging for GraphQL APIs"
          },
          {
            "title": "Testing GraphQL APIs",
            "description": "Writing tests for GraphQL schemas and resolvers"
          }
        ]
      }
    ],
    "estimatedCompletion": "7-8 weeks",
    "metadata": {
      "generatedAt": "2025-11-22T18:00:00Z",
      "version": "1.0",
      "competencies": [
        "GraphQL Fundamentals",
        "GraphQL Server Implementation",
        "GraphQL Advanced Patterns"
      ]
    }
  }'::jsonb,
  false,  -- Not approved yet (requires manual approval)
  NOW() - INTERVAL '10 minutes',  -- Created when Prompt 3 completed
  NOW() - INTERVAL '10 minutes'
)
ON CONFLICT (competency_target_name) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  gap_id = EXCLUDED.gap_id,
  learning_path = EXCLUDED.learning_path,
  approved = EXCLUDED.approved,
  last_modified_at = EXCLUDED.last_modified_at;

-- =====================================================
-- STEP 5: Approval Request Created
-- =====================================================
-- Since TechCorp Inc. has manual approval policy (decision_maker_policy: 'manual'),
-- an approval request is automatically created for the decision maker
-- Decision Maker: John Manager (550e8400-e29b-41d4-a716-446655440010)
--
-- Note: Before running this file, make sure to update the company to manual approval:
-- UPDATE companies SET decision_maker_policy = 'manual', 
--   decision_maker = '{"employee_id": "550e8400-e29b-41d4-a716-446655440010", "employee_name": "John Manager", "employee_email": "john.manager@techcorp.com"}'::jsonb
-- WHERE company_id = 'c1d2e3f4-5678-9012-3456-789012345678';

INSERT INTO path_approvals (
  id,
  learning_path_id,  -- References courses.competency_target_name (TEXT)
  company_id,
  decision_maker_id,  -- UUID from companies.decision_maker JSONB
  status,
  feedback,
  approved_at,
  rejected_at,
  changes_requested_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'GraphQL API Development',  -- Must match courses.competency_target_name
  'c1d2e3f4-5678-9012-3456-789012345678',  -- TechCorp Inc.
  '550e8400-e29b-41d4-a716-446655440010',  -- John Manager (from TechCorp's decision_maker JSONB)
  'pending',  -- Awaiting decision maker review
  NULL,  -- No feedback yet
  NULL,  -- Not approved yet
  NULL,  -- Not rejected yet
  NULL,  -- No changes requested yet
  NOW() - INTERVAL '5 minutes',  -- Approval request created 5 minutes ago
  NOW() - INTERVAL '5 minutes'
)
ON CONFLICT DO NOTHING;

-- =====================================================
-- COMPLETE WORKFLOW FOR GAP 2: Microservices Architecture
-- =====================================================

-- Job for Microservices
INSERT INTO jobs (
  id, user_id, company_id, competency_target_name, type, status, progress, current_stage, result, error, created_at, updated_at
) VALUES (
  'dd22ee33-ff44-aa55-bb66-cc7788990022', 'a1b2c3d4-e5f6-4789-a012-345678901234', 'c1d2e3f4-5678-9012-3456-789012345678',
  'Microservices Architecture', 'path-generation', 'completed', 100, 'path-creation',
  jsonb_build_object('learningPathId', 'Microservices Architecture', 'generatedAt', (NOW() - INTERVAL '1 day 10 hours')::text, 'stepsCount', 4, 'totalDuration', 40),
  NULL, NOW() - INTERVAL '1 day 12 hours', NOW() - INTERVAL '1 day 10 hours'
) ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, company_id = EXCLUDED.company_id, competency_target_name = EXCLUDED.competency_target_name, type = EXCLUDED.type, status = EXCLUDED.status, progress = EXCLUDED.progress, current_stage = EXCLUDED.current_stage, result = EXCLUDED.result, error = EXCLUDED.error, updated_at = EXCLUDED.updated_at;

-- Skills Expansion for Microservices
INSERT INTO skills_expansions (expansion_id, gap_id, user_id, prompt_1_output, prompt_2_output, created_at, last_modified_at) VALUES (
  'dd22ee33-ff44-aa55-bb66-cc7788990033', 'dd22ee33-ff44-aa55-bb66-cc7788990011', 'a1b2c3d4-e5f6-4789-a012-345678901234',
  jsonb_build_object('expanded_competencies_list', jsonb_build_array(
    jsonb_build_object('competency_name', 'Microservices Fundamentals', 'justification', 'Core concepts of microservices architecture including service decomposition and communication patterns.'),
    jsonb_build_object('competency_name', 'Microservices Architecture Patterns', 'justification', 'Domain-driven design, event-driven architecture, and distributed systems patterns essential for microservices.'),
    jsonb_build_object('competency_name', 'Microservices Operations', 'justification', 'Distributed tracing, circuit breakers, and service mesh for production-ready microservices.')
  ), 'generatedAt', (NOW() - INTERVAL '1 day 11 hours')::text),
  jsonb_build_object('competencies_for_skills_engine_processing', jsonb_build_array('Microservices Fundamentals', 'Microservices Architecture Patterns', 'Microservices Operations'), 'reasoning', 'These competencies cover the full spectrum from fundamentals to advanced operations for microservices development.', 'generatedAt', (NOW() - INTERVAL '1 day 10 hours 30 minutes')::text),
  NOW() - INTERVAL '1 day 11 hours', NOW() - INTERVAL '1 day 10 hours 30 minutes'
) ON CONFLICT (expansion_id) DO UPDATE SET gap_id = EXCLUDED.gap_id, user_id = EXCLUDED.user_id, prompt_1_output = EXCLUDED.prompt_1_output, prompt_2_output = EXCLUDED.prompt_2_output, last_modified_at = EXCLUDED.last_modified_at;

-- Course for Microservices
INSERT INTO courses (competency_target_name, user_id, gap_id, learning_path, approved, created_at, last_modified_at) VALUES (
  'Microservices Architecture', 'a1b2c3d4-e5f6-4789-a012-345678901234', 'dd22ee33-ff44-aa55-bb66-cc7788990011',
  '{"pathTitle": "Microservices Architecture", "pathGoal": "Master microservices architecture from fundamentals to production deployment", "pathDescription": "Comprehensive guide to building scalable microservices applications with modern patterns and best practices.", "totalDurationHours": 40, "difficulty": "Advanced", "audience": "Backend Engineers, Software Architects", "learning_modules": [{"module_title": "Microservices Fundamentals", "module_description": "Core concepts of microservices including service decomposition and communication patterns.", "subtopics": [{"title": "Service Decomposition", "description": "Breaking down monolithic applications into microservices"}, {"title": "Service Communication", "description": "Synchronous and asynchronous communication patterns"}, {"title": "API Gateway Patterns", "description": "Centralized API management and routing"}]}, {"module_title": "Microservices Architecture Patterns", "module_description": "Domain-driven design, event-driven architecture, and distributed systems patterns.", "subtopics": [{"title": "Domain-Driven Design", "description": "DDD principles for microservices boundaries"}, {"title": "Event-Driven Architecture", "description": "Event sourcing and CQRS patterns"}, {"title": "Distributed Systems", "description": "Handling distributed transactions and consistency"}]}, {"module_title": "Container Orchestration", "module_description": "Deploying and managing microservices with Kubernetes.", "subtopics": [{"title": "Kubernetes Basics", "description": "Pods, services, and deployments"}, {"title": "Service Discovery", "description": "Service mesh and service discovery patterns"}]}, {"module_title": "Microservices Operations", "module_description": "Monitoring, tracing, and managing microservices in production.", "subtopics": [{"title": "Distributed Tracing", "description": "Tracing requests across microservices"}, {"title": "Circuit Breaker Pattern", "description": "Fault tolerance and resilience patterns"}, {"title": "Service Mesh", "description": "Istio and Linkerd for service mesh"}]}], "estimatedCompletion": "8-10 weeks", "metadata": {"generatedAt": "2025-11-22T18:00:00Z", "version": "1.0", "competencies": ["Microservices Fundamentals", "Microservices Architecture Patterns", "Microservices Operations"]}}'::jsonb,
  false, NOW() - INTERVAL '1 day 10 hours', NOW() - INTERVAL '1 day 10 hours'
) ON CONFLICT (competency_target_name) DO UPDATE SET user_id = EXCLUDED.user_id, gap_id = EXCLUDED.gap_id, learning_path = EXCLUDED.learning_path, approved = EXCLUDED.approved, last_modified_at = EXCLUDED.last_modified_at;

-- Approval for Microservices
INSERT INTO path_approvals (id, learning_path_id, company_id, decision_maker_id, status, feedback, approved_at, rejected_at, changes_requested_at, created_at, updated_at) VALUES (
  gen_random_uuid(), 'Microservices Architecture', 'c1d2e3f4-5678-9012-3456-789012345678', '550e8400-e29b-41d4-a716-446655440010',
  'pending', NULL, NULL, NULL, NULL, NOW() - INTERVAL '1 day 9 hours', NOW() - INTERVAL '1 day 9 hours'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- COMPLETE WORKFLOW FOR GAP 3: CI/CD Pipeline Development
-- =====================================================

-- Job for CI/CD
INSERT INTO jobs (id, user_id, company_id, competency_target_name, type, status, progress, current_stage, result, error, created_at, updated_at) VALUES (
  'ee33ff44-aa55-bb66-cc77-dd8899002233', 'a1b2c3d4-e5f6-4789-a012-345678901234', 'c1d2e3f4-5678-9012-3456-789012345678',
  'CI/CD Pipeline Development', 'path-generation', 'completed', 100, 'path-creation',
  jsonb_build_object('learningPathId', 'CI/CD Pipeline Development', 'generatedAt', (NOW() - INTERVAL '2 days 20 hours')::text, 'stepsCount', 3, 'totalDuration', 30),
  NULL, NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days 20 hours'
) ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, company_id = EXCLUDED.company_id, competency_target_name = EXCLUDED.competency_target_name, type = EXCLUDED.type, status = EXCLUDED.status, progress = EXCLUDED.progress, current_stage = EXCLUDED.current_stage, result = EXCLUDED.result, error = EXCLUDED.error, updated_at = EXCLUDED.updated_at;

-- Skills Expansion for CI/CD
INSERT INTO skills_expansions (expansion_id, gap_id, user_id, prompt_1_output, prompt_2_output, created_at, last_modified_at) VALUES (
  'ee33ff44-aa55-bb66-cc77-dd8899003344', 'ee33ff44-aa55-bb66-cc77-dd8899001122', 'a1b2c3d4-e5f6-4789-a012-345678901234',
  jsonb_build_object('expanded_competencies_list', jsonb_build_array(
    jsonb_build_object('competency_name', 'CI/CD Fundamentals', 'justification', 'Core concepts of continuous integration and continuous deployment pipelines.'),
    jsonb_build_object('competency_name', 'CI/CD Tools', 'justification', 'Hands-on experience with Jenkins, GitHub Actions, and GitLab CI for automation.'),
    jsonb_build_object('competency_name', 'DevOps Practices', 'justification', 'Infrastructure as code, deployment strategies, and rollback procedures.')
  ), 'generatedAt', (NOW() - INTERVAL '2 days 22 hours')::text),
  jsonb_build_object('competencies_for_skills_engine_processing', jsonb_build_array('CI/CD Fundamentals', 'CI/CD Tools', 'DevOps Practices'), 'reasoning', 'These competencies provide comprehensive coverage from CI/CD basics to advanced DevOps practices.', 'generatedAt', (NOW() - INTERVAL '2 days 21 hours')::text),
  NOW() - INTERVAL '2 days 22 hours', NOW() - INTERVAL '2 days 21 hours'
) ON CONFLICT (expansion_id) DO UPDATE SET gap_id = EXCLUDED.gap_id, user_id = EXCLUDED.user_id, prompt_1_output = EXCLUDED.prompt_1_output, prompt_2_output = EXCLUDED.prompt_2_output, last_modified_at = EXCLUDED.last_modified_at;

-- Course for CI/CD
INSERT INTO courses (competency_target_name, user_id, gap_id, learning_path, approved, created_at, last_modified_at) VALUES (
  'CI/CD Pipeline Development', 'a1b2c3d4-e5f6-4789-a012-345678901234', 'ee33ff44-aa55-bb66-cc77-dd8899001122',
  '{"pathTitle": "CI/CD Pipeline Development", "pathGoal": "Master CI/CD pipeline development and DevOps automation", "pathDescription": "Learn to build, automate, and optimize CI/CD pipelines using modern tools and best practices.", "totalDurationHours": 30, "difficulty": "Intermediate", "audience": "DevOps Engineers, Software Engineers", "learning_modules": [{"module_title": "CI/CD Fundamentals", "module_description": "Understanding continuous integration and continuous deployment concepts.", "subtopics": [{"title": "Continuous Integration", "description": "Automated testing and build processes"}, {"title": "Continuous Deployment", "description": "Automated deployment strategies"}, {"title": "Pipeline Automation", "description": "Building automated workflows"}]}, {"module_title": "CI/CD Tools", "module_description": "Hands-on experience with popular CI/CD platforms.", "subtopics": [{"title": "Jenkins Pipelines", "description": "Creating Jenkins pipelines with Groovy"}, {"title": "GitHub Actions", "description": "Workflow automation with GitHub Actions"}, {"title": "GitLab CI", "description": "CI/CD with GitLab CI/CD"}]}, {"module_title": "DevOps Practices", "module_description": "Advanced DevOps practices for production environments.", "subtopics": [{"title": "Infrastructure as Code", "description": "Terraform and CloudFormation"}, {"title": "Deployment Strategies", "description": "Blue-green, canary, and rolling deployments"}, {"title": "Rollback Procedures", "description": "Safe rollback strategies"}]}], "estimatedCompletion": "6-8 weeks", "metadata": {"generatedAt": "2025-11-22T18:00:00Z", "version": "1.0", "competencies": ["CI/CD Fundamentals", "CI/CD Tools", "DevOps Practices"]}}'::jsonb,
  false, NOW() - INTERVAL '2 days 20 hours', NOW() - INTERVAL '2 days 20 hours'
) ON CONFLICT (competency_target_name) DO UPDATE SET user_id = EXCLUDED.user_id, gap_id = EXCLUDED.gap_id, learning_path = EXCLUDED.learning_path, approved = EXCLUDED.approved, last_modified_at = EXCLUDED.last_modified_at;

-- Approval for CI/CD
INSERT INTO path_approvals (id, learning_path_id, company_id, decision_maker_id, status, feedback, approved_at, rejected_at, changes_requested_at, created_at, updated_at) VALUES (
  gen_random_uuid(), 'CI/CD Pipeline Development', 'c1d2e3f4-5678-9012-3456-789012345678', '550e8400-e29b-41d4-a716-446655440010',
  'pending', NULL, NULL, NULL, NULL, NOW() - INTERVAL '2 days 19 hours', NOW() - INTERVAL '2 days 19 hours'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- COMPLETE WORKFLOW FOR GAP 4: Database Design & Optimization
-- =====================================================

-- Job for Database
INSERT INTO jobs (id, user_id, company_id, competency_target_name, type, status, progress, current_stage, result, error, created_at, updated_at) VALUES (
  'ff44aa55-bb66-cc77-dd88-ee9900113344', 'a1b2c3d4-e5f6-4789-a012-345678901234', 'c1d2e3f4-5678-9012-3456-789012345678',
  'Database Design & Optimization', 'path-generation', 'completed', 100, 'path-creation',
  jsonb_build_object('learningPathId', 'Database Design & Optimization', 'generatedAt', (NOW() - INTERVAL '3 days 20 hours')::text, 'stepsCount', 4, 'totalDuration', 35),
  NULL, NOW() - INTERVAL '4 days', NOW() - INTERVAL '3 days 20 hours'
) ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, company_id = EXCLUDED.company_id, competency_target_name = EXCLUDED.competency_target_name, type = EXCLUDED.type, status = EXCLUDED.status, progress = EXCLUDED.progress, current_stage = EXCLUDED.current_stage, result = EXCLUDED.result, error = EXCLUDED.error, updated_at = EXCLUDED.updated_at;

-- Skills Expansion for Database
INSERT INTO skills_expansions (expansion_id, gap_id, user_id, prompt_1_output, prompt_2_output, created_at, last_modified_at) VALUES (
  'ff44aa55-bb66-cc77-dd88-ee9900114455', 'ff44aa55-bb66-cc77-dd88-ee9900112233', 'a1b2c3d4-e5f6-4789-a012-345678901234',
  jsonb_build_object('expanded_competencies_list', jsonb_build_array(
    jsonb_build_object('competency_name', 'Database Design', 'justification', 'Fundamental database design principles including normalization and ER modeling.'),
    jsonb_build_object('competency_name', 'Database Optimization', 'justification', 'Query optimization, index design, and performance tuning techniques.'),
    jsonb_build_object('competency_name', 'Database Advanced', 'justification', 'Transaction management, concurrency control, and database scaling strategies.')
  ), 'generatedAt', (NOW() - INTERVAL '3 days 22 hours')::text),
  jsonb_build_object('competencies_for_skills_engine_processing', jsonb_build_array('Database Design', 'Database Optimization', 'Database Advanced'), 'reasoning', 'These competencies cover the complete database lifecycle from design to optimization and scaling.', 'generatedAt', (NOW() - INTERVAL '3 days 21 hours')::text),
  NOW() - INTERVAL '3 days 22 hours', NOW() - INTERVAL '3 days 21 hours'
) ON CONFLICT (expansion_id) DO UPDATE SET gap_id = EXCLUDED.gap_id, user_id = EXCLUDED.user_id, prompt_1_output = EXCLUDED.prompt_1_output, prompt_2_output = EXCLUDED.prompt_2_output, last_modified_at = EXCLUDED.last_modified_at;

-- Course for Database
INSERT INTO courses (competency_target_name, user_id, gap_id, learning_path, approved, created_at, last_modified_at) VALUES (
  'Database Design & Optimization', 'a1b2c3d4-e5f6-4789-a012-345678901234', 'ff44aa55-bb66-cc77-dd88-ee9900112233',
  '{"pathTitle": "Database Design & Optimization", "pathGoal": "Master database design principles and optimization techniques", "pathDescription": "Comprehensive guide to designing efficient databases and optimizing query performance.", "totalDurationHours": 35, "difficulty": "Intermediate", "audience": "Database Administrators, Backend Engineers", "learning_modules": [{"module_title": "Database Design", "module_description": "Fundamental database design principles and best practices.", "subtopics": [{"title": "Relational Database Design", "description": "Designing normalized relational databases"}, {"title": "Normalization", "description": "Normal forms and database normalization"}, {"title": "Entity Relationship Modeling", "description": "ER diagrams and relationship modeling"}]}, {"module_title": "Database Optimization", "module_description": "Query optimization and performance tuning techniques.", "subtopics": [{"title": "Query Optimization", "description": "Writing efficient SQL queries"}, {"title": "Index Design", "description": "Creating and maintaining database indexes"}, {"title": "Performance Tuning", "description": "Database performance analysis and tuning"}]}, {"module_title": "Database Advanced", "module_description": "Advanced database concepts for production systems.", "subtopics": [{"title": "Transaction Management", "description": "ACID properties and transaction isolation"}, {"title": "Concurrency Control", "description": "Handling concurrent database access"}, {"title": "Database Scaling", "description": "Horizontal and vertical scaling strategies"}]}], "estimatedCompletion": "7-9 weeks", "metadata": {"generatedAt": "2025-11-22T18:00:00Z", "version": "1.0", "competencies": ["Database Design", "Database Optimization", "Database Advanced"]}}'::jsonb,
  false, NOW() - INTERVAL '3 days 20 hours', NOW() - INTERVAL '3 days 20 hours'
) ON CONFLICT (competency_target_name) DO UPDATE SET user_id = EXCLUDED.user_id, gap_id = EXCLUDED.gap_id, learning_path = EXCLUDED.learning_path, approved = EXCLUDED.approved, last_modified_at = EXCLUDED.last_modified_at;

-- Approval for Database
INSERT INTO path_approvals (id, learning_path_id, company_id, decision_maker_id, status, feedback, approved_at, rejected_at, changes_requested_at, created_at, updated_at) VALUES (
  gen_random_uuid(), 'Database Design & Optimization', 'c1d2e3f4-5678-9012-3456-789012345678', '550e8400-e29b-41d4-a716-446655440010',
  'pending', NULL, NULL, NULL, NULL, NOW() - INTERVAL '3 days 19 hours', NOW() - INTERVAL '3 days 19 hours'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- COMPLETE WORKFLOW FOR GAP 5: Cloud Security Fundamentals
-- =====================================================

-- Job for Cloud Security
INSERT INTO jobs (id, user_id, company_id, competency_target_name, type, status, progress, current_stage, result, error, created_at, updated_at) VALUES (
  'aa55bb66-cc77-dd88-ee99-ff0011224455', 'a1b2c3d4-e5f6-4789-a012-345678901234', 'c1d2e3f4-5678-9012-3456-789012345678',
  'Cloud Security Fundamentals', 'path-generation', 'completed', 100, 'path-creation',
  jsonb_build_object('learningPathId', 'Cloud Security Fundamentals', 'generatedAt', (NOW() - INTERVAL '4 days 20 hours')::text, 'stepsCount', 3, 'totalDuration', 32),
  NULL, NOW() - INTERVAL '5 days', NOW() - INTERVAL '4 days 20 hours'
) ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, company_id = EXCLUDED.company_id, competency_target_name = EXCLUDED.competency_target_name, type = EXCLUDED.type, status = EXCLUDED.status, progress = EXCLUDED.progress, current_stage = EXCLUDED.current_stage, result = EXCLUDED.result, error = EXCLUDED.error, updated_at = EXCLUDED.updated_at;

-- Skills Expansion for Cloud Security
INSERT INTO skills_expansions (expansion_id, gap_id, user_id, prompt_1_output, prompt_2_output, created_at, last_modified_at) VALUES (
  'aa55bb66-cc77-dd88-ee99-ff0011225566', 'aa55bb66-cc77-dd88-ee99-ff0011223344', 'a1b2c3d4-e5f6-4789-a012-345678901234',
  jsonb_build_object('expanded_competencies_list', jsonb_build_array(
    jsonb_build_object('competency_name', 'Cloud Security Basics', 'justification', 'Fundamental cloud security concepts including IAM, encryption, and security groups.'),
    jsonb_build_object('competency_name', 'Cloud Security Advanced', 'justification', 'VPC security, network security, monitoring, and compliance frameworks.'),
    jsonb_build_object('competency_name', 'Threat Management', 'justification', 'Vulnerability assessment, penetration testing, and incident response.')
  ), 'generatedAt', (NOW() - INTERVAL '4 days 22 hours')::text),
  jsonb_build_object('competencies_for_skills_engine_processing', jsonb_build_array('Cloud Security Basics', 'Cloud Security Advanced', 'Threat Management'), 'reasoning', 'These competencies provide comprehensive cloud security coverage from basics to advanced threat management.', 'generatedAt', (NOW() - INTERVAL '4 days 21 hours')::text),
  NOW() - INTERVAL '4 days 22 hours', NOW() - INTERVAL '4 days 21 hours'
) ON CONFLICT (expansion_id) DO UPDATE SET gap_id = EXCLUDED.gap_id, user_id = EXCLUDED.user_id, prompt_1_output = EXCLUDED.prompt_1_output, prompt_2_output = EXCLUDED.prompt_2_output, last_modified_at = EXCLUDED.last_modified_at;

-- Course for Cloud Security
INSERT INTO courses (competency_target_name, user_id, gap_id, learning_path, approved, created_at, last_modified_at) VALUES (
  'Cloud Security Fundamentals', 'a1b2c3d4-e5f6-4789-a012-345678901234', 'aa55bb66-cc77-dd88-ee99-ff0011223344',
  '{"pathTitle": "Cloud Security Fundamentals", "pathGoal": "Master cloud security principles and best practices", "pathDescription": "Comprehensive guide to securing cloud infrastructure and applications.", "totalDurationHours": 32, "difficulty": "Intermediate", "audience": "Cloud Engineers, Security Engineers", "learning_modules": [{"module_title": "Cloud Security Basics", "module_description": "Fundamental cloud security concepts and practices.", "subtopics": [{"title": "Identity Access Management", "description": "IAM roles, policies, and access control"}, {"title": "Encryption", "description": "Encryption at rest and in transit"}, {"title": "Security Groups", "description": "Network security and firewall rules"}]}, {"module_title": "Cloud Security Advanced", "module_description": "Advanced cloud security configurations and monitoring.", "subtopics": [{"title": "VPC Security", "description": "Virtual private cloud security configurations"}, {"title": "Network Security", "description": "Network segmentation and security"}, {"title": "Security Monitoring", "description": "CloudWatch and security event monitoring"}]}, {"module_title": "Threat Management", "module_description": "Identifying and responding to security threats.", "subtopics": [{"title": "Vulnerability Assessment", "description": "Security scanning and vulnerability detection"}, {"title": "Penetration Testing", "description": "Security testing methodologies"}, {"title": "Incident Response", "description": "Security incident handling procedures"}]}], "estimatedCompletion": "6-8 weeks", "metadata": {"generatedAt": "2025-11-22T18:00:00Z", "version": "1.0", "competencies": ["Cloud Security Basics", "Cloud Security Advanced", "Threat Management"]}}'::jsonb,
  false, NOW() - INTERVAL '4 days 20 hours', NOW() - INTERVAL '4 days 20 hours'
) ON CONFLICT (competency_target_name) DO UPDATE SET user_id = EXCLUDED.user_id, gap_id = EXCLUDED.gap_id, learning_path = EXCLUDED.learning_path, approved = EXCLUDED.approved, last_modified_at = EXCLUDED.last_modified_at;

-- Approval for Cloud Security
INSERT INTO path_approvals (id, learning_path_id, company_id, decision_maker_id, status, feedback, approved_at, rejected_at, changes_requested_at, created_at, updated_at) VALUES (
  gen_random_uuid(), 'Cloud Security Fundamentals', 'c1d2e3f4-5678-9012-3456-789012345678', '550e8400-e29b-41d4-a716-446655440010',
  'pending', NULL, NULL, NULL, NULL, NOW() - INTERVAL '4 days 19 hours', NOW() - INTERVAL '4 days 19 hours'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- COMPLETE WORKFLOW FOR GAP 6: API Gateway Patterns
-- =====================================================

-- Job for API Gateway
INSERT INTO jobs (id, user_id, company_id, competency_target_name, type, status, progress, current_stage, result, error, created_at, updated_at) VALUES (
  'bb66cc77-dd88-ee99-ff00-aa1122335566', 'a1b2c3d4-e5f6-4789-a012-345678901234', 'c1d2e3f4-5678-9012-3456-789012345678',
  'API Gateway Patterns', 'path-generation', 'completed', 100, 'path-creation',
  jsonb_build_object('learningPathId', 'API Gateway Patterns', 'generatedAt', (NOW() - INTERVAL '5 days 20 hours')::text, 'stepsCount', 3, 'totalDuration', 28),
  NULL, NOW() - INTERVAL '6 days', NOW() - INTERVAL '5 days 20 hours'
) ON CONFLICT (id) DO UPDATE SET user_id = EXCLUDED.user_id, company_id = EXCLUDED.company_id, competency_target_name = EXCLUDED.competency_target_name, type = EXCLUDED.type, status = EXCLUDED.status, progress = EXCLUDED.progress, current_stage = EXCLUDED.current_stage, result = EXCLUDED.result, error = EXCLUDED.error, updated_at = EXCLUDED.updated_at;

-- Skills Expansion for API Gateway
INSERT INTO skills_expansions (expansion_id, gap_id, user_id, prompt_1_output, prompt_2_output, created_at, last_modified_at) VALUES (
  'bb66cc77-dd88-ee99-ff00-aa1122336677', 'bb66cc77-dd88-ee99-ff00-aa1122334455', 'a1b2c3d4-e5f6-4789-a012-345678901234',
  jsonb_build_object('expanded_competencies_list', jsonb_build_array(
    jsonb_build_object('competency_name', 'API Gateway Fundamentals', 'justification', 'Core API gateway concepts including routing, transformation, and load balancing.'),
    jsonb_build_object('competency_name', 'API Gateway Advanced', 'justification', 'Rate limiting, caching, circuit breakers, and API versioning strategies.'),
    jsonb_build_object('competency_name', 'API Security', 'justification', 'Authentication, authorization, OAuth, JWT, and API key management.')
  ), 'generatedAt', (NOW() - INTERVAL '5 days 22 hours')::text),
  jsonb_build_object('competencies_for_skills_engine_processing', jsonb_build_array('API Gateway Fundamentals', 'API Gateway Advanced', 'API Security'), 'reasoning', 'These competencies cover API gateway implementation from basics to advanced security patterns.', 'generatedAt', (NOW() - INTERVAL '5 days 21 hours')::text),
  NOW() - INTERVAL '5 days 22 hours', NOW() - INTERVAL '5 days 21 hours'
) ON CONFLICT (expansion_id) DO UPDATE SET gap_id = EXCLUDED.gap_id, user_id = EXCLUDED.user_id, prompt_1_output = EXCLUDED.prompt_1_output, prompt_2_output = EXCLUDED.prompt_2_output, last_modified_at = EXCLUDED.last_modified_at;

-- Course for API Gateway
INSERT INTO courses (competency_target_name, user_id, gap_id, learning_path, approved, created_at, last_modified_at) VALUES (
  'API Gateway Patterns', 'a1b2c3d4-e5f6-4789-a012-345678901234', 'bb66cc77-dd88-ee99-ff00-aa1122334455',
  '{"pathTitle": "API Gateway Patterns", "pathGoal": "Master API gateway design patterns and implementation", "pathDescription": "Learn to design and implement API gateways with advanced routing, security, and performance patterns.", "totalDurationHours": 28, "difficulty": "Intermediate", "audience": "Backend Engineers, API Developers", "learning_modules": [{"module_title": "API Gateway Fundamentals", "module_description": "Core API gateway concepts and routing strategies.", "subtopics": [{"title": "API Gateway Concepts", "description": "Understanding API gateway architecture"}, {"title": "Routing Strategies", "description": "Request routing and load balancing"}, {"title": "Request Response Transformation", "description": "Transforming requests and responses"}]}, {"module_title": "API Gateway Advanced", "module_description": "Advanced API gateway features and patterns.", "subtopics": [{"title": "Rate Limiting", "description": "Implementing rate limiting policies"}, {"title": "Caching Strategies", "description": "API response caching"}, {"title": "Circuit Breaker", "description": "Fault tolerance patterns"}, {"title": "API Versioning", "description": "Managing API versions"}]}, {"module_title": "API Security", "module_description": "Securing APIs through the gateway.", "subtopics": [{"title": "Authentication Authorization", "description": "API authentication and authorization"}, {"title": "OAuth JWT", "description": "OAuth 2.0 and JWT token management"}, {"title": "API Key Management", "description": "API key generation and validation"}]}], "estimatedCompletion": "5-7 weeks", "metadata": {"generatedAt": "2025-11-22T18:00:00Z", "version": "1.0", "competencies": ["API Gateway Fundamentals", "API Gateway Advanced", "API Security"]}}'::jsonb,
  false, NOW() - INTERVAL '5 days 20 hours', NOW() - INTERVAL '5 days 20 hours'
) ON CONFLICT (competency_target_name) DO UPDATE SET user_id = EXCLUDED.user_id, gap_id = EXCLUDED.gap_id, learning_path = EXCLUDED.learning_path, approved = EXCLUDED.approved, last_modified_at = EXCLUDED.last_modified_at;

-- Approval for API Gateway
INSERT INTO path_approvals (id, learning_path_id, company_id, decision_maker_id, status, feedback, approved_at, rejected_at, changes_requested_at, created_at, updated_at) VALUES (
  gen_random_uuid(), 'API Gateway Patterns', 'c1d2e3f4-5678-9012-3456-789012345678', '550e8400-e29b-41d4-a716-446655440010',
  'pending', NULL, NULL, NULL, NULL, NOW() - INTERVAL '5 days 19 hours', NOW() - INTERVAL '5 days 19 hours'
) ON CONFLICT DO NOTHING;

-- =====================================================
-- Workflow Complete!
-- =====================================================
-- 
-- Summary of what was created:
-- ✅ 1. Skills Gaps: 6 complete gaps for Alice Johnson (GraphQL, Microservices, CI/CD, Database, Cloud Security, API Gateway)
-- ✅ 2. Jobs: 6 completed jobs tracking learning path generation for all gaps
-- ✅ 3. Skills Expansions: Prompt 1 & 2 outputs saved for all 6 gaps
-- ✅ 4. Learning Paths: 6 complete courses with modules and content (all pending approval)
-- ✅ 5. Approval Requests: 6 pending approval requests for John Manager to review
--
-- All 6 gaps have been processed through the complete workflow:
-- - GraphQL API Development (35 hours, 4 modules)
-- - Microservices Architecture (40 hours, 4 modules)
-- - CI/CD Pipeline Development (30 hours, 3 modules)
-- - Database Design & Optimization (35 hours, 3 modules)
-- - Cloud Security Fundamentals (32 hours, 3 modules)
-- - API Gateway Patterns (28 hours, 3 modules)
--
-- Next Steps:
-- - Decision maker (John Manager) reviews the approval request
-- - Can approve, reject, or request changes
-- - Once approved, the learning path will be distributed to Course Builder
-- - Path will then be available to Alice Johnson
--
-- To verify the data:
-- All gaps for Alice Johnson:
-- SELECT * FROM skills_gap WHERE user_id = 'a1b2c3d4-e5f6-4789-a012-345678901234' ORDER BY created_at DESC;
--
-- GraphQL workflow data:
-- SELECT * FROM skills_gap WHERE competency_target_name = 'GraphQL API Development';
-- SELECT * FROM skills_expansions WHERE gap_id = 'aa11bb22-cc33-dd44-ee55-ff6677889900';
-- SELECT * FROM courses WHERE competency_target_name = 'GraphQL API Development';
-- SELECT * FROM path_approvals WHERE learning_path_id = 'GraphQL API Development';
-- SELECT * FROM jobs WHERE competency_target_name = 'GraphQL API Development';
--
-- IMPORTANT: Before running this file, update the company to manual approval:
-- UPDATE companies SET 
--   decision_maker_policy = 'manual',
--   decision_maker = '{"employee_id": "550e8400-e29b-41d4-a716-446655440010", "employee_name": "John Manager", "employee_email": "john.manager@techcorp.com"}'::jsonb,
--   last_modified_at = NOW()
-- WHERE company_id = 'c1d2e3f4-5678-9012-3456-789012345678';

