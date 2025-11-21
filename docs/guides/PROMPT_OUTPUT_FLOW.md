# Prompt Output Flow - Database Storage

This document describes how the three Gemini prompts save their outputs to the database.

---

## 📊 Flow Overview

```
1. Prompt 1 (Skill Expansion)
   └─> Executes with skills_raw_data
   └─> Saves output to: skills_expansions.prompt_1_output

2. Prompt 2 (Competency Identification)
   └─> Reads from: skills_expansions.prompt_1_output
   └─> Executes
   └─> Saves output to: skills_expansions.prompt_2_output

3. Skills Engine Integration
   └─> Uses competencies from prompt_2_output
   └─> Returns micro/nano skills breakdown

4. Prompt 3 (Path Creation)
   └─> Reads from: skills_expansions.prompt_2_output
   └─> Uses skillBreakdown from Skills Engine
   └─> Executes
   └─> Saves output to: courses.learning_path (for user_id + competency_target_name)
```

---

## 🗄️ Database Tables

### 1. `skills_expansions` Table

Stores Prompt 1 and Prompt 2 outputs, linked to the original skills gap and user:

| Column | Type | Description |
|--------|------|-------------|
| `expansion_id` | UUID | Primary key (auto-generated) |
| `gap_id` | UUID | Links to `skills_gap.gap_id` (nullable) |
| `user_id` | UUID | Links to `learners.user_id` (required) |
| `prompt_1_output` | JSONB | Prompt 1 result (expanded skills) |
| `prompt_2_output` | JSONB | Prompt 2 result (competencies for Skills Engine) |
| `created_at` | TIMESTAMP | Record creation time |
| `last_modified_at` | TIMESTAMP | Last update time |

**Example `prompt_1_output`:**
```json
{
  "expanded_competencies_list": [
    {
      "competency_name": "JavaScript Fundamentals",
      "justification": "Essential for web development"
    }
  ]
}
```

**Example `prompt_2_output`:**
```json
{
  "competencies_for_skills_engine_processing": [
    {
      "competency_name": "JavaScript Fundamentals",
      "example_query_to_send": "For the competency named 'JavaScript Fundamentals', check the database for an existing Micro and Nano Skill taxonomy..."
    }
  ]
}
```

---

### 2. `courses` Table

Stores Prompt 3 output (final learning path):

| Column | Type | Description |
|--------|------|-------------|
| `competency_target_name` | TEXT | Primary key (competency name) |
| `user_id` | UUID | Foreign key to learners |
| `learning_path` | JSONB | **Prompt 3 output** (complete learning path) |
| `approved` | BOOLEAN | Approval status |
| `created_at` | TIMESTAMP | Record creation time |
| `last_modified_at` | TIMESTAMP | Last update time |

**Example `learning_path` (Prompt 3 output):**
```json
{
  "path_title": "Personalized Mastery Path for Developer to JavaScript Expert",
  "learner_id": "a1b2c3d4-e5f6-4789-a012-345678901234",
  "total_estimated_duration_hours": 20,
  "learning_modules": [
    {
      "module_order": 1,
      "module_title": "Module 1: JavaScript Fundamentals",
      "estimated_duration_hours": 5,
      "focus_micro_skills": ["Variables", "Functions"],
      "learning_goals": ["Master basic JavaScript syntax"],
      "suggested_content_sequence": [...]
    }
  ]
}
```

---

## 🔄 Implementation Details

### Step 1: Create Skills Expansion Record

When learning path generation starts, a new `skills_expansion` record is created:

```javascript
// Get gap_id from the skills gap (if available)
const gaps = await skillsGapRepository.getSkillsGapsByUser(userId);
const relevantGap = gaps.find(g => g.competency_target_name === competencyTargetName);
const gapId = relevantGap?.gap_id || null;

const expansionId = uuidv4();
await skillsExpansionRepository.createSkillsExpansion({
  expansion_id: expansionId,
  gap_id: gapId, // Links to original skills gap (nullable)
  user_id: userId, // Links to learner (required)
  prompt_1_output: null,
  prompt_2_output: null
});
```

---

### Step 2: Execute Prompt 1 and Save

```javascript
// Execute Prompt 1
const prompt1Result = await geminiClient.executePrompt(fullPrompt1);

// Save to skills_expansions.prompt_1_output
await skillsExpansionRepository.updateSkillsExpansion(expansionId, {
  prompt_1_output: prompt1Result
});
```

---

### Step 3: Execute Prompt 2 (Using Prompt 1 from DB)

```javascript
// Read Prompt 1 output from database
const savedExpansion = await skillsExpansionRepository.getSkillsExpansionById(expansionId);
const prompt1OutputFromDB = savedExpansion.prompt_1_output;

// Use prompt_1_output for Prompt 2 input
const prompt2Input = formatPrompt1ForPrompt2(prompt1OutputFromDB);

// Execute Prompt 2
const prompt2Result = await geminiClient.executePrompt(fullPrompt2);

// Save to skills_expansions.prompt_2_output
await skillsExpansionRepository.updateSkillsExpansion(expansionId, {
  prompt_2_output: prompt2Result
});
```

---

### Step 4: Execute Prompt 3 (Using Prompt 2 from DB)

```javascript
// Read Prompt 2 output from database
const savedExpansion = await skillsExpansionRepository.getSkillsExpansionById(expansionId);
const prompt2OutputFromDB = savedExpansion.prompt_2_output;

// Get skill breakdown from Skills Engine
const skillBreakdown = await skillsEngineClient.requestSkillBreakdown(competencies);

// Use prompt_2_output + skillBreakdown for Prompt 3
const expandedBreakdownForPrompt3 = {
  competencies: prompt2OutputFromDB, // From prompt_2_output
  skillBreakdown: skillBreakdown // From Skills Engine
};

// Execute Prompt 3
const prompt3Result = await geminiClient.executePrompt(fullPrompt3);

// Save to courses.learning_path
await courseRepository.createCourse({
  competency_target_name: competencyTargetName,
  user_id: userId,
  learning_path: prompt3Result // Prompt 3 output saved here
});
```

---

## 🔍 Viewing the Outputs

### View Prompt 1 Output

```sql
SELECT 
  expansion_id,
  gap_id,
  user_id,
  prompt_1_output,
  created_at
FROM skills_expansions
ORDER BY created_at DESC
LIMIT 1;
```

### View Prompt 2 Output

```sql
SELECT 
  expansion_id,
  gap_id,
  user_id,
  prompt_2_output,
  last_modified_at
FROM skills_expansions
ORDER BY last_modified_at DESC
LIMIT 1;
```

### View All Expansions for a User

```sql
SELECT 
  expansion_id,
  gap_id,
  prompt_1_output,
  prompt_2_output,
  created_at
FROM skills_expansions
WHERE user_id = 'a1b2c3d4-e5f6-4789-a012-345678901234'
ORDER BY created_at DESC;
```

### View Expansions for a Specific Gap

```sql
SELECT 
  expansion_id,
  user_id,
  prompt_1_output,
  prompt_2_output
FROM skills_expansions
WHERE gap_id = '550e8400-e29b-41d4-a716-446655440000'
ORDER BY created_at DESC;
```

### View Prompt 3 Output (Learning Path)

```sql
SELECT 
  competency_target_name,
  user_id,
  learning_path,
  approved,
  created_at
FROM courses
WHERE user_id = 'a1b2c3d4-e5f6-4789-a012-345678901234'
ORDER BY created_at DESC;
```

---

## ✅ Benefits

1. **Traceability**: All prompt outputs are saved and can be reviewed
2. **Debugging**: Easy to see what each prompt generated
3. **Reproducibility**: Can re-run prompts using saved outputs
4. **Data Flow**: Clear chain from Prompt 1 → Prompt 2 → Prompt 3
5. **Audit Trail**: Track when each prompt was executed

---

## 🔗 Related Files

- `backend/src/application/useCases/GenerateLearningPathUseCase.js` - Main implementation
- `backend/src/infrastructure/repositories/SkillsExpansionRepository.js` - Database operations
- `backend/src/infrastructure/repositories/CourseRepository.js` - Learning path storage
- `database/migrations/init_schema_migration.sql` - Table schemas

---

**All prompt outputs are now properly saved and linked!** ✅

