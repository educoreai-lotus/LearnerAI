# Viewing Gemini Prompt Outputs

This guide shows you where to find the outputs from all three Gemini prompts.

---

## 📍 Where Prompt Outputs Are Stored

### ✅ **Prompt 3 Output (Learning Path) - SAVED**

**Location:** Supabase Database → `courses` table → `learning_path` column (JSONB)

**Contains:**
- Full learning path structure (modules, steps, duration)
- Path title
- Total duration hours
- All metadata from Prompt 3

**How to View:**

**1. Via Supabase Dashboard:**
```
1. Go to Supabase Dashboard
2. Navigate to: Table Editor → courses
3. Find row with your competency_target_name
4. Click on learning_path column (JSONB)
5. View the full structure
```

**2. Via SQL Query:**
```sql
SELECT 
  competency_target_name,
  user_id,
  learning_path->'metadata' as prompt3_output,
  learning_path->'pathSteps' as learning_modules,
  learning_path->'pathTitle' as path_title,
  learning_path->'totalDurationHours' as duration
FROM courses
WHERE user_id = 'your-user-id'
ORDER BY created_at DESC
LIMIT 1;
```

**3. Via API:**
```powershell
# Get course with learning path
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/courses/user/a1b2c3d4-e5f6-4789-a012-345678901234" -Method GET
```

**Example Structure:**
```json
{
  "learning_path": {
    "pathSteps": [...],
    "pathTitle": "JavaScript Fundamentals Mastery",
    "totalDurationHours": 40,
    "learningModules": [
      {
        "module_number": 1,
        "module_title": "ES6 Basics",
        "steps": [...],
        "estimated_duration": "2 weeks"
      }
    ],
    "metadata": {
      // Full Prompt 3 output here
      "learning_modules": [...],
      "path_title": "...",
      "total_estimated_duration_hours": 40
    }
  }
}
```

---

### ⚠️ **Prompt 1 & Prompt 2 Outputs - NOT CURRENTLY SAVED**

**Current Status:** Prompt 1 (Skill Expansion) and Prompt 2 (Competency Identification) outputs are **not saved to the database**. They are only used internally during processing.

**Where They Are:**
- Only in memory during job processing
- Not persisted to database
- Lost after job completes

**To View Them (Temporary):**

**Option 1: Add Logging (Recommended)**

Add console.log statements in `GenerateLearningPathUseCase.js`:

```javascript
// After Prompt 1 execution (around line 112)
console.log('📝 PROMPT 1 OUTPUT (Skill Expansion):');
console.log(JSON.stringify(prompt1Result, null, 2));

// After Prompt 2 execution (around line 137)
console.log('📝 PROMPT 2 OUTPUT (Competency Identification):');
console.log(JSON.stringify(prompt2Result, null, 2));

// After Prompt 3 execution (around line 177)
console.log('📝 PROMPT 3 OUTPUT (Path Creation):');
console.log(JSON.stringify(prompt3Result, null, 2));
```

Then check your backend terminal logs when generating a path.

**Option 2: Save to Database (Future Enhancement)**

You could modify the code to save intermediate results to the `jobs` table:

```javascript
// After Prompt 1
await this.jobRepository.updateJob(job.id, {
  currentStage: 'competency-identification',
  progress: 30,
  prompt1Output: prompt1Result  // Save Prompt 1 output
});

// After Prompt 2
await this.jobRepository.updateJob(job.id, {
  currentStage: 'skill-breakdown',
  progress: 50,
  prompt2Output: prompt2Result  // Save Prompt 2 output
});
```

Then query the `jobs` table to see them.

---

## 🔍 How to View All Outputs

### Method 1: Check Backend Logs (Real-time)

When you generate a learning path, watch your backend terminal:

```bash
# Terminal where you run: node server.js
📝 Executing Prompt 1: Skill Expansion
✅ Prompt 1 result: { "expanded_competencies_list": [...] }
📝 Executing Prompt 2: Competency Identification
✅ Prompt 2 result: { "competencies": [...] }
📝 Executing Prompt 3: Path Creation
✅ Prompt 3 result: { "learning_modules": [...] }
```

### Method 2: Query Database (Final Results)

**Get the complete learning path:**

```sql
-- View full learning path structure
SELECT 
  competency_target_name,
  user_id,
  learning_path
FROM courses
WHERE user_id = 'a1b2c3d4-e5f6-4789-a012-345678901234'
ORDER BY created_at DESC;
```

**View specific parts:**

```sql
-- View just the learning modules/steps
SELECT 
  competency_target_name,
  learning_path->'learningModules' as modules,
  learning_path->'pathSteps' as steps
FROM courses
WHERE competency_target_name = 'JavaScript Basics';

-- View path metadata (full Prompt 3 output)
SELECT 
  competency_target_name,
  learning_path->'metadata' as prompt3_full_output
FROM courses
WHERE competency_target_name = 'JavaScript Basics';
```

### Method 3: Use API Endpoint

```powershell
# Get all courses for a user (includes learning_path)
$response = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/courses/user/a1b2c3d4-e5f6-4789-a012-345678901234" -Method GET

# View the learning path structure
$response | ConvertTo-Json -Depth 10
```

### Method 4: Frontend Display

The frontend (`UserView.jsx`) displays the learning path. Check:
- Browser DevTools → Network tab → API responses
- Or view in the UI after loading a learning path

---

## 📊 What Each Prompt Output Contains

### Prompt 1 Output (Skill Expansion)
```json
{
  "request_id": "EXPANSION_REQ_001",
  "reasoning_summary": "...",
  "expanded_competencies_list": [
    {
      "competency_name": "Advanced Data Structures"
    },
    {
      "competency_name": "Production Debugging",
      "justification": "Essential for production environments"
    }
  ]
}
```

### Prompt 2 Output (Competency Identification)
```json
{
  "competencies": [
    "React Hooks",
    "TypeScript Fundamentals",
    "Node.js Backend Development"
  ]
}
```

### Prompt 3 Output (Path Creation) - **SAVED IN DATABASE**
```json
{
  "path_title": "JavaScript Fundamentals Mastery",
  "total_estimated_duration_hours": 40,
  "learning_modules": [
    {
      "module_number": 1,
      "module_title": "ES6 Basics",
      "steps": [
        {
          "step": 1,
          "title": "Introduction to ES6",
          "duration": "2 weeks",
          "resources": [...],
          "objectives": [...]
        }
      ]
    }
  ]
}
```

---

## 🛠️ Quick Access Commands

### View Latest Learning Path (PowerShell)

```powershell
# Get latest course for a user
$userId = "a1b2c3d4-e5f6-4789-a012-345678901234"
$courses = Invoke-RestMethod -Uri "http://localhost:5000/api/v1/courses/user/$userId" -Method GET

# View the first course's learning path
$courses[0].learning_path | ConvertTo-Json -Depth 10
```

### View in Supabase SQL Editor

```sql
-- Get full learning path with formatted JSON
SELECT 
  competency_target_name,
  user_id,
  jsonb_pretty(learning_path) as formatted_path
FROM courses
WHERE user_id = 'a1b2c3d4-e5f6-4789-a012-345678901234'
ORDER BY created_at DESC
LIMIT 1;
```

---

## 💡 Recommendation: Save All Prompt Outputs

To see Prompt 1 and Prompt 2 outputs, consider:

1. **Add to Job Table** - Store intermediate results in `jobs` table
2. **Add Logging** - Console.log all prompt outputs (see Method 1 above)
3. **Create Debug Endpoint** - Add `/api/v1/jobs/:jobId/debug` to return all prompt outputs

Would you like me to implement saving Prompt 1 and Prompt 2 outputs to the database?

---

## 📝 Summary

| Prompt | Output Location | How to View |
|--------|----------------|-------------|
| **Prompt 1** (Skill Expansion) | ❌ Not saved | Backend logs (if logging added) |
| **Prompt 2** (Competency Identification) | ❌ Not saved | Backend logs (if logging added) |
| **Prompt 3** (Path Creation) | ✅ **Database: `courses.learning_path`** | Supabase Dashboard, SQL, or API |

**The detailed learning path from Prompt 3 is saved in the `courses` table in the `learning_path` JSONB column!** ✅

