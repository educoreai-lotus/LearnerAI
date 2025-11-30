# Microservices Communication via Coordinator

## 📋 Overview

LearnerAI communicates with 4 external microservices through a coordinator:

1. **Directory** - Company and user management
2. **Skills Engine** - Skills gap analysis
3. **Learning Analytics** - Learning analytics and insights
4. **Course Builder** - Course building.....

---

## 1️⃣ Directory Microservice

### 📥 **What LearnerAI Receives (Incoming)**

**Endpoint:** `POST /api/v1/companies/register`

**What Directory Sends:**
```json
{
  "company_id": "uuid",
  "company_name": "Company Name",
  "approval_policy": "auto" | "manual",
  "decision_maker": {
    "employee_id": "uuid",
    "employee_name": "Decision Maker Name",
    "employee_email": "email@company.com"
  }
}
```

**When Directory Calls:**
- ✅ When a new company registers
- ✅ When a company updates their information

**What LearnerAI Does:**
- Saves/updates in `companies` table
- Updates all existing learners for that company

**Response (What LearnerAI Returns):**
```json
{
  "message": "Company registered successfully",
  "company": {
    "company_id": "uuid",
    "company_name": "Company Name",
    "decision_maker_policy": "auto" | "manual",
    "decision_maker": { ... }
  }
}
```

---

## 2️⃣ Skills Engine Microservice

### 📥 **Type 1: What LearnerAI Receives (Incoming)**

**Endpoint:** `POST /api/v1/skills-gaps`

**What Skills Engine Sends:**
```json
{
  "user_id": "uuid",
  "user_name": "User Name",
  "company_id": "uuid",
  "company_name": "Company Name",
  "competency_target_name": "GraphQL API Development",
  "status": "pass" | "fail",
  "gap": {
    "missing_skills_map": {
      "Competency_GraphQL_Fundamentals": [
        "MGS_GraphQL_Schema_Definition",
        "MGS_GraphQL_Queries"
      ]
    }
  }
}
```

**When Skills Engine Calls:**
- ✅ After each exam
- ✅ When a skills gap is detected

**What LearnerAI Does:**
- Saves to `skills_gap` table
- Creates learner if doesn't exist
- Starts learning path generation process

**Response (What LearnerAI Returns):**
```json
{
  "message": "Skills gap processed successfully",
  "skillsGap": {
    "gap_id": "uuid",
    "user_id": "uuid",
    "competency_target_name": "...",
    "exam_status": "pass" | "fail"
  }
}
```

---

### 📤 **Type 2: What LearnerAI Sends (Outgoing)**

**Endpoint:** `POST {SKILLS_ENGINE_URL}/api/skills/breakdown`

**What LearnerAI Sends:**
```json
[
  "Competency_GraphQL_Fundamentals",
  "Competency_GraphQL_Advanced",
  "Competency_TypeScript_Basics"
]
```
*(Simple array of competency names)*

**When LearnerAI Calls:**
- ✅ During learning path generation
- ✅ After Prompt 2 (competency identification)
- ✅ When Micro/Nano skills breakdown is needed

**What Skills Engine Returns:**
```json
{
  "skills": [
    {
      "competency": "Competency_GraphQL_Fundamentals",
      "micro_skills": [
        {
          "id": "MGS_GraphQL_Schema_Definition",
          "name": "GraphQL Schema Definition",
          "nano_skills": [
            {
              "id": "NGS_Type_Definitions",
              "name": "Type Definitions"
            }
          ]
        }
      ]
    }
  ]
}
```

**What LearnerAI Does with Response:**
- Uses breakdown for Prompt 3 (path creation)
- Caches for future use

---

## 3️⃣ Learning Analytics Microservice

### 📤 **What LearnerAI Sends (Outgoing)**

**Endpoint:** `POST {ANALYTICS_URL}/api/v1/paths/update`

**What LearnerAI Sends:**
```json
{
  "user_id": "uuid",
  "user_name": "User Name",
  "company_id": "uuid",
  "company_name": "Company Name",
  "competency_target_name": "GraphQL API Development",
  "gap_id": "uuid",
  "skills_raw_data": {
    "Competency_GraphQL_Fundamentals": [
      "MGS_GraphQL_Schema_Definition"
    ]
  },
  "exam_status": "pass" | "fail",
  "learning_path": {
    "pathTitle": "Master GraphQL API Development",
    "pathGoal": "...",
    "learning_modules": [ ... ],
    "totalDurationHours": 40
  },
  "created_at": "ISO DateTime",
  "updated_at": "ISO DateTime"
}
```

**When LearnerAI Sends:**
- ✅ After learning path is successfully created
- ✅ After approval (if manual approval)
- ✅ Immediately after creation (if auto approval)

**What Learning Analytics Does:**
- Stores data for analysis
- Calculates learning metrics
- Generates reports

**Response (What Learning Analytics Returns):**
```json
{
  "message": "Learning path data received successfully",
  "status": "ok"
}
```

---

### 📥 **What LearnerAI Receives (Incoming - Optional)**

**Endpoint:** `POST /api/fill-content-metrics`

**What Learning Analytics Sends:**
```json
{
  "user_id": "uuid"
}
```

**When Learning Analytics Calls:**
- ✅ When Learning Analytics needs data for a specific user
- ✅ On-demand data requests

**What LearnerAI Returns:**
```json
{
  "user_id": "uuid",
  "data": [
    {
      "gap_id": "uuid",
      "competency_target_name": "...",
      "exam_status": "pass" | "fail",
      "skills_raw_data": { ... },
      "learning_path": { ... } // if requested
    }
  ]
}
```

---

## 4️⃣ Course Builder Microservice

### 📤 **What LearnerAI Sends (Outgoing)**

**Endpoint:** `POST {COURSE_BUILDER_URL}/api/v1/learning-paths`

**What LearnerAI Sends:**
```json
{
  "user_id": "uuid",
  "user_name": "User Name",
  "company_id": "uuid",
  "company_name": "Company Name",
  "competency_target_name": "GraphQL API Development",
  "learning_path": {
    "pathTitle": "Master GraphQL API Development",
    "pathGoal": "Become a GraphQL expert",
    "pathDescription": "...",
    "learning_modules": [
      {
        "module_title": "GraphQL Fundamentals",
        "module_description": "...",
        "steps": [
          {
            "step": 1,
            "title": "Introduction to GraphQL",
            "duration": "2 hours",
            "resources": ["url1", "url2"],
            "objectives": ["objective1", "objective2"]
          }
        ],
        "subtopics": [ ... ]
      }
    ],
    "totalDurationHours": 40,
    "estimatedCompletion": "4 weeks"
  }
}
```

**⚠️ Important:** LearnerAI **does NOT** send:
- ❌ `gap_id`
- ❌ `skills_raw_data`
- ❌ `exam_status`

(These are only sent to Learning Analytics)

**When LearnerAI Sends:**
- ✅ After learning path is created and approved (if manual approval)
- ✅ Immediately after creation (if auto approval)
- ✅ Only if `approval_policy: "auto"` OR after manual approval

**What Course Builder Does:**
- Builds the course on the platform
- Creates content and structure
- Distributes to learner

**Response (What Course Builder Returns):**
```json
{
  "message": "Learning path received successfully",
  "course_id": "uuid",
  "status": "created"
}
```

---

## 📊 Summary - Communication Table

| Microservice | Direction | Endpoint | What LearnerAI Sends | What LearnerAI Receives |
|--------------|-----------|----------|---------------------|----------------------|
| **Directory** | 📥 Incoming | `POST /api/v1/companies/register` | Response with company data | Company registration data (company_id, name, approval_policy, decision_maker) |
| **Skills Engine** | 📥 Incoming | `POST /api/v1/skills-gaps` | Response with skills gap data | Skills gap data (user_id, competency, gap, status) |
| **Skills Engine** | 📤 Outgoing | `POST /api/skills/breakdown` | Array of competency names | Micro/Nano skills breakdown |
| **Learning Analytics** | 📤 Outgoing | `POST /api/v1/paths/update` | Complete learning path data (gap + path) | Confirmation message |
| **Learning Analytics** | 📥 Incoming | `POST /api/fill-content-metrics` | User data array | Request for user data (user_id) |
| **Course Builder** | 📤 Outgoing | `POST /api/v1/learning-paths` | Learning path structure (NO gap data) | Confirmation + course_id |

---

## 🔐 Authentication

**All communication uses Bearer Tokens:**

### Incoming (Microservices call LearnerAI):
- Header: `Authorization: Bearer {LEARNER_AI_SERVICE_TOKEN}`
- Token stored in: `LEARNER_AI_SERVICE_TOKEN`

### Outgoing (LearnerAI calls microservices):
- Header: `Authorization: Bearer {SERVICE_TOKEN}`
- Tokens:
  - `SKILLS_ENGINE_TOKEN`
  - `ANALYTICS_TOKEN`
  - `COURSE_BUILDER_TOKEN`

---

## 🔄 Complete Communication Flow

### Scenario: New Company → New Learner → Skills Gap → Learning Path

```
1. Directory → LearnerAI
   POST /api/v1/companies/register
   └─> LearnerAI saves to companies table

2. Skills Engine → LearnerAI (Type 1)
   POST /api/v1/skills-gaps
   └─> LearnerAI saves to skills_gap table
   └─> LearnerAI starts learning path generation

3. LearnerAI generates learning path
   ├─> Prompt 1: Expand skills gap
   ├─> Prompt 2: Identify competencies
   │
   └─> LearnerAI → Skills Engine (Type 2)
       POST /api/skills/breakdown
       └─> LearnerAI sends: ["Competency_1", "Competency_2"]
       └─> Skills Engine returns: Micro/Nano breakdown
   │
   └─> Prompt 3: Create learning path

4. LearnerAI → Learning Analytics
   POST /api/v1/paths/update
   └─> LearnerAI sends: Complete path data + gap data

5. LearnerAI → Course Builder (if auto approval or after approval)
   POST /api/v1/learning-paths
   └─> LearnerAI sends: Learning path structure (without gap data)
```

---

## 💡 Key Points

1. **Directory & Skills Engine (Type 1)**: Call LearnerAI (Incoming)
2. **Skills Engine (Type 2)**: LearnerAI calls Skills Engine (Outgoing)
3. **Learning Analytics**: LearnerAI sends data (Outgoing), but can also receive requests (Incoming)
4. **Course Builder**: LearnerAI sends learning paths (Outgoing)
5. **All Communication**: Through coordinator with Bearer token authentication

---

**All communication is secured with Service Tokens!** 🔐
