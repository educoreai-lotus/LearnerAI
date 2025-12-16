# Learning Analytics Connection

This document describes the simplified connection between Learning Analytics and LearnerAI.

---

## 📥 What Learning Analytics Sends

### Batch Request
```json
{
  "requester_service": "LearningAnalytics",
  "payload": {
    "type": "batch",
    "action": "..."
  }
}
```

### On-Demand Request
```json
{
  "requester_service": "LearningAnalytics",
  "payload": {
    "type": "on-demand",
    "action": "...",
    "user_id": "uuid"
  }
}
```

---

## 📤 What LearnerAI Returns

### Response Structure

LearnerAI returns an **array of courses**, where each course contains **exactly 3 fields in this order**:

1. `competency_target_name` - The competency/course name
2. `skills_raw_data` - Skills gap data (object)
3. `learning_path` - Learning path in Prompt 3 format (object)

### Response Format

```json
[
  {
    "competency_target_name": "string",
    "skills_raw_data": {
      /* skills gap object */
    },
    "learning_path": {
      "path_title": "string",
      "learner_id": "uuid",
      "total_estimated_duration_hours": number,
      "learning_modules": [
        {
          "module_order": number,
          "module_title": "string",
          "estimated_duration_hours": number,
          "skills_in_module": [
            "ordered list of skills"
          ],
          "steps": [
            {
              "step": number,
              "title": "string",
              "description": "string",
              "estimatedTime": number,
              "skills_covered": [
                "subset of skills_in_module introduced in this step"
              ]
            }
          ]
        }
      ]
    }
  },
  {
    "competency_target_name": "string",
    "skills_raw_data": {},
    "learning_path": {}
  }
  // ... more courses
]
```

---

## 🔄 Request Types

### Batch (`type: "batch"`)

**What it does:**
- Returns **ALL courses** in the database (all users, all competencies)

**Response:**
- Array of all courses with `competency_target_name`, `skills_raw_data`, `learning_path`

**Example:**
```json
[
  {
    "competency_target_name": "React Frontend Development",
    "skills_raw_data": { /* ... */ },
    "learning_path": { /* Prompt 3 format */ }
  },
  {
    "competency_target_name": "Node.js Backend Development",
    "skills_raw_data": { /* ... */ },
    "learning_path": { /* Prompt 3 format */ }
  }
  // ... all courses in database
]
```

---

### On-Demand (`type: "on-demand"` + `user_id`)

**What it does:**
- Returns **ALL courses** for the specified `user_id`

**Response:**
- Array of courses for that user with `competency_target_name`, `skills_raw_data`, `learning_path`

**Example:**
```json
[
  {
    "competency_target_name": "React Frontend Development",
    "skills_raw_data": { /* ... */ },
    "learning_path": { /* Prompt 3 format */ }
  },
  {
    "competency_target_name": "Python Data Science",
    "skills_raw_data": { /* ... */ },
    "learning_path": { /* Prompt 3 format */ }
  }
  // ... all courses for user_id
]
```

---

## 📋 Learning Path Format (Prompt 3)

The `learning_path` field uses **exactly** the Prompt 3 format:

```json
{
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
          "step": number,              // 1, 2, 3...
          "title": "string",
          "description": "string",
          "estimatedTime": number,     // hours (number, not string)
          "skills_covered": ["skill1"]
        }
      ]
    }
  ]
}
```

**Key Points:**
- `step` is a **number** (1, 2, 3...)
- `estimatedTime` is a **number** (hours), not a string
- `description` is included
- `skills_covered` uses the original field name from Prompt 3

---

## ✅ Summary

| Request Type | Returns | Fields Order |
|-------------|---------|--------------|
| **Batch** | All courses in database | 1. `competency_target_name`<br>2. `skills_raw_data`<br>3. `learning_path` |
| **On-Demand** | All courses for `user_id` | 1. `competency_target_name`<br>2. `skills_raw_data`<br>3. `learning_path` |

**No wrapper structure, no pagination, no extra fields** - just a simple array of courses with the 3 fields in the specified order.

