# Learning Analytics JSON Payload

This document describes the two communication modes between LearnerAI and Learning Analytics microservice.

---

## 📋 Communication Modes

Learning Analytics receives data from LearnerAI in **two ways**:

1. **On-Demand Mode**: Learning Analytics requests data for a specific user by sending `user_id`
2. **Batch Mode**: LearnerAI sends all data for all users every day (scheduled batch)

---

## 1️⃣ On-Demand Mode (Learning Analytics → LearnerAI)

### **How It Works**

Learning Analytics requests data for a specific user by calling LearnerAI's fill-fields endpoint.

#### **Endpoint (in LearnerAI)**
```
POST /api/fill-content-metrics
```

#### **Request from Learning Analytics**
```json
{
  "serviceName": "LearningAnalytics",
  "payload": "{\"user_id\":\"uuid\"}"
}
```

#### **Response from LearnerAI**
LearnerAI returns all learning paths for that user (without `learning_path` unless requested):

```json
{
  "serviceName": "LearningAnalytics",
  "payload": "[{\"user_id\":\"uuid\",\"user_name\":\"string\",\"company_id\":\"uuid\",\"company_name\":\"string\",\"competency_target_name\":\"string\",\"gap_id\":\"uuid\",\"skills_raw_data\":{...},\"exam_status\":\"PASS\"|\"FAIL\"},...]"
}
```

**Note:** In on-demand mode, LearnerAI does NOT send `learning_path` unless Learning Analytics specifically requests it by including `competency_target_name` in the request.

---

## 2️⃣ Batch Mode (LearnerAI → Learning Analytics)

### **How It Works**

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
Array of user data objects:

```json
[
  {
    "user_id": "string (UUID)",
    "user_name": "string",
    "company_id": "string (UUID)",
    "company_name": "string",
    "competency_target_name": "string",
    "gap_id": "string (UUID)",
    "skills_raw_data": {
      "Competency_Name_1": [
        "MGS_Skill_ID_1",
        "MGS_Skill_ID_2",
        "MGS_Skill_ID_3"
      ],
      "Competency_Name_2": [
        "MGS_Skill_ID_4",
        "MGS_Skill_ID_5"
      ]
    },
    "exam_status": "PASS" | "FAIL",
    "learning_path": {
      "steps": [
        {
          "step": "number",
          "title": "string",
          "duration": "string",
          "resources": ["string"],
          "objectives": ["string"],
          "estimatedTime": "string"
        }
      ],
      "estimatedCompletion": "string",
      "totalSteps": "number",
      "createdAt": "string (ISO DateTime)",
      "updatedAt": "string (ISO DateTime)"
    }
  },
  {
    // ... more user data objects
  }
]
```

#### **When LearnerAI Sends This**
- ✅ **Scheduled daily batch** (e.g., every day at midnight)
- ✅ Contains **all users** with their learning paths
- ✅ Includes **complete data** with `learning_path` for each user

---

## 📋 JSON Body Structure (Single User Object)

### Root Level Fields (All Required)

| Field | Type | Required | Description |
|-------|------|---------|-------------|
| `user_id` | String (UUID) | ✅ Yes | Unique identifier for the learner |
| `user_name` | String | ✅ Yes | Full name of the learner |
| `company_id` | String (UUID) | ✅ Yes | Unique identifier for the company |
| `company_name` | String | ✅ Yes | Name of the company |
| `competency_target_name` | String | ✅ Yes | The competency/course name |
| `gap_id` | String (UUID) | ✅ Yes | Unique identifier for the skills gap record |
| `skills_raw_data` | Object (JSONB) | ✅ Yes | Missing skills map structure (from skills_gap table, contains missing_skills_map) |
| `exam_status` | String | ✅ Yes | Exam status: "PASS" or "FAIL" (from skills_gap.exam_status) |
| `learning_path` | Object | ⚠️ **Optional** | Complete learning path structure (JSONB from database) - **Only sent in batch mode** |

### Skills Raw Data Object (`skills_raw_data`)

**Note:** The `skills_raw_data` contains the `missing_skills_map` structure received from Skills Engine and stored directly in the `skills_gap` table. This is a simplified structure where competencies map to arrays of missing skill IDs.

| Field | Type | Required | Description |
|-------|------|---------|-------------|
| `[Competency_Name]` | Array of Strings | ✅ Yes | Object keys are competency names, values are arrays of missing skill IDs |
| | | | **Can contain any number of competencies** - the object is not limited to a specific count |

**Structure:**
- **Keys**: Competency names (strings, e.g., `"Competency_Front_End_Development"`)
- **Values**: Arrays of missing skill IDs (strings, typically prefixed with "MGS_", e.g., `"MGS_React_Hooks_Advanced"`)

**Example:**
```json
{
  "Competency_Front_End_Development": [
    "MGS_React_Hooks_Advanced",
    "MGS_Flexbox_Grid_System",
    "MGS_Async_Await_Handling"
  ],
  "Competency_Back_End_Development": [
    "MGS_Node_JS_Async",
    "MGS_Database_Design"
  ]
}
```

### Learning Path Object (`learning_path`)

**Note:** `learning_path` is **only sent in batch mode**. In on-demand mode, LearnerAI does NOT send `learning_path` unless specifically requested.

| Field | Type | Required | Description |
|-------|------|---------|-------------|
| `steps` | Array | ✅ Yes | Array of learning path step objects |
| `estimatedCompletion` | String | ⚠️ Optional | Estimated time to complete the entire path |
| `totalSteps` | Number | ⚠️ Optional | Total number of steps in the path |
| `createdAt` | String (ISO DateTime) | ⚠️ Optional | When the path was created |
| `updatedAt` | String (ISO DateTime) | ⚠️ Optional | When the path was last updated |

**Note:** The `learning_path` object structure is flexible and depends on what Gemini AI generates. The `steps` array is the only required field.

### Step Object (within `steps` array)

| Field | Type | Required | Description |
|-------|------|---------|-------------|
| `step` | Number | ⚠️ Optional | Step number (1, 2, 3, ...) |
| `title` | String | ⚠️ Optional | Step title/name |
| `duration` | String | ⚠️ Optional | Estimated duration for this step |
| `resources` | Array of Strings | ⚠️ Optional | Learning resources for this step |
| `objectives` | Array of Strings | ⚠️ Optional | Learning objectives for this step |
| `estimatedTime` | String | ⚠️ Optional | Estimated time to complete this step |

**Note:** Step object fields are flexible and depend on what Gemini AI generates in the learning path.

---

## 📝 Example Implementation

### On-Demand Mode (Learning Analytics requests data)

```javascript
// Learning Analytics calls LearnerAI's fill-fields endpoint
// POST /api/fill-content-metrics
// Body: { "serviceName": "LearningAnalytics", "payload": "{\"user_id\":\"uuid\"}" }

// LearnerAI responds with user data (without learning_path)
const response = {
  serviceName: "LearningAnalytics",
  payload: JSON.stringify([
    {
      user_id: "uuid",
      user_name: "Alice Johnson",
      company_id: "uuid",
      company_name: "TechCorp Solutions",
      competency_target_name: "JavaScript Basics",
      gap_id: "uuid",
      skills_raw_data: { ... },
      exam_status: "FAIL"
      // Note: learning_path is NOT included in on-demand mode
    }
  ])
};
```

### Batch Mode (LearnerAI sends all data)

```javascript
// In your scheduled batch job (e.g., daily at midnight)
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

// Send to Learning Analytics
await analyticsClient.sendBatchAnalytics(batchPayload);
```

---

## 📄 Example JSON Payload (Batch Mode)

Here's a concrete example with sample data for batch mode:

```json
[
  {
    "user_id": "660e8400-e29b-41d4-a716-446655440001",
    "user_name": "Alice Johnson",
    "company_id": "550e8400-e29b-41d4-a716-446655440001",
    "company_name": "TechCorp Solutions",
    "competency_target_name": "JavaScript Basics",
    "gap_id": "770e8400-e29b-41d4-a716-446655440001",
    "skills_raw_data": {
      "Competency_Front_End_Development": [
        "MGS_React_Hooks_Advanced",
        "MGS_Flexbox_Grid_System",
        "MGS_Async_Await_Handling"
      ],
      "Competency_JavaScript_Fundamentals": [
        "MGS_ES6_Syntax",
        "MGS_Promise_Handling"
      ]
    },
    "exam_status": "FAIL",
    "learning_path": {
      "steps": [
        {
          "step": 1,
          "title": "Introduction to ES6",
          "duration": "2 weeks",
          "resources": ["ES6 Guide", "Practice Exercises"],
          "objectives": ["Understand ES6 syntax", "Learn arrow functions"],
          "estimatedTime": "10 hours"
        },
        {
          "step": 2,
          "title": "Arrow Functions",
          "duration": "1 week",
          "resources": ["Arrow Functions Tutorial"],
          "objectives": ["Master arrow function syntax"],
          "estimatedTime": "5 hours"
        }
      ],
      "estimatedCompletion": "4 weeks",
      "totalSteps": 2,
      "createdAt": "2025-11-12T10:30:00Z",
      "updatedAt": "2025-11-12T10:35:00Z"
    }
  },
  {
    "user_id": "770e8400-e29b-41d4-a716-446655440002",
    "user_name": "Bob Smith",
    "company_id": "550e8400-e29b-41d4-a716-446655440001",
    "company_name": "TechCorp Solutions",
    "competency_target_name": "React Advanced",
    "gap_id": "880e8400-e29b-41d4-a716-446655440002",
    "skills_raw_data": {
      "Competency_React_Advanced": [
        "MGS_React_Context_API",
        "MGS_React_Performance"
      ]
    },
    "exam_status": "PASS",
    "learning_path": {
      "steps": [...],
      "estimatedCompletion": "6 weeks",
      "totalSteps": 5,
      "createdAt": "2025-11-12T11:00:00Z",
      "updatedAt": "2025-11-12T11:05:00Z"
    }
  }
]
```

---

## 🔄 Course Builder Payload (Different Structure)

**Note:** Course Builder receives a different JSON structure focused on the learning path entity. See `COURSE_BUILDER_JSON.md` for complete documentation.

**POST** `{COURSE_BUILDER_URL}/api/v1/learning-paths`

Course Builder receives the learning path entity (`learningPath.toJSON()`) which includes:
- Learning path structure (`learning_path` JSONB)
- User and company identifiers
- Path metadata and steps

**Course Builder does NOT receive:** `gap_id`, `skills_raw_data`, `exam_status` (these are only sent to Learning Analytics).

---

## ✅ Validation Rules

### Required Fields (Must be present):
- ✅ `user_id` - Must be valid UUID format
- ✅ `user_name` - Must be non-empty string
- ✅ `company_id` - Must be valid UUID format
- ✅ `company_name` - Must be non-empty string
- ✅ `competency_target_name` - Must be non-empty string
- ✅ `gap_id` - Must be valid UUID format (from skills_gap.gap_id)
- ✅ `skills_raw_data` - Must be valid JSON object containing missing_skills_map (from skills_gap.skills_raw_data)
- ✅ `exam_status` - Must be "PASS" or "FAIL" (from skills_gap.exam_status)
- ⚠️ `learning_path` - **Only required in batch mode** (optional in on-demand mode)

### Optional Fields:
- ⚠️ `learning_path.estimatedCompletion` - Optional string
- ⚠️ `learning_path.totalSteps` - Optional number
- ⚠️ `learning_path.createdAt` - Optional ISO DateTime string
- ⚠️ `learning_path.updatedAt` - Optional ISO DateTime string
- ⚠️ Step object fields - All optional, structure depends on AI generation

---

## 🔄 Summary

| Mode | Direction | Endpoint | Includes `learning_path`? | When? |
|------|-----------|----------|---------------------------|-------|
| **On-Demand** | Learning Analytics → LearnerAI | `POST /api/fill-content-metrics` | ❌ No (unless requested) | When Learning Analytics needs specific user data |
| **Batch** | LearnerAI → Learning Analytics | `POST {ANALYTICS_URL}/api/v1/paths/batch` | ✅ Yes | Daily scheduled batch (all users) |

---

**This JSON structure ensures Learning Analytics can track and analyze learning paths effectively!** ✅
