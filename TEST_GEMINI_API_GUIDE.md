# 🧪 How to Test Gemini API & Prompts

## Quick Tests

### 1. **Health Check Endpoint** (Fastest)

```bash
# Check if Gemini API is accessible
curl http://localhost:5000/api/v1/ai/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "Gemini AI",
  "model": "gemini-2.5-flash",
  "timestamp": "2025-11-22T..."
}
```

**If unhealthy:**
- Check `GEMINI_API_KEY` in `.env`
- Verify API key is valid
- Check network connectivity

---

### 2. **Run Test Script** (Comprehensive)

```bash
cd backend
node test-gemini.js
```

**This script tests:**
- ✅ API key presence
- ✅ Gemini client initialization
- ✅ Prompt loader initialization
- ✅ Simple API call
- ✅ Loading all 4 prompts
- ✅ Executing Prompt 1 with sample data

**Expected Output:**
```
🧪 Testing Gemini API and Prompts...

✅ GEMINI_API_KEY found
✅ Gemini client initialized
✅ Prompt loader initialized

📝 Test 1: Simple Gemini API Call
✅ Gemini API responded: {"message": "Hello, Gemini is working!"}

📝 Test 2: Load Prompt 1 (Skill Expansion)
✅ Prompt 1 loaded
   Length: 1234 characters

📝 Test 3: Load Prompt 2 (Competency Identification)
✅ Prompt 2 loaded

📝 Test 4: Load Prompt 3 (Path Creation)
✅ Prompt 3 loaded

📝 Test 5: Execute Prompt 1 with Sample Data
✅ Prompt 1 executed successfully!
   Response type: object
   ✅ Response is valid JSON object
```

---

### 3. **Test via API Endpoint**

```bash
# Test simple query
curl -X POST http://localhost:5000/api/v1/ai/query \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Say hello in JSON format",
    "format": "json"
  }'
```

---

## Verify Prompts Are Used Correctly

### Check 1: Prompt Files Exist

```bash
# Check if all prompt files exist
ls backend/src/infrastructure/prompts/prompts/

# Should see:
# - prompt1-skill-expansion.txt
# - prompt2-competency-identification.txt
# - prompt3-path-creation.txt
# - prompt4-course-suggestions.txt
```

### Check 2: Prompt Loading in Code

**Location:** `GenerateLearningPathUseCase.js`

**Prompt 1 (Line ~150):**
```javascript
const prompt1 = await this.promptLoader.loadPrompt('prompt1-skill-expansion');
```

**Prompt 2 (Line ~190):**
```javascript
const prompt2 = await this.promptLoader.loadPrompt('prompt2-competency-identification');
```

**Prompt 3 (Line ~282):**
```javascript
const prompt3 = await this.promptLoader.loadPrompt('prompt3-path-creation');
```

**Prompt 4 (In GenerateCourseSuggestionsUseCase):**
```javascript
const prompt4 = await this.promptLoader.loadPrompt('prompt4-course-suggestions');
```

---

## Test Full Learning Path Generation

### Step 1: Generate a Learning Path

```bash
curl -X POST http://localhost:5000/api/v1/learning-paths/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "a1b2c3d4-e5f6-4789-a012-345678901234",
    "competencyTargetName": "GraphQL API Development",
    "skillGaps": {
      "Competency_GraphQL_Fundamentals": [
        "MGS_GraphQL_Schema_Definition",
        "MGS_GraphQL_Queries"
      ]
    },
    "companyId": "c1d2e3f4-5678-9012-3456-789012345678"
  }'
```

**Response:**
```json
{
  "jobId": "job-uuid-here",
  "status": "processing",
  "message": "Learning path generation started"
}
```

### Step 2: Check Job Status

```bash
curl http://localhost:5000/api/v1/jobs/{jobId}/status
```

**Watch for:**
- `currentStage: "skill-expansion"` → Prompt 1 executing
- `currentStage: "competency-identification"` → Prompt 2 executing
- `currentStage: "path-creation"` → Prompt 3 executing
- `status: "completed"` → All prompts executed successfully

---

## Check Backend Logs

When generating a learning path, watch the console for:

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
✅ Skills Engine breakdown received
✅ Loaded prompt: prompt3-path-creation
[GenerateLearningPathUseCase] Executing Prompt 3...
✅ Prompt 3 executed successfully
✅ Learning path saved to courses table
```

---

## Verify Prompt Content

### Check Prompt Files

```bash
# View Prompt 1
cat backend/src/infrastructure/prompts/prompts/prompt1-skill-expansion.txt

# View Prompt 2
cat backend/src/infrastructure/prompts/prompts/prompt2-competency-identification.txt

# View Prompt 3
cat backend/src/infrastructure/prompts/prompts/prompt3-path-creation.txt
```

### Verify Prompts Are Loaded Correctly

Add this to your code temporarily:

```javascript
// In GenerateLearningPathUseCase.js
const prompt1 = await this.promptLoader.loadPrompt('prompt1-skill-expansion');
console.log('📝 Prompt 1 loaded:', {
  length: prompt1.length,
  hasPlaceholders: prompt1.includes('{input}'),
  firstLine: prompt1.split('\n')[0]
});
```

---

## Test Each Prompt Individually

### Test Prompt 1 (Skill Expansion)

```bash
curl -X POST http://localhost:5000/api/v1/ai/query \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Load prompt1-skill-expansion.txt content here...",
    "format": "json"
  }'
```

### Test Prompt 2 (Competency Identification)

```bash
# Use output from Prompt 1 as input
curl -X POST http://localhost:5000/api/v1/ai/query \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Load prompt2-competency-identification.txt...",
    "format": "json"
  }'
```

---

## Verify Database Storage

### Check if Prompts Are Saved

```sql
-- Check Prompt 1 & 2 outputs
SELECT 
  expansion_id,
  gap_id,
  prompt_1_output,
  prompt_2_output,
  created_at
FROM skills_expansions
ORDER BY created_at DESC
LIMIT 5;
```

### Check Prompt 3 Output (Learning Path)

```sql
-- Check learning path structure
SELECT 
  competency_target_name,
  learning_path->>'pathTitle' as title,
  learning_path->'learning_modules' as modules,
  created_at
FROM courses
ORDER BY created_at DESC
LIMIT 5;
```

---

## Common Issues & Solutions

### Issue 1: "GEMINI_API_KEY not found"

**Solution:**
```bash
# Check .env file
cat backend/.env | grep GEMINI_API_KEY

# Or set in environment
export GEMINI_API_KEY=your-key-here
```

### Issue 2: "Prompt file not found"

**Solution:**
```bash
# Verify prompt files exist
ls -la backend/src/infrastructure/prompts/prompts/

# Check PROMPTS_DIRECTORY env variable
echo $PROMPTS_DIRECTORY
```

### Issue 3: "Gemini API error: API key not valid"

**Solution:**
- Get new API key from Google AI Studio
- Update `.env` file
- Restart backend server

### Issue 4: "Request timeout"

**Solution:**
- Increase timeout in `GenerateLearningPathUseCase.js`
- Check network connectivity
- Verify API quota not exceeded

---

## Monitoring During Production

### 1. Check Health Endpoint Regularly

```bash
# Add to monitoring
watch -n 30 'curl -s http://localhost:5000/api/v1/ai/health'
```

### 2. Monitor Job Failures

```sql
-- Check failed jobs
SELECT 
  id,
  user_id,
  competency_target_name,
  status,
  error,
  updated_at
FROM jobs
WHERE status = 'failed'
ORDER BY updated_at DESC;
```

### 3. Check API Response Times

Look for these in logs:
- Prompt 1: ~10-20 seconds
- Prompt 2: ~10-20 seconds
- Prompt 3: ~30-60 seconds (longer, generates full path)

---

## Quick Verification Checklist

- [ ] `GEMINI_API_KEY` is set in `.env`
- [ ] Health check returns `"status": "healthy"`
- [ ] Test script runs without errors
- [ ] All 4 prompt files exist
- [ ] Prompt loader can load all prompts
- [ ] Learning path generation completes successfully
- [ ] Prompts are saved to database
- [ ] Generated learning paths have correct structure

---

## Advanced: Test with Real Data

### Create a Test Skills Gap

```bash
curl -X POST http://localhost:5000/api/v1/skills-gaps \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "a1b2c3d4-e5f6-4789-a012-345678901234",
    "company_id": "c1d2e3f4-5678-9012-3456-789012345678",
    "company_name": "TechCorp Inc.",
    "user_name": "Alice Johnson",
    "competency_target_name": "GraphQL API Development",
    "skills_raw_data": {
      "Competency_GraphQL_Fundamentals": [
        "MGS_GraphQL_Schema_Definition",
        "MGS_GraphQL_Queries"
      ]
    },
    "exam_status": "fail"
  }'
```

### Generate Path

```bash
curl -X POST http://localhost:5000/api/v1/learning-paths/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "a1b2c3d4-e5f6-4789-a012-345678901234",
    "competencyTargetName": "GraphQL API Development",
    "skillGaps": {...},
    "companyId": "c1d2e3f4-5678-9012-3456-789012345678"
  }'
```

### Verify Result

```sql
-- Check the generated path
SELECT 
  competency_target_name,
  learning_path->>'pathTitle' as title,
  jsonb_array_length(COALESCE(learning_path->'learning_modules', '[]'::jsonb)) as modules_count,
  learning_path->'learning_modules'->0->>'module_title' as first_module
FROM courses
WHERE competency_target_name = 'GraphQL API Development';
```

---

## Summary

**Quick Test:**
```bash
node backend/test-gemini.js
```

**Health Check:**
```bash
curl http://localhost:5000/api/v1/ai/health
```

**Full Workflow:**
1. Create skills gap
2. Generate learning path
3. Check job status
4. Verify database results

**All working?** ✅ Your Gemini API and prompts are configured correctly!

