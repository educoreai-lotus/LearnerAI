# Exam Failure Flow - First Try

This document describes what happens when a learner fails an exam on their first attempt.

## 📋 Overview

When a learner fails an exam, Skills Engine sends the updated skills gap to LearnerAI. The system updates the gap data and can generate a new learning path based on what the learner still needs to learn.

---

## 🔄 Complete Flow

### Step 1: Learner Takes Exam and Fails

```
Learner takes exam in Skills Engine
    ↓
Skills Engine evaluates exam
    ↓
Result: FAIL
    ↓
Skills Engine identifies remaining skills gap
```

### Step 2: Skills Engine Sends Exam Result to LearnerAI

**Endpoint:** `POST /api/fill-content-metrics` or `POST /api/v1/skills-gaps`

**Request Body:**
```json
{
  "requester_service": "assessment",
  "payload": {
    "action": "update_skills_gap",
    "user_id": "uuid",
    "user_name": "John Doe",
    "company_id": "uuid",
    "company_name": "TechCorp Inc.",
    "competency_target_name": "React Development",
    "exam_status": "FAIL",
    "gap": {
      "Competency_Front_End_Development": [
        "MGS_React_Hooks_Advanced",
        "MGS_Flexbox_Grid_System",
        "MGS_Async_Await_Handling"
      ]
    }
  }
}
```

**Key Points:**
- `exam_status: "FAIL"` indicates the learner failed the exam
- `gap` contains the `missing_skills_map` - skills the learner still needs to learn
- The gap structure: `{ "Competency_Name": ["MGS_Skill_ID_1", "MGS_Skill_ID_2", ...] }`

### Step 3: ProcessSkillsGapUpdateUseCase Processes the Update

**What Happens:**

1. **Check if skills_gap exists** (by `user_id` + `competency_target_name`)
   - If **exists**: Update existing gap
   - If **not exists**: Create new gap

2. **Update skills_raw_data:**
   - **Filter existing skills**: Keep only skills that ARE in the new gap
   - **Remove skills**: Delete skills that are NOT in the new gap (learner already knows them)
   - **Update exam_status**: Set to `'fail'`

3. **Check if learner exists:**
   - If not exists: Create learner record
   - If exists: Update learner name if changed

4. **Check if company exists:**
   - If not exists: Create company with default `approval_policy: 'auto'`

**Database Update:**
```sql
UPDATE skills_gap
SET 
  skills_raw_data = {filtered_gap_data},
  exam_status = 'fail',
  updated_at = NOW()
WHERE user_id = ? AND competency_target_name = ?
```

**Result:**
- ✅ Skills gap updated with remaining missing skills
- ✅ `exam_status` set to `'fail'`
- ✅ Old skills removed (learner already knows them)
- ✅ Only skills learner still needs remain in `skills_raw_data`

### Step 4: Learning Path Update (Manual Trigger)

**Important:** Learning path update is **NOT automatically triggered** after exam failure. It must be manually requested.

**Option A: Skills Engine Triggers It**
```bash
POST /api/v1/learning-paths/generate
{
  "userId": "uuid",
  "companyId": "uuid",
  "competencyTargetName": "React Development"
}
```

**Option B: Frontend/Admin Triggers It**
- Admin or system can call the generate endpoint
- Or Skills Engine can automatically call it after sending the gap update

**What Happens During Update:**

1. **Check if Course Exists:**
   - System checks if course already exists (by `competency_target_name`)
   - If exists: This is an **UPDATE** (after exam failure)
   - If not exists: This is a **NEW** path (first time)

2. **Fetch Updated Skills Gap:**
   - System fetches `skills_gap` from database (by `user_id` + `competency_target_name`)
   - Uses **updated** `skills_raw_data` (containing only remaining missing skills)
   - Checks `exam_status: 'fail'` to confirm this is after exam failure
   - This ensures the updated path focuses on what learner still needs

3. **Create Background Job:**
   - Job created with `status: 'pending'`
   - Job tracks progress through 3 AI prompts

4. **Prompt 1: Skill Expansion**
   - Uses updated `skills_raw_data` from database
   - Expands remaining skills into competencies
   - Progress: 30%

5. **Prompt 2: Competency Identification**
   - Extracts competency names from Prompt 1
   - Progress: 50%

6. **Skills Engine Integration**
   - Requests skill breakdown for identified competencies
   - Progress: 70%

7. **Prompt 3: Path Creation**
   - Creates updated learning path based on:
     - Remaining gap (what learner still needs after failure)
     - Expanded competencies
     - Skill breakdown
   - Progress: 90%

8. **Update Learning Path**
   - **Updates** existing course in `courses` table (not creates new)
   - Key: `competency_target_name` (primary key)
   - Uses **UPSERT** operation: If course exists → UPDATE, if not → INSERT
   - Replaces entire `learning_path` JSONB with updated path structure
   - Preserves `created_at` timestamp, updates `last_modified_at`
   - Progress: 100%
   - See [Learning Path Update Mechanism](LEARNING_PATH_UPDATE_MECHANISM.md) for details

9. **Approval Workflow (SKIPPED for Updates After Failure)**
   - **If this is an UPDATE after exam failure:**
     - ✅ **Skips approval workflow entirely** (even if company has `approval_policy: 'manual'`)
     - ✅ **Automatically distributes** to Course Builder
     - ✅ **No notification** sent to decision maker
   - **If this is a NEW path (first time):**
     - If company has `approval_policy: 'manual'`:
       - Creates approval request
       - Sends notification to decision maker
     - If `approval_policy: 'auto'`:
       - Automatically distributes to Course Builder

### Step 5: Learning Path Distribution

**If Approved (or Auto):**

1. **Send to Course Builder:**
   ```json
   {
     "user_id": "uuid",
     "user_name": "John Doe",
     "company_id": "uuid",
     "company_name": "TechCorp Inc.",
     "competency_target_name": "React Development",
     "learning_path": { /* full learning path structure */ }
   }
   ```

2. **Learning Analytics:**
   - Receives data via on-demand requests (`/api/fill-content-metrics`)
   - Or via daily batch job

3. **Management Reports:**
   - Receives learning path data for reporting

---

## 🎯 Key Differences: First Try vs. Retry

### First Try (Initial Gap)
- **No existing skills_gap**: Creates new gap
- **All skills are missing**: Gap contains all skills needed
- **No existing learning path**: Creates new path

### Retry After Failure
- **Existing skills_gap**: Updates existing gap
- **Filtered skills**: Only skills learner still needs remain
- **Existing learning path**: **Updates** existing course (by `competency_target_name`) - **NOT rebuilt from scratch**
- **Focused path**: Updated path focuses on remaining gaps
- **No approval needed**: Skips approval workflow (even for manual approval companies)
- **Auto-distributed**: Automatically sent to Course Builder without decision maker approval

---

## 📊 Database State After Exam Failure

### Before Exam Failure
```sql
skills_gap:
  gap_id: "abc-123"
  user_id: "user-456"
  competency_target_name: "React Development"
  skills_raw_data: {
    "Competency_Front_End": ["MGS_React_Basics", "MGS_React_Hooks", "MGS_State_Management"]
  }
  exam_status: null
```

### After Exam Failure (First Try)
```sql
skills_gap:
  gap_id: "abc-123"
  user_id: "user-456"
  competency_target_name: "React Development"
  skills_raw_data: {
    "Competency_Front_End": [
      "MGS_React_Hooks_Advanced",      // Still needs to learn
      "MGS_Flexbox_Grid_System",        // Still needs to learn
      "MGS_Async_Await_Handling"        // Still needs to learn
    ]
  }
  exam_status: 'fail'
```

**Note:** Skills like `MGS_React_Basics` are removed because the learner demonstrated they know them (even though they failed overall).

---

## 🔍 Example Scenario

### Scenario: John Fails React Development Exam

1. **Initial State:**
   - John enrolled in "React Development" course
   - Initial gap: 10 skills needed
   - Learning path generated with 10 skills

2. **John Studies and Takes Exam:**
   - Learns 7 skills successfully
   - Fails exam (didn't master all 10)

3. **Skills Engine Sends Result:**
   - `exam_status: "FAIL"`
   - Updated gap: Only 3 skills remaining
   - Skills Engine identifies: "React Hooks Advanced", "Flexbox Grid", "Async/Await"

4. **LearnerAI Updates Gap:**
   - Updates `skills_gap` table
   - Removes 7 skills (John knows them)
   - Keeps 3 skills (John still needs)
   - Sets `exam_status: 'fail'`

5. **Learning Path Updated (Not Rebuilt):**
   - Focuses on 3 remaining skills
   - Shorter, more targeted path
   - **Updates** existing course (same `competency_target_name`)
   - **No approval needed** - automatically distributed to Course Builder

6. **John Gets New Path:**
   - Sees updated learning path in frontend
   - Path is shorter and focused
   - Can retry exam after completing new path

---

## ⚠️ Important Notes

1. **No Automatic Generation:**
   - Learning path generation must be manually triggered
   - Skills Engine or frontend must call `/api/v1/learning-paths/generate`

2. **Course Update vs. Create:**
   - If course exists (by `competency_target_name`), it's **updated** (not rebuilt)
   - If course doesn't exist, it's **created**
   - Same `competency_target_name` = same course

3. **Skills Filtering:**
   - System filters out skills learner already knows
   - Only skills in the new gap remain
   - This ensures path focuses on remaining gaps

4. **Approval Workflow - Special Rule for Exam Failures:**
   - **After exam failure (UPDATE):**
     - ✅ **Skips approval workflow** (even if company has manual approval)
     - ✅ **Automatically distributes** to Course Builder
     - ✅ **No decision maker notification**
   - **New path (first time):**
     - Manual approval companies: Decision maker must approve
     - Auto approval companies: Automatically distributed

5. **Exam Status Tracking:**
   - `exam_status: 'fail'` is stored in `skills_gap` table
   - Sent to Learning Analytics in payload
   - Can be used for reporting and analytics

---

## 🔗 Related Documentation

- [Skills Engine Flow](SKILLS_ENGINE_FLOW_UPDATED.md) - How Skills Engine communicates
- [Learning Path Generation](PROJECT_FLOW.md) - Complete generation flow
- [Approval Workflow](MICROSERVICES_COMMUNICATION.md) - Approval process
- [API Endpoints](../../backend/API_ENDPOINTS.md) - API documentation

---

**Last Updated:** 2025-01-20

