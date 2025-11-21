# Testing Microservices Endpoints

This guide shows how to test all microservice communication endpoints. **Yes, they will fail if the services aren't running or tokens aren't configured**, but that's expected!

---

## 🧪 Testing Setup

### Prerequisites
1. **Backend must be running:**
   ```powershell
   cd backend
   npm start
   # Should see: "✅ API routes registered"
   ```

2. **Check backend health:**
   ```powershell
   Invoke-RestMethod -Uri http://localhost:5000/health
   ```

---

## 📥 Testing Incoming Endpoints (Other Services → LearnerAI)

### 1. Test Directory → LearnerAI

**Endpoint:** `POST /api/v1/companies/register`

```powershell
$body = @{
    company_id = "550e8400-e29b-41d4-a716-446655440001"
    company_name = "Test Corp"
    approval_policy = "auto"
    decision_maker = @{
        employee_id = "660e8400-e29b-41d4-a716-446655440001"
        employee_name = "Test Manager"
        employee_email = "test@testcorp.com"
    }
} | ConvertTo-Json -Depth 10

# Test WITHOUT token (should fail with 401/403)
Invoke-RestMethod -Uri http://localhost:5000/api/v1/companies/register `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body $body

# Test WITH token (should succeed if token is valid)
Invoke-RestMethod -Uri http://localhost:5000/api/v1/companies/register `
  -Method POST `
  -Headers @{ 
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_LEARNER_AI_SERVICE_TOKEN"
  } `
  -Body $body
```

**Expected Results:**
- ✅ **Success:** Returns `{ message: "Company registered successfully", company: {...} }`
- ❌ **Fail (No Token):** Returns `401 Unauthorized` or `403 Forbidden`
- ❌ **Fail (Invalid Token):** Returns `401 Unauthorized`
- ❌ **Fail (Missing Fields):** Returns `400 Bad Request` with error message

---

### 2. Test Skills Engine → LearnerAI (Type 1)

**Endpoint:** `POST /api/v1/skills-gaps`

```powershell
$body = @{
    user_id = "a1b2c3d4-e5f6-4789-a012-345678901234"
    user_name = "Test User"
    company_id = "c1d2e3f4-5678-9012-3456-789012345678"
    company_name = "Test Corp"
    competency_target_name = "JavaScript Basics"
    exam_status = "FAIL"
    gap = @{
        "Competency_JavaScript" = @("MGS_Skill_1", "MGS_Skill_2")
    }
} | ConvertTo-Json -Depth 10

# Test WITHOUT token (should fail)
Invoke-RestMethod -Uri http://localhost:5000/api/v1/skills-gaps `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body $body

# Test WITH token (should succeed if token is valid)
Invoke-RestMethod -Uri http://localhost:5000/api/v1/skills-gaps `
  -Method POST `
  -Headers @{ 
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_LEARNER_AI_SERVICE_TOKEN"
  } `
  -Body $body
```

**Expected Results:**
- ✅ **Success:** Returns `{ message: "Skills gap processed successfully", skillsGap: {...} }`
- ❌ **Fail (No Token):** Returns `401 Unauthorized` or `403 Forbidden`
- ❌ **Fail (Invalid Token):** Returns `401 Unauthorized`
- ❌ **Fail (Missing Fields):** Returns `400 Bad Request` with error message

---

## 📤 Testing Outgoing Endpoints (LearnerAI → Other Services)

### 3. Test LearnerAI → Skills Engine (Type 2)

**This is called automatically during learning path generation**, but you can test the client directly:

**Note:** This will **FAIL** if Skills Engine service is not running or token is invalid.

**How it's called:**
```javascript
// In GenerateLearningPathUseCase.processJob()
const skillBreakdown = await skillsEngineClient.requestSkillBreakdown([
  "React Hooks",
  "TypeScript Fundamentals"
]);
```

**To test manually (if you have access to Skills Engine):**
```powershell
# This endpoint is in Skills Engine, not LearnerAI
# You would test it from Skills Engine side
# But you can check if LearnerAI can reach it:

# Check if Skills Engine is running
Invoke-RestMethod -Uri http://localhost:5001/health

# If Skills Engine has a test endpoint, you could test:
$body = @{
    competencies = @("React Hooks", "TypeScript Fundamentals")
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:5001/api/skills/breakdown `
  -Method POST `
  -Headers @{ 
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_SKILLS_ENGINE_TOKEN"
  } `
  -Body $body
```

**Expected Results:**
- ✅ **Success:** Returns breakdown with `microSkills` and `nanoSkills`
- ❌ **Fail (Service Down):** Connection error, falls back to mock data
- ❌ **Fail (Invalid Token):** Returns `401 Unauthorized`
- ❌ **Fail (Wrong URL):** Connection timeout

---

### 4. Test LearnerAI → Learning Analytics

**This is called automatically by `DistributePathUseCase`** after learning path is generated.

**How it's called:**
```javascript
// In DistributePathUseCase.execute()
await analyticsClient.updatePathAnalytics(analyticsPayload);
```

**To test manually (if you have access to Learning Analytics):**
```powershell
# This endpoint is in Learning Analytics, not LearnerAI
# Check if Learning Analytics is running
Invoke-RestMethod -Uri http://localhost:5003/health

# If Learning Analytics has a test endpoint:
$body = @{
    user_id = "a1b2c3d4-e5f6-4789-a012-345678901234"
    user_name = "Test User"
    company_id = "c1d2e3f4-5678-9012-3456-789012345678"
    company_name = "Test Corp"
    competency_target_name = "JavaScript Basics"
    gap_id = "770e8400-e29b-41d4-a716-446655440001"
    skills_raw_data = @{
        "Competency_JavaScript" = @("MGS_Skill_1", "MGS_Skill_2")
    }
    exam_status = "FAIL"
    learning_path = @{
        steps = @()
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri http://localhost:5003/api/v1/paths/update `
  -Method POST `
  -Headers @{ 
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_ANALYTICS_TOKEN"
  } `
  -Body $body
```

**Expected Results:**
- ✅ **Success:** Returns success response from Learning Analytics
- ❌ **Fail (Service Down):** Connection error, logged in LearnerAI
- ❌ **Fail (Invalid Token):** Returns `401 Unauthorized`
- ❌ **Fail (Wrong URL):** Connection timeout

---

### 5. Test LearnerAI → Course Builder

**This is called automatically by `DistributePathUseCase`** after learning path is generated.

**How it's called:**
```javascript
// In DistributePathUseCase.execute()
await courseBuilderClient.sendLearningPath(courseBuilderPayload);
```

**To test manually (if you have access to Course Builder):**
```powershell
# This endpoint is in Course Builder, not LearnerAI
# Check if Course Builder is running
Invoke-RestMethod -Uri http://localhost:5002/health

# If Course Builder has a test endpoint:
$body = @{
    user_id = "a1b2c3d4-e5f6-4789-a012-345678901234"
    user_name = "Test User"
    company_id = "c1d2e3f4-5678-9012-3456-789012345678"
    company_name = "Test Corp"
    competency_target_name = "JavaScript Basics"
    learning_path = @{
        steps = @(
            @{
                step = 1
                title = "Introduction"
                duration = "1 week"
                resources = @("Resource 1")
                objectives = @("Learn basics")
                estimatedTime = "5 hours"
            }
        )
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri http://localhost:5002/api/v1/learning-paths `
  -Method POST `
  -Headers @{ 
    "Content-Type" = "application/json"
    "Authorization" = "Bearer YOUR_COURSE_BUILDER_TOKEN"
  } `
  -Body $body
```

**Expected Results:**
- ✅ **Success:** Returns success response from Course Builder
- ❌ **Fail (Service Down):** Connection error, logged in LearnerAI
- ❌ **Fail (Invalid Token):** Returns `401 Unauthorized`
- ❌ **Fail (Wrong URL):** Connection timeout

---

## 🔍 How to Check if Endpoints Are Working

### Check Backend Logs

When you test incoming endpoints, check your backend console for:
- ✅ `✅ Company registered successfully`
- ✅ `✅ Skills gap processed successfully`
- ❌ `❌ Failed to...` (if there are errors)

### Check for Authentication

**Without tokens, incoming endpoints should fail:**
```powershell
# This should return 401 or 403
Invoke-RestMethod -Uri http://localhost:5000/api/v1/companies/register `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"company_id":"test","company_name":"Test"}'
```

### Check Environment Variables

Make sure your `.env` file has:
```env
LEARNER_AI_SERVICE_TOKEN=your-token-here
SKILLS_ENGINE_URL=http://localhost:5001
SKILLS_ENGINE_TOKEN=your-token-here
ANALYTICS_URL=http://localhost:5003
ANALYTICS_TOKEN=your-token-here
COURSE_BUILDER_URL=http://localhost:5002
COURSE_BUILDER_TOKEN=your-token-here
```

---

## ✅ Expected Behavior

### Incoming Endpoints (Should Work)
- ✅ **Directory** endpoint: Should work if backend is running (may need token validation)
- ✅ **Skills Engine** endpoint: Should work if backend is running (may need token validation)

### Outgoing Endpoints (Will Fail if Services Not Running)
- ❌ **Skills Engine** (Type 2): Will fail if Skills Engine service is not running → Falls back to mock data
- ❌ **Learning Analytics**: Will fail if Analytics service is not running → Error logged
- ❌ **Course Builder**: Will fail if Course Builder service is not running → Error logged

**This is normal!** The outgoing endpoints will fail gracefully and log errors, but won't crash your application.

---

## 🧪 Quick Test Script

```powershell
# Test all incoming endpoints
Write-Host "Testing Directory endpoint..."
Invoke-RestMethod -Uri http://localhost:5000/api/v1/companies/register `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"company_id":"test","company_name":"Test","approval_policy":"auto","decision_maker":{"employee_id":"test","employee_name":"Test","employee_email":"test@test.com"}}'

Write-Host "Testing Skills Engine endpoint..."
Invoke-RestMethod -Uri http://localhost:5000/api/v1/skills-gaps `
  -Method POST `
  -Headers @{ "Content-Type" = "application/json" } `
  -Body '{"user_id":"test","user_name":"Test","company_id":"test","company_name":"Test","competency_target_name":"Test","exam_status":"FAIL","gap":{"Test":["skill1"]}}'
```

---

**Yes, endpoints will fail if services aren't running or tokens aren't configured - that's expected!** ✅

