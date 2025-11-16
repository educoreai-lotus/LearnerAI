# Testing Full Learning Path Flow - End-to-End

This guide shows you how to test the **complete flow** from receiving a skills gap to generating a full learning path, including sending expansions to Skills Engine.

---

## 🔄 Complete Flow Overview

```
1. Skills Engine → LearnerAI: POST /api/v1/skills-gaps (sends gap)
   └─> Skills gap saved to database

2. LearnerAI: POST /api/v1/learning-paths/generate (trigger generation)
   └─> Job created (status: pending)

3. Background Processing:
   ├─> Prompt 1: Expand skills gap
   │   └─> Output saved to skills_expansions.prompt_1_output
   ├─> Prompt 2: Identify competencies
   │   └─> Output saved to skills_expansions.prompt_2_output
   ├─> LearnerAI → Skills Engine: POST /api/skills/breakdown (send expansions)
   │   └─> Skills Engine returns micro/nano skills
   └─> Prompt 3: Create learning path
       └─> Output saved to courses.learning_path

4. Verify Results:
   ├─> Check skills_expansions table (Prompt 1 & 2)
   ├─> Check courses table (Prompt 3 - learning path)
   └─> Check Skills Engine received the expansion request
```

---

## 📋 Prerequisites

### 1. Make Sure Backend is Running

```powershell
cd backend
node server.js
```

**Keep this terminal open** - you'll see all the logs here!

### 2. Run SQL Migration (If Not Done)

Run this in Supabase SQL Editor to remove the FK constraint:

```sql
ALTER TABLE IF EXISTS jobs
    DROP CONSTRAINT IF EXISTS fk_jobs_competency;
```

### 3. Set Environment Variables

Make sure these are set in `backend/.env`:

```env
GEMINI_API_KEY=your-key-here
SKILLS_ENGINE_URL=http://localhost:5001  # or your Skills Engine URL
SKILLS_ENGINE_TOKEN=your-token-here
SUPABASE_URL=your-supabase-url
SUPABASE_KEY=your-supabase-key
```

---

## 🧪 Step-by-Step Testing

### **Step 1: Simulate Skills Engine Sending a Gap**

**Purpose:** Simulate Skills Engine sending a skills gap after an exam.

**Endpoint:** `POST /api/v1/skills-gaps`

**Where:** Postman or PowerShell

#### **Postman Setup:**

1. **Method:** `POST`
2. **URL:** `http://localhost:5000/api/v1/skills-gaps`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body (raw JSON):**
```json
{
  "user_id": "a1b2c3d4-e5f6-4789-a012-345678901234",
  "user_name": "Alice Johnson",
  "company_id": "c1d2e3f4-5678-9012-3456-789012345678",
  "company_name": "TechCorp Inc.",
  "competency_target_name": "JavaScript Basics",
  "status": "fail",
  "gap": {
    "missing_skills_map": {
      "microSkills": [
        {
          "id": "MGS_ES6_Syntax",
          "name": "ES6+ Syntax (Arrow Functions, Destructuring, Spread)"
        },
        {
          "id": "MGS_Promise_Handling",
          "name": "Promise Handling and Error Management"
        }
      ],
      "nanoSkills": [
        {
          "id": "MGS_Async_Await",
          "name": "Async/Await Patterns"
        },
        {
          "id": "MGS_Promise_Chaining",
          "name": "Promise Chaining and Composition"
        }
      ]
    }
  }
}
```

#### **PowerShell Alternative:**

```powershell
$gapBody = @{
    user_id = "a1b2c3d4-e5f6-4789-a012-345678901234"
    user_name = "Alice Johnson"
    company_id = "c1d2e3f4-5678-9012-3456-789012345678"
    company_name = "TechCorp Inc."
    competency_target_name = "JavaScript Basics"
    status = "fail"
    gap = @{
        missing_skills_map = @{
            microSkills = @(
                @{
                    id = "MGS_ES6_Syntax"
                    name = "ES6+ Syntax (Arrow Functions, Destructuring, Spread)"
                },
                @{
                    id = "MGS_Promise_Handling"
                    name = "Promise Handling and Error Management"
                }
            )
            nanoSkills = @(
                @{
                    id = "MGS_Async_Await"
                    name = "Async/Await Patterns"
                },
                @{
                    id = "MGS_Promise_Chaining"
                    name = "Promise Chaining and Composition"
                }
            )
        }
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri "http://localhost:5000/api/v1/skills-gaps" `
    -Method POST `
    -ContentType "application/json" `
    -Body $gapBody
```

#### **Expected Response:**

```json
{
  "message": "Skills gap processed successfully",
  "skillsGap": {
    "gap_id": "uuid-here",
    "user_id": "a1b2c3d4-e5f6-4789-a012-345678901234",
    "competency_target_name": "JavaScript Basics",
    "exam_status": "fail",
    "skills_raw_data": { ... }
  }
}
```

**✅ What Happened:**
- Skills gap saved to `skills_gap` table
- `skills_raw_data` contains the gap data
- Ready for learning path generation

---

### **Step 2: Generate Learning Path**

**Purpose:** Trigger learning path generation using the skills gap from Step 1.

**Endpoint:** `POST /api/v1/learning-paths/generate`

#### **Postman Setup:**

1. **Method:** `POST`
2. **URL:** `http://localhost:5000/api/v1/learning-paths/generate`
3. **Headers:**
   - `Content-Type: application/json`
4. **Body (raw JSON):**
```json
{
  "userId": "a1b2c3d4-e5f6-4789-a012-345678901234",
  "companyId": "c1d2e3f4-5678-9012-3456-789012345678",
  "competencyTargetName": "JavaScript Basics"
}
```

#### **PowerShell Alternative:**

```powershell
$generateBody = @{
    userId = "a1b2c3d4-e5f6-4789-a012-345678901234"
    companyId = "c1d2e3f4-5678-9012-3456-789012345678"
    competencyTargetName = "JavaScript Basics"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/learning-paths/generate" `
    -Method POST `
    -ContentType "application/json" `
    -Body $generateBody

$jobId = $response.jobId
Write-Host "Job ID: $jobId"
```

#### **Expected Response:**

```json
{
  "message": "Learning path generation started",
  "jobId": "550e8400-e29b-41d4-a716-446655440001",
  "status": "pending"
}
```

**✅ What Happened:**
- Job created in `jobs` table
- Background processing started
- **Save the `jobId`** - you'll need it for Step 3!

---

### **Step 3: Monitor Job Progress**

**Purpose:** Track the job as it processes through all stages.

**Endpoint:** `GET /api/v1/jobs/{jobId}/status`

#### **Postman Setup:**

1. **Method:** `GET`
2. **URL:** `http://localhost:5000/api/v1/jobs/{jobId}/status`
   - Replace `{jobId}` with the jobId from Step 2
   - Example: `http://localhost:5000/api/v1/jobs/550e8400-e29b-41d4-a716-446655440001/status`

#### **PowerShell Polling Script:**

```powershell
$jobId = "550e8400-e29b-41d4-a716-446655440001"  # Use your jobId from Step 2

Write-Host "Monitoring job progress..."
while ($true) {
    $status = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/jobs/$jobId/status" -Method GET
    
    Write-Host "[$($status.status)] Progress: $($status.progress)% - Stage: $($status.currentStage)"
    
    if ($status.status -eq "completed") {
        Write-Host "✅ Learning path generated successfully!"
        Write-Host "Competency: $($status.result.learningPathId)"
        break
    }
    if ($status.status -eq "failed") {
        Write-Host "❌ Generation failed: $($status.error)"
        break
    }
    
    Start-Sleep -Seconds 10
}
```

#### **Expected Progress:**

| Stage | Progress | What's Happening |
|-------|----------|------------------|
| `pending` | 0% | Job created |
| `skill-expansion` | 10-30% | Prompt 1 executing |
| `competency-identification` | 30-50% | Prompt 2 executing |
| `skill-breakdown` | 50-70% | **Sending expansions to Skills Engine** |
| `path-creation` | 70-90% | Prompt 3 executing |
| `completed` | 100% | Learning path saved |

**✅ What to Watch For:**
- Backend terminal logs showing each stage
- Progress percentage increasing
- Stage changing as prompts complete

---

### **Step 4: Verify Skills Engine Received Expansion**

**Purpose:** Confirm that LearnerAI sent the expanded competencies to Skills Engine.

#### **Option 1: Check Backend Logs**

**Where:** Terminal where `node server.js` is running

**Look for:**
```
📝 Requesting skill breakdown from Skills Engine
✅ Skills Engine responded with breakdown
```

**Or if Skills Engine is unavailable:**
```
⚠️ Skills Engine unavailable, using mock data
```

#### **Option 2: Check Skills Engine Logs**

If you have access to Skills Engine logs, you should see:
```
POST /api/skills/breakdown
Body: {
  "competencies": [
    "Competency_Name_1",
    "Competency_Name_2",
    ...
  ]
}
```

#### **Option 3: Check Network Traffic**

Use a tool like **Postman Interceptor** or **Fiddler** to capture the request:
- **URL:** `{SKILLS_ENGINE_URL}/api/skills/breakdown`
- **Method:** `POST`
- **Headers:** `Authorization: Bearer {SKILLS_ENGINE_TOKEN}`
- **Body:**
```json
{
  "competencies": [
    "TypeScript Fundamentals",
    "Asynchronous Programming",
    ...
  ]
}
```

**✅ What Should Happen:**
- LearnerAI extracts competencies from Prompt 2 output
- Sends simple array of competency names to Skills Engine
- Skills Engine returns micro/nano skills breakdown
- Breakdown is used in Prompt 3

---

### **Step 5: Verify Final Results**

**Purpose:** Check that all outputs are saved correctly.

#### **5.1: Check Prompt 1 & 2 Outputs**

**Location:** `skills_expansions` table

**SQL Query:**
```sql
SELECT 
  expansion_id,
  gap_id,
  user_id,
  prompt_1_output,
  prompt_2_output,
  created_at
FROM skills_expansions
WHERE user_id = 'a1b2c3d4-e5f6-4789-a012-345678901234'
ORDER BY created_at DESC
LIMIT 1;
```

**Via API:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/skills-expansions?user_id=a1b2c3d4-e5f6-4789-a012-345678901234" -Method GET
```

**✅ What to Verify:**
- `prompt_1_output` contains expanded skills
- `prompt_2_output` contains competencies list
- `gap_id` links to original skills gap
- `user_id` matches

#### **5.2: Check Prompt 3 Output (Learning Path)**

**Location:** `courses` table

**SQL Query:**
```sql
SELECT 
  competency_target_name,
  user_id,
  gap_id,
  learning_path,
  approved,
  created_at
FROM courses
WHERE user_id = 'a1b2c3d4-e5f6-4789-a012-345678901234'
  AND competency_target_name = 'JavaScript Basics'
ORDER BY created_at DESC
LIMIT 1;
```

**Via API:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/courses/user/a1b2c3d4-e5f6-4789-a012-345678901234" -Method GET
```

**✅ What to Verify:**
- `learning_path` contains full path structure
- `competency_target_name` matches
- `gap_id` links to original skills gap
- `user_id` matches

---

## 📊 Complete Test Script (PowerShell)

Here's a complete script that does all steps:

```powershell
# Step 1: Send skills gap from Skills Engine
Write-Host "Step 1: Sending skills gap..." -ForegroundColor Cyan
$gapBody = @{
    user_id = "a1b2c3d4-e5f6-4789-a012-345678901234"
    user_name = "Alice Johnson"
    company_id = "c1d2e3f4-5678-9012-3456-789012345678"
    company_name = "TechCorp Inc."
    competency_target_name = "JavaScript Basics"
    status = "fail"
    gap = @{
        missing_skills_map = @{
            microSkills = @(
                @{ id = "MGS_ES6_Syntax"; name = "ES6+ Syntax" },
                @{ id = "MGS_Promise_Handling"; name = "Promise Handling" }
            )
            nanoSkills = @(
                @{ id = "MGS_Async_Await"; name = "Async/Await Patterns" }
            )
        }
    }
} | ConvertTo-Json -Depth 10

$gapResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/skills-gaps" `
    -Method POST -ContentType "application/json" -Body $gapBody
Write-Host "✅ Skills gap saved: $($gapResponse.skillsGap.gap_id)" -ForegroundColor Green

# Step 2: Generate learning path
Write-Host "`nStep 2: Generating learning path..." -ForegroundColor Cyan
$generateBody = @{
    userId = "a1b2c3d4-e5f6-4789-a012-345678901234"
    companyId = "c1d2e3f4-5678-9012-3456-789012345678"
    competencyTargetName = "JavaScript Basics"
} | ConvertTo-Json

$generateResponse = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/learning-paths/generate" `
    -Method POST -ContentType "application/json" -Body $generateBody
$jobId = $generateResponse.jobId
Write-Host "✅ Job created: $jobId" -ForegroundColor Green

# Step 3: Monitor progress
Write-Host "`nStep 3: Monitoring job progress..." -ForegroundColor Cyan
while ($true) {
    $status = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/jobs/$jobId/status" -Method GET
    
    Write-Host "[$($status.status)] Progress: $($status.progress)% - Stage: $($status.currentStage)" -ForegroundColor Yellow
    
    if ($status.status -eq "completed") {
        Write-Host "`n✅ Learning path generated successfully!" -ForegroundColor Green
        Write-Host "Competency: $($status.result.learningPathId)" -ForegroundColor Green
        break
    }
    if ($status.status -eq "failed") {
        Write-Host "`n❌ Generation failed: $($status.error)" -ForegroundColor Red
        break
    }
    
    Start-Sleep -Seconds 10
}

# Step 4: Verify results
Write-Host "`nStep 4: Verifying results..." -ForegroundColor Cyan

# Check skills expansions
$expansions = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/skills-expansions?user_id=a1b2c3d4-e5f6-4789-a012-345678901234" -Method GET
Write-Host "✅ Skills expansions found: $($expansions.length)" -ForegroundColor Green

# Check courses
$courses = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/courses/user/a1b2c3d4-e5f6-4789-a012-345678901234" -Method GET
Write-Host "✅ Courses found: $($courses.length)" -ForegroundColor Green

Write-Host "`n✅ Full flow test completed!" -ForegroundColor Green
```

---

## 🔍 What to Check in Backend Logs

**Watch the terminal where `node server.js` is running:**

```
✅ Created skills expansion record: uuid
✅ Found gap_id: uuid for linking to skills_expansions
✅ Using updated skills_raw_data from database
✅ Saved Prompt 1 output to skills_expansions: uuid
✅ Using Prompt 1 output from skills_expansions table
✅ Saved Prompt 2 output to skills_expansions: uuid
✅ Using Prompt 2 output from skills_expansions table
📝 Requesting skill breakdown from Skills Engine
✅ Skills Engine responded with breakdown
✅ Saved learning path to database
✅ Learning path generation completed
```

---

## ⚠️ Troubleshooting

### Issue: "Job failed" or "Error in processing"

**Solution:**
1. Check backend terminal logs for detailed error
2. Verify `GEMINI_API_KEY` is set
3. Check Supabase connection
4. Verify Skills Engine URL and token

### Issue: "Skills Engine unavailable"

**Solution:**
- The system will use mock data automatically
- Check `SKILLS_ENGINE_URL` and `SKILLS_ENGINE_TOKEN` in `.env`
- Verify Skills Engine is running and accessible

### Issue: "Foreign key constraint violation"

**Solution:**
- Run the SQL migration to remove the FK constraint:
```sql
ALTER TABLE IF EXISTS jobs
    DROP CONSTRAINT IF EXISTS fk_jobs_competency;
```

---

## ✅ Success Criteria

You've successfully tested the full flow when:

- [x] Skills gap received and saved
- [x] Job created successfully
- [x] Job progresses through all stages
- [x] Prompt 1 output saved to `skills_expansions`
- [x] Prompt 2 output saved to `skills_expansions`
- [x] Expansions sent to Skills Engine (or mock data used)
- [x] Prompt 3 output saved to `courses`
- [x] Learning path contains full structure

---

**Ready to test! Follow the steps above to verify the complete flow.** ✅

