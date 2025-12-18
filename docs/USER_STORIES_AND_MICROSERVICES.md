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
> "As a company, I want to control whether learning paths are approved automatically or require manager approval before being available to Course Builder."

**What Happens:**
1. Directory sends company registration with approval policy (auto/manual)
2. LearnerAI checks the policy
3. If **auto** → learning path is stored as `approved: true`
4. If **manual** → learning path is stored as `approved: false`, sends for manager approval
5. Course Builder requests learning paths on-demand when needed
6. Learning Analytics requests data on-demand or in batch mode

**Key Components:**
- Company approval policies (auto/manual)
- Decision maker notifications
- Approval workflow management
- Course Builder pulls data on-demand (no automatic push)
- Learning Analytics pulls data on-demand or batch

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

**Endpoint:** `POST /api/fill-content-metrics`

**Request Body:**
```json
{
  "requester_service": "directory" | "Directory",
  "payload": {
    "action": "sending_decision_maker_to_approve_learning_path" | "update_company" | "register_company",
    "company_id": "uuid",
    "company_name": "TechCorp Inc.",
    "approval_policy": "auto" | "manual",
    "decision_maker_policy": "auto" | "manual",
    "decision_maker": {
      "employee_id": "uuid",
      "employee_name": "John Manager",
      "employee_email": "john@techcorp.com"
    }
  }
}
```

**Headers:**
```http
Content-Type: application/json
X-Service-Name: directory-service
X-Signature: <ECDSA signature>
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

**Endpoint:** `POST /api/fill-content-metrics`

**Request Body:**
```json
{
  "requester_service": "skills-engine" | "skills-engine-service",
  "payload": {
    "action": "update_skills_gap" | "create_skills_gap" | "update_skills_gap_to_update_the_learning_path",
    "user_id": "uuid",
    "user_name": "Alice Johnson",
    "company_id": "uuid",
    "company_name": "TechCorp Inc.",
    "competency_target_name": "JavaScript Modern Development",
    "status": "pass" | "fail",
    "exam_status": "PASS" | "FAIL",
    "preferred_language": "string",  // ⚠️ OPTIONAL - Learner's preferred language (VARCHAR)
    "gap": {
      "Competency_Front_End_Development": [
        "MGS_React_Hooks_Advanced",
        "MGS_Flexbox_Grid_System",
        "MGS_Async_Await_Handling"
      ]
    }
    // OR Skills Engine may send gap with skill_id and skill_name:
    // "gap": {
    //   "python basic": [
    //     { "skill_id": "mgs-1", "skill_name": "lists" },
    //     { "skill_id": "mgs-2", "skill_name": "dictionaries" }
    //   ]
    // }
  }
}
```

**Headers:**
```http
Content-Type: application/json
X-Service-Name: skills-engine-service
X-Signature: <ECDSA signature>
```

**Note:** 
- LearnerAI uses AI-powered field mapping to handle field name mismatches (e.g., `trainer_id` → `user_id`, `the_gap` → `gap`).
- If Skills Engine sends gap data with objects containing `skill_id` and `skill_name` (e.g., `{"skill_id": "mgs-1", "skill_name": "lists"}`), LearnerAI extracts only the `skill_name` and removes `skill_id` before saving to database.
- The database stores `skills_raw_data` in competency-based structure: `{"competency_name": ["skill1", "skill2"]}` (only skill names, no IDs).
- `preferred_language` is **optional** - if provided, it will be stored in the `skills_gap` table and can be used for personalized learning path generation.

**When Skills Engine Calls:**
- ✅ After each exam completion
- ✅ When a skills gap is detected
- ✅ When a learner fails an exam (exam_status: "FAIL")
- ✅ When a learner passes an exam (exam_status: "PASS")

**What LearnerAI Does:**
1. Normalizes gap format: Extracts only skill names from gap data (removes `skill_id` if present)
   - If gap contains objects like `{"skill_id": "mgs-1", "skill_name": "lists"}`, extracts only `"lists"`
   - Saves to database as: `{"competency_name": ["lists", "dictionaries"]}` (only skill names)
2. Checks if skills gap exists (by `user_id` + `competency_target_name`)
3. If exists: Updates `skills_raw_data` (filters to keep only skills in new gap)
4. If not exists: Creates new `skills_gap` row
5. Checks if learner exists (by `user_id`)
6. If not exists: Creates learner (gets company details from `companies` table)
7. Starts learning path generation process

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

**OR Skills Engine may send skills with IDs:**
```json
{
  "React Hooks": [
    { "skill_id": "mgs-1", "skill_name": "State Management" },
    { "skill_id": "mgs-2", "skill_name": "Side Effects" },
    { "skill_id": "mgs-3", "skill_name": "Custom Hooks" }
  ],
  "TypeScript Fundamentals": [
    { "skill_id": "mgs-4", "skill_name": "Type Annotations" },
    { "skill_id": "mgs-5", "skill_name": "Interfaces" }
  ]
}
```

**Note:** 
- Skills Engine returns **only the skills in the LOWEST layer** for each competency
- Skills Engine may send skills as **strings** (skill names) or as **objects** with `skill_id` and `skill_name`
- **LearnerAI normalizes the response:** Extracts only `skill_name` from objects (ignores `skill_id`)
- After normalization, LearnerAI uses **only skill names** (strings) - no IDs, no micro/nano separation
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
5. Skills Engine → LearnerAI: Returns lowest layer skills (may include skill_id + skill_name)
6. LearnerAI normalizes breakdown: Extracts only skill_name (ignores skill_id)
7. Prompt 3: Create learning path using gap + normalized breakdown (AI)
```

---

### 3️⃣ **Learning Analytics Microservice** (Bidirectional)

#### 📥 **Type 1: Batch Requests (Incoming)**

**Endpoint:** `POST /api/fill-content-metrics`

**Request Body:**
```json
{
  "requester_service": "LearningAnalytics",
  "payload": {
    "type": "batch",
    "action": "batch:ROUTE_TO_LearnerAI: ..."
  }
}
```

**Response from LearnerAI:**
```json
{
  "success": true,
  "action": "batch:...",
  "data": [
    {
      "competency_target_name": "string",
      "skills_raw_data": ["MGS_Skill_ID_1", "MGS_Skill_ID_2", "MGS_Skill_ID_3"],
      "exam_status": "pass" | "fail",
      "learning_path": {
        "path_title": "string",
        "learner_id": "uuid",
        "total_estimated_duration_hours": number,
        "learning_modules": [
          {
            "module_order": number,
            "module_title": "string",
            "estimated_duration_hours": number,
            "skills_in_module": ["skill1", "skill2"],
            "steps": [
              {
                "step": number,
                "title": "string",
                "description": "string",
                "estimatedTime": number,
                "skills_covered": ["skill1"]
              }
            ]
          }
        ]
      }
    }
    // ... all courses in database
  ]
}
```

**When Learning Analytics Calls:**
- ✅ When Learning Analytics needs all learning paths (batch mode)
- ✅ Returns **ALL courses** in the database (all users, all competencies)

**Note:** Returns simple array with 4 fields per course: `competency_target_name`, `skills_raw_data` (array of skill names, competency structure removed), `exam_status`, `learning_path` (Prompt 3 format)

#### 📥 **Type 2: On-Demand Requests (Incoming)**

**Endpoint:** `POST /api/fill-content-metrics`

**Request Body:**
```json
{
  "requester_service": "LearningAnalytics",
  "payload": {
    "type": "on-demand",
    "action": "on-demand:ROUTE_TO_LearnerAI: ...",
    "user_id": "uuid"
  }
}
```

**Response from LearnerAI:**
```json
{
  "success": true,
  "action": "on-demand:...",
  "data": [
    {
      "competency_target_name": "string",
      "skills_raw_data": ["MGS_Skill_ID_1", "MGS_Skill_ID_2", "MGS_Skill_ID_3"],
      "exam_status": "pass" | "fail",
      "learning_path": {
        "path_title": "string",
        "learner_id": "uuid",
        "total_estimated_duration_hours": number,
        "learning_modules": [
          {
            "module_order": number,
            "module_title": "string",
            "estimated_duration_hours": number,
            "skills_in_module": ["skill1", "skill2"],
            "steps": [
              {
                "step": number,
                "title": "string",
                "description": "string",
                "estimatedTime": number,
                "skills_covered": ["skill1"]
              }
            ]
          }
        ]
      }
    }
    // ... all courses for this user_id
  ]
}
```

**When Learning Analytics Calls:**
- ✅ When Learning Analytics needs data for a specific user
- ✅ Returns **ALL courses** for that `user_id`

**Note:** Returns simple array with 3 fields per course: `competency_target_name`, `skills_raw_data`, `learning_path` (Prompt 3 format). **Both batch and on-demand return the same structure** - just different scope (all courses vs. user-specific courses).

---

### 4️⃣ **Course Builder Microservice** (Bidirectional)

#### 📥 **Type 1: Batch Learners Request (Incoming)**

**Endpoint:** `POST /api/fill-content-metrics`

**Request Body:**
```json
{
  "requester_service": "course-builder" | "course-builder-service",
  "payload": {
    "company_id": "uuid",           // ✅ REQUIRED
    "company_name": "string",        // ⚠️ OPTIONAL
    "learning_flow": "career_path_driven",  // Optional, defaults to "career_path_driven"
    "learners": [
      { 
        "learner_id": "uuid1",
        "learner_name": "string",        // ⚠️ OPTIONAL
        "preferred_language": "string"  // ⚠️ OPTIONAL
      },
      { 
        "learner_id": "uuid2",
        "learner_name": "string",        // ⚠️ OPTIONAL
        "preferred_language": "string"   // ⚠️ OPTIONAL
      }
    ]
  }
}
```

**Response from LearnerAI:**
```json
{
  "success": true,
  "action": "get_batch_career_paths",
  "data": {
    "company_id": "uuid",
    "company_name": "string",
    "learning_flow": "career_path_driven",
    "learners_data": [
      {
        "user_id": "uuid1",
        "user_name": "string",
        "company_id": "uuid",
        "company_name": "string",
        "learning_flow": "career_path_driven",
        "preferred_language": "string",  // ⚠️ Included if provided in request
        "career_learning_paths": [
          {
            "competency_target_name": "string",
            "skills_raw_data": ["skill1", "skill2", "skill3"],
            "learning_path": {
              "path_title": "string",
              "learner_id": "uuid",
              "total_estimated_duration_hours": number,
              "learning_modules": [...]
            }
          }
        ]
      }
      // ... one object per learner
    ]
  }
}
```

**When Course Builder Calls:**
- ✅ When Course Builder needs career paths for multiple learners from a company
- ✅ Returns all courses for each learner in the `learners` array

**Note:** 
- `company_id` is **required**, `company_name` is optional
- `learner_name` and `preferred_language` are optional in the `learners` array
- If `learner_name` is provided, it will override the `user_name` fetched from the database
- `preferred_language` is returned in the response if provided in the request
- Returns Prompt 3 format learning paths

#### 📥 **Type 2: Single Learner Career Path Request (Incoming)**

**Endpoint:** `POST /api/fill-content-metrics`

**Request Body:**
```json
{
  "requester_service": "course-builder" | "course-builder-service",
  "payload": {
    "user_id": "uuid",
    "company_id": "uuid",
    "learner_name": "string",        // ⚠️ OPTIONAL
    "preferred_language": "string",   // ⚠️ OPTIONAL
    "learning_flow": "career_path_driven"
  }
}
```

**Response from LearnerAI:**
```json
{
  "success": true,
  "action": "get_career_paths",
  "data": {
    "user_id": "uuid",
    "user_name": "string",
    "company_id": "uuid",
    "company_name": "string",
    "learning_flow": "career_path_driven",
    "preferred_language": "string",  // ⚠️ Included if provided in request
    "career_learning_paths": [
      {
        "competency_target_name": "string",
        "skills_raw_data": ["skill1", "skill2", "skill3"],
        "learning_path": {
          "path_title": "string",
          "learner_id": "uuid",
          "total_estimated_duration_hours": number,
          "learning_modules": [...]
        }
      }
      // ... all courses for this user
    ]
  }
}
```

**When Course Builder Calls:**
- ✅ When Course Builder needs all career paths for a single learner
- ✅ Returns all courses for that `user_id`

**Note:** 
- `learner_name` and `preferred_language` are optional in the payload
- If `learner_name` is provided, it will override the `user_name` fetched from the database
- `preferred_language` is returned in the response if provided in the request
- Returns Prompt 3 format learning paths

#### 📥 **Type 3: Get Learning Path Request (Incoming)**

**Endpoint:** `POST /api/fill-content-metrics`

**Request Body:**
```json
{
  "requester_service": "course-builder" | "course-builder-service",
  "payload": {
    "action": "get_learning_path",
    "user_id": "uuid",
    "tag": "string"  // or "competency_target_name"
  }
}
```

**Response from LearnerAI:**
```json
{
  "success": true,
  "action": "get_learning_path",
  "data": {
    "user_id": "uuid",
    "competency_target_name": "string",
    "learning_path": {
      "path_title": "string",
      "learner_id": "uuid",
      "total_estimated_duration_hours": number,
      "learning_modules": [...]
    },
    "skills_raw_data": ["skill1", "skill2", "skill3"]
  },
  "learning_path": {...},
  "skills_raw_data": ["skill1", "skill2", "skill3"]
}
```

**When Course Builder Calls:**
- ✅ When Course Builder needs a specific learning path for a competency
- ✅ Returns learning path and skills_raw_data for that specific course

**Note:** 
- Supports both `tag` and `competency_target_name` fields (AI-powered field mapping)
- Returns Prompt 3 format learning paths
- `skills_raw_data` field is returned as an array of skill names (competency structure removed)

#### 📤 **What LearnerAI Sends (Outgoing):**
- ❌ **No longer automatically sends** learning paths to Course Builder
- ✅ Course Builder now **requests** data on-demand from LearnerAI
- ✅ This allows Course Builder to pull data when needed, rather than LearnerAI pushing

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
1. Directory → LearnerAI (via Coordinator)
   POST /api/fill-content-metrics
   └─> Store company in companies table
   └─> Save approval policy and decision maker

2. Skills Engine → LearnerAI (Type 1, via Coordinator)
   POST /api/fill-content-metrics
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
   ├─> If auto → Learning path is ready (stored in database)
   └─> If manual → Create approval request
       └─> Send notification to decision maker
       └─> Wait for approval
       └─> If approved → Learning path is ready (stored in database)

5. Course Builder → LearnerAI (on-demand, via Coordinator)
   POST /api/fill-content-metrics
   └─> Course Builder requests learning path when needed
   └─> Options:
       - Batch learners: `learners` array (with optional `learner_name`, `preferred_language`) + `company_id`
       - Single learner: `learning_flow: "career_path_driven"` + `user_id` (with optional `learner_name`, `preferred_language`)
       - Get path: `action: "get_learning_path"` + `user_id` + `tag`
   └─> LearnerAI returns learning path (Prompt 3 format) + skills_raw_data + `preferred_language` (if provided)

6. Learning Analytics → LearnerAI (on-demand or batch, via Coordinator)
   POST /api/fill-content-metrics
   └─> Learning Analytics requests data:
       - Batch: `type: "batch"` → returns all courses
       - On-demand: `type: "on-demand"` + `user_id` → returns user's courses
   └─> LearnerAI returns simple array: `[{ competency_target_name, skills_raw_data, learning_path }, ...]`
   └─> Learning path in Prompt 3 format exactly as stored

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
| **Directory** | 📥 Incoming | `POST /api/fill-content-metrics` | Company registration/update data (company_id, name, approval_policy, decision_maker) | Response with company data |
| **Skills Engine** | 📥 Incoming (Type 1) | `POST /api/fill-content-metrics` | Skills gap data (user_id, competency, gap, exam_status, preferred_language) | Response with job_id |
| **Skills Engine** | 📤 Outgoing (Type 2) | `POST /api/skills/breakdown` | Lowest layer skills (array of skill names per competency) | Array of competency names |
| **Learning Analytics** | 📥 Incoming (Batch) | `POST /api/fill-content-metrics` | Batch request (`type: "batch"`) | Simple array: all courses with `competency_target_name`, `skills_raw_data` (array), `exam_status`, `learning_path` (Prompt 3 format) |
| **Learning Analytics** | 📥 Incoming (On-demand) | `POST /api/fill-content-metrics` | On-demand request (`type: "on-demand"`, `user_id`) | Simple array: all courses for user with `competency_target_name`, `skills_raw_data` (array), `exam_status`, `learning_path` (Prompt 3 format) |
| **Course Builder** | 📥 Incoming (Batch) | `POST /api/fill-content-metrics` | Batch learners request (`learners` array with optional `learner_name`, `preferred_language`, `company_id`) | `learners_data` array with `career_learning_paths` + `preferred_language` (Prompt 3 format, `skills_raw_data` as array) |
| **Course Builder** | 📥 Incoming (Single) | `POST /api/fill-content-metrics` | Career path request (`learning_flow: "career_path_driven"`, `user_id`, optional `learner_name`, `preferred_language`) | `career_learning_paths` array + `preferred_language` (Prompt 3 format, `skills_raw_data` as array) |
| **Course Builder** | 📥 Incoming (Get Path) | `POST /api/fill-content-metrics` | Get learning path (`action: "get_learning_path"`, `user_id`, `tag`) | Learning path + `skills_raw_data` (array) (Prompt 3 format) |
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

### Approval Workflow

**Learning Path Distribution:**
- Learning paths are **stored in the database** after generation
- **Course Builder requests** learning paths on-demand when needed (no automatic push)
- Approval workflow determines if path is stored as `approved: true` or `approved: false`
- Course Builder can request paths regardless of approval status

**Updates After Exam Failure:**
- If learning path is an **update** after exam failure (course already exists + `exam_status: 'fail'`):
  - Learning path is updated in database
  - Course Builder can request the updated path on-demand
  - No automatic distribution to Course Builder

### Data Differences

**Course Builder receives (when requesting from LearnerAI):**
- ✅ Learning path structure (Prompt 3 format)
- ✅ User and company info
- ✅ Skills raw data (`skills_raw_data`) - **as array of skill names** (competency structure removed) - included in career path requests
- ✅ `preferred_language` - returned if provided in the request
- ✅ Learning path in Prompt 3 format: `{ path_title, learner_id, total_estimated_duration_hours, learning_modules: [...] }`

**Learning Analytics receives (when requesting from LearnerAI):**
- ✅ Learning path structure (Prompt 3 format)
- ✅ Skills raw data (`skills_raw_data`) - **as array of skill names** (competency structure removed)
- ✅ `exam_status` - Exam status: `"pass"` or `"fail"`
- ✅ Learning path in Prompt 3 format: `{ path_title, learner_id, total_estimated_duration_hours, learning_modules: [...] }`
- ✅ Simple array format: `[{ competency_target_name, skills_raw_data (array), exam_status, learning_path }, ...]`

**Note:** 
- Both Course Builder and Learning Analytics receive `skills_raw_data` as a **plain array** of skill names (competency names removed)
- Learning paths are in **Prompt 3 format** exactly as stored in the database
- Database structure remains unchanged (competency-based structure) - transformation only happens when sending to Course Builder and Learning Analytics

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
- **Learning Analytics Connection**: `LEARNING_ANALYTICS_CONNECTION.md`
- **Learning Analytics JSON**: `docs/guides/LEARNING_ANALYTICS_JSON.md`
- **Course Builder JSON**: `docs/guides/COURSE_BUILDER_JSON.md`

---

**Document Maintained By:** LearnerAI Development Team

