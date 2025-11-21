5# LearnerAI System Overview
## Database Backend, Prompts & Endpoints

---

## Slide 1: System Architecture Overview

### LearnerAI Platform
- **Purpose**: Adaptive learning path generation and course recommendations
- **Database**: PostgreSQL/Supabase (7 core tables)
- **AI Prompts**: 4-stage pipeline for learning path creation
- **API**: RESTful endpoints for CRUD operations & microservice communication

---

## Slide 2: Database Schema - Core Tables

### 7 Main Tables

1. **companies** - Company information & decision maker policies
2. **learners** - User/learner profiles linked to companies
3. **skills_gap** - Identified skill gaps with raw JSONB data
4. **skills_expansions** - AI prompt outputs (Prompt 1 & 2 results)
5. **courses** - Generated learning paths (Prompt 3 results)
6. **recommendations** - Course suggestions (Prompt 4 results)
7. **jobs** - Background job processing status tracking

**Key Relationships:**
- `learners` → `companies` (many-to-one)
- `skills_gap` → `learners` & `companies` (many-to-one)
- `skills_expansions` → `skills_gap` (one-to-one)
- `courses` → `skills_gap` & `learners` (one-to-one)
- `recommendations` → `courses` & `learners` (many-to-one)

---

## Slide 3: Database Schema - Data Flow

### Traceability Chain

```
skills_gap (original gap)
    ↓ gap_id
skills_expansions (prompts 1 & 2)
    ↓ gap_id
courses (prompt 3 / learning path)
    ↓ competency_target_name
recommendations (prompt 4)
```

**Key Fields:**
- `gap_id` - Links skills_gap → skills_expansions → courses
- `user_id` - Links all user-related data
- `competency_target_name` - Primary key for courses
- JSONB fields: `skills_raw_data`, `learning_path`, `suggested_courses`

---

## Slide 4: AI Prompts Pipeline

### 4-Stage AI Processing Flow

**Prompt 1: Skill Expansion**
- **Input**: Nano/Micro skills from skills gap
- **Output**: Expanded list of Core + Out-of-the-Box competencies
- **Purpose**: Identify all competencies needed for mastery

**Prompt 2: Competency Identification**
- **Input**: Expanded competencies from Prompt 1
- **Output**: Standardized query template for Skills Engine
- **Purpose**: Prepare taxonomy validation requests

**Prompt 3: Path Creation**
- **Input**: Finalized skills breakdown + initial gap
- **Output**: Structured learning path with modules
- **Purpose**: Create ordered, pedagogical learning sequence

**Prompt 4: Course Suggestions**
- **Input**: Completed course + learner history
- **Output**: Personalized follow-up course recommendations
- **Purpose**: Suggest next learning steps after completion
- **RAG Integration**: Output is sent to RAG microservice for enhancement with contextual content

---

## Slide 5: API Endpoints - Core Resources

### Base URL: `/api/v1`

**Learners** (`/api/v1/learners`)
- `POST /` - Create learner
- `GET /:userId` - Get by ID
- `GET /company/:companyId` - Get by company
- `PUT /:userId` - Update
- `DELETE /:userId` - Delete

**Skills Gaps** (`/api/v1/skills-gaps`)
- `POST /` - Create skills gap
- `GET /:gapId` - Get by ID
- `GET /user/:userId` - Get by user
- `GET /company/:companyId` - Get by company
- `GET /competency/:name` - Get by competency
- `PUT /:gapId` - Update
- `DELETE /:gapId` - Delete

---

## Slide 6: API Endpoints - Learning Resources

### Courses (`/api/v1/courses`)
- `POST /` - Create course/learning path
- `GET /:competencyTargetName` - Get by competency name
- `GET /user/:userId` - Get by user
- `GET /approved/:status` - Get by approval status
- `PUT /:competencyTargetName` - Update
- `DELETE /:competencyTargetName` - Delete

### Skills Expansions (`/api/v1/skills-expansions`)
- `POST /` - Create expansion (stores Prompt 1 & 2 outputs)
- `GET /:expansionId` - Get by ID
- `GET /` - List all (with filters: user_id, gap_id)
- `PUT /:expansionId` - Update
- `DELETE /:expansionId` - Delete

### Recommendations (`/api/v1/recommendations`)
- `POST /` - Create recommendation (Prompt 4 output)
- `GET /:recommendationId` - Get by ID
- `GET /user/:userId` - Get by user
- `GET /course/:baseCourseName` - Get by base course
- `GET /rag/:status` - Get by RAG status
- `PUT /:recommendationId` - Update
- `DELETE /:recommendationId` - Delete

---

## Slide 7: API Endpoints - Workflow & Jobs

### Learning Path Generation (`/api/v1/learning-paths`)
- `POST /generate` - Generate learning path (async job)
  - Returns: Job ID for status tracking
  - Triggers: Prompts 1, 2, 3 pipeline

### Job Status (`/api/v1/jobs`)
- `GET /:jobId/status` - Get job status & progress
  - Status: pending, processing, completed, failed
  - Progress: 0-100%
  - Result: Final output when completed

### Approvals (`/api/v1/approvals`)
- `POST /courses/:competencyTargetName/approve` - Approve course
- `POST /courses/:competencyTargetName/reject` - Reject course
- `GET /courses/pending` - Get pending approvals

### Completions (`/api/v1/completions`)
- `POST /` - Record course completion
  - Triggers: Prompt 4 (course suggestions)

### Suggestions (`/api/v1/suggestions`)
- `GET /:userId` - Get course suggestions for user

---

## Slide 8: API Endpoints - Microservices

### Incoming (Other Services → LearnerAI)

**Directory Service**
- `POST /api/v1/companies/register` - Register/update company
  - **Purpose**: Receives company data from Directory microservice when a company joins or updates their information
  - **Input**: `company_id`, `company_name`, `approval_policy` ("auto" | "manual"), `decision_maker` (optional)
  - **Action**: Upserts company to `companies` table and updates existing learners with new company info

**Skills Engine**
- `POST /api/v1/skills-gaps` - Receive skills gap data

**Learning Analytics**
- `POST /api/fill-content-metrics` - Fill data on-demand

### Outgoing (LearnerAI → Other Services)

**Skills Engine**
- `POST {SKILLS_ENGINE_URL}/api/skills/breakdown` - Request skill taxonomy

**Learning Analytics**
- `POST {ANALYTICS_URL}/api/v1/paths/batch` - Send batch analytics

**Course Builder**
- `POST {COURSE_BUILDER_URL}/api/v1/learning-paths` - Distribute learning path

---

## Slide 9: API Endpoints - Utilities

### Companies (`/api/v1/companies`)
- `POST /register` - Register company (from Directory)
- `GET /:companyId` - Get company details
- `GET /` - List all companies

### Assets (`/api/assets`)
- `GET /logo/:type` - Get company logos (dark/light)

### Seed (`/api/seed`)
- `POST /` - Seed database with test data
- `DELETE /` - Clear seed data

### Endpoints (`/api`)
- `GET /endpoints` - List all available endpoints

---

## Slide 10: Data Flow Summary

### Complete Learning Path Generation Flow

1. **Skills Gap Received** → `POST /api/v1/skills-gaps`
   - Stores in `skills_gap` table

2. **Path Generation Requested** → `POST /api/v1/learning-paths/generate`
   - Creates job in `jobs` table
   - Executes Prompt 1 → Prompt 2 → Skills Engine → Prompt 3
   - Saves to `skills_expansions` and `courses` tables

3. **Approval Process** → `POST /api/v1/approvals/courses/:name/approve`
   - Updates `courses.approved = true`

4. **Distribution** → Automatically sends to Course Builder

5. **Completion** → `POST /api/v1/completions`
   - Triggers Prompt 4
   - Saves to `recommendations` table

6. **Suggestions** → `GET /api/v1/suggestions/:userId`
   - Returns personalized course recommendations

---

## Slide 11: Key Technical Features

### Database Features
- **UUID Primary Keys** - All tables use UUID for IDs
- **JSONB Storage** - Flexible schema for skills, paths, recommendations
- **Foreign Key Constraints** - Data integrity with CASCADE deletes
- **Indexes** - Optimized queries on user_id, company_id, status fields
- **Triggers** - Auto-update `last_modified_at` timestamps
- **GIN Indexes** - Fast JSONB queries on skills_data and learning_path

### API Features
- **RESTful Design** - Standard HTTP methods (GET, POST, PUT, DELETE)
- **Async Processing** - Job-based background processing
- **Status Tracking** - Real-time job progress monitoring
- **Microservice Integration** - Token-based authentication
- **Error Handling** - Standardized error responses

---

## Slide 12: Summary

### Database Backend
✅ 7 core tables with complete traceability
✅ JSONB for flexible data storage
✅ Optimized indexes and constraints

### AI Prompts
✅ 4-stage pipeline: Expansion → Identification → Path Creation → Suggestions
✅ Each prompt stores output in database
✅ Complete audit trail via gap_id linking

### API Endpoints
✅ 50+ endpoints covering all operations
✅ CRUD for all resources
✅ Microservice communication endpoints
✅ Job status tracking
✅ Approval workflow

**Total Endpoints**: ~50+ across 12 resource categories

