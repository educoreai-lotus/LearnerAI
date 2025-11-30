# 🧪 Step-by-Step Postman Testing Guide

## Prerequisites

1. **Backend is running:**
   ```bash
   cd backend
   npm start
   ```
   Should see: `✅ Server running on port 5000`

2. **Postman installed** (or use any REST client)

3. **Environment variables set:**
   - `GEMINI_API_KEY` in `backend/.env`
   - Database connection configured

---

## 📋 Step 1: Health Check (Verify Backend is Ready)

**Purpose:** Make sure backend and Gemini API are working

**Request:**
- **Method:** `GET`
- **URL:** `http://localhost:5000/api/v1/ai/health`
- **Headers:** None needed

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "Gemini AI",
  "model": "gemini-2.5-flash",
  "timestamp": "2025-01-22T..."
}
```

**✅ If you see `"status": "healthy"`, proceed to Step 2**

---

## 📋 Step 2: Create Skills Gap (Simulate Skills Engine)

**Purpose:** Create a skills gap that would normally come from Skills Engine. This is the starting point......

**Request:**
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/v1/skills-gaps`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**

```json
{
  "user_id": "a1b2c3d4-e5f6-4789-a012-345678901234",
  "user_name": "Alice Johnson",
  "company_id": "c1d2e3f4-5678-9012-3456-789012345678",
  "company_name": "TechCorp Inc.",
  "competency_target_name": "GraphQL API Development",
  "status": "fail",
  "gap": {
    "missing_skills_map": {
      "Competency_GraphQL_Fundamentals": [
        "MGS_GraphQL_Schema_Definition",
        "MGS_GraphQL_Queries",
        "MGS_GraphQL_Mutations"
      ],
      "Competency_GraphQL_Advanced": [
        "MGS_GraphQL_Subscriptions",
        "MGS_GraphQL_Resolvers"
      ]
    }
  }
}
```

**Alternative (Legacy Format):**
If the above doesn't work, try this format:

```json
{
  "user_id": "a1b2c3d4-e5f6-4789-a012-345678901234",
  "user_name": "Alice Johnson",
  "company_id": "c1d2e3f4-5678-9012-3456-789012345678",
  "company_name": "TechCorp Inc.",
  "competency_target_name": "GraphQL API Development",
  "exam_status": "fail",
  "skills_raw_data": {
    "Competency_GraphQL_Fundamentals": [
      "MGS_GraphQL_Schema_Definition",
      "MGS_GraphQL_Queries",
      "MGS_GraphQL_Mutations"
    ],
    "Competency_GraphQL_Advanced": [
      "MGS_GraphQL_Subscriptions",
      "MGS_GraphQL_Resolvers"
    ]
  }
}
```

**Expected Response:**
```json
{
  "message": "Skills gap processed successfully",
  "skillsGap": {
    "gap_id": "generated-uuid-here",
    "user_id": "a1b2c3d4-e5f6-4789-a012-345678901234",
    "competency_target_name": "GraphQL API Development",
    "exam_status": "fail",
    ...
  }
}
```

**✅ Save the `gap_id` from the response - you'll need it later**

---

## 📋 Step 3: Verify Skills Gap Was Created

**Purpose:** Confirm the gap is in the database

**Request:**
- **Method:** `GET`
- **URL:** `http://localhost:5000/api/v1/skills-gaps/user/a1b2c3d4-e5f6-4789-a012-345678901234`

**Expected Response:**
```json
{
  "user_id": "a1b2c3d4-e5f6-4789-a012-345678901234",
  "count": 1,
  "skillsGaps": [
    {
      "gap_id": "...",
      "competency_target_name": "GraphQL API Development",
      "exam_status": "fail",
      ...
    }
  ]
}
```

**✅ If you see your gap, proceed to Step 4**

---

## 📋 Step 4: Generate Learning Path (Triggers All 3 Prompts)

**Purpose:** After skills gap is created, trigger learning path generation. This is where Gemini API and all 3 prompts are executed!

**⚠️ Important:** In production, Skills Engine would automatically call this endpoint after sending the skills gap. For testing, we call it manually.

**Request:**
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/v1/learning-paths/generate`
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**

```json
{
  "userId": "a1b2c3d4-e5f6-4789-a012-345678901234",
  "companyId": "c1d2e3f4-5678-9012-3456-789012345678",
  "competencyTargetName": "GraphQL API Development"
}
```

**Expected Response:**
```json
{
  "message": "Learning path generation started",
  "jobId": "job-uuid-here",
  "status": "processing"
}
```

**✅ Save the `jobId` - you'll use it to check progress**

**What happens now (Automatic Process):**
1. **System fetches skills gap** from database (using `userId` + `competencyTargetName`)
2. **Prompt 1** executes (Skill Expansion) - ~10-20 seconds
   - Uses `skills_raw_data` from the skills gap
3. **Prompt 2** executes (Competency Identification) - ~10-20 seconds
   - Uses Prompt 1 output
   - **After Prompt 2:** System sends competencies to Skills Engine for breakdown
4. **Skills Engine returns** Micro/Nano skills breakdown
5. **Prompt 3** executes (Path Creation) - ~30-60 seconds
   - Uses: initial gap + Prompt 2 competencies + Skills Engine breakdown
6. Learning path is saved to database

**💡 Watch your backend console logs to see the prompts executing!**

**Note:** The system automatically:
- Fetches the skills gap from database (created in Step 2)
- Sends competencies to Skills Engine after Prompt 2
- Combines all data for Prompt 3

---

## 📋 Step 5: Check Job Status (Monitor Prompt Execution)

**Purpose:** See which prompt is currently executing and track progress

**Request:**
- **Method:** `GET`
- **URL:** `http://localhost:5000/api/v1/jobs/{jobId}/status`
  - Replace `{jobId}` with the jobId from Step 4

**Example:**
```
http://localhost:5000/api/v1/jobs/abc123-def456-ghi789/status
```

**Expected Responses (as it progresses):**

**Stage 1 - Prompt 1 Running:**
```json
{
  "jobId": "abc123...",
  "status": "processing",
  "progress": 20,
  "currentStage": "skill-expansion",
  "result": null,
  "error": null
}
```

**Stage 2 - Prompt 2 Running:**
```json
{
  "jobId": "abc123...",
  "status": "processing",
  "progress": 50,
  "currentStage": "competency-identification",
  "result": null,
  "error": null
}
```

**Stage 2.5 - Skills Engine Breakdown (After Prompt 2):**
```json
{
  "jobId": "abc123...",
  "status": "processing",
  "progress": 50,
  "currentStage": "skill-breakdown",
  "result": null,
  "error": null
}
```
*Note: This stage happens automatically after Prompt 2 - system sends competencies to Skills Engine and receives Micro/Nano breakdown*

**Stage 3 - Prompt 3 Running:**
```json
{
  "jobId": "abc123...",
  "status": "processing",
  "progress": 70,
  "currentStage": "path-creation",
  "result": null,
  "error": null
}
```

**Stage 4 - Completed:**
```json
{
  "jobId": "abc123...",
  "status": "completed",
  "progress": 100,
  "currentStage": "completed",
  "result": {
    "competencyTargetName": "GraphQL API Development",
    "pathId": "..."
  },
  "error": null
}
```

**💡 Keep refreshing this endpoint every 5-10 seconds to see progress!**

**Expected Timeline:**
- Total time: ~60-100 seconds
- Prompt 1: ~10-20 seconds
- Prompt 2: ~10-20 seconds
- Skills Engine breakdown: ~2-5 seconds (after Prompt 2)
- Prompt 3: ~30-60 seconds

**Complete Flow:**
```
Step 2: Skills Gap Created
    ↓
Step 4: Generate Learning Path (manual trigger for testing)
    ↓
    ├─> Fetch skills gap from database
    ├─> Prompt 1: Expand skills
    ├─> Prompt 2: Identify competencies
    ├─> Send to Skills Engine → Get Micro/Nano breakdown
    ├─> Prompt 3: Create path (using gap + competencies + breakdown)
    └─> Save to database
```

---

## 📋 Step 6: Verify Generated Learning Path

**Purpose:** Check that the learning path was created with all modules and steps

**Request:**
- **Method:** `GET`
- **URL:** `http://localhost:5000/api/v1/learning-paths/a1b2c3d4-e5f6-4789-a012-345678901234`

**Expected Response:**
```json
{
  "userId": "a1b2c3d4-e5f6-4789-a012-345678901234",
  "learningPaths": [
    {
      "competencyTargetName": "GraphQL API Development",
      "learningPath": {
        "pathTitle": "Master GraphQL API Development",
        "pathGoal": "...",
        "pathDescription": "...",
        "learning_modules": [
          {
            "module_title": "GraphQL Fundamentals",
            "module_description": "...",
            "steps": [...],
            "subtopics": [...]
          },
          ...
        ]
      },
      "approved": false
    }
  ]
}
```

**✅ If you see a complete learning path with modules, steps, and subtopics, all prompts worked!**

**📋 What Happens Next (Approval Flow):**

After the learning path is generated, the system automatically checks the company's approval policy:

1. **Auto Approval (`approval_policy: "auto"`):**
   - ✅ Learning path is **immediately distributed** to Course Builder
   - ✅ Sent to Reports microservice
   - ✅ No approval needed

2. **Manual Approval (`approval_policy: "manual"`):**
   - 📋 Approval request is created in `path_approvals` table (status: `"pending"`)
   - 📧 Decision maker receives notification (currently logged to console)
   - ⏳ System waits for decision maker's response
   - ✅ If approved → Path is distributed to Course Builder
   - ❌ If rejected → Feedback stored, path not distributed
   - 🔄 If changes requested → Feedback stored, path can be regenerated

3. **Exception: Updates After Exam Failure:**
   - 🔄 If path is an **update** after exam failure (existing course + `exam_status: 'fail'`)
   - ✅ **Skips approval workflow** (even for manual approval companies)
   - ✅ **Automatically distributed** to Course Builder

---

## 📋 Step 7: Check Prompt Outputs in Database (Optional)

**Purpose:** Verify that Prompt 1 and Prompt 2 outputs were saved

**Request:**
- **Method:** `GET`
- **URL:** `http://localhost:5000/api/v1/skills-expansions`
- **Query Parameters:**
  - `user_id`: `a1b2c3d4-e5f6-4789-a012-345678901234`

**Expected Response:**
```json
{
  "count": 1,
  "skillsExpansions": [
    {
      "expansion_id": "...",
      "gap_id": "...",
      "user_id": "a1b2c3d4-e5f6-4789-a012-345678901234",
      "prompt_1_output": {
        "expanded_competencies_list": [...]
      },
      "prompt_2_output": {
        "competencies_for_skills_engine_processing": [...]
      },
      "created_at": "..."
    }
  ]
}
```

**✅ If you see `prompt_1_output` and `prompt_2_output`, both prompts executed and saved correctly!**

---

## 📋 Step 8: Check Approval Status (If Manual Approval Required)

**Purpose:** If the company has `approval_policy: "manual"`, check if an approval request was created

**Request:**
- **Method:** `GET`
- **URL:** `http://localhost:5000/api/v1/approvals`
- **Query Parameters:**
  - `company_id`: `c1d2e3f4-5678-9012-3456-789012345678` (optional)
  - `status`: `pending` (optional)

**Expected Response (Manual Approval):**
```json
{
  "count": 1,
  "approvals": [
    {
      "id": "approval-uuid-here",
      "learning_path_id": "GraphQL API Development",
      "company_id": "c1d2e3f4-5678-9012-3456-789012345678",
      "status": "pending",
      "decision_maker_id": "...",
      "created_at": "...",
      "approved_at": null,
      "rejected_at": null,
      "feedback": null
    }
  ]
}
```

**Expected Response (Auto Approval):**
```json
{
  "count": 0,
  "approvals": []
}
```
*No approval needed - path was distributed directly*

**✅ If you see a pending approval, proceed to Step 9**

---

## 📋 Step 9: Approve/Reject Learning Path (Manual Approval Only)

**Purpose:** Simulate decision maker approving or rejecting the learning path

**Request:**
- **Method:** `POST`
- **URL:** `http://localhost:5000/api/v1/approvals/{approvalId}/respond`
  - Replace `{approvalId}` with the approval ID from Step 8
- **Headers:**
  - `Content-Type: application/json`
- **Body (raw JSON):**

**Option A: Approve**
```json
{
  "response": "approved"
}
```

**Option B: Reject**
```json
{
  "response": "rejected",
  "feedback": "This path doesn't meet our requirements"
}
```

**Option C: Request Changes**
```json
{
  "response": "changes_requested",
  "feedback": "Please add more practical exercises"
}
```

**Expected Response (Approved):**
```json
{
  "id": "approval-uuid-here",
  "status": "approved",
  "approved_at": "2025-01-22T...",
  "feedback": null
}
```

**What happens after approval:**
1. ✅ Course is marked as `approved: true` in `courses` table
2. ✅ Learning path is **distributed to Course Builder**
3. ✅ Learning path is sent to **Reports microservice**
4. 📧 Notification sent to requester (currently logged to console)

**What happens after rejection:**
1. ❌ Approval status set to `"rejected"`
2. ❌ Feedback stored in database
3. ❌ Path is **NOT distributed** to Course Builder
4. 📧 Notification sent to requester

**What happens after changes requested:**
1. 🔄 Approval status set to `"changes_requested"`
2. 🔄 Feedback stored in database
3. ❌ Path is **NOT distributed** (can be regenerated with feedback)
4. 📧 Notification sent to requester

---

## 📋 Step 10: Verify Path Distribution (After Approval)

**Purpose:** Check if the learning path was sent to Course Builder

**Note:** This step requires Course Builder microservice to be running or configured. The system will use mock data if Course Builder is unavailable.

**What to check:**
1. **Backend logs** should show:
   ```
   ✅ Learning path sent to Course Builder: GraphQL API Development
   ✅ Learning path sent to Reports: GraphQL API Development
   ```

2. **If Course Builder is unavailable:**
   ```
   ⚠️ Course Builder unavailable, used rollback mock data
   ```
   *This is expected if Course Builder microservice is not running*

---

## 📋 Step 11: Test Health Check Again (Verify Everything Still Works)

**Request:**
- **Method:** `GET`
- **URL:** `http://localhost:5000/api/v1/ai/health`

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "Gemini AI",
  "model": "gemini-2.5-flash"
}
```

---

## 🎯 Quick Test Checklist

- [ ] Step 1: Health check returns `"status": "healthy"`
- [ ] Step 2: Skills gap created successfully
- [ ] Step 3: Verify skills gap was created
- [ ] Step 4: Learning path generation started (got `jobId`)
- [ ] Step 5: Job status shows progress through all stages:
  - [ ] `currentStage: "skill-expansion"` (Prompt 1)
  - [ ] `currentStage: "competency-identification"` (Prompt 2)
  - [ ] `currentStage: "skill-breakdown"` (Skills Engine)
  - [ ] `currentStage: "path-creation"` (Prompt 3)
  - [ ] `status: "completed"`
- [ ] Step 6: Learning path retrieved with full structure
- [ ] Step 7: Prompt outputs visible in skills_expansions
- [ ] Step 8: Approval status checked (if manual approval)
- [ ] Step 9: Approval response processed (if manual approval)
- [ ] Step 10: Path distribution verified (after approval)

---

## 🐛 Troubleshooting

### Issue: Health check returns "unhealthy"
- **Check:** `GEMINI_API_KEY` in `backend/.env`
- **Fix:** Add valid API key and restart backend

### Issue: Skills gap creation fails
- **Check:** All required fields are present
- **Check:** UUIDs are valid format
- **Fix:** Use the exact format shown in Step 2

### Issue: Job status stuck at a stage
- **Check:** Backend console logs for errors
- **Check:** Gemini API quota/limits
- **Fix:** Wait longer (Prompt 3 can take 60+ seconds)

### Issue: Learning path is empty or incomplete
- **Check:** Backend logs for prompt execution errors
- **Check:** Prompt files exist in `backend/src/infrastructure/prompts/prompts/`
- **Fix:** Verify all 3 prompt files are present

---

## 📊 What to Watch in Backend Logs

When Step 4 runs, you should see:

```
✅ Using Gemini model: gemini-2.5-flash
✅ Loaded prompt: prompt1-skill-expansion
[GenerateLearningPathUseCase] Executing Prompt 1...
✅ Prompt 1 executed successfully
✅ Saved Prompt 1 output to skills_expansions
✅ Loaded prompt: prompt2-competency-identification
[GenerateLearningPathUseCase] Executing Prompt 2...
✅ Prompt 2 executed successfully
✅ Saved Prompt 2 output to skills_expansions
✅ Extracted competencies for Skills Engine
✅ Skills Engine breakdown received for X competencies
✅ Loaded prompt: prompt3-path-creation
[GenerateLearningPathUseCase] Executing Prompt 3...
✅ Prompt 3 executed successfully
✅ Learning path saved to courses table
✅ Checking approval policy...
✅ Approval request created for path X (manual approval required)
   OR
✅ Learning path X distributed (auto approval)
✅ Learning path sent to Course Builder: X
✅ Learning path sent to Reports: X
```

---

## 🎉 Success Criteria

**All prompts are working correctly if:**
1. ✅ Health check returns `"healthy"`
2. ✅ Job completes with `"status": "completed"`
3. ✅ Learning path has:
   - `pathTitle`
   - `pathGoal`
   - `pathDescription`
   - `learning_modules` array with at least 1 module
   - Each module has `steps` and `subtopics`
4. ✅ `skills_expansions` table has `prompt_1_output` and `prompt_2_output`
5. ✅ Backend logs show all 3 prompts executed successfully

---

## 💡 Pro Tips

1. **Save requests in Postman collection** - Create a collection with all these requests for easy reuse
2. **Use Postman environment variables** - Set `base_url = http://localhost:5000` and `user_id`, `company_id`, etc.
3. **Watch backend console** - Keep it open to see real-time prompt execution
4. **Test with different competencies** - Try "React Development", "Python Basics", etc.
5. **Check database directly** - Use Supabase dashboard to see raw data

---

**Ready to test? Start with Step 1!** 🚀

