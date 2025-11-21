# Learning Path Update Mechanism

This document explains how learning paths are updated (not rebuilt) after exam failure.

## 🔄 Update vs. Create

### How It Works

The system uses **UPSERT** (Update or Insert) operation in the database:

1. **Primary Key**: `competency_target_name` is the primary key of the `courses` table
2. **UPSERT Logic**: 
   - If course with `competency_target_name` **exists** → **UPDATE** the existing record
   - If course with `competency_target_name` **doesn't exist** → **INSERT** (create) new record

### Implementation

**Location**: `backend/src/infrastructure/repositories/SupabaseRepository.js`

**Method**: `saveLearningPath(learningPath)`

```javascript
async saveLearningPath(learningPath) {
  const { data, error } = await this.client
    .from('courses')
    .upsert({
      competency_target_name: learningPath.competencyTargetName, // Primary key
      user_id: learningPath.userId,
      gap_id: learningPath.gapId || null,
      learning_path: pathData, // JSONB - contains full learning path structure
      approved: learningPath.status === 'completed',
      created_at: learningPath.createdAt,
      last_modified_at: learningPath.updatedAt
    }, {
      onConflict: 'competency_target_name' // If exists, update; if not, insert
    })
    .select()
    .single();
}
```

## 📊 What Gets Updated

When a learning path is updated after exam failure:

### Database Record (courses table)

| Field | Behavior |
|-------|----------|
| `competency_target_name` | **Unchanged** (primary key - identifies the course) |
| `user_id` | **Unchanged** (same learner) |
| `gap_id` | **May change** (links to updated skills gap) |
| `learning_path` (JSONB) | **Replaced** (new path structure with updated steps) |
| `approved` | **May change** (based on new approval status) |
| `created_at` | **Unchanged** (original creation time preserved) |
| `last_modified_at` | **Updated** (timestamp of the update) |

### Learning Path Structure (learning_path JSONB)

The entire `learning_path` JSONB field is **replaced** with the new structure:

**Before (Initial Path):**
```json
{
  "pathTitle": "React Development - Complete Course",
  "totalDurationHours": 120,
  "steps": [
    { "step": 1, "title": "React Basics", "duration": "2 weeks", ... },
    { "step": 2, "title": "React Hooks", "duration": "2 weeks", ... },
    { "step": 3, "title": "State Management", "duration": "2 weeks", ... },
    { "step": 4, "title": "Advanced Patterns", "duration": "2 weeks", ... },
    { "step": 5, "title": "Testing", "duration": "1 week", ... }
  ],
  "totalSteps": 5,
  "estimatedCompletion": "9 weeks"
}
```

**After (Updated Path - After Exam Failure):**
```json
{
  "pathTitle": "React Development - Focused Remediation",
  "totalDurationHours": 36,
  "steps": [
    { "step": 1, "title": "React Hooks Advanced", "duration": "1 week", ... },
    { "step": 2, "title": "Flexbox & Grid Systems", "duration": "1 week", ... },
    { "step": 3, "title": "Async/Await Patterns", "duration": "1 week", ... }
  ],
  "totalSteps": 3,
  "estimatedCompletion": "3 weeks"
}
```

**Key Changes:**
- ✅ **Shorter path** (3 steps instead of 5)
- ✅ **Focused content** (only skills learner still needs)
- ✅ **Reduced duration** (36 hours instead of 120)
- ✅ **Same competency_target_name** (identifies it as the same course)

## 🔍 Detection Logic

**Location**: `backend/src/application/useCases/GenerateLearningPathUseCase.js`

**How the system knows it's an update:**

```javascript
// Step 1: Check if course already exists
const existingCourse = await this.repository.getLearningPath(competencyTargetName);

// Step 2: Check if this is after exam failure
const examStatus = relevantGap.exam_status; // 'fail' or 'pass' or null

// Step 3: Determine if this is an update after failure
const isUpdateAfterFailure = existingCourse && examStatus === 'fail';
```

**Conditions for Update After Failure:**
1. ✅ Course exists (by `competency_target_name`)
2. ✅ `exam_status === 'fail'` in the skills gap

**If both are true:**
- Path is **updated** (not created)
- Approval workflow is **skipped**
- Automatically distributed to Course Builder

## 📝 Database Operation Flow

### Scenario 1: First Time (New Path)

```
1. Check: Course with competency_target_name = "React Development" exists?
   → NO

2. UPSERT Operation:
   → INSERT new record
   → Creates new course

3. Result:
   → New course created
   → Goes through approval workflow (if manual)
```

### Scenario 2: Update After Exam Failure

```
1. Check: Course with competency_target_name = "React Development" exists?
   → YES (from previous generation)

2. Check: exam_status === 'fail'?
   → YES (learner failed exam)

3. UPSERT Operation:
   → UPDATE existing record
   → Replaces learning_path JSONB
   → Updates last_modified_at timestamp
   → Keeps same competency_target_name (primary key)

4. Result:
   → Existing course updated
   → Approval workflow SKIPPED
   → Automatically distributed
```

## 🔑 Key Points

1. **Same Primary Key = Same Course**
   - `competency_target_name` is the identifier
   - Same name = update, different name = new course

2. **Full Replacement**
   - The entire `learning_path` JSONB is replaced
   - Not a partial update - complete new structure

3. **Preserved Fields**
   - `created_at` timestamp is preserved
   - `competency_target_name` stays the same
   - `user_id` stays the same

4. **Updated Fields**
   - `learning_path` JSONB (complete replacement)
   - `last_modified_at` timestamp (auto-updated by trigger)
   - `gap_id` (may link to new skills gap)

5. **No History**
   - Previous learning path structure is **not** saved
   - Only the latest version exists in the database
   - If you need history, you'd need a separate audit table

## 🗄️ Database Schema

**courses table:**
```sql
CREATE TABLE courses (
  competency_target_name TEXT PRIMARY KEY,  -- Primary key (identifies course)
  user_id UUID NOT NULL,                    -- Foreign key to learners
  gap_id UUID,                              -- Link to skills_gap
  learning_path JSONB NOT NULL,             -- Full path structure (replaced on update)
  approved BOOLEAN DEFAULT FALSE,           -- Approval status
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- Preserved on update
  last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()  -- Auto-updated
);
```

**Trigger for last_modified_at:**
```sql
CREATE TRIGGER trigger_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

This trigger automatically updates `last_modified_at` whenever a course is updated.

## 🔄 Complete Update Flow

```
1. Skills Engine sends exam failure
   ↓
2. ProcessSkillsGapUpdateUseCase updates skills_gap
   ↓
3. Learning path generation triggered
   ↓
4. GenerateLearningPathUseCase.processJob()
   ↓
5. Check: existingCourse exists?
   ↓
6. Check: examStatus === 'fail'?
   ↓
7. **Use SAME 3 Prompts (but with different input):**
   - Prompt 1: Skill Expansion (uses UPDATED skills_raw_data - only remaining skills)
   - Prompt 2: Competency Identification (uses Prompt 1 output)
   - Prompt 3: Path Creation (uses updated gap + expanded breakdown)
   ↓
8. Generate new path structure (focused on remaining skills)
   ↓
9. repository.saveLearningPath()
   ↓
10. UPSERT operation:
    - If exists: UPDATE learning_path JSONB
    - If not: INSERT new record
    ↓
11. If isUpdateAfterFailure:
    - Skip approval
    - Auto-distribute to Course Builder
```

## 🤖 Prompts Used for Updates

**Important:** The system uses the **SAME 3 prompts** for both creating new paths and updating existing paths after exam failure.

### The 3 Prompts

1. **prompt1-skill-expansion.txt**
   - Expands skills gap into competencies
   - **Input difference**: Uses updated `skills_raw_data` (only remaining skills after failure)
   - **Output**: Expanded competencies list

2. **prompt2-competency-identification.txt**
   - Identifies and extracts competency names
   - **Input**: Prompt 1 output (same for both new and update)
   - **Output**: Structured competency list

3. **prompt3-path-creation.txt**
   - Creates the learning path structure
   - **Input difference**: Uses updated initial gap (only remaining skills) + expanded breakdown
   - **Output**: Complete learning path with modules, steps, duration

### Key Difference: Input Data, Not Prompts

**For New Path (First Time):**
```
Input to Prompt 1:
- skills_raw_data: { ALL skills needed - 10 skills }
- Initial gap: Complete gap with all skills

Input to Prompt 3:
- initialGap: { All 10 skills }
- expandedBreakdown: { All competencies }
```

**For Update (After Exam Failure):**
```
Input to Prompt 1:
- skills_raw_data: { Only remaining skills - 3 skills }
- Initial gap: Filtered gap with only skills learner still needs

Input to Prompt 3:
- initialGap: { Only 3 remaining skills }
- expandedBreakdown: { Competencies for remaining skills }
```

### Why Same Prompts Work

The prompts are designed to be **data-driven**:
- They receive the skills gap as input
- They generate a path based on **what's in the input**
- If input has fewer skills → output has fewer modules/steps
- The prompts don't need to know if it's an update or new path

**Example:**
- Prompt 3 receives: `{ initialGap: [3 skills], expandedBreakdown: {...} }`
- Prompt 3 generates: Path with 3 focused modules
- Same prompt, different input = different output (shorter, focused path)

## 📚 Related Documentation

- [Exam Failure Flow](EXAM_FAILURE_FLOW.md) - Complete flow after exam failure
- [Project Flow](PROJECT_FLOW.md) - Overall system flow
- [Database Schema](../../database/migrations/init_schema_migration.sql) - Complete schema definition

---

**Last Updated:** 2025-01-20

