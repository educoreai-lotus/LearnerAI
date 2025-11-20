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

### 6. AI Query (`/api/v1/ai`)

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
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

