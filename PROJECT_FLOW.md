# LearnerAI Project Flow Documentation

This document describes all flows in the LearnerAI system - from user interactions to data processing.

---

## 📊 Table of Contents

1. [Overall System Flow](#overall-system-flow)
2. [User Journey Flow](#user-journey-flow)
3. [Feature 1: Learning Path Generation Flow](#feature-1-learning-path-generation-flow)
4. [Feature 2: Path Distribution Flow](#feature-2-path-distribution-flow)
5. [Feature 3: Course Completion & Suggestions Flow](#feature-3-course-completion--suggestions-flow)
6. [Data Flow](#data-flow)
7. [API Request/Response Flow](#api-requestresponse-flow)
8. [Frontend Flow](#frontend-flow)
9. [Database Flow](#database-flow)

---

## 🌐 Overall System Flow

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │
       │ HTTP Requests
       ▼
┌─────────────────────────────────────┐
│      Frontend (Vercel)              │
│  - React + Vite                     │
│  - Company Dashboard                │
│  - User View                        │
└──────┬──────────────────────────────┘
       │
       │ REST API Calls
       │ (Never directly to Supabase)
       ▼
┌─────────────────────────────────────┐
│    Backend API (Railway)           │
│  - Express.js REST API             │
│  - Single entry point              │
│  - Business logic                  │
└──────┬──────────────────────────────┘
       │
       ├─────────────────┬─────────────────┬──────────────────┐
       │                 │                 │                  │
       ▼                 ▼                 ▼                  ▼
┌─────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│  Supabase   │  │  Gemini API  │  │  Skills      │  │  Course      │
│  Database   │  │  (AI)        │  │  Engine      │  │  Builder     │
│             │  │              │  │  (Micro)     │  │  (Micro)     │
└─────────────┘  └──────────────┘  └──────────────┘  └──────────────┘
```

**Key Principle:** Frontend → Backend → External Services (Frontend never talks directly to Supabase or microservices)

---

## 👤 User Journey Flow

### Scenario 1: Company Admin Views Dashboard

```
1. Admin opens Company Dashboard
   └─> Frontend loads
       └─> GET /api/v1/learners/company/:companyId
           └─> Backend queries Supabase
               └─> Returns all learners in company
                   └─> Frontend displays user cards

2. Admin clicks on a user
   └─> GET /api/v1/courses/user/:userId
       └─> Backend queries Supabase
           └─> Returns all courses for user
               └─> Frontend displays courses

3. Admin selects a course
   └─> GET /api/v1/learning-paths/:userId
       └─> Backend queries Supabase
           └─> Returns learning path
               └─> Frontend displays timeline
```

### Scenario 2: Learner Views Their Learning Path

```
1. Learner opens User View
   └─> Frontend loads with userId
       └─> GET /api/v1/courses/user/:userId
           └─> Backend queries Supabase
               └─> Returns learner's courses
                   └─> Frontend shows course dropdown

2. Learner selects a course
   └─> GET /api/v1/learning-paths/:userId
       └─> Backend queries Supabase
           └─> Filters by courseId
               └─> Returns learning path
                   └─> Frontend displays step-by-step timeline
```

### Scenario 3: Skills Gap Detected → Learning Path Generated

```
1. Skills Engine Microservice detects gap
   └─> Skills Engine POSTs to: POST /api/v1/learning-paths/generate
       │
       ├─> Body: { userId, companyId, courseId, microSkills, nanoSkills }
       │
       └─> Backend validates request
           └─> Creates job (status: "pending")
               └─> Returns jobId immediately (202 Accepted)
                   └─> Starts background processing

2. Frontend polls for status (optional - if user is viewing)
   └─> GET /api/v1/jobs/:jobId
       └─> Backend returns current status
           └─> Frontend shows progress
               └─> Polls every 2-3 seconds

3. Job completes
   └─> Status: "completed"
       └─> Frontend fetches learning path (when user views it)
           └─> GET /api/v1/learning-paths/:userId
               └─> Displays complete path
```

**Note:** The POST request is made by **Skills Engine microservice**, not by you or the frontend directly.

---

## 🎯 Feature 1: Learning Path Generation Flow

### Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    LEARNING PATH GENERATION                     │
└─────────────────────────────────────────────────────────────────┘

Step 1: Initial Request (Synchronous - ~100ms)
─────────────────────────────────────────────────
Skills Engine → POST /api/v1/learning-paths/generate
                │
                ├─> Validate: userId, companyId, courseId
                ├─> Create Job entity
                ├─> Save job to Supabase (status: "pending")
                └─> Return jobId immediately (202 Accepted)

Step 2: Background Processing (Asynchronous - ~2-5 minutes)
───────────────────────────────────────────────────────────
Job Processor starts:
│
├─> Update job: status="processing", stage="skill-expansion", progress=10%
│
├─> PROMPT 1: Skill Expansion (~30-60s)
│   │
│   ├─> Fetch latest skills_raw_data from database
│   │   └─> (After Skills Engine POST update)
│   ├─> Load prompt1-skill-expansion.txt
│   ├─> Format prompt with updated skills_raw_data from database
│   ├─> Call Gemini API (gemini-2.5-flash)
│   ├─> Parse expanded skills
│   └─> Update job: progress=30%
│
├─> PROMPT 2: Competency Identification (~30-60s)
│   │
│   ├─> Load prompt2-competency-identification.txt
│   ├─> Format prompt with Prompt 1 output
│   ├─> Call Gemini API
│   ├─> Extract competencies
│   └─> Update job: progress=50%
│
├─> Skills Engine Integration (~5-10s)
│   │
│   ├─> Send competencies to Skills Engine
│   ├─> Request Micro/Nano skill breakdown
│   ├─> Receive structured breakdown
│   └─> Update job: progress=70%
│
└─> PROMPT 3: Path Creation (~60-90s)
    │
    ├─> Load prompt3-path-creation.txt
    ├─> Format prompt with:
    │   ├─> Initial skills gap
    │   └─> Expanded breakdown from Skills Engine
    ├─> Call Gemini API (longer timeout: 90s)
    ├─> Parse learning path structure
    ├─> Create LearningPath entity
    ├─> Save to Supabase (courses table)
    └─> Update job: status="completed", progress=100%

Step 3: Completion
──────────────────
Frontend polls: GET /api/v1/jobs/:jobId
                │
                └─> Status: "completed"
                    └─> Frontend fetches: GET /api/v1/learning-paths/:userId
                        └─> Displays learning path
```

### Detailed Step-by-Step

**1. Request Received (from Skills Engine Microservice)**
```javascript
// Skills Engine microservice makes this POST request:
POST /api/v1/learning-paths/generate
Headers: {
  Authorization: "Bearer <service_token>",
  Content-Type: "application/json"
}
Body: {
  userId: "uuid",
  companyId: "uuid",
  courseId: "uuid",
  microSkills: [...],
  nanoSkills: [...]
}

Response (202 Accepted):
{
  jobId: "uuid",
  status: "pending"
}
```

**Who calls this?**
- ✅ **Skills Engine Microservice** - Primary caller (when it detects a skills gap)
- ⚠️ **Frontend** - Can also call it (for manual generation), but typically Skills Engine does it automatically

**2. Job Creation**
- Creates `Job` entity with:
  - `id`: UUID
  - `userId`, `companyId`, `courseId`
  - `type`: "path-generation"
  - `status`: "pending"
- Saves to `ai_execution_logs` table (or jobs table)

**3. Prompt 1: Skill Expansion**
- Loads `ai/prompts/prompt1-skill-expansion.txt`
- Formats with skills gap data
- Calls Gemini API with timeout: 60s
- Parses JSON response for expanded skills
- Updates job: `progress=30%`, `stage="skill-expansion"`

**4. Prompt 2: Competency Identification**
- Loads `ai/prompts/prompt2-competency-identification.txt`
- Formats with Prompt 1 output
- Calls Gemini API with timeout: 60s
- Extracts competencies list
- Updates job: `progress=50%`, `stage="competency-identification"`

**5. Skills Engine Integration**
- Sends competencies to Skills Engine microservice
- Requests Micro/Nano skill breakdown
- Receives structured breakdown
- Updates job: `progress=70%`, `stage="skill-breakdown"`

**6. Prompt 3: Path Creation**
- Loads `ai/prompts/prompt3-path-creation.txt`
- Formats with:
  - Initial skills gap
  - Expanded breakdown from Skills Engine
- Calls Gemini API with timeout: 90s (longer for complex output)
- Parses learning path structure (modules, steps, duration)
- Updates job: `progress=90%`, `stage="path-creation"`

**7. Save Learning Path**
- Creates `LearningPath` entity
- Saves to `courses` table with:
  - `user_id`
  - `learning_path` (JSONB)
  - `approved`: false
- Updates job: `status="completed"`, `progress=100%`

**8. Frontend Polling**
- Frontend polls `GET /api/v1/jobs/:jobId` every 2-3 seconds
- When status = "completed", fetches learning path
- Displays in timeline component

---

## 📤 Feature 2: Path Distribution Flow

### Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│              PATH DISTRIBUTION FLOW                     │
└─────────────────────────────────────────────────────────┘

Learning Path Completed
        │
        ▼
┌───────────────────────┐
│ Check Approval Policy │
│ (auto/manual)         │
└───────┬───────────────┘
        │
        ├─> AUTO ──────────────────────────┐
        │                                   │
        │                                   ▼
        │                          ┌──────────────────┐
        │                          │  Send to Course  │
        │                          │  Builder         │
        │                          └──────────────────┘
        │
        └─> MANUAL ────────────────────────┐
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │ Create Approval  │
                                  │ Request          │
                                  └────────┬─────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │ Notify Decision  │
                                  │ Maker            │
                                  └────────┬─────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │ Wait for         │
                                  │ Approval         │
                                  └────────┬─────────┘
                                           │
                                           ▼
                                  ┌──────────────────┐
                                  │ Approved?        │
                                  └────────┬─────────┘
                                           │
                                           ├─> YES ──> Send to Course Builder
                                           │
                                           └─> NO ──> Store feedback, notify
```

### Detailed Steps

**1. Path Completion Detected**
- Learning path generation completes
- `GenerateLearningPathUseCase` triggers distribution

**2. Check Approval Policy**
- Query company's `decision_maker_policy`:
  - `"auto"` → Skip approval, proceed directly
  - `"manual"` → Require approval

**3. Auto Approval Path**
```
Path Completed
    │
    ├─> Check policy: "auto"
    │
    └─> DistributePathUseCase.execute()
        │
        ├─> Send to Course Builder
        │   └─> POST to Course Builder microservice
        │
        ├─> Update Analytics
        │   └─> POST to Analytics microservice
        │
        └─> Update Reports
            └─> POST to Reports microservice
```

**4. Manual Approval Path**
```
Path Completed
    │
    ├─> Check policy: "manual"
    │
    ├─> RequestPathApprovalUseCase.execute()
    │   │
    │   ├─> Create approval record (status: "pending")
    │   │
    │   └─> Notify decision maker
    │       └─> Send email/notification
    │
    └─> Wait for response
        │
        ├─> Decision maker approves
        │   └─> ProcessApprovalResponseUseCase.execute()
        │       └─> DistributePathUseCase.execute()
        │
        └─> Decision maker rejects
            └─> Store feedback, notify user
```

---

## ✅ Feature 3: Course Completion & Suggestions Flow

### Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│     COURSE COMPLETION & SUGGESTIONS FLOW                │
└─────────────────────────────────────────────────────────┘

Skills Engine detects completion
        │
        ▼
┌───────────────────────┐
│ POST /api/v1/         │
│ completions            │
└───────┬───────────────┘
        │
        ├─> Validate: userId, courseId, passed
        │
        ├─> Check: passed = true?
        │   │
        │   ├─> NO ──> Return: "Course not passed"
        │   │
        │   └─> YES ──> Continue
        │
        ▼
┌───────────────────────┐
│ DetectCompletion      │
│ UseCase               │
└───────┬───────────────┘
        │
        ▼
┌───────────────────────┐
│ GenerateCourse        │
│ SuggestionsUseCase    │
│ (creates job)         │
└───────┬───────────────┘
        │
        └─> Return jobId (202 Accepted)
            │
            ▼
    ┌───────────────────────┐
    │ Background Processing  │
    └───────┬───────────────┘
            │
            ├─> Load learning path history
            │
            ├─> PROMPT 4: Course Suggestions (~60-90s)
            │   │
            │   ├─> Load prompt4-course-suggestions.txt
            │   ├─> Format with:
            │   │   ├─> Completed course details
            │   │   ├─> Learning path history
            │   │   └─> User context
            │   ├─> Call Gemini API
            │   └─> Parse suggestions
            │
            ├─> RAG Enhancement (~10-20s)
            │   │
            │   ├─> Send to RAG microservice
            │   ├─> Enhance with context
            │   └─> Receive enhanced suggestions
            │
            └─> Save to recommendations table
                │
                └─> Update job: status="completed"
```

### Detailed Steps

**1. Completion Event Received**
```javascript
POST /api/v1/completions
Body: {
  userId: "uuid",
  courseId: "uuid",
  passed: true,
  completionDetails: {...}
}

Response (202 Accepted):
{
  jobId: "uuid",
  status: "pending",
  message: "Suggestions generation started"
}
```

**2. Validation**
- Check `passed = true` (only generate suggestions for passed courses)
- Validate `userId` and `courseId`

**3. Generate Suggestions Job**
- `DetectCompletionUseCase` triggers `GenerateCourseSuggestionsUseCase`
- Creates job with `type: "course-suggestion"`
- Returns jobId immediately

**4. Background Processing**

**4a. Load Context**
- Fetch user's learning path history from Supabase
- Get completed course details

**4b. Prompt 4: Course Suggestions**
- Load `ai/prompts/prompt4-course-suggestions.txt`
- Format with:
  - Completed course ID
  - Completion date
  - Learning path history
  - User context
- Call Gemini API (timeout: 90s)
- Parse suggestions JSON

**4c. RAG Enhancement**
- Send suggestions to RAG microservice
- Enhance with:
  - User's skill profile
  - Career goals
  - Learning history
- Receive enhanced suggestions

**4d. Save Recommendations**
- Save to `recommendations` table:
  - `user_id`
  - `base_course_id` (completed course)
  - `suggested_courses` (JSONB)
  - `sent_to_rag`: true

**5. Frontend Retrieval**
```javascript
GET /api/v1/recommendations/user/:userId
Response: {
  recommendations: [
    {
      recommendation_id: "uuid",
      base_course_id: "uuid",
      suggested_courses: {...},
      sent_to_rag: true
    }
  ]
}
```

---

## 🔄 Data Flow

### New Schema Data Flow

```
┌─────────────────────────────────────────────────────────┐
│                    DATA FLOW                            │
└─────────────────────────────────────────────────────────┘

1. Learner Registration
   ────────────────────
   POST /api/v1/learners
        │
        └─> Save to learners table
            ├─> user_id (PK)
            ├─> company_id
            ├─> company_name
            ├─> user_name
            └─> decision_maker_policy

2. Skills Gap Detection
   ────────────────────
   POST /api/v1/skills-gaps
        │
        └─> Save to skills_gap table
            ├─> gap_id (PK)
            ├─> user_id (FK → learners)
            ├─> company_id
            ├─> skills_raw_data (JSONB)
            ├─> test_status
            └─> course_id (FK → courses, nullable)

3. Learning Path Generation
   ────────────────────────
   Background process completes
        │
        └─> Save to courses table
            ├─> course_id (PK)
            ├─> user_id (FK → learners)
            ├─> learning_path (JSONB)
            └─> approved (boolean)

4. Skills Expansion
   ────────────────
   AI processing
        │
        └─> Save to skills_expansions table
            ├─> expansion_id (PK)
            ├─> prompt_1_output (JSONB)
            └─> prompt_2_output (JSONB)

5. Course Recommendations
   ─────────────────────
   Completion detected
        │
        └─> Save to recommendations table
            ├─> recommendation_id (PK)
            ├─> user_id (FK → learners)
            ├─> base_course_id (FK → courses)
            ├─> suggested_courses (JSONB)
            └─> sent_to_rag (boolean)
```

### Relationships

```
learners (1) ──< (many) courses
learners (1) ──< (many) skills_gap
learners (1) ──< (many) recommendations
courses (1) ──< (many) skills_gap (nullable)
courses (1) ──< (many) recommendations (nullable)
```

---

## 🌐 API Request/Response Flow

### Request Flow

```
Client Request
    │
    ▼
┌─────────────────┐
│ Express Router  │
│ (server.js)     │
└───────┬─────────┘
        │
        ├─> Route matching
        ├─> Middleware (CORS, JSON parsing)
        │
        ▼
┌─────────────────┐
│ Route Handler   │
│ (routes/*.js)   │
└───────┬─────────┘
        │
        ├─> Input validation
        ├─> Create entity (Domain Layer)
        │
        ▼
┌─────────────────┐
│ Use Case        │
│ (useCases/*.js) │
└───────┬─────────┘
        │
        ├─> Business logic
        ├─> Call Infrastructure Layer
        │
        ▼
┌─────────────────┐
│ Repository      │
│ (repositories/  │
│  *.js)          │
└───────┬─────────┘
        │
        └─> Supabase Client
            └─> Database Query
```

### Response Flow

```
Database Result
    │
    ▼
Repository
    │
    ├─> Map to Domain Entity
    │
    ▼
Use Case
    │
    ├─> Apply business rules
    │
    ▼
Route Handler
    │
    ├─> Format response
    │
    ▼
Express Response
    │
    └─> JSON to Client
```

---

## 💻 Frontend Flow

### Component Hierarchy

```
App.jsx
    │
    ├─> Header (logo, theme toggle)
    │
    └─> View Toggle
        │
        ├─> Company Dashboard
        │   │
        │   ├─> UserCard (list of users)
        │   │
        │   └─> LearningPathTimeline (selected user's path)
        │
        └─> User View
            │
            ├─> Course Dropdown
            │
            └─> LearningPathTimeline (selected course's path)
```

### Data Loading Flow

```
Component Mounts
    │
    ▼
useEffect Hook
    │
    ├─> Call API Service
    │   └─> api.getLearningPaths(userId)
    │
    ├─> Set Loading State
    │
    ├─> Fetch from Backend
    │   └─> GET /api/v1/learning-paths/:userId
    │
    ├─> Parse Response
    │
    ├─> Update State
    │
    └─> Render Components
```

### State Management

```
Component State:
├─> loading: boolean
├─> data: array/object
├─> error: string/null
└─> selectedItem: string/null

Flow:
1. Initial: loading=true, data=null
2. Fetching: loading=true, data=null
3. Success: loading=false, data=[...]
4. Error: loading=false, error="message"
```

---

## 🗄️ Database Flow

### Table Operations

```
┌─────────────────────────────────────────────────────────┐
│                  DATABASE OPERATIONS                    │
└─────────────────────────────────────────────────────────┘

1. INSERT (Create)
   ──────────────
   Repository.createX()
        │
        └─> Supabase Client
            └─> .from('table').insert(data)
                └─> Returns created record

2. SELECT (Read)
   ─────────────
   Repository.getXById() / getXByY()
        │
        └─> Supabase Client
            └─> .from('table').select().eq('field', value)
                └─> Returns array/object

3. UPDATE
   ──────
   Repository.updateX()
        │
        └─> Supabase Client
            └─> .from('table').update(data).eq('id', id)
                └─> Trigger updates last_modified_at
                    └─> Returns updated record

4. DELETE
   ──────
   Repository.deleteX()
        │
        └─> Supabase Client
            └─> .from('table').delete().eq('id', id)
                └─> Cascade deletes handled by FK constraints
```

### Automatic Triggers

```
UPDATE Operation
    │
    ▼
Trigger: update_last_modified_at()
    │
    └─> BEFORE UPDATE
        └─> NEW.last_modified_at = NOW()
            └─> Applied to all tables with last_modified_at
```

---

## 🔁 Complete End-to-End Example

### Scenario: New Learner → Learning Path → Course Completion → Suggestions

```
Step 1: Register Learner
───────────────────────
POST /api/v1/learners
{
  company_id: "uuid",
  company_name: "TechCorp",
  user_name: "Alice",
  decision_maker_policy: "auto"
}
    │
    └─> Saved to learners table
        └─> Returns: { user_id: "uuid-1", ... }

Step 2: Skills Gap Detected
────────────────────────────
POST /api/v1/skills-gaps
{
  user_id: "uuid-1",
  company_id: "uuid",
  skills_raw_data: {...},
  test_status: "fail"
}
    │
    └─> Saved to skills_gap table
        └─> Returns: { gap_id: "uuid-2", ... }

Step 3: Generate Learning Path
───────────────────────────────
POST /api/v1/learning-paths/generate
{
  userId: "uuid-1",
  companyId: "uuid",
  courseId: "uuid-3"
}
    │
    ├─> Creates job (status: "pending")
    ├─> Returns: { jobId: "uuid-4" }
    │
    └─> Background processing:
        ├─> Prompt 1 → Prompt 2 → Skills Engine → Prompt 3
        └─> Saves to courses table
            └─> Updates job (status: "completed")

Step 4: Frontend Displays Path
───────────────────────────────
GET /api/v1/jobs/uuid-4
    │
    └─> Status: "completed"
        │
        └─> GET /api/v1/learning-paths/uuid-1
            └─> Returns learning path
                └─> Frontend displays timeline

Step 5: Course Completed
─────────────────────────
POST /api/v1/completions
{
  userId: "uuid-1",
  courseId: "uuid-3",
  passed: true
}
    │
    ├─> Creates suggestion job
    └─> Background processing:
        ├─> Prompt 4 → RAG Enhancement
        └─> Saves to recommendations table

Step 6: Display Suggestions
────────────────────────────
GET /api/v1/recommendations/user/uuid-1
    │
    └─> Returns recommendations
        └─> Frontend displays next courses
```

---

## 📝 Key Flow Principles

1. **Synchronous Response, Asynchronous Processing**
   - API returns immediately with jobId
   - Heavy processing happens in background
   - Frontend polls for status

2. **Single Entry Point**
   - All requests go through Railway API
   - Frontend never talks directly to Supabase

3. **Layered Architecture**
   - API Layer → Application Layer → Infrastructure Layer → Database
   - Clean separation of concerns

4. **Error Handling**
   - Try-catch at each layer
   - Graceful degradation
   - Error messages returned to client

5. **Status Tracking**
   - Jobs tracked in database
   - Progress updates at each stage
   - Frontend can poll for real-time updates

---

**Last Updated:** 2025-11-12

