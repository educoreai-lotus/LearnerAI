# Course Builder Connection - Complete Overview

## 🔄 Communication Pattern

**⚠️ IMPORTANT:** LearnerAI does **NOT** automatically send learning paths to Course Builder.

**Pattern:** **On-Demand (Pull Model)**
- Course Builder requests data when needed
- LearnerAI responds with the requested data

**Why:** This allows Course Builder to control when it fetches data and ensures data is only sent when actually needed.

---

## 📤 OUTGOING: LearnerAI → Course Builder

### ⚠️ DEPRECATED / NOT USED

**Note:** The `CourseBuilderClient.sendLearningPath()` method exists but is **NOT automatically called**.

**Code Evidence:** `ProcessApprovalResponseUseCase.js` (lines 56-64):
```javascript
// NOTE: We do NOT automatically distribute to Course Builder.
// Course Builder will request data when needed via the request endpoint.
```

**What Actually Happens:**
- When a learning path is approved, LearnerAI only marks it as `approved: true` in the database
- Course Builder requests data on-demand when needed

### Implementation Files

#### 1. **CourseBuilderClient** (`backend/src/infrastructure/clients/CourseBuilderClient.js`)
- **Purpose**: HTTP client for sending learning paths to Course Builder
- **Method**: `sendLearningPath(learningPath, options)`
- **Features**:
  - ✅ AI-powered field mapping (maps LearnerAI fields → Course Builder fields)
  - ✅ Retry logic (3 attempts with exponential backoff)
  - ✅ Rollback mock data if Course Builder unavailable
  - ✅ Automatic field name transformation

#### 2. **DistributePathUseCase** (`backend/src/application/useCases/DistributePathUseCase.js`)
- **Purpose**: Orchestrates sending learning paths to multiple services
- **Flow**:
  1. Fetches learning path from database
  2. Fetches skills gap data (for `user_name`, `company_name`, `company_id`)
  3. Builds Course Builder payload
  4. Calls `courseBuilderClient.sendLearningPath()`

### Request Details

**Endpoint (Course Builder):**
```
POST {COURSE_BUILDER_URL}/api/v1/learning-paths
```

**Headers:**
```http
Content-Type: application/json
Authorization: Bearer {COURSE_BUILDER_TOKEN}
X-Service-Token: {COURSE_BUILDER_TOKEN}
```

**Request Body (LearnerAI format):**
```json
{
  "user_id": "uuid",
  "user_name": "string",
  "company_id": "uuid",
  "company_name": "string",
  "competency_target_name": "string",
  "learning_path": {
    "learner_id": "uuid",
    "path_title": "string",
    "learning_modules": [
      {
        "module_order": 1,
        "module_title": "string",
        "steps": [
          {
            "step": 1,
            "title": "string",
            "description": "string",
            "estimatedTime": 1.5,
            "skills_covered": ["string"]
          }
        ],
        "skills_in_module": ["string"],
        "estimated_duration_hours": 3
      }
    ],
    "total_estimated_duration_hours": 31
  }
}
```

**Note:** Course Builder does NOT receive `gap_id`, `skills_raw_data`, or `exam_status` (these are only sent to Learning Analytics).

### Environment Variables
```env
COURSE_BUILDER_URL=http://localhost:5002
COURSE_BUILDER_TOKEN=your-token-here
```

### Field Mapping
- Uses AI-powered mapping (`mapFieldsOutgoingWithAI`) to transform field names
- Maps LearnerAI internal format → Course Builder expected format
- Falls back to predefined mappings if AI unavailable

---

## 📥 INCOMING: Course Builder → LearnerAI

### Purpose
Course Builder requests learning paths and data from LearnerAI.

### Entry Point
**Endpoint:** `POST /api/fill-content-metrics` (via Coordinator)

**Service Name:** `"course-builder"` (in `requester_service` field)

### Handler
**Function:** `courseBuilderHandler()` in `backend/src/api/routes/endpoints.js`

**Handler Flow (in order):**
1. Checks `action === 'query' || action === 'chat'` → Routes to AI handler
2. Checks `action === 'request_learning_path'` → Waits for approval
3. Checks `action === 'get_learning_path'` → Returns immediately
4. Checks `payload.learning_flow === 'career_path_driven'` → Returns ALL paths for user ⚠️ **Note: Uses `learning_flow`, NOT `action`**
5. Fallback: Calls `fillCourseBuilderData()` for other requests

### Supported Actions

#### 1. **`career_path_driven`** (Main Flow - Get ALL Learning Paths for User)
**Purpose:** Course Builder sends `user_id` and LearnerAI returns **ALL** learning paths + skills_raw_data for that user

**⚠️ IMPORTANT:** This uses `payload.learning_flow === 'career_path_driven'` (NOT `action`). The `action` field is still required but can be any value.

**Request:**
```json
{
  "requester_service": "course-builder",
  "payload": {
    "action": "get_career_paths",  // Required but can be any value
    "learning_flow": "career_path_driven",  // This triggers the handler
    "user_id": "uuid",
    "company_id": "uuid"  // Optional
  },
  "response": {}
}
```

**Code Location:** `endpoints.js` line 1240 - checks `payload.learning_flow === 'career_path_driven'`

**Response:**
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
    "career_learning_paths": [
      {
        "competency_target_name": "string",
        "skills_raw_data": { /* full skills gap data */ },
        "learning_path": { /* full learning path object */ }
      },
      // ... all other learning paths for this user
    ]
  }
}
```

**Implementation:**
- Fetches **ALL** courses for `user_id` from `courses` table
- For each course, fetches `skills_raw_data` from `skills_gap` table
- Returns array of all learning paths with their skills data
- This is the **primary flow** used by Course Builder

#### 2. **`get_learning_path`** (Single Learning Path - Immediate Return)
**Purpose:** Get learning path and skills data immediately (doesn't wait for approval)

**Request:**
```json
{
  "requester_service": "course-builder",
  "payload": {
    "action": "get_learning_path",
    "user_id": "uuid",
    "tag": "Node.js Backend Development"  // Maps to competency_target_name
  },
  "response": {
    "learning_path": [],
    "skills": []
  }
}
```

**Response:**
```json
{
  "requester_service": "course-builder",
  "payload": { ... },
  "response": {
    "learning_path": { /* full learning path object */ },
    "skills": { /* skills_raw_data object */ },
    "answer": "{ ... }"  // Also stringified in answer
  }
}
```

**Implementation:**
- Maps `tag` → `competency_target_name` using AI field mapping
- Fetches `learning_path` from `courses` table
- Fetches `skills_raw_data` from `skills_gap` table
- Returns immediately (doesn't wait for approval)

#### 2. **`request_learning_path`** (Waits for Approval)
**Purpose:** Request learning path and wait for approval if not yet approved

**Request:**
```json
{
  "requester_service": "course-builder",
  "payload": {
    "action": "request_learning_path",
    "userId": "uuid",
    "competencyTargetName": "string",
    "maxWaitTime": 30000,  // Optional: max wait time in ms (default: 30000)
    "pollInterval": 1000   // Optional: poll interval in ms (default: 1000)
  },
  "response": {}
}
```

**Response (if approved):**
```json
{
  "success": true,
  "action": "request_learning_path",
  "status": "approved",
  "message": "Learning path is approved and ready",
  "data": {
    "user_id": "uuid",
    "user_name": "string",
    "company_id": "uuid",
    "company_name": "string",
    "competency_target_name": "string",
    "learning_path": { /* full learning path object */ },
    "approved": true,
    "created_at": "ISO DateTime",
    "last_modified_at": "ISO DateTime"
  }
}
```

**Response (if pending):**
```json
{
  "success": false,
  "action": "request_learning_path",
  "status": "pending_approval",
  "message": "Learning path is not approved yet. Please try again later.",
  "data": null
}
```

**Implementation:**
- Uses `GetLearningPathForCourseBuilderUseCase`
- Polls approval status every 1 second (configurable)
- Waits up to 30 seconds (configurable) for approval
- Returns immediately if already approved


#### 4. **AI Queries** (`query`, `chat`)
**Purpose:** Course Builder can make AI queries through LearnerAI

**Request:**
```json
{
  "requester_service": "course-builder",
  "payload": {
    "action": "query",  // or "chat"
    "query": "What is React?",
    "context": { /* optional context */ }
  },
  "response": {}
}
```

**Implementation:**
- Routes to `aiHandler()` (same as general AI queries)
- Allows Course Builder to use LearnerAI's AI capabilities

### Field Mapping (Incoming)
- Uses AI-powered mapping (`mapFieldsWithAI`) to handle field name mismatches
- Maps Course Builder fields → LearnerAI internal format
- Examples:
  - `tag` → `competency_target_name`
  - `learner_id` → `user_id`
  - Any other mismatches handled automatically by AI

---

## 🔧 Configuration

### Environment Variables Required

```env
# Course Builder URL (where LearnerAI sends learning paths)
COURSE_BUILDER_URL=http://localhost:5002

# Course Builder Token (for authentication)
COURSE_BUILDER_TOKEN=your-token-here

# Service Name (for signature generation)
SERVICE_NAME=learnerAI-service
```

### Dependencies

**CourseBuilderClient requires:**
- `HttpClient` (for HTTP requests)
- `geminiClient` (optional, for AI field mapping)

**courseBuilderHandler requires:**
- `courseRepository` (fetch learning paths)
- `skillsGapRepository` (fetch skills data)
- `approvalRepository` (check approval status)
- `learnerRepository` (fetch learner data)
- `geminiClient` (for AI field mapping)

---

## 📊 Data Flow Diagrams

### Actual Flow (Course Builder → LearnerAI - On-Demand)
```
1. Learning Path Generated & Approved
   ↓
2. LearnerAI marks course as approved: true in database
   ↓
3. Course Builder requests data when needed:
   POST /api/fill-content-metrics
   {
     "requester_service": "course-builder",
     "payload": {
       "learning_flow": "career_path_driven",
       "user_id": "uuid"
     }
   }
   ↓
4. LearnerAI fetches ALL learning paths + skills_raw_data for user_id
   ↓
5. Returns response with career_learning_paths array
   ↓
6. Course Builder receives all data
```

### Incoming Flow (Course Builder → LearnerAI)
```
1. Course Builder sends request via Coordinator
   POST /api/fill-content-metrics
   {
     "requester_service": "course-builder",
     "payload": { "action": "get_learning_path", ... }
   }
   ↓
2. Coordinator routes to LearnerAI
   ↓
3. courseBuilderHandler() processes request
   ├─ AI Field Mapping (Course Builder → LearnerAI format)
   ├─ Fetch data from database
   └─ Return response
   ↓
4. Response populated in requestBody.response
   {
     "learning_path": { ... },
     "skills": { ... },
     "answer": "{ ... }"
   }
   ↓
5. Coordinator returns response to Course Builder
```

---

## 🐛 Error Handling

### Outgoing (LearnerAI → Course Builder)
- ✅ **Retry Logic**: 3 attempts with exponential backoff
- ✅ **Rollback Mock Data**: Returns mock data if Course Builder unavailable
- ✅ **Field Mapping Fallback**: Falls back to predefined mappings if AI fails
- ✅ **Logging**: Comprehensive logging for debugging

### Incoming (Course Builder → LearnerAI)
- ✅ **Field Mapping**: AI handles unknown field mismatches
- ✅ **Missing Data**: Returns empty arrays/objects if data not found
- ✅ **Approval Timeout**: Returns `pending_approval` status if timeout
- ✅ **Error Logging**: Detailed error logging

---

## 📝 Key Files Reference

| File | Purpose |
|------|---------|
| `backend/src/infrastructure/clients/CourseBuilderClient.js` | HTTP client for sending to Course Builder |
| `backend/src/api/routes/endpoints.js` | Handler for incoming Course Builder requests |
| `backend/src/application/useCases/DistributePathUseCase.js` | Orchestrates sending learning paths |
| `backend/src/application/useCases/GetLearningPathForCourseBuilderUseCase.js` | Handles `request_learning_path` action |
| `backend/src/utils/fieldMapper.js` | AI-powered field mapping utilities |
| `backend/server.js` | Initializes CourseBuilderClient and dependencies |

---

## ✅ Summary

**⚠️ IMPORTANT:** LearnerAI does **NOT** automatically send to Course Builder.

### Exact Code Behavior (from `endpoints.js`)

**Handler Order (lines 1069-1370):**
1. **Line 1079-1081:** `if (action === 'query' || action === 'chat')` → Routes to `aiHandler()`
2. **Line 1084-1125:** `if (action === 'request_learning_path')` → Uses `GetLearningPathForCourseBuilderUseCase`, waits for approval
3. **Line 1128-1236:** `if (action === 'get_learning_path')` → Fetches single learning path + skills_raw_data, returns immediately
4. **Line 1240-1359:** `if (payload.learning_flow === 'career_path_driven')` → ⚠️ **Uses `learning_flow`, NOT `action`**
   - Fetches ALL courses for `user_id`
   - For each course, fetches `skills_raw_data` from `skills_gap` table
   - Returns `career_learning_paths` array with all paths + skills_raw_data
5. **Line 1361-1369:** Fallback → Calls `fillCourseBuilderData()` (read-only data filling)

**Key Code Details:**
- **Line 109:** `action` field IS required (returns 400 if missing)
- **Line 1240:** `career_path_driven` checks `payload.learning_flow`, NOT `action`
- **Line 1327-1331:** Each item in `career_learning_paths` contains:
  - `competency_target_name`
  - `skills_raw_data` (from `skills_gap` table)
  - `learning_path` (from `courses` table)

### Actual Flow:
1. **Course Builder requests data** via Coordinator → `/api/fill-content-metrics`
2. **Main flow:** `learning_flow: "career_path_driven"` - Course Builder sends:
   ```json
   {
     "requester_service": "course-builder",
     "payload": {
       "action": "get_career_paths",  // Required (can be any value)
       "learning_flow": "career_path_driven",  // This triggers the handler
       "user_id": "uuid"
     }
   }
   ```
   LearnerAI returns **ALL** learning paths + skills_raw_data for that user
3. **Other actions:**
   - `action: "get_learning_path"` - Get single learning path (immediate)
   - `action: "request_learning_path"` - Get single learning path (waits for approval)
   - `action: "query"` or `action: "chat"` - AI queries
   - Fallback: Any other `action` → Calls `fillCourseBuilderData()` (read-only)

**Key Points:**
- ✅ **On-demand (pull model)** - Course Builder controls when to fetch data
- ✅ **Returns ALL paths** - When Course Builder sends `user_id` + `learning_flow: "career_path_driven"`, gets all learning paths + skills_raw_data
- ✅ **AI field mapping** - Handles field name mismatches automatically
- ❌ **No automatic sending** - `CourseBuilderClient.sendLearningPath()` exists but is NOT called automatically
- ⚠️ **`career_path_driven` uses `learning_flow` field**, not `action` field (but `action` is still required)

