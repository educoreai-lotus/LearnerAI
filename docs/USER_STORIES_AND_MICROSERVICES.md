# LearnerAI - User Stories & Microservices Communication

**Last Updated:** 2025-01-27  
**Version:** 1.0.0

---

## 📋 Table of Contents

1. [User Stories (3 Features)](#user-stories-3-features)
2. [Microservices Communication](#microservices-communication)
3. [Complete Communication Flow](#complete-communication-flow-example)
4. [Summary Table](#summary-table)
5. [Authentication](#authentication)

---

## 🎯 User Stories (3 Features)

### **Feature 1: Adaptive Learning Path Generation**

**User Story:**
> "As a learner, when I fail an exam, I want the system to generate a personalized learning path based on my skill gaps and suggest additional skills I should learn."

**What Happens:**
1. Skills Engine sends skills gap after exam
2. LearnerAI generates learning path in 3 stages:
   - **Prompt 1**: Expand skill gaps (AI)
   - **Prompt 2**: Identify new competencies (AI)
   - **Prompt 3**: Create detailed learning path (AI)

**Key Components:**
- Receives skills gap from Skills Engine
- Uses Gemini AI for all prompts
- Stores learning paths in database
- Handles both initial gaps and updated gaps after test attempts

---

### **Feature 2: Path Distribution & Approval Workflow**

**User Story:**
> "As a company, I want to control whether learning paths are sent automatically or require manager approval before being sent to Course Builder."

**What Happens:**
1. Directory sends company registration with approval policy (auto/manual)
2. LearnerAI checks the policy
3. If **auto** → sends directly to Course Builder
4. If **manual** → sends for manager approval, then to Course Builder
5. Also sends to Learning Analytics and Management Reports

**Key Components:**
- Company approval policies (auto/manual)
- Decision maker notifications
- Approval workflow management
- Exception: Updates after exam failure skip approval

---

### **Feature 3: Course Completion & Next Course Suggestions**

**User Story:**
> "As a learner, when I successfully complete a course, I want the system to suggest the next courses I should learn."

**What Happens:**
1. Skills Engine sends course completion notification (Passed: True)
2. LearnerAI generates course suggestions (Prompt 4 - AI)
3. LearnerAI sends to RAG Microservice for further processing
4. Suggestions are stored and displayed to the user

**Key Components:**
- Completion detection from Skills Engine
- AI-powered course suggestions
- RAG integration for enhanced recommendations

---

## 🔄 Microservices Communication

### 1️⃣ **Directory Microservice**

#### 📥 **What LearnerAI Receives (Incoming):**

**Endpoint:** `POST /api/v1/companies/register`

**Request Body:**
```json
{
  "company_id": "uuid",
  "company_name": "TechCorp Inc.",
  "approval_policy": "auto" | "manual",
  "decision_maker": {
    "employee_id": "uuid",
    "employee_name": "John Manager",
    "employee_email": "john@techcorp.com"
  }
}
```

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer {LEARNER_AI_SERVICE_TOKEN}
X-Service-Token: {LEARNER_AI_SERVICE_TOKEN}
```

**When Directory Calls:**
- ✅ When a new company registers
- ✅ When a company updates their information

**What LearnerAI Does:**
- Saves/updates in `companies` table
- Updates all learners for that company
- Stores approval policy and decision maker info

**Response:**
```json
{
  "message": "Company registered successfully",
  "company": {
    "company_id": "uuid",
    "company_name": "TechCorp Inc.",
    "approval_policy": "auto" | "manual",
    "decision_maker": { ... }
  }
}
```

#### 📤 **What LearnerAI Sends:**
- ❌ Nothing (Directory doesn't call LearnerAI)

---

### 2️⃣ **Skills Engine Microservice** (Bidirectional)

#### 📥 **Type 1: Skills Gap (Incoming)**

**Endpoint:** `POST /api/v1/skills-gaps`

**Request Body:**
```json
{
  "user_id": "uuid",
  "user_name": "Alice Johnson",
  "company_id": "uuid",
  "company_name": "TechCorp Inc.",
  "competency_target_name": "JavaScript Modern Development",
  "exam_status": "PASS" | "FAIL",
  "gap": {
    "Competency_Front_End_Development": [
      "MGS_React_Hooks_Advanced",
      "MGS_Flexbox_Grid_System",
      "MGS_Async_Await_Handling"
    ]
  }
}
```

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer {LEARNER_AI_SERVICE_TOKEN}
X-Service-Token: {LEARNER_AI_SERVICE_TOKEN}
```

**When Skills Engine Calls:**
- ✅ After each exam completion
- ✅ When a skills gap is detected
- ✅ When a learner fails an exam (exam_status: "FAIL")
- ✅ When a learner passes an exam (exam_status: "PASS")

**What LearnerAI Does:**
1. Checks if skills gap exists (by `user_id` + `competency_target_name`)
2. If exists: Updates `skills_raw_data` (filters to keep only skills in new gap)
3. If not exists: Creates new `skills_gap` row
4. Checks if learner exists (by `user_id`)
5. If not exists: Creates learner (gets company details from `companies` table)
6. Starts learning path generation process

**Response:**
```json
{
  "message": "Skills gap processed successfully",
  "job_id": "uuid",
  "status": "processing"
}
```

#### 📤 **Type 2: Skill Breakdown Request (Outgoing)**

**Endpoint:** `POST {SKILLS_ENGINE_URL}/api/skills/breakdown`

**Request Body:**
```json
{
  "competencies": [
    "React Hooks",
    "TypeScript Fundamentals",
    "Node.js Backend Development"
  ]
}
```

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer {SKILLS_ENGINE_TOKEN}
```

**Response from Skills Engine:**
```json
{
  "React Hooks": [
    "State Management",
    "Side Effects",
    "Custom Hooks",
    "useState Hook",
    "useEffect Hook"
  ],
  "TypeScript Fundamentals": [
    "Type Annotations",
    "Interfaces",
    "Generics",
    "Type Guards"
  ]
}
```

**Note:** 
- Skills Engine returns **only the skills in the LOWEST layer** for each competency
- Response is a **simple array of skill names** (strings) - no IDs, no micro/nano separation
- This matches the level of the initial skills gap for consistency

**When LearnerAI Calls:**
- ✅ During learning path generation (after Prompt 2 - Competency Identification)
- ✅ After AI expands competencies from the initial skills gap
- ✅ Used to get the lowest layer skills for each competency for path creation

**Flow in Learning Path Generation:**
```
1. Skills Engine sends gap → LearnerAI (Type 1)
2. Prompt 1: Expand skills gap (AI)
3. Prompt 2: Identify competencies from expanded skills (AI)
4. LearnerAI → Skills Engine: Request breakdown for expanded competencies (Type 2)
5. Skills Engine → LearnerAI: Returns lowest layer skills (array of skill names)
6. Prompt 3: Create learning path using gap + breakdown (AI)
```

---

### 3️⃣ **Learning Analytics Microservice** (Bidirectional)

#### 📥 **Type 1: On-Demand Requests (Incoming)**

**Endpoint:** `POST /api/fill-content-metrics`

**Request Body:**
```json
{
  "serviceName": "LearningAnalytics",
  "payload": "{\"user_id\":\"uuid\"}"
}
```

**Response from LearnerAI:**
```json
{
  "serviceName": "LearningAnalytics",
  "payload": "[{\"user_id\":\"uuid\",\"user_name\":\"string\",\"company_id\":\"uuid\",\"company_name\":\"string\",\"competency_target_name\":\"string\",\"gap_id\":\"uuid\",\"skills_raw_data\":{...},\"exam_status\":\"PASS\"|\"FAIL\"},...]"
}
```

**Note:** In on-demand mode, LearnerAI does **NOT** send `learning_path` unless Learning Analytics specifically requests it by including `competency_target_name` in the request.

**When Learning Analytics Calls:**
- ✅ When Learning Analytics needs data for a specific user
- ✅ On-demand requests for user analytics

#### 📤 **Type 2: Batch Mode (Outgoing)**

**Endpoint:** `POST {ANALYTICS_URL}/api/v1/paths/batch`

**Request Body:**
```json
[
  {
    "user_id": "uuid",
    "user_name": "string",
    "company_id": "uuid",
    "company_name": "string",
    "competency_target_name": "string",
    "gap_id": "uuid",
    "skills_raw_data": {
      "Competency_Name_1": ["MGS_Skill_ID_1", "MGS_Skill_ID_2"]
    },
    "exam_status": "PASS" | "FAIL",
    "learning_path": {
      "steps": [...],
      "estimatedCompletion": "string",
      "totalSteps": 1,
      "createdAt": "ISO DateTime",
      "updatedAt": "ISO DateTime"
    }
  }
]
```

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer {ANALYTICS_TOKEN}
X-Service-Token: {ANALYTICS_TOKEN}
```

**When LearnerAI Calls:**
- ✅ **Scheduled daily batch** (e.g., every day at midnight)
- ✅ Contains **all users** with their learning paths
- ✅ Includes **complete data** with `learning_path` for each user

---

### 4️⃣ **Course Builder Microservice**

#### 📤 **What LearnerAI Sends (Outgoing):**

**Endpoint:** `POST {COURSE_BUILDER_URL}/api/v1/learning-paths`

**Request Body:**
```json
{
  "user_id": "uuid",
  "user_name": "string",
  "company_id": "uuid",
  "company_name": "string",
  "competency_target_name": "string",
  "learning_path": {
    "pathTitle": "Master GraphQL API Development",
    "pathGoal": "Become a GraphQL expert",
    "pathDescription": "...",
    "steps": [
      {
        "step": 1,
        "title": "Introduction to GraphQL",
        "duration": "2 hours",
        "resources": ["url1", "url2"],
        "objectives": ["objective1", "objective2"],
        "estimatedTime": "2 hours"
      }
    ],
    "estimatedCompletion": "4 weeks",
    "totalSteps": 10,
    "createdAt": "ISO DateTime",
    "updatedAt": "ISO DateTime"
  }
}
```

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer {COURSE_BUILDER_TOKEN}
X-Service-Token: {COURSE_BUILDER_TOKEN}
```

**⚠️ Important:** Course Builder does **NOT** receive:
- ❌ `gap_id`
- ❌ `skills_raw_data`
- ❌ `exam_status`

(These are only sent to Learning Analytics)

**When LearnerAI Calls:**
- ✅ After learning path is generated and approved (if manual approval)
- ✅ Immediately after generation (if auto approval)
- ✅ Only if company has `approval_policy: "auto"` OR after manual approval
- ✅ **Exception:** Updates after exam failure skip approval and auto-distribute

**Response:**
```json
{
  "message": "Learning path received successfully",
  "course_id": "uuid",
  "status": "created"
}
```

#### 📥 **What LearnerAI Receives:**
- ❌ Nothing (Course Builder doesn't call LearnerAI)

---

### 5️⃣ **Management Reports Microservice**

#### 📤 **What LearnerAI Sends (Outgoing):**

**Endpoint:** `POST {REPORTS_URL}/api/fill-reports-fields`

**Request Body:**
```json
{
  "serviceName": "LearnerAI",
  "payload": "<stringified JSON with learning path data>"
}
```

**Headers:**
```http
Content-Type: application/x-www-form-urlencoded
Authorization: Bearer {REPORTS_TOKEN}
```

**When LearnerAI Calls:**
- ✅ After learning path is generated
- ✅ Same time as Course Builder and Learning Analytics
- ✅ Uses fill-fields protocol

**Response:**
```json
{
  "serviceName": "LearnerAI",
  "payload": "<stringified JSON with filled fields>"
}
```

#### 📥 **What LearnerAI Receives:**
- ❌ Nothing (Management Reports doesn't call LearnerAI)

---

### 6️⃣ **RAG Microservice** (Bidirectional)

#### 📤 **Type 1: Send Course Suggestions (Outgoing)**

**Endpoint:** `POST {RAG_URL}/api/v1/suggestions/process`

**Request Body:**
```json
{
  "suggestions": {
    "suggested_courses": [
      {
        "course_name": "Advanced React Patterns",
        "reason": "Builds on your React Hooks knowledge",
        "difficulty": "intermediate"
      }
    ]
  },
  "completionData": {
    "userId": "uuid",
    "competencyTargetName": "React Hooks",
    "completedCourseId": "React Hooks",
    "completionDate": "2025-01-27"
  }
}
```

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer {RAG_MICROSERVICE_TOKEN}
```

**When LearnerAI Calls:**
- ✅ After course completion detection
- ✅ After generating course suggestions (Prompt 4)
- ✅ To enhance suggestions with RAG content

**Response:**
```json
{
  "enhanced": true,
  "ragProcessed": true,
  "originalSuggestions": {...},
  "enhancedSuggestions": [
    {
      "course_name": "Advanced React Patterns",
      "ragContent": {
        "similarCourses": [...],
        "contentMatches": [...],
        "learnerProfileMatch": "High"
      }
    }
  ]
}
```

#### 📥 **Type 2: Get Recommendations (Incoming)**

**Endpoint:** `POST /api/fill-content-metrics`

**Request Body:**
```json
{
  "serviceName": "rag" | "rag-microservice",
  "payload": "{\"action\":\"get_recommendations\",\"user_id\":\"uuid\"}"
}
```

**Response from LearnerAI:**
```json
{
  "success": true,
  "action": "get_recommendations",
  "data": {
    "recommendations": [
      {
        "suggestion_id": "uuid",
        "user_id": "uuid",
        "competency_target_name": "string",
        "suggested_courses": [...],
        "created_at": "ISO DateTime"
      }
    ],
    "user_id": "uuid"
  }
}
```

**When RAG Calls:**
- ✅ When RAG needs course recommendations for a user
- ✅ On-demand requests for recommendation data

---

## 🔄 Complete Communication Flow Example

### Scenario: New Company → New Learner → Skills Gap → Learning Path

```
1. Directory → LearnerAI
   POST /api/v1/companies/register
   └─> Store company in companies table
   └─> Save approval policy and decision maker

2. Skills Engine → LearnerAI (Type 1)
   POST /api/v1/skills-gaps
   └─> Store skills gap after exam
   └─> Create learner if doesn't exist
   └─> Start learning path generation

3. LearnerAI generates learning path
   ├─> Prompt 1: Expand skills gap (AI - Gemini)
   ├─> Prompt 2: Identify competencies (AI - Gemini)
   │
   └─> LearnerAI → Skills Engine (Type 2)
       POST /api/skills/breakdown
       └─> Request Micro/Nano breakdown for expanded competencies
       └─> Skills Engine → LearnerAI: Returns breakdown
   │
   └─> Prompt 3: Create learning path using gap + breakdown (AI - Gemini)
   └─> Store learning path in courses table

4. Check approval policy
   ├─> If auto → Send directly to Course Builder
   └─> If manual → Create approval request
       └─> Send notification to decision maker
       └─> Wait for approval
       └─> If approved → Send to Course Builder

5. LearnerAI → Course Builder
   POST /api/v1/learning-paths
   └─> Send learning path (NO gap data)

6. LearnerAI → Learning Analytics
   POST /api/v1/paths/batch (or on-demand)
   └─> Send learning path + gap data

7. LearnerAI → Management Reports
   POST /api/fill-reports-fields
   └─> Send learning path data
```

### Scenario: Course Completion → Next Course Suggestions

```
1. Skills Engine → LearnerAI
   POST /api/completions (or via skills-gaps with Passed: True)
   └─> Course completion detected

2. LearnerAI generates suggestions
   └─> Prompt 4: Generate course suggestions (AI - Gemini)
   └─> Store suggestions in recommendations table

3. LearnerAI → RAG Microservice
   POST /api/v1/suggestions/process
   └─> Send suggestions for enhancement
   └─> RAG → LearnerAI: Returns enhanced suggestions

4. Suggestions available for user
   └─> Display in frontend
   └─> User can view next courses to learn
```

---

## 📊 Summary Table

| Microservice | Direction | Endpoint | What LearnerAI Receives | What LearnerAI Sends |
|--------------|-----------|----------|------------------------|---------------------|
| **Directory** | 📥 Incoming | `POST /api/v1/companies/register` | Company registration data (company_id, name, approval_policy, decision_maker) | Response with company data |
| **Skills Engine** | 📥 Incoming (Type 1) | `POST /api/v1/skills-gaps` | Skills gap data (user_id, competency, gap, exam_status) | Response with job_id |
| **Skills Engine** | 📤 Outgoing (Type 2) | `POST /api/skills/breakdown` | Lowest layer skills (array of skill names per competency) | Array of competency names |
| **Learning Analytics** | 📥 Incoming | `POST /api/fill-content-metrics` | On-demand request for user data | User data with gap (no learning_path unless requested) |
| **Learning Analytics** | 📤 Outgoing | `POST /api/v1/paths/batch` | Confirmation | Batch data (all users with learning paths + gap data) |
| **Course Builder** | 📤 Outgoing | `POST /api/v1/learning-paths` | Confirmation + course_id | Learning path structure (NO gap data) |
| **Management Reports** | 📤 Outgoing | `POST /api/fill-reports-fields` | Confirmation | Learning path data (fill-fields protocol) |
| **RAG** | 📥 Incoming | `POST /api/fill-content-metrics` | Request for recommendations | Course recommendations |
| **RAG** | 📤 Outgoing | `POST /api/v1/suggestions/process` | Enhanced suggestions | Course suggestions + completion data |

---

## 🔐 Authentication

### Service Tokens

All microservice communication uses **Bearer tokens** for authentication:

#### **Incoming Requests** (Other services call LearnerAI):
- Header: `Authorization: Bearer {LEARNER_AI_SERVICE_TOKEN}`
- Token stored in environment: `LEARNER_AI_SERVICE_TOKEN`
- Validated in: All incoming endpoints

#### **Outgoing Requests** (LearnerAI calls other services):
- Header: `Authorization: Bearer {SERVICE_TOKEN}`
- Tokens stored in environment:
  - `SKILLS_ENGINE_TOKEN` (for Skills Engine)
  - `ANALYTICS_TOKEN` (for Learning Analytics)
  - `COURSE_BUILDER_TOKEN` (for Course Builder)
  - `REPORTS_TOKEN` (for Management Reports)
  - `RAG_MICROSERVICE_TOKEN` (for RAG)

### Environment Variables Setup

```env
# Incoming (what other services use to call LearnerAI)
LEARNER_AI_SERVICE_TOKEN=your-learner-ai-token

# Outgoing (what LearnerAI uses to call other services)
SKILLS_ENGINE_URL=http://localhost:5001
SKILLS_ENGINE_TOKEN=your-skills-engine-token

ANALYTICS_URL=http://localhost:5003
ANALYTICS_TOKEN=your-analytics-token

COURSE_BUILDER_URL=http://localhost:5002
COURSE_BUILDER_TOKEN=your-course-builder-token

REPORTS_URL=http://localhost:5004
REPORTS_TOKEN=your-reports-token

RAG_MICROSERVICE_URL=http://localhost:5005
RAG_MICROSERVICE_TOKEN=your-rag-token
```

---

## 📝 Key Notes

### Approval Workflow Exception

**Updates After Exam Failure:**
- If learning path is an **update** after exam failure (course already exists + `exam_status: 'fail'`):
  - **Skip approval workflow entirely** (even for manual approval companies)
  - **Automatically distribute** to Course Builder without decision maker approval
  - **No notification** sent to decision maker
  - This exception only applies to path updates, not new path creation

### Data Differences

**Course Builder receives:**
- ✅ Learning path structure
- ✅ User and company info
- ❌ NO gap data
- ❌ NO exam status

**Learning Analytics receives:**
- ✅ Learning path structure
- ✅ Gap data (`gap_id`, `skills_raw_data`)
- ✅ Exam status
- ✅ User and company info

### Error Handling

- **Retry Logic**: All outgoing calls have retry logic with exponential backoff
- **Mock Data Fallback**: If services fail, LearnerAI uses predefined mock data
- **Logging**: All inter-service communications are logged
- **Graceful Degradation**: System continues to function even if some services are unavailable

---

## 📚 Related Documentation

- **Architecture**: `docs/architecture.md`
- **Requirements**: `docs/requirements.md`
- **Microservices Communication Guide**: `docs/guides/MICROSERVICES_COMMUNICATION.md`
- **API Endpoints**: `backend/API_ENDPOINTS.md`
- **Learning Analytics JSON**: `docs/guides/LEARNING_ANALYTICS_JSON.md`
- **Course Builder JSON**: `docs/guides/COURSE_BUILDER_JSON.md`

---

**Document Maintained By:** LearnerAI Development Team

