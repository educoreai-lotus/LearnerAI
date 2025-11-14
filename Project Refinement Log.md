```json
[
  {
    "phase": "Phase 1: Project Initialization & Environment Setup",
    "decision_context": "Repository Structure",
    "user_answer": "Yes, use 'frontend' and 'backend' naming convention for main project parts",
    "tags": ["USER-DECISION", "STRUCTURE"]
  },
  {
    "phase": "Phase 1: Project Initialization & Environment Setup",
    "decision_context": "Repository Structure - Refinement",
    "user_answer": "Add a 'database/' directory to store database-related files",
    "tags": ["USER-REFINEMENT", "STRUCTURE"]
  },
  {
    "phase": "Phase 1: Project Initialization & Environment Setup",
    "decision_context": "Environment Configuration",
    "user_answer": "Start simpler with just local and production environments (no staging for now)",
    "tags": ["USER-DECISION", "ENVIRONMENT"]
  },
  {
    "phase": "Phase 1: Project Initialization & Environment Setup",
    "decision_context": "Secrets Management",
    "user_answer": "Adopt a centralized, role-based access control (RBAC) system for secrets management, moving away from individual ownership",
    "tags": ["USER-DECISION", "SECURITY", "RBAC"]
  },
  {
    "phase": "Phase 1: Project Initialization & Environment Setup",
    "decision_context": "CI/CD Setup",
    "user_answer": "Start with automated tests via GitHub Actions on every push, but handle deployments manually to Vercel and Railway",
    "tags": ["USER-DECISION", "CI/CD", "AUTOMATION"]
  },
  {
    "phase": "Phase 1: Project Initialization & Environment Setup",
    "decision_context": "AI Data Storage Structure",
    "user_answer": "Create a 'dataBase/' folder at root level (outside ai/) to store AI-specific data like embeddings and training datasets",
    "tags": ["USER-DECISION", "STRUCTURE", "AI-DATA"]
  },
  {
    "phase": "Phase 2: Requirements Gathering",
    "decision_context": "MVP Core Features",
    "user_answer": "1) Get skills gap from skills gap microservice, use 3 prompts to build detailed learning path; 2) Send path to course builder microservice and update learning analytics + management reports microservices; 3) When learner finishes course successfully, use prompt to send suggestion to RAG microservice for another courses",
    "tags": ["USER-DECISION", "MVP", "MICROSERVICE", "AI-PROMPTS"]
  },
  {
    "phase": "Phase 2: Requirements Gathering",
    "decision_context": "Complete Adaptive Flow - Detailed Process",
    "user_answer": "Adaptive Path Generation: Receive gap from Skills Engine → Prompt 1 (Skill Expansion) → Prompt 2 (Competency Identification) → Request Micro/Nano breakdown from Skills Engine → Prompt 3 (Path Creation) → Send to Course Builder. Caching: Maintain Cache Table in Supabase for all Micro/Nano Skill divisions, update after every test attempt. Completion Flow: Receive success status from Skills Engine → Generate next courses with new prompt → Send to RAG Microservice",
    "tags": ["USER-DECISION", "FLOW", "ADAPTIVE", "CACHING", "COMPLETION"]
  },
  {
    "phase": "Phase 2: Requirements Gathering",
    "decision_context": "AI Model Selection",
    "user_answer": "Use Gemini API for all AI prompts because it's free for developers. Optimize for speed with async handling, timeout/retry logic, and caching. Handle rate limits gracefully with error handling for API failures or slow responses",
    "tags": ["USER-DECISION", "AI-MODEL", "GEMINI", "PERFORMANCE"]
  },
  {
    "phase": "Phase 2: Requirements Gathering",
    "decision_context": "Error Handling & Resilience",
    "user_answer": "Implement mock data rollback system: when microservice calls fail after retries, use predefined mock data matching expected response formats. Retry real services first with exponential backoff, then fall back to mock data. Log when mock data is used for monitoring service health",
    "tags": ["USER-DECISION", "ERROR-HANDLING", "RESILIENCE", "MOCK-DATA"]
  },
  {
    "phase": "Phase 2: Requirements Gathering",
    "decision_context": "Cache Management & Scalability",
    "user_answer": "Cache will be updated whenever a new gap is received from Skills Engine, replacing old data with fresh data (not keeping historical versions). Design for scale with many learners: use proper database indexing, efficient upsert operations (update if exists, insert if new), and optimized queries. Cache maintains current state per learner",
    "tags": ["USER-DECISION", "CACHE", "SCALABILITY", "DATABASE"]
  },
  {
    "phase": "Phase 2: Requirements Gathering",
    "decision_context": "Microservice Authentication & Identification",
    "user_answer": "Each microservice is identified by tokens. Learner AI will store its own token securely (via RBAC secrets management) and include it in API calls to other services. Validate tokens from incoming requests from other microservices. Implement logging for all inter-service communications and authentication events",
    "tags": ["USER-DECISION", "AUTHENTICATION", "TOKENS", "SECURITY", "LOGGING"]
  },
  {
    "phase": "Phase 2: Requirements Gathering",
    "decision_context": "Product Backlog & MVP Scope",
    "user_answer": "Focus on three core features for MVP: adaptive path generation, path distribution, and course suggestions. Implement sequentially (generation → distribution → suggestions). No additional features for now - keep MVP focused",
    "tags": ["USER-DECISION", "BACKLOG", "MVP", "PRIORITIZATION"]
  },
  {
    "phase": "Phase 3: Feature Design & Planning",
    "decision_context": "Frontend Interfaces",
    "user_answer": "Two frontend interfaces: (1) Company Dashboard - shows all users in a company, with ability to view each user's learning path. Learning paths update automatically when generated from gaps (which include user_id and company_id). (2) User View - shows all registered courses in a dropdown/search interface, with learning path display for each selected course. Both interfaces consume REST API endpoints from backend",
    "tags": ["USER-DECISION", "FRONTEND", "UI", "DASHBOARD", "USER-VIEW"]
  },
  {
    "phase": "Phase 3: Feature Design & Planning",
    "decision_context": "UI Design System",
    "user_answer": "Use provided Tailwind config with emeraldbrand colors, gradients, shadows, and Inter/Space Grotesk fonts. Header must match corporate design standard but branded for LearnerAI. All pages use consistent design system. Logo fetched from Railway API. Full Light/Dark mode support. All styling via Tailwind CSS utility classes only. EDUCORE AI logo provided (light and dark versions)",
    "tags": ["USER-DECISION", "UI", "DESIGN-SYSTEM", "TAILWIND", "BRANDING"]
  },
  {
    "phase": "Phase 3: Feature Design & Planning",
    "decision_context": "Company Dashboard Display",
    "user_answer": "Include search and filter functionality to quickly find users. Display full learning path per course for each learner - showing complete path structure generated by AI (expanded competencies, Micro/Nano skills, detailed learning steps). Use cards or expandable sections with clear visual organization",
    "tags": ["USER-DECISION", "DASHBOARD", "UI", "FILTER", "SEARCH"]
  },
  {
    "phase": "Phase 3: Feature Design & Planning",
    "decision_context": "User View Learning Path Display",
    "user_answer": "Vertical step-by-step timeline layout where each learning step is displayed as a card below the previous one. Use emeraldbrand colors, gradients, and card styling from shared UI system. Steps visually connected with clear indicators for completed, current, and upcoming steps. Responsive, accessible design with smooth animations and clear visual hierarchy",
    "tags": ["USER-DECISION", "USER-VIEW", "UI", "TIMELINE", "STEPS"]
  },
  {
    "phase": "Phase 4: System Architecture Design",
    "decision_context": "Frontend-Backend Communication Architecture",
    "user_answer": "Frontend (Vercel) will always communicate through custom Railway API first, never directly to Supabase. This provides better security, centralized business logic, consistent error handling, and easier maintenance. Railway API acts as single point of entry for all data operations, AI processing, and microservice communication",
    "tags": ["USER-DECISION", "ARCHITECTURE", "API", "SECURITY", "DATA-FLOW"]
  },
  {
    "phase": "Phase 4: System Architecture Design",
    "decision_context": "AI Prompt Storage & Version Control",
    "user_answer": "Store prompts as files in ai/prompts/ directory for Git version control. Implement version control system using a registry (database or config file) that tracks active prompt versions. Backend loads prompts from files based on registry, allowing easy version management, testing, and rollback capabilities",
    "tags": ["USER-DECISION", "AI", "PROMPTS", "VERSION-CONTROL", "STORAGE"]
  },
  {
    "phase": "Phase 4: System Architecture Design",
    "decision_context": "Adaptive Flow Processing Architecture",
    "user_answer": "Use asynchronous approach: initial request returns synchronously with acknowledgment and job ID, then full adaptive flow runs in background. Implement job status system in Supabase to track processing state. Frontend polls status endpoint or receives notifications when path generation complete. Show progress indicators for long-running processes with status updates for each stage",
    "tags": ["USER-DECISION", "ARCHITECTURE", "ASYNC", "JOBS", "NOTIFICATIONS"]
  },
  {
    "phase": "Phase 4: System Architecture Design",
    "decision_context": "Backend Architecture Pattern",
    "user_answer": "Adopt Onion Architecture: Domain Layer (core business logic, learning path entities), Application Layer (use cases, path generation logic), Infrastructure Layer (Supabase, Gemini API, microservice clients), API Layer (Express routes). This improves separation of concerns, testability, and maintainability by keeping business logic independent of external dependencies",
    "tags": ["USER-DECISION", "ARCHITECTURE", "ONION", "LAYERS", "DESIGN-PATTERN"]
  },
  {
    "phase": "Phase 5: Implementation (TDD)",
    "decision_context": "Testing & Quality Assurance",
    "user_answer": "Write tests for all three main features (path generation, distribution, suggestions) before implementation, as required by TDD process. Use AI-powered tools to help generate basic tests, with human expert review of all generated tests",
    "tags": ["USER-DECISION", "TDD", "TESTING", "AI-TOOLS", "QUALITY"]
  },
  {
    "phase": "Phase 5: Implementation (TDD)",
    "decision_context": "Database & Data Layer Design",
    "user_answer": "Store AI-specific data in Supabase alongside regular data, organized clearly. Implement data versioning and auditability for cache table and learning paths - track when data changes and who made the changes",
    "tags": ["USER-DECISION", "DATABASE", "VERSIONING", "AUDIT", "AI-DATA"]
  },
  {
    "phase": "Phase 5: Implementation (TDD)",
    "decision_context": "Backend Development - AI Integration",
    "user_answer": "Use one unified AI service module that orchestrates all prompts (Prompt 1, 2, 3, and suggestion prompt). Implement strict data validation before sending any data to Gemini API",
    "tags": ["USER-DECISION", "BACKEND", "AI-SERVICE", "VALIDATION", "SECURITY"]
  },
  {
    "phase": "Phase 5: Implementation (TDD)",
    "decision_context": "Frontend Development",
    "user_answer": "Manually build core UI components using design system for consistency. Leverage AI-assisted tools for rapid prototyping and generating boilerplate code. UI should adapt based on AI's personalized insights - showing different layouts or recommendations based on user behavior or learning patterns",
    "tags": ["USER-DECISION", "FRONTEND", "UI", "AI-ADAPTIVE", "PROTOTYPING"]
  },
  {
    "phase": "Phase 5: Implementation (TDD)",
    "decision_context": "API Design & Integration",
    "user_answer": "Use versioning for API endpoints (e.g., /api/v1/learning-paths/generate). Combine automatic retries with returning specific error codes for frontend to handle. Frontend handles error scenarios based on error codes",
    "tags": ["USER-DECISION", "API", "VERSIONING", "ERROR-HANDLING", "RETRIES"]
  },
  {
    "phase": "Phase 5: Implementation (TDD)",
    "decision_context": "AI Integration Pipeline",
    "user_answer": "Implement fully automatic deployment of AI prompts via GitHub Actions and Railway CI/CD pipeline. Require detailed tracing: execution time for each individual prompt, token usage, and cost tracking to ensure performance and cost efficiency",
    "tags": ["USER-DECISION", "CI/CD", "AUTOMATION", "OBSERVABILITY", "TRACING", "COST-TRACKING"]
  },
  {
    "phase": "Phase 5: Implementation (TDD)",
    "decision_context": "Feasibility Analysis & Risk Assessment",
    "user_answer": "Use automated checks to monitor prompt efficiency, tracking metrics like token usage and execution time for cost control. Implement two-step fallback: First, try predefined simpler fallback prompt. Second, if that fails or on critical system errors, activate mock data system",
    "tags": ["USER-DECISION", "MONITORING", "FALLBACK", "RISK-MANAGEMENT", "COST-CONTROL"]
  },
  {
    "phase": "Phase 6: CI/CD & DevOps Automation",
    "decision_context": "AI Prompt Deployment Automation",
    "user_answer": "Require manual approval for prompt version deployment to production (not automatic). Include mandatory automated testing of prompts before deployment - validating they produce expected output formats",
    "tags": ["USER-DECISION", "CI/CD", "DEPLOYMENT", "TESTING", "APPROVAL"]
  },
  {
    "phase": "Phase 7: Documentation & Knowledge Transfer",
    "decision_context": "Documentation Strategy",
    "user_answer": "Use AI doc-assistants to help draft content for efficiency. Require comprehensive documentation for maintainability: API documentation, setup guides, architecture decisions, troubleshooting guides, and developer onboarding materials",
    "tags": ["USER-DECISION", "DOCUMENTATION", "AI-ASSISTANCE", "MAINTAINABILITY"]
  },
  {
    "phase": "Phase 8: Cybersecurity",
    "decision_context": "Security Measures",
    "user_answer": "Implement layered security: API validation for prompt injection detection. Use both API key rotation and rate limiting for access control to protect Gemini API access",
    "tags": ["USER-DECISION", "SECURITY", "PROMPT-INJECTION", "API-KEYS", "RATE-LIMITING"]
  },
  {
    "phase": "Phase 2: Requirements Gathering",
    "decision_context": "Company Approval Workflow for Learning Paths",
    "user_answer": "When a new company is registered, Directory microservice sends company info (company_id, company_name, approval_policy: 'auto' or 'manual', decision_maker: {employee_id, name, email}). If approval_policy is 'auto', send learning path directly to Course Builder. If 'manual', send learning path to decision maker for approval first. Only send to Course Builder after approval. If rejected, decision maker sends feedback for corrections.",
    "tags": ["USER-DECISION", "FEATURE-2", "APPROVAL-WORKFLOW", "COMPANY-POLICY", "COURSE-BUILDER"]
  },
  {
    "phase": "Phase 5: Implementation (TDD)",
    "decision_context": "Database Schema - Learning Paths Storage",
    "user_answer": "Do not create separate learning_paths table. Use existing courses table to store learning paths. The courses table has competency_target_name as PRIMARY KEY (TEXT), user_id (UUID FK), learning_path JSONB column which stores the complete learning path structure, approved (BOOLEAN). SupabaseRepository updated to query courses table by competency_target_name instead of course_id. Map LearningPath entity to courses table structure (competency_target_name PK, user_id, learning_path JSONB, approved).",
    "tags": ["USER-REFINEMENT", "DATABASE", "SCHEMA", "LEARNING-PATHS", "COURSES-TABLE", "COMPETENCY"]
  },
  {
    "phase": "Phase 5: Implementation (TDD)",
    "decision_context": "Database Schema - Jobs Table",
    "user_answer": "Add jobs table to track background job processing status for async operations. Table includes: id (UUID), user_id (UUID FK to learners), company_id (UUID, nullable), competency_target_name (TEXT, nullable), type, status, progress, current_stage, result (JSONB), error, created_at, updated_at. Foreign key constraint on user_id and competency_target_name (references courses table).",
    "tags": ["USER-REFINEMENT", "DATABASE", "SCHEMA", "JOBS", "ASYNC", "BACKGROUND-JOBS", "COMPETENCY"]
  },
  {
    "phase": "Phase 2: Requirements Gathering",
    "decision_context": "Cache Strategy - Using skills_gap Table",
    "user_answer": "Do not create separate cache_skills table. Use skills_raw_data JSONB column in skills_gap table as the cache for Micro and Nano Skill divisions. When new gap is received from Skills Engine (user_id, user_name, company_id, company_name, competency_name, status, gap), find existing skills_gap record by user_id + competency_target_name, extract skill IDs from new gap, filter existing skills_raw_data to keep only skills that are in the new gap, remove skills not in new gap. Update skills_gap record with filtered data. This provides simpler schema, data consistency, and automatic cleanup via CASCADE.",
    "tags": ["USER-REFINEMENT", "CACHE", "DATABASE", "SKILLS-GAP", "JSONB", "CACHE-STRATEGY"]
  },
  {
    "phase": "Phase 5: Implementation (TDD)",
    "decision_context": "Repository Methods - Cache Update Logic",
    "user_answer": "Add methods to SkillsGapRepository: getSkillsGapByUserAndCompetency() to find existing gap by user_id + competency_target_name, updateSkillsGapCache() to filter and update skills_raw_data, _extractSkillIds() to extract skill IDs from gap structure, _filterSkillsByIds() to remove skills not in new gap. These methods implement the cache update logic when new gaps arrive from Skills Engine. Updated to use competency_target_name instead of course_id.",
    "tags": ["USER-REFINEMENT", "REPOSITORY", "CACHE", "SKILLS-GAP", "METHODS", "COMPETENCY"]
  },
  {
    "phase": "Phase 5: Implementation (TDD)",
    "decision_context": "Code Cleanup - Remove Unnecessary Files",
    "user_answer": "Remove unnecessary migration files and documentation: QUICK_FIX.md, QUICK_SQL_FIX.md, DEPLOY_QUICK_START.md, DEPLOY_CHECKLIST.md, DEPLOY_NOW.md, VERIFICATION_REPORT.md, ROADMAP_ANALYSIS.md, NEXT_STEPS.md, and duplicate migration files. Keep only essential files: init_schema_migration.sql, DEPLOYMENT_GUIDE.md, DEPLOY_EXISTING.md, and core documentation.",
    "tags": ["USER-REFINEMENT", "CLEANUP", "FILE-MANAGEMENT", "MAINTENANCE"]
  },
  {
    "phase": "Phase 5: Implementation (TDD)",
    "decision_context": "Database Schema Verification",
    "user_answer": "Verify Supabase schema matches codebase requirements. All 6 tables verified: learners, courses, skills_gap, skills_expansions, recommendations, jobs. All repositories match table structures. Foreign keys properly configured. Indexes created for performance. Triggers set up for automatic timestamp updates. Schema is correct and ready for deployment.",
    "tags": ["USER-REFINEMENT", "DATABASE", "VERIFICATION", "SCHEMA", "QUALITY-ASSURANCE"]
  },
  {
    "phase": "Phase 5: Implementation (TDD)",
    "decision_context": "Database Schema Rebuild - New Schema Structure",
    "user_answer": "Complete database schema rebuild. New tables: learners (user_id PK, company_id FK, company_name, user_name), companies (company_id PK, company_name, decision_maker_policy, decision_maker JSONB), skills_gap (gap_id PK, user_id FK, company_id FK, competency_target_name, skills_raw_data JSONB, exam_status), skills_expansions (expansion_id PK, prompt_1_output, prompt_2_output), courses (competency_target_name PK, user_id FK, learning_path JSONB, approved), recommendations (recommendation_id PK, user_id FK, base_course_name FK, suggested_courses JSONB), jobs (id PK, user_id FK, type, status, progress). All foreign keys properly configured with CASCADE/SET NULL. Triggers for last_modified_at auto-update.",
    "tags": ["USER-REFINEMENT", "DATABASE", "SCHEMA", "REBUILD", "TABLES", "FOREIGN-KEYS"]
  },
  {
    "phase": "Phase 2: Requirements Gathering",
    "decision_context": "Skills Engine Integration - Field Names",
    "user_answer": "Skills Engine POSTs: user_id, user_name, company_id, company_name, competency_name (maps to competency_target_name in database), status, gap (JSONB). Use competency_target_name instead of course_id throughout codebase. Use exam_status instead of test_status. Check skills_gap table by user_id + competency_target_name. Filter skills_raw_data to keep only skills in new gap, delete skills not present.",
    "tags": ["USER-REFINEMENT", "SKILLS-ENGINE", "FIELD-NAMES", "COMPETENCY", "EXAM-STATUS"]
  },
  {
    "phase": "Phase 2: Requirements Gathering",
    "decision_context": "Directory Microservice - Companies Table",
    "user_answer": "Directory microservice sends company data when new company joins or updates: company_id, company_name, approval_policy (auto/manual), decision_maker (employee_id, employee_name, employee_email). Store in companies table. When creating new learner, get decision_maker_policy and decision_maker_id from companies table (not from Directory API). Companies table is single source of truth for company data.",
    "tags": ["USER-REFINEMENT", "DIRECTORY", "COMPANIES", "MICROSERVICE", "DATA-FLOW"]
  },
  {
    "phase": "Phase 5: Implementation (TDD)",
    "decision_context": "ProcessSkillsGapUpdateUseCase - Skills Engine Updates",
    "user_answer": "New use case: ProcessSkillsGapUpdateUseCase handles Skills Engine gap updates. Flow: 1) Check skills_gap table (user_id + competency_target_name), 2) If exists: update skills_raw_data (filter skills), 3) If not exists: create new skills_gap row, 4) Check learners table, 5) If not exists: create learner (get company details from companies table). Filters skills_raw_data to keep only skills in new gap, removes skills not in new gap.",
    "tags": ["USER-REFINEMENT", "USE-CASE", "SKILLS-ENGINE", "PROCESSING", "GAP-UPDATE"]
  },
  {
    "phase": "Phase 5: Implementation (TDD)",
    "decision_context": "ProcessCompanyUpdateUseCase - Directory Updates",
    "user_answer": "New use case: ProcessCompanyUpdateUseCase handles Directory company registration/updates. Flow: 1) Upsert to companies table (create or update), 2) Update all existing learners with this company_id (sync company_name, decision_maker_policy, decision_maker_id). Ensures all learners stay in sync when company data changes.",
    "tags": ["USER-REFINEMENT", "USE-CASE", "DIRECTORY", "COMPANY-UPDATE", "SYNC"]
  },
  {
    "phase": "Phase 2: Requirements Gathering",
    "decision_context": "Learning Analytics JSON Payload - Additional Fields",
    "user_answer": "Learning Analytics requires additional fields in JSON payload: gap_id (UUID from skills_gap.gap_id), skills_raw_data (JSONB from skills_gap.skills_raw_data), test_status (pass/fail from skills_gap.exam_status). DistributePathUseCase updated to fetch skills gap data and include these fields when sending to Learning Analytics. Complete payload: user_id, user_name, company_id, company_name, competency_target_name, gap_id, skills_raw_data, test_status, learning_path.",
    "tags": ["USER-REFINEMENT", "LEARNING-ANALYTICS", "JSON", "PAYLOAD", "GAP-DATA"]
  },
  {
    "phase": "Phase 5: Implementation (TDD)",
    "decision_context": "Repository Updates - Competency-Based Queries",
    "user_answer": "Updated repositories to use competency_target_name: SkillsGapRepository.getSkillsGapByUserAndCompetency(), SupabaseRepository queries courses table by competency_target_name (primary key), CourseRepository uses competency_target_name. LearningPath entity includes competencyTargetName field. All code updated to use competency_target_name instead of course_id.",
    "tags": ["USER-REFINEMENT", "REPOSITORY", "COMPETENCY", "QUERIES", "SCHEMA-UPDATE"]
  },
  {
    "phase": "Phase 5: Implementation (TDD)",
    "decision_context": "Learning Path Distribution - Skills Gap Data",
    "user_answer": "DistributePathUseCase updated to fetch skills gap data when sending to Learning Analytics. Fetches skills_gap by user_id + competency_target_name, includes gap_id, skills_raw_data, test_status in analytics payload. Course Builder receives same structure. Ensures Learning Analytics has complete context including original gap data.",
    "tags": ["USER-REFINEMENT", "DISTRIBUTION", "LEARNING-ANALYTICS", "SKILLS-GAP", "PAYLOAD"]
  },
  {
    "phase": "Phase 5: Implementation (TDD)",
    "decision_context": "Skills Engine Gap Data - Lowest Layer Hierarchy",
    "user_answer": "The gap field received from Skills Engine contains the lowest layer in the skills gap hierarchy, consisting of micro and nano skills. This gap data is saved directly to skills_raw_data JSONB column in the skills_gap table. The same skills_raw_data (with micro + nano skills) is sent to Learning Analytics when the learning path is ready. This ensures Learning Analytics receives the granular skill-level data needed for analysis.",
    "tags": ["USER-REFINEMENT", "SKILLS-ENGINE", "GAP-DATA", "SKILLS-HIERARCHY", "MICRO-SKILLS", "NANO-SKILLS", "LEARNING-ANALYTICS"]
  }
]
```

