# LearnerAI API Endpoints

This document describes all available API endpoints for the new database schema.

## Base URL
```
http://localhost:5000/api/v1
```

## Endpoints Overview

### 1. Learners (`/api/v1/learners`)

#### Create Learner
- **POST** `/api/v1/learners`
- **Body:**
  ```json
  {
    "user_id": "uuid (optional)",
    "company_id": "uuid (required)",
    "company_name": "string (required)",
    "user_name": "string (required)",
    // Note: decision_maker_policy and decision_maker_id are stored in companies table, not learners
  }
  ```

#### Get Learner by ID
- **GET** `/api/v1/learners/:userId`

#### Get Learners by Company
- **GET** `/api/v1/learners/company/:companyId`

#### Update Learner
- **PUT** `/api/v1/learners/:userId`
- **Body:** Partial update object

#### Delete Learner
- **DELETE** `/api/v1/learners/:userId`

---

### 2. Courses (`/api/v1/courses`)

#### Create Course
- **POST** `/api/v1/courses`
- **Body:**
  ```json
  {
    "competency_target_name": "string (required, primary key)",
    "user_id": "uuid (required)",
    "gap_id": "uuid (optional, links to skills_gap)",
    "learning_path": "jsonb (required)",
    "approved": "boolean (optional, default: false)"
  }
  ```

#### Get Course by ID
- **GET** `/api/v1/courses/:competencyTargetName`

#### Get Courses by User
- **GET** `/api/v1/courses/user/:userId`

#### Get Courses by Approval Status
- **GET** `/api/v1/courses/approved/:status` (true/false)

#### Update Course
- **PUT** `/api/v1/courses/:competencyTargetName`
- **Body:** Partial update object

#### Delete Course
- **DELETE** `/api/v1/courses/:competencyTargetName`

---

### 3. Skills Gaps (`/api/v1/skills-gaps`)

#### Create Skills Gap
- **POST** `/api/v1/skills-gaps`
- **Body:**
  ```json
  {
    "gap_id": "uuid (optional)",
    "user_id": "uuid (required)",
    "company_id": "uuid (required)",
    "company_name": "string (required)",
    "user_name": "string (required)",
    "skills_raw_data": "jsonb (required)",
    "exam_status": "pass|fail (optional)",
    "competency_target_name": "string (required)"
  }
  ```

#### Get Skills Gap by ID
- **GET** `/api/v1/skills-gaps/:gapId`

#### Get Skills Gaps by User
- **GET** `/api/v1/skills-gaps/user/:userId`

#### Get Skills Gaps by Company
- **GET** `/api/v1/skills-gaps/company/:companyId`

#### Get Skills Gaps by Competency
- **GET** `/api/v1/skills-gaps/competency/:competencyTargetName`

#### Get Skills Gaps by Exam Status
- **GET** `/api/v1/skills-gaps/exam-status/:status` (pass/fail)

#### Update Skills Gap
- **PUT** `/api/v1/skills-gaps/:gapId`
- **Body:** Partial update object

#### Delete Skills Gap
- **DELETE** `/api/v1/skills-gaps/:gapId`

---

### 4. Skills Expansions (`/api/v1/skills-expansions`)

#### Create Skills Expansion
- **POST** `/api/v1/skills-expansions`
- **Body:**
  ```json
  {
    "expansion_id": "uuid (optional)",
    "gap_id": "uuid (optional, links to skills_gap)",
    "user_id": "uuid (required)",
    "prompt_1_output": "jsonb (optional)",
    "prompt_2_output": "jsonb (optional)"
  }
  ```

#### Get Skills Expansion by ID
- **GET** `/api/v1/skills-expansions/:expansionId`

#### Get All Skills Expansions
- **GET** `/api/v1/skills-expansions`
- **Query Parameters:**
  - `limit` (optional, default: 50)
  - `offset` (optional, default: 0)
  - `user_id` (optional, filter by user)
  - `gap_id` (optional, filter by skills gap)

#### Update Skills Expansion
- **PUT** `/api/v1/skills-expansions/:expansionId`
- **Body:** Partial update object

#### Delete Skills Expansion
- **DELETE** `/api/v1/skills-expansions/:expansionId`

---

### 5. Recommendations (`/api/v1/recommendations`)

#### Create Recommendation
- **POST** `/api/v1/recommendations`
- **Body:**
  ```json
  {
    "recommendation_id": "uuid (optional)",
    "user_id": "uuid (required)",
    "base_course_name": "string (optional)",
    "suggested_courses": "jsonb (required)",
    "sent_to_rag": "boolean (optional, default: false)"
  }
  ```

#### Get Recommendation by ID
- **GET** `/api/v1/recommendations/:recommendationId`

#### Get Recommendations by User
- **GET** `/api/v1/recommendations/user/:userId`

#### Get Recommendations by Base Course
- **GET** `/api/v1/recommendations/course/:baseCourseName`

#### Get Recommendations by RAG Status
- **GET** `/api/v1/recommendations/rag/:status` (true/false)

#### Update Recommendation
- **PUT** `/api/v1/recommendations/:recommendationId`
- **Body:** Partial update object

#### Delete Recommendation
- **DELETE** `/api/v1/recommendations/:recommendationId`

---

### 6. AI Query (`/api/v1/ai`).

#### Query AI
- **POST** `/api/v1/ai/query`
- **Body:**
  ```json
  {
    "prompt": "string (required) - The prompt/question to send to AI",
    "model": "string (optional) - Model name (default: gemini-2.5-flash)",
    "temperature": "number (optional) - 0.0 to 1.0 (default: 0.7)",
    "maxTokens": "number (optional) - Max response tokens (default: 2048)",
    "format": "string (optional) - 'json' or 'text' (default: 'text')"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "response": "string or object - AI response",
    "model": "string - Model used",
    "duration": "string - Response time",
    "timestamp": "ISO timestamp"
  }
  ```

#### Chat with AI (Conversation Context)
- **POST** `/api/v1/ai/chat`
- **Body:**
  ```json
  {
    "messages": [
      { "role": "user", "content": "Hello" },
      { "role": "assistant", "content": "Hi there!" },
      { "role": "user", "content": "What is JavaScript?" }
    ],
    "model": "string (optional)",
    "temperature": "number (optional)"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "response": "string - AI response",
    "model": "string - Model used",
    "duration": "string - Response time",
    "timestamp": "ISO timestamp"
  }
  ```

#### Get Available Models
- **GET** `/api/v1/ai/models`
- **Response:**
  ```json
  {
    "success": true,
    "current": "gemini-2.5-flash",
    "available": ["gemini-2.5-flash", "gemini-2.5-pro", ...],
    "note": "Model availability depends on your API key and region"
  }
  ```

#### AI Health Check
- **GET** `/api/v1/ai/health`
- **Response:**
  ```json
  {
    "status": "healthy",
    "service": "Gemini AI",
    "model": "gemini-2.5-flash",
    "timestamp": "ISO timestamp"
  }
  ```

---

### 7. Learning Paths (`/api/v1/learning-paths`)

#### Generate Learning Path (Async)
- **POST** `/api/v1/learning-paths/generate`
- **Body:**
  ```json
  {
    "userId": "uuid (required)",
    "companyId": "uuid (required)",
    "competencyTargetName": "string (required)",
    "microSkills": "array (optional)",
    "nanoSkills": "array (optional)"
  }
  ```
- **Response:** `202 Accepted`
  ```json
  {
    "message": "Learning path generation started",
    "jobId": "uuid",
    "status": "processing"
  }
  ```
- **Note:** This is an async operation. Use the `jobId` to poll `/api/v1/jobs/:jobId/status` for completion.

#### Get Learning Paths by User
- **GET** `/api/v1/learning-paths/:userId`
- **Response:**
  ```json
  {
    "userId": "uuid",
    "learningPaths": [ ... ]
  }
  ```

#### Get Learning Paths by Company
- **GET** `/api/v1/learning-paths/company/:companyId/users`
- **Response:**
  ```json
  {
    "companyId": "uuid",
    "users": [
      {
        "userId": "uuid",
        "learningPaths": [ ... ]
      }
    ]
  }
  ```

---

### 8. Approvals (`/api/v1/approvals`)

#### Get Approval Details
- **GET** `/api/v1/approvals/:approvalId`
- **Query Parameters:**
  - `userId` (optional, for authorization check)
- **Response:**
  ```json
  {
    "success": true,
    "approval": {
      "approvalId": "uuid",
      "status": "pending|approved|rejected|changes_requested",
      "decisionMakerId": "uuid",
      "learningPathId": "string",
      "createdAt": "ISO timestamp",
      "updatedAt": "ISO timestamp"
    },
    "learningPath": { ... },
    "requester": { ... },
    "company": { ... }
  }
  ```

#### Approve Learning Path
- **POST** `/api/v1/approvals/:approvalId/approve`
- **Body:**
  ```json
  {
    "feedback": "string (optional)"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Learning path approved successfully",
    "approval": { ... }
  }
  ```
- **Note:** Automatically distributes path to Course Builder after approval.

#### Request Changes to Learning Path
- **POST** `/api/v1/approvals/:approvalId/request-changes`
- **Body:**
  ```json
  {
    "feedback": "string (required)"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Changes requested successfully",
    "approval": { ... }
  }
  ```

#### Reject Learning Path
- **POST** `/api/v1/approvals/:approvalId/reject`
- **Body:**
  ```json
  {
    "feedback": "string (optional)"
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Learning path rejected",
    "approval": { ... }
  }
  ```

#### Get Pending Approvals
- **GET** `/api/v1/approvals/pending/:decisionMakerId`
- **Response:**
  ```json
  {
    "success": true,
    "approvals": [ ... ],
    "count": 5
  }
  ```

---

### 9. Jobs (`/api/v1/jobs`)

#### Get Job Status
- **GET** `/api/v1/jobs/:jobId/status`
- **Response:**
  ```json
  {
    "jobId": "uuid",
    "status": "processing|completed|failed",
    "progress": "number (0-100)",
    "currentStage": "string",
    "result": "object (if completed)",
    "error": "string (if failed)",
    "createdAt": "ISO timestamp",
    "updatedAt": "ISO timestamp"
  }
  ```
- **Use Case:** Poll this endpoint after receiving a `jobId` from async operations (learning path generation, course suggestions).

---

### 10. Completions (`/api/v1/completions`)

#### Process Course Completion
- **POST** `/api/v1/completions`
- **Body:**
  ```json
  {
    "userId": "uuid (required)",
    "competencyTargetName": "string (required)",
    "passed": "boolean (required)",
    "completionDetails": "object (optional)"
  }
  ```
- **Response:** `202 Accepted` (if suggestions generated)
  ```json
  {
    "message": "Completion processed, generating suggestions...",
    "jobId": "uuid",
    "status": "processing"
  }
  ```
- **Response:** `200 OK` (if no suggestions needed)
  ```json
  {
    "message": "Completion processed",
    "processed": false
  }
  ```
- **Note:** Triggers async course suggestion generation if `passed: true`.

---

### 11. Companies (`/api/v1/companies`)

#### Register/Update Company (from Directory microservice)
- **POST** `/api/v1/companies/register`
- **Body:**
  ```json
  {
    "company_id": "uuid (required)",
    "company_name": "string (required)",
    "approval_policy": "auto|manual (required)",
    "decision_maker": {
      "employee_id": "uuid (required)",
      "employee_name": "string (required)",
      "employee_email": "string (required)"
    }
  }
  ```
- **Response:**
  ```json
  {
    "success": true,
    "message": "Company registered successfully",
    "company": { ... }
  }
  ```

---

### 12. Generic Microservice Endpoint (`/api/fill-content-metrics`)

#### Fill Learner AI Fields (Generic Handler)
- **POST** `/api/fill-content-metrics`
- **Body:** (Stringified JSON)
  ```json
  {
    "requester_service": "assessment|content-studio|analytics|course-builder",
    "payload": {
      "action": "string (required)",
      // ... other action-specific data
    },
    "response": {
      "answer": ""
    }
  }
  ```
- **Response:** (Stringified JSON)
  ```json
  {
    "requester_service": "assessment",
    "payload": { ... },
    "response": {
      "answer": "processed result data"
    }
  }
  ```
- **Supported Services:**
  - `assessment`: Skills gap updates, completion processing
  - `content-studio`: Content generation requests
  - `analytics`: Analytics data requests
  - `course-builder`: Course building requests
- **Note:** This is a generic endpoint that routes to different handlers based on `requester_service` and `payload.action`.

---

## Example Requests

### Create a Learner
```bash
curl -X POST http://localhost:5000/api/v1/learners \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "c1d2e3f4-5678-9012-3456-789012345678",
    "company_name": "TechCorp Inc.",
    "user_name": "Alice Johnson",
    "decision_maker_policy": "auto"
  }'
```

### Create a Course
```bash
curl -X POST http://localhost:5000/api/v1/courses \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "a1b2c3d4-e5f6-4789-a012-345678901234",
    "learning_path": {
      "title": "JavaScript Basics",
      "modules": [
        {
          "id": "mod1",
          "title": "Variables and Data Types",
          "duration": "2 hours"
        }
      ]
    },
    "approved": true
  }'
```

### Create a Skills Gap
```bash
curl -X POST http://localhost:5000/api/v1/skills-gaps \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "a1b2c3d4-e5f6-4789-a012-345678901234",
    "company_id": "c1d2e3f4-5678-9012-3456-789012345678",
    "company_name": "TechCorp Inc.",
    "user_name": "Alice Johnson",
    "skills_raw_data": {
      "identifiedGaps": [
        {
          "skill": "JavaScript ES6+ Syntax",
          "level": "beginner",
          "priority": "high"
        }
      ]
    },
    "exam_status": "fail"
  }'
```

### Query AI
```bash
curl -X POST http://localhost:5000/api/v1/ai/query \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Explain what JavaScript closures are in simple terms",
    "format": "text"
  }'
```

### Chat with AI (with context)
```bash
curl -X POST http://localhost:5000/api/v1/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "messages": [
      { "role": "user", "content": "What is React?" },
      { "role": "assistant", "content": "React is a JavaScript library for building user interfaces..." },
      { "role": "user", "content": "How does it compare to Vue.js?" }
    ]
  }'
```

### Get Available AI Models
```bash
curl -X GET http://localhost:5000/api/v1/ai/models
```

### Check AI Health
```bash
curl -X GET http://localhost:5000/api/v1/ai/health
```

## Response Format

All successful responses follow this format:
```json
{
  "message": "Operation successful message",
  "data": { ... }
}
```

Error responses:
```json
{
  "error": "Error type",
  "message": "Detailed error message"
}
```

## Status Codes

- `200` - Success
- `201` - Created
- `202` - Accepted (async operation started)
- `400` - Bad Request (validation error)
- `403` - Forbidden (authorization error)
- `404` - Not Found
- `500` - Internal Server Error

---

## 🎤 Interview Example: Explaining an Endpoint

### Example Endpoint: `POST /api/v1/approvals/:approvalId/approve`

This is a great endpoint to explain in interviews because it demonstrates multiple full-stack concepts.

#### **1. Overview (30 seconds)**
> "This endpoint handles approval of learning paths. When a decision maker reviews a learning path request, they can approve it, which triggers automatic distribution to the Course Builder microservice and updates analytics."

#### **2. Request Flow (1 minute)**
```
Client Request
    ↓
Express Route Handler (approvals.js)
    ↓
Validation & Authorization Check
    ↓
ProcessApprovalResponseUseCase (Business Logic)
    ↓
Update Approval Status in Database
    ↓
DistributePathUseCase (Microservice Integration)
    ↓
Send Notification to Requester
    ↓
Return Success Response
```

#### **3. Technical Details (2 minutes)**

**Request:**
```http
POST /api/v1/approvals/abc-123/approve
Content-Type: application/json
X-User-Id: decision-maker-uuid

{
  "feedback": "Looks good, approved!"
}
```

**What Happens:**

1. **Route Handler** (`approvals.js`):
   - Extracts `approvalId` from URL params
   - Extracts `feedback` from request body
   - Extracts `userId` from headers (for authorization)

2. **Authorization Check**:
   - Fetches approval from database
   - Verifies `userId` matches `decisionMakerId`
   - Returns `403 Forbidden` if unauthorized

3. **Business Logic** (`ProcessApprovalResponseUseCase`):
   - Updates approval status to "approved"
   - Records timestamp
   - Stores feedback (if provided)
   - Validates approval isn't already processed

4. **Microservice Integration** (`DistributePathUseCase`):
   - Fetches learning path data
   - Sends to Course Builder microservice
   - Updates Learning Analytics service
   - Updates Management Reports service
   - Handles failures gracefully (retry logic, rollback data)

5. **Notification**:
   - Sends email/notification to requester
   - Includes approval status and learning path details
   - Non-blocking (doesn't fail if notification fails)

**Response:**
```json
{
  "success": true,
  "message": "Learning path approved successfully",
  "approval": {
    "approvalId": "abc-123",
    "status": "approved",
    "decisionMakerId": "decision-maker-uuid",
    "feedback": "Looks good, approved!",
    "updatedAt": "2025-01-20T10:30:00Z"
  }
}
```

#### **4. Key Concepts Demonstrated**

**Architecture:**
- **Onion Architecture**: Route → Use Case → Repository
- **Separation of Concerns**: HTTP handling separate from business logic
- **Dependency Injection**: Use cases receive dependencies, easy to test

**Error Handling:**
- **Validation**: Checks required fields, authorization
- **Graceful Degradation**: Notification failure doesn't break approval
- **Microservice Resilience**: Retry logic, fallback data

**Testing:**
- **Unit Tests**: Test use case with mocked dependencies
- **Integration Tests**: Test route with mocked repositories
- **Mock Strategy**: Mock external services (Course Builder, Analytics)

**Async Processing:**
- Approval is synchronous (immediate response)
- Distribution to microservices happens synchronously but with timeout handling
- Could be made async with job queue if needed

#### **5. Edge Cases Handled**

1. **Already Approved**: Returns error, prevents duplicate processing
2. **Unauthorized User**: Returns `403 Forbidden`
3. **Approval Not Found**: Returns `404 Not Found`
4. **Microservice Failure**: Retries 3 times, uses rollback data if all fail
5. **Notification Failure**: Logs error but doesn't fail the approval

#### **6. Why This Design?**

**Why Use Case Pattern?**
- Business logic isolated from HTTP concerns
- Reusable: Can be called from API, CLI, or background jobs
- Testable: Easy to mock dependencies

**Why Repository Pattern?**
- Database abstraction: Can swap Supabase for another DB
- Consistent data access: All DB operations go through repository
- Testable: Mock repository for unit tests

**Why Microservice Integration?**
- Separation of concerns: Each service handles its domain
- Scalability: Services can scale independently
- Resilience: Failure in one service doesn't break others

#### **7. Potential Improvements**

1. **Add Rate Limiting**: Prevent approval spam
2. **Add Audit Log**: Track who approved what and when
3. **Make Distribution Async**: Use job queue for better performance
4. **Add Webhooks**: Notify external systems of approval events
5. **Add Caching**: Cache approval details for faster lookups

---

### Quick Interview Answer Template

**"Explain this endpoint"** → Use this structure:

1. **What it does** (1 sentence)
2. **Request/Response** (show example)
3. **Flow** (3-4 steps)
4. **Key concepts** (architecture, error handling, testing)
5. **Edge cases** (2-3 examples)
6. **Why this design** (trade-offs, decisions)

**Example:**
> "This endpoint approves learning paths. It receives an approval ID and optional feedback, validates authorization, updates the database, distributes to microservices, and sends notifications. I use Onion Architecture with use cases for business logic, repository pattern for data access, and handle edge cases like unauthorized access and microservice failures. The design separates concerns and makes the code testable and maintainable."

---

## 🎤 Interview Example: Learning Path Generation Endpoint

### Example Endpoint: `POST /api/v1/learning-paths/generate`

This is an excellent endpoint to explain because it demonstrates async processing, AI integration, microservice orchestration, and complex business logic.

#### **1. Overview (30 seconds)**
> "This endpoint generates personalized learning paths using AI. It receives a skills gap, creates a background job, and returns a job ID immediately. The actual generation happens asynchronously through a 3-stage AI prompt pipeline that expands skills, identifies competencies, and creates a structured learning path with modules, steps, and resources."

#### **2. Request Flow (1 minute)**
```
Client Request (Skills Gap)
    ↓
Express Route Handler (learningPaths.js)
    ↓
Validation (userId, companyId, competencyTargetName)
    ↓
GenerateLearningPathUseCase.execute() [SYNCHRONOUS]
    ↓
Create Job in Database (status: "pending")
    ↓
Return Job ID Immediately (202 Accepted)
    ↓
[BACKGROUND PROCESSING - Fire and Forget]
    ↓
processJob() [ASYNCHRONOUS]
    ↓
Update Job Status: "processing"
    ↓
┌─────────────────────────────────────┐
│  3-STAGE AI PROMPT PIPELINE         │
├─────────────────────────────────────┤
│  Stage 1: Skill Expansion           │
│  → Call Gemini API (Prompt 1)       │
│  → Expand initial skills gap        │
│  → Save to skills_expansions table   │
│                                     │
│  Stage 2: Competency Identification │
│  → Call Gemini API (Prompt 2)       │
│  → Identify competencies             │
│  → Save to skills_expansions table   │
│                                     │
│  Stage 3: Path Creation             │
│  → Request skill breakdown from     │
│    Skills Engine microservice       │
│  → Call Gemini API (Prompt 3)       │
│  → Generate structured learning path│
│  → Save to courses table            │
└─────────────────────────────────────┘
    ↓
Check Approval Policy
    ↓
Auto-approve OR Create Approval Request
    ↓
Distribute to Course Builder (if approved)
    ↓
Update Job Status: "completed"
```

#### **3. Technical Details (3 minutes)**

**Request:**
```http
POST /api/v1/learning-paths/generate
Content-Type: application/json

{
  "userId": "user-uuid",
  "companyId": "company-uuid",
  "competencyTargetName": "JavaScript ES6+",
  "microSkills": ["Arrow Functions", "Destructuring"],
  "nanoSkills": ["Array Destructuring", "Object Destructuring"]
}
```

**Immediate Response (202 Accepted):**
```json
{
  "message": "Learning path generation started",
  "jobId": "job-uuid-123",
  "status": "pending"
}
```

**What Happens Synchronously:**

1. **Route Handler** (`learningPaths.js`):
   - Validates required fields (`userId`, `companyId`, `competencyTargetName`)
   - Creates `SkillsGap` entity
   - Calls `GenerateLearningPathUseCase.execute()`

2. **Use Case - Execute Method**:
   - Validates skills gap entity
   - Creates `Job` entity with status "pending"
   - Saves job to database
   - Starts background processing (fire and forget)
   - Returns job ID immediately

**What Happens Asynchronously (Background Job):**

The `processJob()` method orchestrates the entire generation:

**Stage 1: Skill Expansion (Prompt 1)**
- **Purpose**: Expand the initial skills gap into broader competencies
- **Process**:
  - Loads `prompt1-skill-expansion` template
  - Formats skills gap data (uses updated `skills_raw_data` from database if available)
  - Calls Gemini API with 60-second timeout
  - Retries up to 3 times on failure
  - Saves output to `skills_expansions.prompt_1_output`
  - Updates job: `currentStage: "competency-identification"`, `progress: 30%`

**Stage 2: Competency Identification (Prompt 2)**
- **Purpose**: Convert expanded skills into standardized competency queries for Skills Engine
- **Process**:
  - Loads `prompt2-competency-identification` template
  - Uses Prompt 1 output as input
  - Calls Gemini API with 60-second timeout
  - Retries up to 3 times
  - Extracts competencies list
  - Saves output to `skills_expansions.prompt_2_output`
  - Updates job: `currentStage: "skill-breakdown"`, `progress: 50%`

**Stage 3: Skill Breakdown & Path Creation**

**Step 3a: Send Competencies to Skills Engine and Wait for Breakdown**

This is the critical integration point where competencies are sent to Skills Engine to get micro/nano skill divisions:

1. **Extract Competencies from Prompt 2**:
   ```javascript
   // After Prompt 2 completes, extract competencies list
   competencies = this._extractCompetenciesFromPrompt2(prompt2Result);
   // Example: ["JavaScript ES6+ Syntax", "Async Programming", "Modern JavaScript Patterns"]
   ```

2. **Update Job Status**:
   ```javascript
   await this.jobRepository.updateJob(job.id, {
     currentStage: 'skill-breakdown',
     progress: 50
   });
   ```

3. **Send Competencies to Skills Engine**:
   ```javascript
   // Call Skills Engine microservice
   skillBreakdown = await this.skillsEngineClient.requestSkillBreakdown(competencies, {
     maxRetries: 3,
     retryDelay: 1000,
     useMockData: false
   });
   ```

4. **Skills Engine API Call**:
   ```http
   POST {SKILLS_ENGINE_URL}/api/skills/breakdown
   Authorization: Bearer {service_token}
   Content-Type: application/json
   
   {
     "competencies": [
       "JavaScript ES6+ Syntax",
       "Async Programming",
       "Modern JavaScript Patterns"
     ]
   }
   ```

5. **Skills Engine Response** (waits for this):
   ```json
   {
     "JavaScript ES6+ Syntax": {
       "microSkills": [
         { "id": "micro-1", "name": "Arrow Functions" },
         { "id": "micro-2", "name": "Destructuring" },
         { "id": "micro-3", "name": "Template Literals" }
       ],
       "nanoSkills": [
         { "id": "nano-1", "name": "Array Destructuring" },
         { "id": "nano-2", "name": "Object Destructuring" },
         { "id": "nano-3", "name": "Nested Destructuring" }
       ]
     },
     "Async Programming": {
       "microSkills": [
         { "id": "micro-4", "name": "Promises" },
         { "id": "micro-5", "name": "Async/Await" }
       ],
       "nanoSkills": [
         { "id": "nano-4", "name": "Promise Chaining" },
         { "id": "nano-5", "name": "Error Handling in Promises" }
       ]
     }
   }
   ```

6. **Error Handling**:
   - Retries 3 times with exponential backoff (1s, 2s, 4s)
   - If all retries fail → Falls back to mock data
   - Logs warning but continues processing
   - Updates job status even if Skills Engine fails

7. **Filtering (Update Mode Only)**:
   - If updating existing path, filters breakdown to match remaining skills
   - Removes competencies that don't have matching skills in updated gap
   - Keeps only relevant micro/nano skills

8. **Cache Breakdown**:
   ```javascript
   // Cache in database for future use
   await this.cacheRepository.upsertSkillBreakdown(userId, skillBreakdown);
   ```

**Step 3b: Generate Final Path Using Combined Data (Prompt 3)**

Now that we have the breakdown from Skills Engine, we combine everything for Prompt 3:

1. **Update Job Status**:
   ```javascript
   await this.jobRepository.updateJob(job.id, {
     currentStage: 'path-creation',
     progress: 70
   });
   ```

2. **Prepare Combined Input for Prompt 3**:
   ```javascript
   // Combine Prompt 2 output (competencies) + Skills Engine breakdown (micro/nano)
   const expandedBreakdownForPrompt3 = {
     competencies: prompt2OutputFromDB,  // From Prompt 2: competency names + descriptions
     skillBreakdown: skillBreakdown      // From Skills Engine: micro/nano skill divisions
   };
   ```

3. **Format Prompt 3 Template**:
   ```javascript
   const prompt3 = await this.promptLoader.loadPrompt('prompt3-path-creation');
   const fullPrompt3 = prompt3
     .replace('{initialGap}', JSON.stringify(skillsGap.toJSON(), null, 2))
     .replace('{expandedBreakdown}', JSON.stringify(expandedBreakdownForPrompt3, null, 2));
   ```

4. **Prompt 3 Input Structure**:
   ```json
   {
     "initialGap": {
       "userId": "user-uuid",
       "competencyTargetName": "JavaScript ES6+",
       "microSkills": ["Arrow Functions", "Destructuring"],
       "nanoSkills": ["Array Destructuring"]
     },
     "expandedBreakdown": {
       "competencies": [
         {
           "competency_name": "JavaScript ES6+ Syntax",
           "justification": "Core modern JavaScript features"
         }
       ],
       "skillBreakdown": {
         "JavaScript ES6+ Syntax": {
           "microSkills": [
             { "id": "micro-1", "name": "Arrow Functions" },
             { "id": "micro-2", "name": "Destructuring" }
           ],
           "nanoSkills": [
             { "id": "nano-1", "name": "Array Destructuring" }
           ]
         }
       }
     }
   }
   ```

5. **Call Gemini API (Prompt 3)**:
   ```javascript
   const prompt3Result = await this.geminiClient.executePrompt(fullPrompt3, '', {
     timeout: 90000,  // 90 seconds for complex path generation
     maxRetries: 3
   });
   ```

6. **Extract Structured Learning Path**:
   ```javascript
   const pathData = this._extractPathData(prompt3Result, userId);
   // Returns:
   // {
   //   path_title: "Master JavaScript ES6+",
   //   goal: "Learn modern JavaScript syntax",
   //   total_estimated_duration_hours: 20,
   //   learning_modules: [
   //     {
   //       module_id: "mod1",
   //       title: "Arrow Functions",
   //       steps: [...],
   //       resources: [...],
   //       objectives: [...]
   //     }
   //   ]
   // }
   ```

7. **Create and Save Learning Path**:
   ```javascript
   const learningPath = new LearningPath({
     userId: skillsGap.userId,
     companyId: skillsGap.companyId,
     competencyTargetName: competencyTargetName,
     pathSteps: pathData.learning_modules,
     pathTitle: pathData.path_title,
     totalDurationHours: pathData.total_estimated_duration_hours,
     pathMetadata: pathData,
     status: 'completed'
   });
   
   await this.repository.createLearningPath(learningPath);
   ```

**Key Point**: Prompt 3 receives BOTH:
- **Competencies** (from Prompt 2) - high-level learning areas
- **Skill Breakdown** (from Skills Engine) - detailed micro/nano skills

This allows AI to create a learning path that:
- Covers the competencies identified
- Includes specific micro/nano skills from Skills Engine
- Structures content hierarchically (competency → micro → nano)
- Provides detailed steps and resources for each skill level

**Post-Generation: Approval Workflow**
- Checks if this is an update after exam failure:
  - If course exists AND `exam_status: 'fail'` → Skip approval, auto-distribute
- Otherwise checks company approval policy:
  - **Auto Policy**: Immediately distribute to Course Builder
  - **Manual Policy**: Create approval request, notify decision maker
- Updates job status to "completed"

**Polling for Completion:**
```http
GET /api/v1/jobs/job-uuid-123/status
```

**Response (while processing):**
```json
{
  "jobId": "job-uuid-123",
  "status": "processing",
  "progress": 50,
  "currentStage": "skill-breakdown",
  "createdAt": "2025-01-20T10:00:00Z",
  "updatedAt": "2025-01-20T10:01:30Z"
}
```

**Response (when completed):**
```json
{
  "jobId": "job-uuid-123",
  "status": "completed",
  "progress": 100,
  "currentStage": "completed",
  "result": {
    "learningPathId": "JavaScript ES6+",
    "approved": true,
    "distributed": true
  },
  "createdAt": "2025-01-20T10:00:00Z",
  "updatedAt": "2025-01-20T10:03:45Z"
}
```

#### **4. Key Concepts Demonstrated**

**Async Processing Pattern:**
- **Job Queue**: Creates job immediately, processes in background
- **Fire and Forget**: Background processing doesn't block response
- **Status Polling**: Client polls job status endpoint
- **Progress Tracking**: Updates `currentStage` and `progress` throughout

**AI Integration:**
- **3-Stage Pipeline**: Sequential prompts, each building on previous output
- **Prompt Templates**: Stored in files, loaded dynamically
- **Error Handling**: Retries with exponential backoff
- **Timeout Management**: Different timeouts for different prompt complexities

**Microservice Integration:**
- **Skills Engine**: Requests skill breakdown
- **Resilience**: Retry logic, fallback to mock data
- **Caching**: Caches breakdown for future use
- **Non-Blocking**: Continues even if Skills Engine fails

**Update Mode vs Full Generation:**
- **Update Mode**: If learning path exists and expansions exist:
  - Skips Prompts 1 & 2 (uses existing expansions)
  - Filters competencies to match remaining skills
  - Only regenerates Prompt 3 with updated data
- **Full Generation**: Runs all 3 prompts from scratch

**Data Flow:**
```
Skills Gap (Input)
    ↓
Prompt 1 → Expanded Skills
    ↓
Prompt 2 → Competencies List
    ↓
┌─────────────────────────────────────────┐
│  SKILLS ENGINE INTEGRATION              │
│  (Critical Step - Waiting for Response) │
├─────────────────────────────────────────┤
│  1. Extract Competencies from Prompt 2  │
│     ["JS ES6+", "Async Programming"]   │
│                                         │
│  2. Send to Skills Engine API:          │
│     POST /api/skills/breakdown         │
│     Body: { competencies: [...] }       │
│                                         │
│  3. WAIT for Response:                  │
│     {                                   │
│       "JS ES6+": {                      │
│         microSkills: [...],             │
│         nanoSkills: [...]               │
│       }                                 │
│     }                                   │
│                                         │
│  4. Receive Breakdown (micro/nano)     │
│  5. Cache breakdown in database         │
│  6. Filter (if update mode)             │
└─────────────────────────────────────────┘
    ↓
Prompt 3 Input = {
  initialGap: {...},
  expandedBreakdown: {
    competencies: [...],      // From Prompt 2
    skillBreakdown: {...}     // From Skills Engine
  }
}
    ↓
Prompt 3 → Structured Learning Path
    ↓
Courses Table (Output)
```

**Detailed Skills Engine Integration Flow:**

```
After Prompt 2 Completes:
├─ Extract competencies: ["Competency A", "Competency B"]
├─ Update job: currentStage = "skill-breakdown", progress = 50%
│
├─ Call Skills Engine Client:
│  └─ requestSkillBreakdown(competencies, options)
│     │
│     ├─ Format Request:
│     │  POST {SKILLS_ENGINE_URL}/api/skills/breakdown
│     │  Headers: Authorization: Bearer {token}
│     │  Body: { competencies: ["Competency A", "Competency B"] }
│     │
│     ├─ Wait for Response (with retries):
│     │  Attempt 1 → If fails, wait 1s
│     │  Attempt 2 → If fails, wait 2s  
│     │  Attempt 3 → If fails, use mock data
│     │
│     └─ Receive Breakdown:
│        {
│          "Competency A": {
│            microSkills: [{id: "m1", name: "Micro Skill 1"}, ...],
│            nanoSkills: [{id: "n1", name: "Nano Skill 1"}, ...]
│          },
│          "Competency B": { ... }
│        }
│
├─ Cache breakdown in database (for future use)
├─ Filter breakdown (if update mode - only keep relevant skills)
│
└─ Combine for Prompt 3:
   {
     competencies: prompt2Output,      // High-level competencies
     skillBreakdown: skillBreakdown    // Detailed micro/nano skills
   }
```

**Caching Strategy:**
- **Skills Expansions**: Saves Prompt 1 & 2 outputs for reuse
- **Skill Breakdown**: Caches Skills Engine responses
- **Update Mode**: Reuses cached expansions when possible

#### **5. Edge Cases Handled**

1. **AI Timeout**: Retries 3 times, fails gracefully with error message
2. **Invalid AI Response**: Parses JSON with fallback, validates structure
3. **Skills Engine Failure**: Falls back to mock data, continues generation
4. **Duplicate Request**: Checks for existing path, uses update mode if found
5. **Missing Skills Gap Data**: Fetches latest from database before processing
6. **Update After Exam Failure**: Skips approval workflow, auto-distributes
7. **Job Failure**: Catches errors, updates job status to "failed" with error message
8. **Database Failures**: Logs warnings, continues processing (non-critical saves)

#### **6. Why This Design?**

**Why Async Processing?**
- **User Experience**: Immediate response (no waiting 2-3 minutes)
- **Scalability**: Can handle multiple requests concurrently
- **Reliability**: Job persists in database, can resume if server restarts
- **Progress Tracking**: Users see real-time progress updates

**Why 3-Stage Pipeline?**
- **Modularity**: Each stage has a specific purpose
- **Reusability**: Can cache intermediate results (Prompt 1 & 2 outputs)
- **Quality**: Each stage refines the output before next stage
- **Debugging**: Easy to identify which stage failed

**Why Job Queue Pattern?**
- **Decoupling**: API doesn't wait for long-running operations
- **Resilience**: Jobs can be retried if they fail
- **Monitoring**: Track job status, progress, failures
- **Scalability**: Can process jobs in parallel, add workers later

**Why Save Intermediate Results?**
- **Caching**: Reuse Prompt 1 & 2 outputs in update mode
- **Debugging**: Can inspect what AI generated at each stage
- **Analytics**: Track AI performance, prompt effectiveness
- **Cost Optimization**: Avoid regenerating same expansions

**Why Microservice Integration?**
- **Separation of Concerns**: Skills Engine owns skill hierarchy
- **Reusability**: Other services can use same breakdown
- **Maintainability**: Changes to skill structure don't affect LearnerAI
- **Resilience**: Falls back to mock data if service unavailable

#### **7. Performance Considerations**

**Optimizations:**
- **Caching**: Reuses expansions and skill breakdowns
- **Update Mode**: Skips 2 prompts when updating existing paths
- **Parallel Processing**: Could process multiple jobs concurrently
- **Database Indexing**: Indexes on `user_id`, `competency_target_name` for fast lookups

**Bottlenecks:**
- **AI API Calls**: Sequential prompts (could parallelize Prompt 1 & 2 if independent)
- **Skills Engine**: Network latency (mitigated with caching)
- **Database Writes**: Multiple writes per job (could batch)

**Scalability:**
- **Horizontal Scaling**: Add more workers to process jobs
- **Queue System**: Could use Redis/RabbitMQ for job distribution
- **Load Balancing**: Multiple API servers can create jobs
- **Database Sharding**: Shard by `company_id` for large scale

#### **8. Potential Improvements**

1. **WebSocket Updates**: Push job status updates instead of polling
2. **Parallel Prompts**: Run Prompt 1 & 2 in parallel if independent
3. **Job Queue System**: Use Redis/RabbitMQ for distributed job processing
4. **Rate Limiting**: Limit concurrent AI API calls per user/company
5. **Prompt Versioning**: Track which prompt versions generated which paths
6. **A/B Testing**: Test different prompt templates
7. **Streaming Responses**: Stream AI responses for better UX
8. **Job Prioritization**: Prioritize urgent requests
9. **Cost Tracking**: Track AI API costs per job/user
10. **Analytics Dashboard**: Visualize job success rates, average times

#### **9. Testing Strategy**

**Unit Tests:**
- Mock Gemini client, Skills Engine client, repositories
- Test use case logic in isolation
- Test prompt formatting, data extraction
- Test update mode vs full generation logic

**Integration Tests:**
- Test route handler with mocked use case
- Test job creation and status updates
- Test error handling (timeouts, failures)

**E2E Tests:**
- Test full flow: request → job → completion
- Test polling mechanism
- Test update mode detection

**Mock Strategy:**
- Mock AI responses with realistic JSON structures
- Mock Skills Engine with sample breakdown data
- Mock repositories to return expected entities

---

### Quick Interview Answer Template for Learning Path Endpoint

**"Explain this endpoint"** → Use this structure:

1. **What it does** (1 sentence)
   > "Generates personalized learning paths using a 3-stage AI pipeline, processes asynchronously with a job queue, and integrates with Skills Engine microservice."

2. **Request/Response** (show example)
   - Show request with skills gap
   - Show immediate 202 response with job ID
   - Show polling endpoint and completion response

3. **Flow** (4-5 steps)
   - Immediate: Create job, return job ID
   - Background: 3-stage AI pipeline
   - Integration: Skills Engine breakdown
   - Post-processing: Approval workflow, distribution

4. **Key concepts** (architecture, async, AI, microservices)
   - Async job queue pattern
   - 3-stage sequential AI prompts
   - Microservice integration with resilience
   - Caching and update mode optimization

5. **Edge cases** (3-4 examples)
   - AI timeouts and retries
   - Skills Engine failures (fallback to mock)
   - Update mode detection
   - Job failure handling

6. **Why this design** (trade-offs, decisions)
   - Async for UX and scalability
   - 3-stage for quality and modularity
   - Job queue for resilience
   - Caching for performance

**Example Full Answer:**
> "This endpoint generates learning paths using AI. It receives a skills gap, immediately creates a background job and returns a job ID (202 Accepted). The actual generation happens asynchronously through a 3-stage pipeline: Prompt 1 expands skills, Prompt 2 identifies competencies, then we request skill breakdown from Skills Engine microservice, and Prompt 3 creates the structured learning path. I use a job queue pattern so users get immediate responses, and they can poll the job status endpoint. The design includes retry logic for AI calls, fallback to mock data if Skills Engine fails, and an update mode that reuses cached expansions when updating existing paths. This makes it scalable, resilient, and provides good UX with progress tracking."

