# Prompt Usage Implementation - Same Prompts, Different Inputs

This document shows exactly how the code uses the same prompts with different inputs for new paths vs. updates after exam failure.

## ✅ Implementation Confirmed

**Yes, the code is implemented exactly as described:**
- ✅ **Same 3 prompts** used for both new and update scenarios
- ✅ **Different input data** based on what's in the database
- ✅ **No conditional prompt loading** - always uses the same prompts

## 📍 Code Flow

### Step 1: Fetch Latest Data from Database

**Location**: `GenerateLearningPathUseCase.js` lines 90-114

```javascript
// Fetch the latest skills_raw_data from database (after Skills Engine update)
let skillsRawData = null;
let gapId = null;
let examStatus = null;

if (this.skillsGapRepository) {
  // Get the most recent skills gap for this user and competency
  const gaps = await this.skillsGapRepository.getSkillsGapsByUser(skillsGap.userId);
  const relevantGap = gaps.find(g => g.competency_target_name === competencyTargetName);
  
  if (relevantGap) {
    skillsRawData = relevantGap.skills_raw_data; // ← This is FILTERED (only remaining skills)
    examStatus = relevantGap.exam_status; // 'fail' or 'pass'
  }
}
```

**What happens:**
- **New Path**: `skillsRawData` might be `null` or contain all skills
- **Update After Failure**: `skillsRawData` contains **only remaining skills** (filtered by `ProcessSkillsGapUpdateUseCase`)

### Step 2: Prompt 1 - Always Same Prompt

**Location**: `GenerateLearningPathUseCase.js` lines 141-149

```javascript
// Prompt 1: Skill Expansion
// Use updated skills_raw_data from database if available, otherwise use request data
const prompt1 = await this.promptLoader.loadPrompt('prompt1-skill-expansion'); // ← ALWAYS SAME
const prompt1Input = this._formatSkillsGapForPrompt(skillsGap, skillsRawData); // ← DIFFERENT INPUT
const fullPrompt1 = prompt1.replace('{input}', prompt1Input);
const prompt1Result = await this.geminiClient.executePrompt(fullPrompt1, '', {
  timeout: 60000,
  maxRetries: 3
});
```

**Key Points:**
- ✅ Always loads `'prompt1-skill-expansion'` (same file)
- ✅ Input differs: `_formatSkillsGapForPrompt()` uses `skillsRawData` from database
- ✅ If `skillsRawData` exists → uses filtered data (update scenario)
- ✅ If `skillsRawData` is null → uses request data (new scenario)

### Step 3: Format Input Method

**Location**: `GenerateLearningPathUseCase.js` lines 408-430

```javascript
_formatSkillsGapForPrompt(skillsGap, skillsRawData = null) {
  const competencyTargetName = skillsGap.competencyTargetName;
  
  // If we have updated skills_raw_data from database, use that
  if (skillsRawData) {
    return JSON.stringify({
      skills_raw_data: skillsRawData, // ← FILTERED DATA (only remaining skills)
      context: {
        userId: skillsGap.userId,
        competencyTargetName: competencyTargetName
      }
    }, null, 2);
  }
  
  // Fallback to request data (for backward compatibility)
  return JSON.stringify({
    microSkills: skillsGap.microSkills || [],
    nanoSkills: skillsGap.nanoSkills || [],
    context: {
      userId: skillsGap.userId,
      competencyTargetName: competencyTargetName
    }
  }, null, 2);
}
```

**Logic:**
- **If `skillsRawData` exists** (from database) → Use it (filtered data for updates)
- **If `skillsRawData` is null** → Use request data (new path scenario)

### Step 4: Prompt 2 - Always Same Prompt

**Location**: `GenerateLearningPathUseCase.js` lines 191-204

```javascript
const prompt2 = await this.promptLoader.loadPrompt('prompt2-competency-identification'); // ← ALWAYS SAME
const prompt2Input = /* Format Prompt 1 result */; // ← Input depends on Prompt 1 output
const fullPrompt2 = prompt2.replace('{input}', prompt2Input);
const prompt2Result = await this.geminiClient.executePrompt(fullPrompt2, '', {
  timeout: 60000,
  maxRetries: 3
});
```

**Key Points:**
- ✅ Always loads `'prompt2-competency-identification'` (same file)
- ✅ Input is based on Prompt 1 output (which already reflects filtered data)

### Step 5: Prompt 3 - Always Same Prompt

**Location**: `GenerateLearningPathUseCase.js` lines 281-298

```javascript
// Use longer timeout for path creation as it generates complex structured output
const prompt3 = await this.promptLoader.loadPrompt('prompt3-path-creation'); // ← ALWAYS SAME

const expandedBreakdownForPrompt3 = {
  competencies: prompt2OutputFromDB, // From Prompt 2 (already filtered)
  skillBreakdown: skillBreakdown // From Skills Engine
};

const fullPrompt3 = prompt3
  .replace('{initialGap}', JSON.stringify(skillsGap.toJSON(), null, 2)) // ← Uses filtered gap
  .replace('{expandedBreakdown}', JSON.stringify(expandedBreakdownForPrompt3, null, 2));
  
const prompt3Result = await this.geminiClient.executePrompt(fullPrompt3, '', {
  timeout: 90000,
  maxRetries: 3
});
```

**Key Points:**
- ✅ Always loads `'prompt3-path-creation'` (same file)
- ✅ `{initialGap}` contains filtered data (from `skillsGap.toJSON()`)
- ✅ `{expandedBreakdown}` contains competencies based on filtered skills

### Step 6: Check for Update (Only for Approval Workflow)

**Location**: `GenerateLearningPathUseCase.js` lines 317-319

```javascript
// Check if this is an update after exam failure (course already exists + exam_status is 'fail')
const existingCourse = await this.repository.getLearningPath(competencyTargetName);
const isUpdateAfterFailure = existingCourse && examStatus === 'fail';
```

**Important:** This check happens **AFTER** all prompts are executed. It's only used for:
- Skipping approval workflow
- Not for changing which prompts to use

## 🔍 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│              LEARNING PATH GENERATION                   │
│         (Same for New Path and Update)                  │
└─────────────────────────────────────────────────────────┘

1. Fetch Latest Data from Database
   ↓
   ├─> New Path: skillsRawData = null or all skills
   └─> Update: skillsRawData = filtered (only remaining skills)
   
2. Load Prompt 1: 'prompt1-skill-expansion' ← ALWAYS SAME
   ↓
   Format Input: _formatSkillsGapForPrompt(skillsGap, skillsRawData)
   ↓
   ├─> New Path: Uses request data (all skills)
   └─> Update: Uses skillsRawData from DB (filtered skills)
   
3. Execute Prompt 1
   ↓
   Output: Expanded competencies (based on input)
   ↓
   ├─> New Path: Competencies for all skills
   └─> Update: Competencies for remaining skills only
   
4. Load Prompt 2: 'prompt2-competency-identification' ← ALWAYS SAME
   ↓
   Input: Prompt 1 output (already reflects filtered data)
   ↓
5. Execute Prompt 2
   ↓
   Output: Competency list
   
6. Request Skills Engine Breakdown
   ↓
   Input: Competencies from Prompt 2
   ↓
   Output: Micro/Nano skill breakdown
   
7. Load Prompt 3: 'prompt3-path-creation' ← ALWAYS SAME
   ↓
   Format Input:
   - {initialGap}: skillsGap.toJSON() (filtered if update)
   - {expandedBreakdown}: Competencies + breakdown
   ↓
8. Execute Prompt 3
   ↓
   Output: Learning path structure
   ↓
   ├─> New Path: Full path (all skills)
   └─> Update: Focused path (remaining skills)
   
9. Save to Database (UPSERT)
   ↓
   ├─> New Path: INSERT new record
   └─> Update: UPDATE existing record
   
10. Check Approval (ONLY HERE - not for prompts)
    ↓
    ├─> New Path: Normal approval workflow
    └─> Update After Failure: Skip approval
```

## 📊 Comparison: New vs. Update

| Aspect | New Path | Update After Failure |
|--------|----------|---------------------|
| **Prompt 1 File** | `prompt1-skill-expansion.txt` | `prompt1-skill-expansion.txt` ✅ Same |
| **Prompt 1 Input** | All skills (from request) | Filtered skills (from DB) |
| **Prompt 2 File** | `prompt2-competency-identification.txt` | `prompt2-competency-identification.txt` ✅ Same |
| **Prompt 2 Input** | Prompt 1 output (all competencies) | Prompt 1 output (filtered competencies) |
| **Prompt 3 File** | `prompt3-path-creation.txt` | `prompt3-path-creation.txt` ✅ Same |
| **Prompt 3 Input** | Full gap + all competencies | Filtered gap + filtered competencies |
| **Prompt 3 Output** | Full path (10 steps) | Focused path (3 steps) |
| **Database Operation** | INSERT | UPDATE |
| **Approval Workflow** | Normal (manual/auto) | SKIPPED |

## 🔑 Key Implementation Details

### 1. No Conditional Prompt Loading

**There is NO code like this:**
```javascript
// ❌ THIS DOES NOT EXIST
if (isUpdateAfterFailure) {
  prompt = await this.promptLoader.loadPrompt('prompt3-path-update'); // Different prompt
} else {
  prompt = await this.promptLoader.loadPrompt('prompt3-path-creation'); // Different prompt
}
```

**Instead, it's always:**
```javascript
// ✅ ALWAYS THE SAME
const prompt3 = await this.promptLoader.loadPrompt('prompt3-path-creation');
```

### 2. Data-Driven Approach

The prompts are **data-driven**:
- They receive input data
- They generate output based on input
- Same prompt + different input = different output

### 3. Filtering Happens Before Prompts

The filtering of skills happens in `ProcessSkillsGapUpdateUseCase`:
- Skills Engine sends updated gap
- System filters `skills_raw_data` (removes skills learner knows)
- Filtered data is saved to database
- When prompts run, they fetch this filtered data

### 4. Update Detection is Separate

The `isUpdateAfterFailure` check happens **after** prompts execute:
- It's only used for approval workflow
- It doesn't affect which prompts are used
- It doesn't affect prompt inputs (those are already filtered)

## ✅ Summary

**Yes, the code is implemented exactly as described:**

1. ✅ **Always uses same 3 prompts** (no conditional loading)
2. ✅ **Fetches latest data from database** (which is filtered for updates)
3. ✅ **Uses filtered data as input** to prompts (via `_formatSkillsGapForPrompt`)
4. ✅ **Prompts generate different output** based on input (fewer skills → shorter path)
5. ✅ **Update detection** only affects approval workflow, not prompts

The implementation is clean, data-driven, and works as expected! 🎯

---

**Last Updated:** 2025-01-20

