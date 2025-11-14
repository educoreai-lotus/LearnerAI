# Learning Analytics JSON Payload

This document describes the exact JSON structure sent to the Learning Analytics microservice when a learning path is ready.

---

## 📤 Endpoint

**POST** `{ANALYTICS_URL}/api/v1/paths/update`

**Headers:**
```
Content-Type: application/json
Authorization: Bearer {ANALYTICS_TOKEN}
X-Service-Token: {ANALYTICS_TOKEN}
```

---

## 📋 JSON Body Structure (General Specification)

```json
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
    // ... can contain any number of competencies
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
}
```

---

## 🔑 Field Descriptions

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
| `learning_path` | Object | ✅ Yes | Complete learning path structure (JSONB from database) |

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

```javascript
// In your code when learning path is ready
// You need to fetch the skills_gap data to include gap_id, skills_raw_data, and test_status
const skillsGap = await skillsGapRepository.getSkillsGapByUserAndCompetency(
  learningPath.user_id,
  learningPath.competency_target_name
);

const analyticsPayload = {
  user_id: learningPath.user_id,
  user_name: learningPath.user_name,
  company_id: learningPath.company_id,
  company_name: learningPath.company_name,
  competency_target_name: learningPath.competency_target_name,
  gap_id: skillsGap.gap_id, // From skills_gap table
  skills_raw_data: skillsGap.skills_raw_data, // From skills_gap table (contains missing_skills_map)
  exam_status: skillsGap.exam_status, // From skills_gap table ("PASS" or "FAIL")
  learning_path: learningPath.learning_path // JSONB from courses table
};

// Send to Learning Analytics
await analyticsClient.updatePathAnalytics(analyticsPayload);
```

---

## 📄 Example JSON Payload

Here's a concrete example with sample data:

```json
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
}
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
- ✅ `learning_path` - Must be valid JSON object
- ✅ `learning_path.steps` - Must be an array (can be empty)

### Optional Fields:
- ⚠️ `learning_path.estimatedCompletion` - Optional string
- ⚠️ `learning_path.totalSteps` - Optional number
- ⚠️ `learning_path.createdAt` - Optional ISO DateTime string
- ⚠️ `learning_path.updatedAt` - Optional ISO DateTime string
- ⚠️ Step object fields - All optional, structure depends on AI generation

---

**This JSON structure ensures Learning Analytics can track and analyze learning paths effectively!** ✅

