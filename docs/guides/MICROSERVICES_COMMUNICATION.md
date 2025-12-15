# Microservices Communication Guide

This document explains how LearnerAI communicates with the 4 external microservices:
1. **Directory** (incoming)
2. **Skills Engine** (bidirectional)
3. **Learning Analytics** (outgoing)
4. **Course Builder** (outgoing)

---

## 📋 Overview

### Communication Types

| Microservice | Direction | Purpose | Authentication |
|--------------|-----------|---------|----------------|
| **Directory** | **Incoming** → LearnerAI | Sends company registration/updates | Service Token |
| **Skills Engine** | **Bidirectional** | **Type 1**: Sends skills gaps TO LearnerAI (after exams)<br>**Type 2**: LearnerAI requests Micro/Nano breakdown FROM it (during path generation) | Service Token |
| **Learning Analytics** | **Outgoing** → LearnerAI | LearnerAI sends learning path data | Service Token |
| **Course Builder** | **Outgoing** → LearnerAI | LearnerAI sends learning paths | Service Token |

---

## 1️⃣ Directory Microservice

### 📥 **Incoming: Directory → LearnerAI**

Directory sends company registration/update data to LearnerAI.

#### **Endpoint (in LearnerAI)**
```
POST /api/v1/companies/register
```

#### **Headers (from Directory)**
```http
Content-Type: application/json
Authorization: Bearer {LEARNER_AI_SERVICE_TOKEN}
X-Service-Token: {LEARNER_AI_SERVICE_TOKEN}
```

#### **Request Body (from Directory)**
```json
{
  "company_id": "uuid",
  "company_name": "string",
  "approval_policy": "auto" | "manual",
  "decision_maker": {
    "employee_id": "uuid",
    "employee_name": "string",
    "employee_email": "string"
  }
}
```

#### **When Directory Calls This**
- ✅ When a new company joins
- ✅ When a company updates their information

#### **What LearnerAI Does**
1. **Upsert to `companies` table** (create or update)
   - Store `company_id`, `company_name`, `decision_maker_policy`, `decision_maker` (JSONB)
2. **Update all existing learners** with this `company_id`:
   - Sync `company_name` (in case company name changed)
   - **Note**: `decision_maker_policy` and `decision_maker_id` are stored in `companies` table, not `learners` table
   - Learners reference companies via `company_id` foreign key
   - To get decision maker info for a learner, join with `companies` table

#### **Implementation**
- **Route**: `backend/src/api/routes/companies.js`
- **Use Case**: `ProcessCompanyUpdateUseCase`
- **Repository**: `CompanyRepository`

#### **Example (Directory calling LearnerAI)**
```bash
# From Directory microservice
curl -X POST http://learner-ai-url/api/v1/companies/register \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_LEARNER_AI_TOKEN" \
  -d '{
    "company_id": "550e8400-e29b-41d4-a716-446655440001",
    "company_name": "TechCorp Solutions",
    "approval_policy": "auto",
    "decision_maker": {
      "employee_id": "660e8400-e29b-41d4-a716-446655440001",
      "employee_name": "John Manager",
      "employee_email": "john@techcorp.com"
    }
  }'
```

---

## 2️⃣ Skills Engine Microservice

Skills Engine has **two distinct communication patterns** with LearnerAI:

---

### 📥 **Communication Type 1: Skills Gap Updates (Incoming)**

**Skills Engine → LearnerAI**: Sends skills gap data after each exam.

#### **Purpose**
- Skills Engine detects skills gaps after a learner completes an exam
- Sends the gap data to LearnerAI for processing and learning path generation

#### **Endpoint (in LearnerAI)**
```
POST /api/v1/skills-gaps
```

#### **Headers (from Skills Engine)**
```http
Content-Type: application/json
Authorization: Bearer {LEARNER_AI_SERVICE_TOKEN}
X-Service-Token: {LEARNER_AI_SERVICE_TOKEN}
```

#### **Request Body (from Skills Engine)**
```json
{
  "user_id": "uuid",
  "user_name": "string",
  "company_id": "uuid",
  "company_name": "string",
  "competency_target_name": "string",
  "exam_status": "PASS" | "FAIL",
  "gap": {
    "Competency_Name_1": [
      "MGS_Skill_ID_1",
      "MGS_Skill_ID_2"
    ],
    "Competency_Name_2": [
      "MGS_Skill_ID_3"
    ]
  }
}
```

**Note:** The `gap` field contains `missing_skills_map` structure where:
- **Keys**: Competency names (e.g., `"Competency_Front_End_Development"`)
- **Values**: Arrays of missing skill IDs (e.g., `["MGS_React_Hooks_Advanced", "MGS_Flexbox_Grid_System"]`)

#### **When Skills Engine Calls This**
- ✅ After each exam completion
- ✅ When a learner fails an exam (exam_status: "FAIL")
- ✅ When a learner passes an exam (exam_status: "PASS")
- ✅ Whenever skills gap is detected or updated

#### **What LearnerAI Does**
1. **Check if skills gap exists** (by `user_id` + `competency_target_name`)
2. **If exists**: Update `skills_raw_data` (filter to keep only skills in new gap, remove skills not in gap)
3. **If not exists**: Create new `skills_gap` row
4. **Check if learner exists** (by `user_id`)
5. **If not exists**: Create learner (get company details from `companies` table)

#### **Implementation**
- **Route**: `backend/src/api/routes/skillsGaps.js`
- **Use Case**: `ProcessSkillsGapUpdateUseCase`
- **Repository**: `SkillsGapRepository`, `LearnerRepository`, `CompanyRepository`

#### **Example (Skills Engine calling LearnerAI)**
```bash
# From Skills Engine microservice - After exam completion
curl -X POST http://learner-ai-url/api/v1/skills-gaps \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_LEARNER_AI_TOKEN" \
  -d '{
    "user_id": "a1b2c3d4-e5f6-4789-a012-345678901234",
    "user_name": "Alice Johnson",
    "company_id": "c1d2e3f4-5678-9012-3456-789012345678",
    "company_name": "TechCorp Inc.",
    "competency_target_name": "JavaScript Modern Development",
    "exam_status": "FAIL",
    "gap": {
      "Competency_Front_End_Development": [
        "MGS_React_Hooks_Advanced",
        "MGS_Flexbox_Grid_System",
        "MGS_Async_Await_Handling"
      ]
    }
  }'
```

#### **PowerShell Example**
```powershell
$body = @{
    user_id = "a1b2c3d4-e5f6-4789-a012-345678901234"
    user_name = "Alice Johnson"
    company_id = "c1d2e3f4-5678-9012-3456-789012345678"
    company_name = "TechCorp Inc."
    competency_target_name = "JavaScript Modern Development"
    exam_status = "FAIL"
    gap = @{
        "Competency_Front_End_Development" = @(
            "MGS_React_Hooks_Advanced",
            "MGS_Flexbox_Grid_System",
            "MGS_Async_Await_Handling"
        )
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri http://localhost:5000/api/v1/skills-gaps `
  -Method POST `
  -Headers @{ 
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_TOKEN"
  } `
  -Body $body
```

---

### 📤 **Communication Type 2: Skill Breakdown Request (Outgoing)**

**LearnerAI → Skills Engine**: Requests Micro/Nano skill breakdown for expanded competencies.

#### **Purpose**
- During learning path generation, LearnerAI expands competencies using AI
- LearnerAI sends these expanded competencies to Skills Engine
- Skills Engine returns the Micro and Nano skill breakdown for each competency

#### **Endpoint (in Skills Engine)**
```
POST {SKILLS_ENGINE_URL}/api/skills/breakdown
```

#### **Headers (from LearnerAI)**
```http
Content-Type: application/json
Authorization: Bearer {SKILLS_ENGINE_TOKEN}
```

#### **Request Body (from LearnerAI)**
```json
{
  "competencies": [
    "Competency_Name_1",
    "Competency_Name_2",
    "Competency_Name_3"
  ]
}
```

**Note:** 
- The `competencies` array is a simple array of competency names (strings) identified from Prompt 2 (Competency Identification). For example:
  - `"React Hooks"`
  - `"TypeScript Fundamentals"`
  - `"Node.js Backend Development"`
- **Skills Engine returns the LOWEST LAYER skills** as a simple array of skill names (strings) - no IDs, no micro/nano separation
- This ensures consistency: both the initial gap and expanded breakdown are at the same granularity level (lowest layer).

#### **Response (from Skills Engine)**
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
- Response format is `{ "Competency_Name": ["Skill Name 1", "Skill Name 2", ...] }`
- Only skill names (strings) in the lowest layer - no IDs, no micro/nano separation
- This matches the level of the initial skills gap for consistency

#### **When LearnerAI Calls This**
- ✅ During learning path generation (after Prompt 2 - Competency Identification)
- ✅ After AI expands competencies from the initial skills gap
- ✅ Used to get the lowest layer skills for each competency for path creation

#### **Flow in Learning Path Generation**
```
1. Skills Engine sends gap → LearnerAI (Communication Type 1)
2. Prompt 1: Expand skills gap
3. Prompt 2: Identify competencies from expanded skills
4. LearnerAI → Skills Engine: Request breakdown for expanded competencies (Communication Type 2)
5. Skills Engine → LearnerAI: Returns lowest layer skills (array of skill names)
6. Prompt 3: Create learning path using gap + breakdown
```

#### **Implementation**
- **Client**: `SkillsEngineClient` (`backend/src/infrastructure/clients/SkillsEngineClient.js`)
- **Method**: `requestSkillBreakdown(competencies, options)`
- **Used in**: `GenerateLearningPathUseCase`
- **Retry Logic**: 3 retries with exponential backoff
- **Fallback**: Mock data if Skills Engine unavailable

#### **Example (LearnerAI calling Skills Engine)**
```javascript
// In GenerateLearningPathUseCase
// After Prompt 2 identifies competencies
const competencyNames = [
  "React Hooks",
  "TypeScript Fundamentals",
  "Node.js Backend Development"
];

// Request Micro/Nano breakdown from Skills Engine
const breakdown = await skillsEngineClient.requestSkillBreakdown(
  competencyNames,
  {
    maxRetries: 3,
    retryDelay: 1000,
    useMockData: false
  }
);

// breakdown contains:
// {
//   "React Hooks": {
//     microSkills: [...],
//     nanoSkills: [...]
//   },
//   "TypeScript Fundamentals": {
//     microSkills: [...],
//     nanoSkills: [...]
//   },
//   "Node.js Backend Development": {
//     microSkills: [...],
//     nanoSkills: [...]
//   }
// }
```

#### **Environment Variables**
```env
SKILLS_ENGINE_URL=http://localhost:5001
SKILLS_ENGINE_TOKEN=your-skills-engine-token
LEARNER_AI_SERVICE_TOKEN=your-learner-ai-token
```

---

## 3️⃣ Learning Analytics Microservice

Learning Analytics has **two distinct communication patterns** with LearnerAI:

---

### 📥 **Communication Type 1: On-Demand Requests (Incoming)**

Learning Analytics requests data for a specific user by calling LearnerAI's fill-fields endpoint.

#### **Endpoint (in LearnerAI)**
```
POST /api/fill-content-metrics
```

#### **Request Body (from Learning Analytics)**
```json
{
  "serviceName": "LearningAnalytics",
  "payload": "{\"user_id\":\"uuid\"}"
}
```

#### **Response (from LearnerAI)**
```json
{
  "serviceName": "LearningAnalytics",
  "payload": "[{\"user_id\":\"uuid\",\"user_name\":\"string\",\"company_id\":\"uuid\",\"company_name\":\"string\",\"competency_target_name\":\"string\",\"gap_id\":\"uuid\",\"skills_raw_data\":{...},\"exam_status\":\"PASS\"|\"FAIL\"},...]"
}
```

**Note:** In on-demand mode, LearnerAI does **NOT** send `learning_path` unless Learning Analytics specifically requests it by including `competency_target_name` in the request.

#### **When Learning Analytics Calls This**
- ✅ When Learning Analytics needs data for a specific user
- ✅ On-demand requests for user analytics

#### **Implementation**
- **Route**: `backend/src/api/routes/endpoints.js`
- **Handler**: `fillLearningAnalyticsData()` function
- **Method**: Learning Analytics calls `/api/fill-content-metrics` with `serviceName: "LearningAnalytics"`

---

### 📤 **Communication Type 2: Batch Mode (Outgoing)**

LearnerAI sends all data for all users every day in a scheduled batch.

#### **Endpoint (in Learning Analytics)**
```
POST {ANALYTICS_URL}/api/v1/paths/batch
```

#### **Headers (from LearnerAI)**
```http
Content-Type: application/json
Authorization: Bearer {ANALYTICS_TOKEN}
X-Service-Token: {ANALYTICS_TOKEN}
```

#### **Request Body (from LearnerAI)**
Array of user data objects (all users with their learning paths):

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
  },
  {
    // ... more user data objects
  }
]
```

#### **When LearnerAI Calls This**
- ✅ **Scheduled daily batch** (e.g., every day at midnight)
- ✅ Contains **all users** with their learning paths
- ✅ Includes **complete data** with `learning_path` for each user

#### **Implementation**
- **Client**: `AnalyticsClient` (`backend/src/infrastructure/clients/AnalyticsClient.js`)
- **Method**: `analyticsClient.sendBatchAnalytics(batchData)`
- **Scheduled**: Daily batch job (cron/scheduler)

#### **Example (LearnerAI calling Learning Analytics - Batch Mode)**
```javascript
// In scheduled batch job (e.g., daily at midnight)
const allUsersData = await getAllUsersAnalyticsData(); // Fetch all users with their learning paths

const batchPayload = allUsersData.map(userData => ({
  user_id: userData.user_id,
  user_name: userData.user_name,
  company_id: userData.company_id,
  company_name: userData.company_name,
  competency_target_name: userData.competency_target_name,
  gap_id: userData.gap_id,
  skills_raw_data: userData.skills_raw_data,
  exam_status: userData.exam_status,
  learning_path: userData.learning_path // Included in batch mode
}));

await analyticsClient.sendBatchAnalytics(batchPayload);
```

#### **Environment Variables**
```env
ANALYTICS_URL=http://localhost:5003
ANALYTICS_TOKEN=your-token-here
```

#### **Full Documentation**
See `LEARNING_ANALYTICS_JSON.md` for complete JSON specification and both communication modes.

---

## 4️⃣ Course Builder Microservice

### 📤 **Outgoing: LearnerAI → Course Builder**

LearnerAI sends learning paths to Course Builder for course creation.

#### **Endpoint (in Course Builder)**
```
POST {COURSE_BUILDER_URL}/api/v1/learning-paths
```

#### **Headers (from LearnerAI)**
```http
Content-Type: application/json
Authorization: Bearer {COURSE_BUILDER_TOKEN}
X-Service-Token: {COURSE_BUILDER_TOKEN}
```

#### **Request Body (from LearnerAI)**
```json
{
  "user_id": "uuid",
  "user_name": "string",
  "company_id": "uuid",
  "company_name": "string",
  "competency_target_name": "string",
  "learning_path": {
    "steps": [
      {
        "step": 1,
        "title": "string",
        "duration": "string",
        "resources": ["string"],
        "objectives": ["string"],
        "estimatedTime": "string"
      }
    ],
    "estimatedCompletion": "string",
    "totalSteps": 1,
    "createdAt": "ISO DateTime",
    "updatedAt": "ISO DateTime"
  }
}
```

**Note:** Course Builder does NOT receive `gap_id`, `skills_raw_data`, or `exam_status` (these are only sent to Learning Analytics).

#### **When LearnerAI Calls This**
- After learning path is generated and approved (if manual approval)
- Immediately after generation (if auto approval)
- Only if company has `approval_policy: "auto"` OR after manual approval

#### **Implementation**
- **Client**: `CourseBuilderClient` (`backend/src/infrastructure/clients/CourseBuilderClient.js`)
- **Use Case**: `DistributePathUseCase`
- **Method**: `courseBuilderClient.sendLearningPath(learningPath)`

#### **Example (LearnerAI calling Course Builder)**
```javascript
// In DistributePathUseCase
const courseBuilderPayload = {
  user_id: learningPath.userId,
  user_name: skillsGap.user_name,
  company_id: skillsGap.company_id,
  company_name: skillsGap.company_name,
  competency_target_name: competencyTargetName,
  learning_path: learningPath.pathMetadata || learningPath.learning_path
};

await courseBuilderClient.sendLearningPath(courseBuilderPayload);
```

#### **Environment Variables**
```env
COURSE_BUILDER_URL=http://localhost:5002
COURSE_BUILDER_TOKEN=your-token-here
```

#### **Full Documentation**
See `COURSE_BUILDER_JSON.md` for complete JSON specification.

---

## 🔐 Authentication & Security

### Service Tokens

All microservice communication uses **Bearer tokens** for authentication:

1. **Incoming requests** (Directory, Skills Engine → LearnerAI):
   - Validate `Authorization: Bearer {LEARNER_AI_SERVICE_TOKEN}`
   - Token stored in environment: `LEARNER_AI_SERVICE_TOKEN`

2. **Outgoing requests** (LearnerAI → Skills Engine, Learning Analytics, Course Builder):
   - Send `Authorization: Bearer {SERVICE_TOKEN}`
   - Tokens stored in environment:
     - `SKILLS_ENGINE_TOKEN` (for Skills Engine)
     - `ANALYTICS_TOKEN` (for Learning Analytics)
     - `COURSE_BUILDER_TOKEN` (for Course Builder)

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
```

---

## 🔄 Complete Communication Flow

### Scenario: New Company → New Learner → Skills Gap → Learning Path

```
1. Directory → LearnerAI
   POST /api/v1/companies/register
   └─> Store company in companies table

2. Skills Engine → LearnerAI (Communication Type 1)
   POST /api/v1/skills-gaps
   └─> Store skills gap after exam, create learner if needed

3. LearnerAI generates learning path
   ├─> Prompt 1: Expand skills gap
   ├─> Prompt 2: Identify competencies
   │
   └─> LearnerAI → Skills Engine (Communication Type 2)
       POST {SKILLS_ENGINE_URL}/api/skills/breakdown
       └─> Request Micro/Nano breakdown for expanded competencies
       └─> Skills Engine → LearnerAI: Returns breakdown
   │
   └─> Prompt 3: Create learning path using gap + breakdown

4. LearnerAI → Course Builder (if auto approval)
   POST {COURSE_BUILDER_URL}/api/v1/learning-paths
   └─> Send learning path

5. LearnerAI → Learning Analytics
   POST {ANALYTICS_URL}/api/v1/paths/update
   └─> Send learning path + gap data
```

---

## 🛠️ Testing Microservice Communication

### Test Directory → LearnerAI
```powershell
# PowerShell
$body = @{
    company_id = "550e8400-e29b-41d4-a716-446655440001"
    company_name = "Test Corp"
    approval_policy = "auto"
    decision_maker = @{
        employee_id = "660e8400-e29b-41d4-a716-446655440001"
        employee_name = "Test Manager"
        employee_email = "test@testcorp.com"
    }
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:5000/api/v1/companies/register `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json"; "Authorization" = "Bearer YOUR_TOKEN" } `
  -Body $body
```

### Test Skills Engine → LearnerAI
```powershell
# PowerShell
$body = @{
    user_id = "a1b2c3d4-e5f6-4789-a012-345678901234"
    user_name = "Test User"
    company_id = "c1d2e3f4-5678-9012-3456-789012345678"
    company_name = "Test Corp"
    competency_name = "JavaScript Basics"
    exam_status = "FAIL"
    gap = @{
        "Competency_JavaScript" = @("MGS_Skill_1", "MGS_Skill_2")
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri http://localhost:5000/api/v1/skills-gaps `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json"; "Authorization" = "Bearer YOUR_TOKEN" } `
  -Body $body
```

### Test LearnerAI → Learning Analytics
```powershell
# This is called automatically by DistributePathUseCase
# You can test by generating a learning path and checking logs
```

### Test LearnerAI → Course Builder
```powershell
# This is called automatically by DistributePathUseCase
# You can test by generating a learning path and checking logs
```

---

## 📚 Related Documentation

- **Learning Analytics JSON**: `LEARNING_ANALYTICS_JSON.md`
- **Course Builder JSON**: `COURSE_BUILDER_JSON.md`
- **Directory Flow**: `DIRECTORY_COMPANY_FLOW.md`
- **Architecture**: `docs/architecture.md`

---

## ✅ Summary

| Microservice | Direction | Endpoint | When Called |
|--------------|-----------|----------|-------------|
| **Directory** | Incoming | `POST /api/v1/companies/register` | Company registration/update |
| **Skills Engine** | Incoming (Type 1) | `POST /api/v1/skills-gaps` | After each exam completion |
| **Skills Engine** | Outgoing (Type 2) | `POST /api/skills/breakdown` | During path generation (after competency expansion) |
| **Learning Analytics** | Outgoing | `POST /api/v1/paths/update` | After path generation |
| **Course Builder** | Outgoing | `POST /api/v1/learning-paths` | After path generation |

**All communication uses Bearer token authentication!** 🔐

