# Course Builder Request Flow - Updated

## Overview

**Changed Behavior:** Learning paths are NO LONGER automatically sent to Course Builder when approved. Instead, Course Builder requests data on-demand when needed.

## New Flow

### 1. Learning Path Generation & Approval

```
Learning Path Generated
    ↓
Check Approval Policy
    ↓
├─ Auto Approval → Mark as approved (NO automatic distribution)
└─ Manual Approval → Create approval request → Wait for decision
    ↓
Decision Maker Approves
    ↓
Mark as approved (NO automatic distribution)
```

**Key Change:** No automatic distribution to Course Builder happens at any point.

### 2. Course Builder Requests Data

When Course Builder needs learning path data, it calls:

**Endpoint:** `POST /api/fill-learner-ai-fields`

**Request Body:**
```json
{
  "requester_service": "course-builder",
  "payload": {
    "action": "request_learning_path",
    "userId": "uuid",
    "competencyTargetName": "string",
    "maxWaitTime": 30000,  // Optional: max wait time in ms (default: 30s)
    "pollInterval": 1000   // Optional: poll interval in ms (default: 1s)
  },
  "response": {
    "answer": ""
  }
}
```

### 3. Response Behavior

**If Learning Path is Approved:**
```json
{
  "requester_service": "course-builder",
  "payload": { ... },
  "response": {
    "answer": "{\"success\":true,\"action\":\"request_learning_path\",\"status\":\"approved\",\"message\":\"Learning path GraphQL API Development is approved and ready\",\"data\":{\"user_id\":\"uuid\",\"user_name\":\"Alice Johnson\",\"company_id\":\"uuid\",\"company_name\":\"TechCorp Inc.\",\"competency_target_name\":\"GraphQL API Development\",\"learning_path\":{...},\"approved\":true}}"
  }
}
```

**If Learning Path is NOT Approved Yet:**
- System waits for approval (polls every 1 second, up to 30 seconds)
- If approved during wait → Returns data immediately
- If timeout → Returns pending status:

```json
{
  "requester_service": "course-builder",
  "payload": { ... },
  "response": {
    "answer": "{\"success\":false,\"action\":\"request_learning_path\",\"status\":\"pending_approval\",\"message\":\"Learning path GraphQL API Development is not approved yet. Please try again later.\",\"data\":null}"
  }
}
```

**If Learning Path was Rejected:**
```json
{
  "error": "Learning path GraphQL API Development was rejected. Cannot provide data to Course Builder."
}
```

## Implementation Details

### Use Case: `GetLearningPathForCourseBuilderUseCase`

- **Location:** `src/application/useCases/GetLearningPathForCourseBuilderUseCase.js`
- **Purpose:** Handles Course Builder requests for learning path data
- **Features:**
  - Validates user ownership
  - Checks approval status
  - Waits for approval if not approved (async polling)
  - Returns formatted data for Course Builder

### Handler: `courseBuilderHandler`

- **Location:** `src/api/routes/endpoints.js`
- **Action:** `request_learning_path`
- **Required Parameters:**
  - `userId` (UUID)
  - `competencyTargetName` (string)

### Removed Automatic Distribution

**Files Modified:**
1. `ProcessApprovalResponseUseCase.js` - Removed distribution on approval
2. `GenerateLearningPathUseCase.js` - Removed distribution for auto-approval and update-after-failure

## Course Builder Integration

### Example Request

```bash
curl -X POST https://learner-ai-backend-production.up.railway.app/api/fill-learner-ai-fields \
  -H "Content-Type: application/json" \
  -d '{
    "requester_service": "course-builder",
    "payload": {
      "action": "request_learning_path",
      "userId": "a1b2c3d4-e5f6-4789-a012-345678901234",
      "competencyTargetName": "GraphQL API Development"
    },
    "response": {
      "answer": ""
    }
  }'
```

### Response Data Structure

When approved, the `data` field contains:
```json
{
  "user_id": "uuid",
  "user_name": "Alice Johnson",
  "company_id": "uuid",
  "company_name": "TechCorp Inc.",
  "competency_target_name": "GraphQL API Development",
  "learning_path": {
    "pathTitle": "...",
    "learning_modules": [...],
    ...
  },
  "approved": true,
  "created_at": "2025-01-20T10:00:00Z",
  "last_modified_at": "2025-01-20T10:00:00Z"
}
```

## Benefits

1. **On-Demand Data:** Course Builder only gets data when it needs it
2. **Approval Guarantee:** Data is only sent if approved (or waits for approval)
3. **Async Support:** Handles pending approvals gracefully
4. **Better Control:** Course Builder controls when to fetch data
5. **Reduced Coupling:** No automatic pushes, only pull-based requests

## Migration Notes

- **Old Behavior:** Learning paths were automatically sent to Course Builder on approval
- **New Behavior:** Course Builder must request data when needed
- **Backward Compatibility:** Existing Course Builder integrations need to be updated to use the new request endpoint

