# System Architecture Documentation

This document contains all system architecture details for the LearnerAI microservice, organized by features.

## Table of Contents
1. [Overall System Architecture](#overall-system-architecture)
2. [Feature 1: Adaptive Learning Path Generation Architecture](#feature-1-adaptive-learning-path-generation-architecture)
3. [Feature 2: Path Distribution & Analytics Updates Architecture](#feature-2-path-distribution--analytics-updates-architecture)
4. [Feature 3: Course Completion & Next Course Suggestions Architecture](#feature-3-course-completion--next-course-suggestions-architecture)
5. [Infrastructure & Deployment](#infrastructure--deployment)
6. [Data Flow & Communication](#data-flow--communication)

---

## Overall System Architecture

### Architecture Pattern

**Onion Architecture** is adopted for the backend to ensure clean separation of concerns:

- **Domain Layer**: Core business logic, learning path entities, business rules
- **Application Layer**: Use cases, path generation logic, orchestration
- **Infrastructure Layer**: Supabase client, Gemini API client, microservice clients
- **API Layer**: Express routes, request/response handling

### System Components

1. **Frontend (Vercel)**
   - React + Vite application
   - Consumes REST API from Railway backend
   - Never communicates directly with Supabase

2. **Backend API (Railway)**
   - Express.js REST API
   - Single point of entry for all operations
   - Handles all business logic, AI processing, and data operations

3. **Database (Supabase)**
   - PostgreSQL database
   - Cache table for Micro/Nano Skill divisions
   - Job status tracking
   - Learning path storage

4. **AI Service (Gemini API)**
   - All AI prompt execution
   - Free tier for developers

5. **External Microservices**
   - Skills Engine
   - Course Builder
   - Learning Analytics
   - Management Reports
   - RAG Microservice

### Communication Flow

```
Frontend (Vercel) → Railway API → [Supabase | Gemini API | External Microservices]
```

**Key Principle**: Frontend always communicates through Railway API first, never directly to Supabase or external services.

---

## Feature 1: Adaptive Learning Path Generation Architecture

### Data Flow

1. **Initial Request (Synchronous)**
   - Skills Engine sends skills gap to Railway API
   - API validates request and token
   - Returns immediate acknowledgment with job ID
   - Status: "processing"

2. **Background Processing (Asynchronous)**
   - Job queued for background processing
   - Sequential execution:
     a. **Prompt 1 (Skill Expansion)**: Call Gemini API
     b. **Prompt 2 (Competency Identification)**: Call Gemini API with Prompt 1 output
     c. **Skills Engine Integration**: Request Micro/Nano breakdown for expanded competencies
     d. **Prompt 3 (Path Creation)**: Call Gemini API with combined data (initial gap + breakdown)
   - Update job status at each stage
   - Store results in Supabase

3. **Completion & Notification**
   - Job status updated to "completed"
   - Frontend polls status endpoint or receives notification
   - Learning path available for display

### Architecture Layers

**Domain Layer:**
- `LearningPath` entity
- `SkillsGap` entity
- `Competency` entity
- Business rules for path generation

**Application Layer:**
- `GenerateLearningPathUseCase`
- `ExpandSkillsUseCase`
- `IdentifyCompetenciesUseCase`
- `CreatePathUseCase`

**Infrastructure Layer:**
- `GeminiApiClient` (prompt execution)
- `SkillsEngineClient` (microservice communication)
- `SupabaseRepository` (data persistence)
- `PromptLoader` (loads prompts from `ai/prompts/` directory)

**API Layer:**
- `POST /api/learning-paths/generate` (receives gap, returns job ID)
- `GET /api/jobs/:jobId/status` (polling endpoint)

### Prompt Management

**Storage:**
- Prompts stored as files in `ai/prompts/` directory
- Git version control for prompt files

**Version Control:**
- Registry system (database or config file) tracks active prompt versions
- Backend loads prompts from files based on registry
- Supports version management, testing, and rollback

**Prompt Files:**
- `prompt1-skill-expansion.txt` (or versioned)
- `prompt2-competency-identification.txt`
- `prompt3-path-creation.txt`
- `prompt4-course-suggestions.txt`

### Caching Strategy

**Cache Table (Supabase):**
- Stores all Micro and Nano Skill divisions
- Includes both initial GAP and expanded competencies breakdown
- Updated whenever new gap is received
- Uses upsert operations (update if exists, insert if new)
- Indexed by `learner_id` and `skill_id` for fast lookups

### Error Handling

- Retry logic with exponential backoff for Gemini API calls
- Mock data rollback if services fail after retries
- Job status updated to "failed" with error details
- Logging for all operations

---

## Feature 2: Path Distribution & Analytics Updates Architecture

### Data Flow

1. **Company Registration**
   - Directory microservice sends company registration data
   - Store company info in `companies` table:
     - `company_id`, `company_name`
     - `approval_policy`: "auto" or "manual"
     - `decision_maker`: {employee_id, name, email}

2. **Path Completion**
   - Learning path generated and stored in Supabase
   - Job status: "completed"
   - Check company's `approval_policy`

3. **Approval Workflow**
   - **Auto Policy**: 
     - Skip approval, proceed directly to Course Builder
   - **Manual Policy**:
     - Create approval record in `path_approvals` table (status: "pending")
     - Send notification/email to decision maker with learning path details
     - Wait for decision maker response
     - If approved: Update approval record, proceed to Course Builder
     - If rejected: Update approval record with feedback, store feedback for corrections

4. **Distribution Process**
   - **To Course Builder**: Send complete learning path via REST API (only after approval if manual)
   - **To Learning Analytics**: Update with path data
   - **To Management Reports**: Update with path information
   - All calls include Learner AI service token for authentication

5. **Error Handling**
   - Retry logic for each microservice call
   - Mock data rollback if service unavailable
   - Logging of all distribution attempts

### Architecture Layers

**Application Layer:**
- `RegisterCompanyUseCase` (receives company data from Directory)
- `CheckApprovalPolicyUseCase` (checks if approval needed)
- `RequestPathApprovalUseCase` (sends to decision maker)
- `ProcessApprovalResponseUseCase` (handles approval/rejection)
- `DistributePathUseCase` (sends to Course Builder after approval)
- `UpdateAnalyticsUseCase`
- `UpdateReportsUseCase`

**Infrastructure Layer:**
- `DirectoryClient` (receives company registration)
- `CourseBuilderClient` (REST API client)
- `LearningAnalyticsClient` (REST API client)
- `ManagementReportsClient` (REST API client)
- `NotificationService` (sends approval requests to decision makers)
- `CompanyRepository` (stores company data)
- `ApprovalRepository` (manages approval records)
- `MockDataService` (fallback data)

**API Layer:**
- `POST /api/v1/companies/register` (receives company registration from Directory)
- `POST /api/v1/approvals/:approvalId/approve` (decision maker approves)
- `POST /api/v1/approvals/:approvalId/reject` (decision maker rejects with feedback)
- Internal service calls for distribution (called after approval)

### Authentication

- Each microservice identified by tokens
- Learner AI token stored securely via RBAC secrets management
- Token included in all outgoing API calls
- Tokens validated for incoming requests

---

## Feature 3: Course Completion & Next Course Suggestions Architecture

### Data Flow

1. **Completion Detection**
   - Skills Engine sends success status (e.g., `Passed: True`)
   - Railway API receives completion event
   - Validates request and token

2. **Suggestion Generation (Asynchronous)**
   - Background job created
   - Execute dedicated prompt (Prompt 4) via Gemini API
   - Generate follow-up course suggestions
   - Store suggestions in Supabase

3. **RAG Integration**
   - Send suggestions to RAG Microservice
   - RAG processes for content sourcing or detailed recommendations
   - Results stored and available for display

### Architecture Layers

**Application Layer:**
- `DetectCompletionUseCase`
- `GenerateCourseSuggestionsUseCase`
- `SendToRAGUseCase`

**Infrastructure Layer:**
- `GeminiApiClient` (for suggestion prompt)
- `RAGMicroserviceClient` (REST API client)
- `SkillsEngineClient` (for completion events)

**API Layer:**
- `POST /api/completions` (receives completion status)
- `GET /api/suggestions/:userId` (retrieve suggestions)

### Error Handling

- Retry logic for RAG microservice calls
- Mock data fallback if RAG unavailable
- Job status tracking for suggestion generation

---

## Infrastructure & Deployment

### Frontend Deployment (Vercel)

- React + Vite application
- Environment variables:
  - `VITE_RAILWAY_API_URL` (backend API endpoint)
  - `RAILWAY_ASSET_KEY` (for logo fetching)
- Automatic deployments (manual trigger for now)

### Backend Deployment (Railway)

- Express.js REST API
- Environment variables:
  - `SUPABASE_URL`
  - `SUPABASE_KEY`
  - `GEMINI_API_KEY`
  - `LEARNER_AI_SERVICE_TOKEN`
  - `SKILLS_ENGINE_TOKEN`
  - `COURSE_BUILDER_TOKEN`
  - `RAG_MICROSERVICE_TOKEN`
  - `ANALYTICS_TOKEN`
  - `REPORTS_TOKEN`
- Manual deployments (for now)

### Database (Supabase)

**Tables:**
- `cache_skills` (Micro/Nano Skill divisions)
- `learning_paths` (generated paths)
- `jobs` (job status tracking)
- `course_suggestions` (RAG suggestions)
- `prompt_registry` (active prompt versions)

**Indexing:**
- `cache_skills`: Indexed on `learner_id`, `skill_id`
- `learning_paths`: Indexed on `user_id`, `company_id`, `course_id`
- `jobs`: Indexed on `job_id`, `user_id`, `status`

### CI/CD (GitHub Actions)

- Automated tests on every push
- Frontend and backend test execution
- Manual deployments to Vercel and Railway
- Test failures prevent merge

---

## Data Flow & Communication

### Request Flow

1. **Frontend Request**
   ```
   Frontend → Railway API (REST)
   ```

2. **Backend Processing**
   ```
   Railway API → [Domain Logic → Application Logic → Infrastructure]
   ```

3. **External Calls**
   ```
   Infrastructure → [Supabase | Gemini API | External Microservices]
   ```

4. **Response Flow**
   ```
   Infrastructure → Application → Domain → API → Frontend
   ```

### Authentication Flow

1. **Outgoing Requests**
   - Railway API includes Learner AI service token
   - Token stored in environment variables (RBAC managed)

2. **Incoming Requests**
   - Validate token from Skills Engine, Course Builder, etc.
   - Reject if invalid

3. **Frontend Requests**
   - User authentication handled by Railway API
   - JWT or session-based (to be determined)

### Async Job Processing

1. **Job Creation**
   - Job record created in Supabase `jobs` table
   - Status: "pending"
   - Returns job ID to requester

2. **Background Processing**
   - Background worker picks up job
   - Status updated to "processing"
   - Progress updates at each stage

3. **Completion**
   - Status updated to "completed" or "failed"
   - Results stored in appropriate tables
   - Frontend polls or receives notification

### Error Handling & Resilience

**Retry Strategy:**
- Exponential backoff for all external calls
- Configurable retry counts
- Timeout handling

**Mock Data Fallback:**
- Predefined mock responses for each service
- Used when all retries fail
- Logged for monitoring

**Circuit Breaker:**
- Track service health
- Temporarily stop calling unhealthy services
- Automatic recovery

---

## API Endpoints

### Learning Path Generation

- `POST /api/learning-paths/generate`
  - Receives: Skills gap data, user_id, company_id
  - Returns: Job ID and acknowledgment
  - Status: Synchronous response, async processing

- `GET /api/jobs/:jobId/status`
  - Returns: Job status, progress, results
  - Used for: Frontend polling

- `GET /api/learning-paths/:userId`
  - Returns: All learning paths for user
  - Used for: User view display

- `GET /api/learning-paths/company/:companyId/users`
  - Returns: All users and their learning paths
  - Used for: Company dashboard

### Course Suggestions

- `POST /api/completions`
  - Receives: Completion status from Skills Engine
  - Returns: Job ID
  - Triggers: Suggestion generation

- `GET /api/suggestions/:userId`
  - Returns: Course suggestions for user
  - Used for: Displaying next courses

### Health & Status

- `GET /api/health`
  - Returns: Service health status
  - Used for: Monitoring

---

## Security Architecture

### Token Management

- **RBAC System**: Centralized, role-based access control
- **Service Tokens**: Stored in environment variables
- **Token Validation**: All incoming requests validated
- **Token Rotation**: Support for token updates

### Data Security

- **API Gateway**: Railway API as single entry point
- **Input Validation**: All inputs validated and sanitized
- **SQL Injection Prevention**: Parameterized queries
- **XSS Prevention**: Input sanitization

### Logging & Monitoring

- **Request Logging**: All API requests logged
- **Error Logging**: All errors logged with context
- **Performance Monitoring**: Response times tracked
- **Service Health**: Health checks for dependencies

---

## Scalability Considerations

### Database

- Proper indexing on frequently queried columns
- Efficient upsert operations
- Connection pooling
- Query optimization

### API

- Stateless API design
- Horizontal scaling capability
- Load balancing ready
- Caching strategies

### Background Jobs

- Job queue system (to be implemented)
- Worker scaling capability
- Priority queues for urgent jobs
- Job timeout handling

---

## Technology Stack Summary

- **Frontend**: React, JavaScript, JSX, Vite, Tailwind CSS
- **Backend**: Node.js, Express.js, REST API
- **Database**: Supabase (PostgreSQL)
- **AI Service**: Gemini API
- **Deployment**: Vercel (Frontend), Railway (Backend)
- **CI/CD**: GitHub Actions
- **Architecture Pattern**: Onion Architecture

---

## Future Enhancements

- WebSocket support for real-time notifications
- GraphQL API option
- Advanced caching strategies (Redis)
- Message queue for job processing (RabbitMQ, AWS SQS)
- API rate limiting
- Request/response caching
- Advanced monitoring and analytics

