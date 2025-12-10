# Learning Path Structure - General Specification

This document describes the general structure of a learning path object that is stored in the `courses.learning_path` JSONB column and sent to Course Builder and other microservices.

---

## 📋 General Structure

```json
{
  "steps": [
    {
      "step": 1,
      "title": "Step Title",
      "duration": "string (e.g., '1 week', '2 weeks')",
      "resources": ["array", "of", "resource", "strings"],
      "objectives": ["array", "of", "learning", "objectives"],
      "estimatedTime": "string (e.g., '6 hours', '10 hours')"
    }
  ],
  "estimatedCompletion": "string (e.g., '6-8 weeks')",
  "totalSteps": 8,
  "createdAt": "ISO DateTime string",
  "updatedAt": "ISO DateTime string"
}
```

---

## 🔑 Field Descriptions

### Root Level Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `steps` | Array | ✅ **Yes** | Array of learning path step objects |
| `estimatedCompletion` | String | ⚠️ Optional | Estimated time to complete the entire path (e.g., "6-8 weeks") |
| `totalSteps` | Number | ⚠️ Optional | Total number of steps in the path |
| `createdAt` | String (ISO DateTime) | ⚠️ Optional | When the path was created (ISO 8601 format) |
| `updatedAt` | String (ISO DateTime) | ⚠️ Optional | When the path was last updated (ISO 8601 format) |

### Step Object (within `steps` array)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `step` | Number | ⚠️ Optional | Step number (1, 2, 3, ...) |
| `title` | String | ⚠️ Optional | Step title/name |
| `duration` | String | ⚠️ Optional | Estimated duration for this step (e.g., "1 week", "2 weeks") |
| `resources` | Array of Strings | ⚠️ Optional | Learning resources for this step (links, documents, videos, etc.) |
| `objectives` | Array of Strings | ⚠️ Optional | Learning objectives for this step |
| `estimatedTime` | String | ⚠️ Optional | Estimated time to complete this step (e.g., "6 hours", "10 hours") |

**Note:** Step object fields are flexible and depend on what Gemini AI generates. Additional fields may be present.

---

## 📝 Complete Example

```json
{
  "steps": [
    {
      "step": 1,
      "title": "Introduction to JavaScript",
      "duration": "1 week",
      "resources": [
        "JavaScript MDN Documentation - Introduction",
        "JavaScript.info - The Modern JavaScript Tutorial",
        "Video: JavaScript Basics by freeCodeCamp"
      ],
      "objectives": [
        "Understand what JavaScript is and its role in web development",
        "Set up a development environment",
        "Write your first JavaScript program",
        "Understand how JavaScript runs in browsers and Node.js"
      ],
      "estimatedTime": "6 hours"
    },
    {
      "step": 2,
      "title": "Variables, Data Types, and Operators",
      "duration": "1 week",
      "resources": [
        "MDN: Variables",
        "MDN: Data Types",
        "MDN: Expressions and Operators",
        "Interactive: JavaScript Variables Practice"
      ],
      "objectives": [
        "Declare variables using let, const, and var",
        "Understand primitive data types (string, number, boolean, null, undefined)",
        "Use arithmetic, comparison, and logical operators",
        "Understand type coercion and type conversion"
      ],
      "estimatedTime": "8 hours"
    },
    {
      "step": 3,
      "title": "Control Flow: Conditionals and Loops",
      "duration": "1.5 weeks",
      "resources": [
        "MDN: Control Flow",
        "MDN: if...else",
        "MDN: Loops and iteration",
        "Video: Control Flow Explained"
      ],
      "objectives": [
        "Write conditional statements (if, else if, else)",
        "Use switch statements for multiple conditions",
        "Implement for, while, and do-while loops",
        "Use break and continue statements effectively"
      ],
      "estimatedTime": "10 hours"
    }
  ],
  "estimatedCompletion": "6-8 weeks",
  "totalSteps": 3,
  "createdAt": "2025-11-12T10:30:00Z",
  "updatedAt": "2025-11-12T10:35:00Z"
}
```

---

## 🎯 Minimal Example (Single Module/Step)

```json
{
  "steps": [
    {
      "step": 1,
      "title": "Getting Started",
      "duration": "1 week",
      "resources": [
        "Introduction Guide",
        "Getting Started Video"
      ],
      "objectives": [
        "Understand the basics",
        "Learn core concepts"
      ],
      "estimatedTime": "6 hours"
    }
  ],
  "estimatedCompletion": "1 week",
  "totalSteps": 1,
  "createdAt": "2025-11-12T10:30:00Z",
  "updatedAt": "2025-11-12T10:35:00Z"
}
```

---

## 🔄 Prompt 3 Expected Structure (Module-Based - AI Generated Format)

**This is the structure that Prompt 3 (`prompt3-path-creation.txt`) expects and generates:**

```json
{
  "path_title": "Personalized Mastery Path for [Learner Role] to [Target Goal]",
  "learner_id": "[Will be provided by system]",
  "total_estimated_duration_hours": 110,
  "learning_modules": [
    {
      "module_order": 1,
      "module_title": "Module 1: Title",
      "estimated_duration_hours": 9,
      "focus_micro_skills": ["Micro Skill 1", "Micro Skill 2"],
      "learning_goals": ["Goal 1", "Goal 2"],
      "suggested_content_sequence": [
        "Lesson: Title (Nano: Skill Name)",
        "Practice Lab: Description",
        "Assessment: Name"
      ]
    }
  ]
}
```

## 🔄 Stored Structure (After System Processing)

**After Prompt 3 generates the path, the system stores it with additional fields and converts to camelCase:**

```json
{
  "status": "approved",
  "metadata": {},
  "companyId": "uuid",
  "pathSteps": [...],  // Same as learning_modules (camelCase conversion)
  "pathTitle": "...",  // Converted from path_title
  "learningModules": [...],  // Same as learning_modules (camelCase)
  "learning_modules": [...],  // Original from Prompt 3 (snake_case)
  "totalDurationHours": 110,  // Converted from total_estimated_duration_hours
  "competencyTargetName": "..."
}
```

**Note:** The system stores both formats for compatibility:
- **Original Prompt 3 format**: `learning_modules`, `path_title`, `total_estimated_duration_hours` (snake_case)
- **Converted format**: `pathSteps`, `pathTitle`, `totalDurationHours` (camelCase)
- **System fields**: `status`, `metadata`, `companyId`, `competencyTargetName`

### Module Object (within `learning_modules` array from Prompt 3)

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `module_order` | Number | ✅ **Yes** | Module sequence number (1, 2, 3, ...) |
| `module_title` | String | ✅ **Yes** | Module title/name |
| `estimated_duration_hours` | Number | ✅ **Yes** | Estimated duration in hours for this module |
| `focus_micro_skills` | Array of Strings | ✅ **Yes** | Micro skills covered in this module |
| `learning_goals` | Array of Strings | ✅ **Yes** | Learning goals for this module |
| `suggested_content_sequence` | Array of Strings | ✅ **Yes** | Sequence of lessons, labs, and assessments |

**Note:** Prompt 3 generates this exact structure. The system then:
1. Stores the original `learning_modules` array (snake_case)
2. Also stores as `pathSteps` and `learningModules` (camelCase) for compatibility
3. Adds system fields (`status`, `metadata`, `companyId`, `competencyTargetName`)

---

## ✅ Validation Rules

### Prompt 3 Output (What AI Generates):
**Required Fields:**
- ✅ `path_title` - Learning path title (string)
- ✅ `total_estimated_duration_hours` - Total duration (number)
- ✅ `learning_modules` - Array of module objects (must have at least one)

**Module Object Required Fields:**
- ✅ `module_order` - Module sequence number
- ✅ `module_title` - Module title
- ✅ `estimated_duration_hours` - Module duration in hours
- ✅ `focus_micro_skills` - Array of micro skill names
- ✅ `learning_goals` - Array of learning goals
- ✅ `suggested_content_sequence` - Array of content items

### Stored Structure (After System Processing):
**Required Fields:**
- ✅ `learning_modules` OR `pathSteps` OR `learningModules` - Must be an array (at least one module)

**Optional Fields (Added by System):**
- ⚠️ `status` - Path status (e.g., "approved", "pending", "rejected")
- ⚠️ `metadata` - Additional metadata object
- ⚠️ `companyId` - Company identifier (UUID)
- ⚠️ `pathTitle` / `path_title` - Overall learning path title (both formats stored)
- ⚠️ `totalDurationHours` / `total_estimated_duration_hours` - Total duration (both formats)
- ⚠️ `competencyTargetName` - Competency/course name
- ⚠️ `createdAt` - Creation timestamp (ISO DateTime)
- ⚠️ `updatedAt` - Last update timestamp (ISO DateTime)

---

## 📊 Usage Context

### Storage:
- Stored in `courses.learning_path` column (JSONB type)
- Primary key: `competency_target_name`

### Distribution:
- **Course Builder**: Receives full learning path structure
- **Learning Analytics**: Receives learning path + additional analytics data
- **Coordinator**: Routes requests based on learning path content

---

## 🔍 Key Points

1. **Prompt 3 Format**: Prompt 3 generates `learning_modules` array with snake_case fields (`path_title`, `total_estimated_duration_hours`)
2. **System Conversion**: The system converts to camelCase and stores both formats for compatibility
3. **Module Structure**: Each module must have `module_order`, `module_title`, `estimated_duration_hours`, `focus_micro_skills`, `learning_goals`, `suggested_content_sequence`
4. **Stored Format**: The database stores the full structure with both snake_case (original) and camelCase (converted) versions
5. **System Fields**: Additional fields like `status`, `metadata`, `companyId`, `competencyTargetName` are added by the system

## 📋 Your Structure Matches Prompt 3

Your structure is **correct** and matches what Prompt 3 expects:
- ✅ `learning_modules` array with proper module structure
- ✅ `path_title` / `pathTitle` (both formats)
- ✅ `total_estimated_duration_hours` / `totalDurationHours` (both formats)
- ✅ All module fields match Prompt 3 specification
- ✅ System fields (`status`, `metadata`, `companyId`, `competencyTargetName`) are correctly added

---

**This structure provides a comprehensive, flexible format for learning paths that can accommodate various course structures!** ✅

