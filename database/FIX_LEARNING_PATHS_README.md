# Fix Missing Learning Paths in Company Dashboard

If you're seeing learning paths in the Company Dashboard but they don't show the full content (modules, steps, etc.), the `learning_path` JSONB field in the `courses` table is likely NULL or empty.

## Quick Fix

Run this SQL file in Supabase SQL Editor:

**`update_learning_paths.sql`** - This will update existing courses with full learning path content.

## Diagnostic Steps

### Step 1: Check What's in the Database

Run `check_learning_paths.sql` to see:
- Which courses have learning paths
- Which courses have NULL/empty learning paths
- Module counts for each course

### Step 2: Fix Missing Learning Paths

**Option A: Update Existing Courses (Recommended)**
```sql
-- Run: update_learning_paths.sql
```
This updates courses that exist but have NULL/empty `learning_path` fields.

**Option B: Re-run Complete Workflow SQL**
```sql
-- Run: complete_workflow_example.sql
```
This will insert/update all courses with full learning path data using `ON CONFLICT DO UPDATE`.

### Step 3: Verify

After running the fix, verify with:
```sql
SELECT 
  competency_target_name,
  learning_path->>'pathTitle' as title,
  jsonb_array_length(COALESCE(learning_path->'learning_modules', '[]'::jsonb)) as modules_count
FROM courses
WHERE user_id = 'a1b2c3d4-e5f6-4789-a012-345678901234';
```

You should see:
- `title`: The learning path title
- `modules_count`: Number of modules (should be 3-4 for each course)

## Why This Happens

1. **Courses created without learning paths** - If courses were created before the workflow completed
2. **SQL file not run** - The `complete_workflow_example.sql` file wasn't executed
3. **ON CONFLICT didn't update** - If courses existed, the conflict handler might not have updated the `learning_path` field

## After Fixing

1. Refresh the Company Dashboard in your browser
2. Click on a user to view their learning paths
3. You should now see:
   - Full module titles
   - Module descriptions
   - Subtopics for each module
   - Complete learning path timeline


