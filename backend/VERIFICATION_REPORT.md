# Verification Report: Skills Engine Lowest Layer Flow

## User Requirements

1. **Initial Gap from Skills Engine:** When Skills Engine sends a gap for a specific learner with a specific competency, we should get a list of skills that are in the **LOWEST LAYER** of that competency's hierarchy (as Skills Engine builds it).

2. **Expanded Competencies:** When we make expansions of competencies using prompts, we send those competencies to Skills Engine to ask for the list of skills that are in the **LOWEST LAYER** of that competency's hierarchy (as Skills Engine builds it).

3. **Prompt 3 Input:** All of these skills (from both sources) should be sent as input to the third prompt.

---

## Current Implementation Verification

### ✅ 1. Initial Gap from Skills Engine (LOWEST LAYER)

**Status:** ✅ **CORRECT** - But needs verification

**Flow:**
1. Skills Engine sends `gap` field with micro/nano skills (lowest layer)
2. Stored in `skills_gap.skills_raw_data` as JSONB
3. Retrieved from database: `skillsRawData = relevantGap.skills_raw_data` (line 109)
4. Used for Prompt 1: `_formatSkillsGapForPrompt(skillsGap, skillsRawData)` (line 200)

**Issue Found:**
- For Prompt 3, we use `skillsGap.toJSON()` (line 412) which returns:
  ```javascript
  {
    userId: this.userId,
    companyId: this.companyId,
    competencyTargetName: this.competencyTargetName,
    microSkills: this.microSkills,  // From entity, not from skills_raw_data
    nanoSkills: this.nanoSkills,    // From entity, not from skills_raw_data
    receivedAt: this.receivedAt
  }
  ```
- **Problem:** The SkillsGap entity might not have `microSkills` and `nanoSkills` populated from `skills_raw_data`
- **Solution Needed:** Use `skillsRawData` directly for Prompt 3 instead of `skillsGap.toJSON()`

**Location:**
- `backend/src/api/routes/skillsGaps.js` - Receives gap from Skills Engine
- `backend/src/application/useCases/ProcessSkillsGapUpdateUseCase.js` - Processes gap (saves to `skills_raw_data`)
- `backend/src/application/useCases/GenerateLearningPathUseCase.js` - Uses gap for prompts

---

### ✅ 2. Requesting Breakdown for Expanded Competencies (LOWEST LAYER)

**Status:** ✅ **CORRECT** - Updated to explicitly request lowest layer

**Flow:**
1. After Prompt 2, extract competencies
2. Call `skillsEngineClient.requestSkillBreakdown(competencies, { includeExpansions: true })`
3. Skills Engine returns breakdown with `microSkills` and `nanoSkills` (lowest layer)

**Request Format (Updated):**
```json
{
  "competencies": ["Competency_Name_1", "Competency_Name_2"],
  "level": "lowest",
  "include_expansions": true,
  "granularity": "nano"
}
```

**Location:**
- `backend/src/infrastructure/clients/SkillsEngineClient.js` - Requests lowest layer
- `backend/src/application/useCases/GenerateLearningPathUseCase.js` - Calls requestSkillBreakdown (line 288)

---

### ⚠️ 3. Combining for Prompt 3

**Status:** ⚠️ **NEEDS FIX** - Initial gap not using lowest layer from `skills_raw_data`

**Current Implementation:**
```javascript
// Line 412: Uses skillsGap.toJSON() - might not have lowest layer skills
const fullPrompt3 = prompt3
  .replace('{initialGap}', JSON.stringify(skillsGap.toJSON(), null, 2))
  .replace('{expandedBreakdown}', JSON.stringify(expandedBreakdownForPrompt3, null, 2));
```

**Problem:**
- `skillsGap.toJSON()` returns `microSkills` and `nanoSkills` from the entity
- But the entity might not be populated with the lowest layer skills from `skills_raw_data`
- We should use `skillsRawData` (from database) which contains the actual lowest layer skills

**Solution:**
- Use `skillsRawData` directly for `{initialGap}` in Prompt 3
- Format it properly to include the lowest layer skills

**Location:**
- `backend/src/application/useCases/GenerateLearningPathUseCase.js` - Line 412

---

## Required Fixes

### Fix 1: Use `skillsRawData` for Prompt 3 Initial Gap

**File:** `backend/src/application/useCases/GenerateLearningPathUseCase.js`

**Current Code (Line 412):**
```javascript
const fullPrompt3 = prompt3
  .replace('{initialGap}', JSON.stringify(skillsGap.toJSON(), null, 2))
  .replace('{expandedBreakdown}', JSON.stringify(expandedBreakdownForPrompt3, null, 2));
```

**Fixed Code:**
```javascript
// Format initial gap using skills_raw_data (lowest layer) from database
const initialGapForPrompt3 = skillsRawData 
  ? {
      userId: skillsGap.userId,
      companyId: skillsGap.companyId,
      competencyTargetName: skillsGap.competencyTargetName,
      skills_raw_data: skillsRawData  // Use lowest layer from database
    }
  : skillsGap.toJSON(); // Fallback if skillsRawData not available

const fullPrompt3 = prompt3
  .replace('{initialGap}', JSON.stringify(initialGapForPrompt3, null, 2))
  .replace('{expandedBreakdown}', JSON.stringify(expandedBreakdownForPrompt3, null, 2));
```

---

## Summary

| Requirement | Status | Notes |
|------------|--------|-------|
| 1. Initial gap contains lowest layer | ⚠️ **NEEDS FIX** | Stored correctly in `skills_raw_data`, but Prompt 3 uses `skillsGap.toJSON()` instead |
| 2. Expanded competencies request lowest layer | ✅ **CORRECT** | Updated to explicitly request with `level: "lowest"`, `include_expansions: true` |
| 3. Both sources sent to Prompt 3 | ⚠️ **NEEDS FIX** | Expanded breakdown is correct, but initial gap needs to use `skillsRawData` |

---

## Next Steps

1. ✅ Update `SkillsEngineClient` to request lowest layer (DONE)
2. ⚠️ Fix Prompt 3 to use `skillsRawData` for initial gap (NEEDED)
3. ✅ Verify expanded breakdown uses lowest layer (DONE)

---

**Last Updated:** 2025-01-XX
**Status:** ⚠️ Needs Fix for Initial Gap in Prompt 3

