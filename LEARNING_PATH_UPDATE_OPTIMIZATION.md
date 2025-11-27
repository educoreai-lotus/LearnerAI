# Learning Path Update Optimization

## Problem
Currently, when updating an existing learning path (user_id + competency_target_name), the system regenerates everything:
- Prompt 1: Skill Expansion
- Prompt 2: Competency Identification  
- Prompt 3: Path Creation

This is inefficient when we only want to:
- Update the learning path
- Remove finished skills
- Keep existing expansions

## Solution: Smart Update Detection ✅ IMPLEMENTED

### Detection Logic
1. Check if learning path exists (by competency_target_name)
2. Check if skills_expansions exist for this gap/user (with both prompt_1_output and prompt_2_output)
3. If both exist → **Update Mode** (skip Prompts 1 & 2)
4. If either missing → **Full Generation Mode** (run all 3 prompts)

### Update Mode Flow
```
1. Get existing learning path ✅
2. Check if skills_expansions exist (to detect update mode) ✅
3. Get updated skills gap (with finished skills removed) ✅
4. Use existing Prompt 1 & 2 outputs (preserves competencies - no new ones added) ✅
5. Get skill breakdown from Skills Engine (for all existing competencies) ✅
6. Filter skill breakdown to only include skills in remaining gap ✅
7. Filter competencies to only those with remaining skills ✅
8. Filter Prompt 2 output to match filtered competencies ✅
9. Run Prompt 3 with:
   - Updated initial gap (filtered skills)
   - Filtered prompt_2_output (only competencies with remaining skills)
   - Filtered skill breakdown (only remaining skills)
10. Update learning path ✅
```

**Why filter instead of regenerate?**
- ✅ **Preserves existing competencies** (no new ones added - true update)
- ✅ **Only removes finished skills** (filters out competencies for finished skills)
- ✅ **Faster** (no Prompt 1 & 2 regeneration - saves ~2 minutes)
- ✅ **Cost-effective** (fewer AI calls)
- ✅ **True update** (not regeneration - only removes what's finished)

### Implementation Details

**File: `GenerateLearningPathUseCase.js`**

The `processJob` method now:
1. **Checks for update mode** at the beginning:
   ```javascript
   const existingCourse = await this.repository.getLearningPathById(competencyTargetName);
   if (existingCourse && gapId && this.skillsExpansionRepository) {
     existingExpansion = await this.skillsExpansionRepository.getLatestSkillsExpansionByUserAndGap(
       skillsGap.userId, gapId
     );
     if (existingExpansion && existingExpansion.prompt_1_output && existingExpansion.prompt_2_output) {
       isUpdateMode = true; // Skip Prompts 1 & 2
     }
   }
   ```

2. **Skips Prompts 1 & 2** when in update mode:
   - Uses `existingExpansion.prompt_1_output` and `existingExpansion.prompt_2_output`
   - Extracts competencies from existing Prompt 2 output
   - Jumps directly to skill breakdown

3. **Runs Prompt 3** with updated gap:
   - Uses filtered skills (finished skills removed)
   - Uses existing competencies
   - Generates updated learning path structure

### Benefits
- ✅ **Preserves existing competencies** (no new ones added - true update)
- ✅ **Only removes finished skills** (filters out competencies for finished skills)
- ✅ **Faster** (no Prompt 1 & 2 regeneration - saves ~2 minutes)
- ✅ **Cost-effective** (fewer AI calls)
- ✅ **True update** (not regeneration - only removes what's finished)
- ✅ **Automatic detection** (no manual flags needed)

### How Filtering Works

**The Problem:**
- Old Prompt 1/2 outputs contain competencies for ALL original skills (including finished ones)
- Updated gap has finished skills removed
- If we reuse old outputs, Prompt 3 gets competencies for skills that are already finished

**The Solution:**
1. **Use existing expansions** (don't regenerate - preserves competencies)
2. **Get skill breakdown** from Skills Engine for all existing competencies
3. **Filter skill breakdown** to only include skills in the updated gap
4. **Filter competencies** to only those that have skills in the filtered breakdown
5. **Filter Prompt 2 output** to match filtered competencies
6. **Regenerate Prompt 3** with filtered data (ensures path matches remaining skills)

**Result:**
- ✅ No new competencies added (uses existing ones)
- ✅ Only competencies with remaining skills are kept
- ✅ Prompt 3 receives accurate data (no finished skills)

### When Update Mode is Used

**Update Mode is triggered when:**
- ✅ Learning path exists (by `competency_target_name`)
- ✅ Skills gap exists (by `user_id` + `competency_target_name`)
- ✅ Skills expansion exists with both `prompt_1_output` and `prompt_2_output`

**What Update Mode Does:**
- ✅ Uses existing Prompt 1 & 2 outputs (preserves competencies - no new ones)
- ✅ Gets skill breakdown from Skills Engine for existing competencies
- ✅ Filters skill breakdown to only include skills in remaining gap
- ✅ Filters competencies to only those with remaining skills
- ✅ Regenerates Prompt 3 with filtered data (ensures path matches remaining skills)
- ✅ Updates learning path (removes finished skills, keeps existing competencies)

**Full Generation Mode is used when:**
- ❌ Learning path doesn't exist (first time)
- ❌ Skills expansion doesn't exist
- ❌ Skills expansion is incomplete (missing prompt outputs)

### Example Scenarios

**Scenario 1: First Time (Full Generation)**
```
User: New user
Competency: "React Basics"
Result: Runs all 3 prompts, creates new path
```

**Scenario 2: Update with Finished Skills (Update Mode)**
```
User: Existing user
Competency: "React Basics" (path exists)
Gap: Updated (finished skills removed)
Expansions: Exist with prompt_1_output and prompt_2_output
Result: Uses existing expansions, filters competencies, runs Prompt 3 with filtered data
Reason: Preserves existing competencies, only removes those for finished skills
```

**Scenario 3: Update but No Expansions (Full Generation)**
```
User: Existing user
Competency: "React Basics" (path exists)
Gap: Updated
Expansions: Don't exist or incomplete
Result: Runs all 3 prompts (creates new expansions)
```

