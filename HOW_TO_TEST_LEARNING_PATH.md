# How to Test Learning Path Generation - Complete Guide

This guide shows you **exactly where and how** to perform the three testing steps.

---

## 🔧 Prerequisites

### 1. Start the Backend Server

**Where:** Terminal/PowerShell in the project root

```powershell
cd backend
node server.js
```

**What you'll see:**
```
✅ API routes registered
🚀 Server running on port 5000
```

**Keep this terminal open** - you'll see logs here!

---

## 📋 Step 1: Check Backend Logs When Generating a Learning Path

### **Where:** The terminal where you ran `node server.js`

### **What to look for:**

When you generate a learning path, you'll see logs like:

```
✅ Created skills expansion record: 550e8400-e29b-41d4-a716-446655440001
✅ Found gap_id: d7e8f9a0-b1c2-3456-7890-123456789012 for linking to skills_expansions
✅ Using updated skills_raw_data from database for user a1b2c3d4-e5f6-4789-a012-345678901234
✅ Saved Prompt 1 output to skills_expansions: 550e8400-e29b-41d4-a716-446655440001
✅ Using Prompt 1 output from skills_expansions table
✅ Saved Prompt 2 output to skills_expansions: 550e8400-e29b-41d4-a716-446655440001
✅ Using Prompt 2 output from skills_expansions table
✅ Saved learning path to database
```

### **How to monitor:**

1. Keep the terminal window visible
2. Watch for `✅` success messages
3. Watch for `⚠️` warning messages
4. Watch for `❌` error messages

---

## 📝 Step 2: Test the Endpoint - POST /api/v1/learning-paths/generate

### **Where:** Postman (or any API client)

### **Method 1: Using Postman (Recommended)**

1. **Open Postman**
2. **Create New Request:**
   - Click "New" → "HTTP Request"
3. **Configure Request:**
   - **Method:** `POST`
   - **URL:** `http://localhost:5000/api/v1/learning-paths/generate`
4. **Add Headers:**
   - Go to "Headers" tab
   - Add: `Content-Type: application/json`
5. **Add Body:**
   - Go to "Body" tab
   - Select "raw" and "JSON"
   - Paste this:
   ```json
   {
     "userId": "a1b2c3d4-e5f6-4789-a012-345678901234",
     "companyId": "c1d2e3f4-5678-9012-3456-789012345678",
     "competencyTargetName": "JavaScript Basics"
   }
   ```
6. **Click "Send"**

### **Method 2: Using PowerShell**

**Where:** PowerShell terminal (separate from backend server)

```powershell
$body = @{
    userId = "a1b2c3d4-e5f6-4789-a012-345678901234"
    companyId = "c1d2e3f4-5678-9012-3456-789012345678"
    competencyTargetName = "JavaScript Basics"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/api/v1/learning-paths/generate" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body
```

### **Expected Response:**

```json
{
  "message": "Learning path generation started",
  "jobId": "550e8400-e29b-41d4-a716-446655440001",
  "status": "pending"
}

```

**Save the `jobId`** - you'll need it for Step 3!

---

## 🔍 Step 3: Check Job Status - GET /api/v1/jobs/{jobId}/status

### **Where:** Postman (or PowerShell)

### **Method 1: Using Postman**

1. **Create New Request** (or use the same one)
2. **Configure Request:**
   - **Method:** `GET`
   - **URL:** `http://localhost:5000/api/v1/jobs/{jobId}/status`
   - Replace `{jobId}` with the actual jobId from Step 2
   - Example: `http://localhost:5000/api/v1/jobs/550e8400-e29b-41d4-a716-446655440001/status`
3. **No headers needed** (GET request)
4. **No body needed**
5. **Click "Send"**

### **Method 2: Using PowerShell**

**Where:** PowerShell terminal

```powershell
$jobId = "550e8400-e29b-41d4-a716-446655440001"  # Use the jobId from Step 2

Invoke-RestMethod -Uri "http://localhost:5000/api/v1/jobs/$jobId/status" `
    -Method GET
```

### **Expected Responses:**

#### **While Processing:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "status": "processing",
  "progress": 30,
  "currentStage": "skill-expansion"
}
```

#### **When Completed:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "status": "completed",
  "progress": 100,
  "currentStage": "completed",
  "result": {
    "learningPathId": "JavaScript Basics"
  }
}
```

### **Polling Strategy:**

Since generation takes 2-5 minutes, **poll every 10 seconds**:

**In PowerShell:**
```powershell
$jobId = "550e8400-e29b-41d4-a716-446655440001"

while ($true) {
    $status = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/jobs/$jobId/status"
    Write-Host "Status: $($status.status) - Progress: $($status.progress)% - Stage: $($status.currentStage)"
    
    if ($status.status -eq "completed" -or $status.status -eq "failed") {
        break
    }
    
    Start-Sleep -Seconds 10
}
```

---

## 📊 Complete Testing Workflow

### **Terminal 1: Backend Server**
```powershell
cd backend
node server.js
```
**Purpose:** See real-time logs

### **Terminal 2: PowerShell (or Postman)**
```powershell
# Step 1: Generate learning path
$body = @{
    userId = "a1b2c3d4-e5f6-4789-a012-345678901234"
    companyId = "c1d2e3f4-5678-9012-3456-789012345678"
    competencyTargetName = "JavaScript Basics"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/learning-paths/generate" `
    -Method POST -ContentType "application/json" -Body $body

$jobId = $response.jobId
Write-Host "Job ID: $jobId"

# Step 2: Check status (poll every 10 seconds)
while ($true) {
    $status = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/jobs/$jobId/status"
    Write-Host "[$($status.status)] Progress: $($status.progress)% - Stage: $($status.currentStage)"
    
    if ($status.status -eq "completed") {
        Write-Host "✅ Learning path generated successfully!"
        break
    }
    if ($status.status -eq "failed") {
        Write-Host "❌ Generation failed!"
        break
    }
    
    Start-Sleep -Seconds 10
}
```

---

## 🔍 Where to Find Outputs

### **Prompt 1 & 2 Outputs:**

**In Database:**
```sql
SELECT 
  expansion_id,
  gap_id,
  user_id,
  prompt_1_output,
  prompt_2_output
FROM skills_expansions
ORDER BY created_at DESC
LIMIT 1;
```

**In Backend Logs:**
- Look for: `✅ Saved Prompt 1 output to skills_expansions`
- Look for: `✅ Saved Prompt 2 output to skills_expansions`

### **Prompt 3 Output (Learning Path):**

**In Database:**
```sql
SELECT 
  competency_target_name,
  user_id,
  gap_id,
  learning_path
FROM courses
WHERE user_id = 'a1b2c3d4-e5f6-4789-a012-345678901234'
ORDER BY created_at DESC
LIMIT 1;
```

**Via API:**
```powershell
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/courses/user/a1b2c3d4-e5f6-4789-a012-345678901234"
```

---

## 📍 Quick Reference

| Step | Where | How |
|------|-------|-----|
| **1. Check Logs** | Backend terminal | Watch the terminal where `node server.js` is running |
| **2. Generate Path** | Postman/PowerShell | POST to `http://localhost:5000/api/v1/learning-paths/generate` |
| **3. Check Status** | Postman/PowerShell | GET `http://localhost:5000/api/v1/jobs/{jobId}/status` |

---

## 💡 Pro Tips

1. **Use two terminals:**
   - Terminal 1: Backend server (watch logs)
   - Terminal 2: PowerShell (run API calls)

2. **Save the jobId:**
   - Copy it from Step 2 response
   - Use it in Step 3

3. **Poll regularly:**
   - Check status every 10 seconds
   - Generation takes 2-5 minutes

4. **Check Supabase:**
   - View `skills_expansions` table for Prompt 1 & 2 outputs
   - View `courses` table for Prompt 3 output (learning path)

---

**Ready to test! Follow the steps above.** ✅

