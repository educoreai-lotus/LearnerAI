# Skills Engine - Lowest Layer (Expansions) Request Update

## 📋 Summary

Updated the codebase to **explicitly request the lowest layer (expansions competencies)** from Skills Engine when requesting skill breakdown for competencies. This ensures that for each competency, we get the micro/nano skills from the lowest layer, including expansions.

---

## ✅ Changes Made

### 1. **SkillsEngineClient.js** - Updated Request Format

**File:** `backend/src/infrastructure/clients/SkillsEngineClient.js`

**Changes:**
- Added explicit parameters to request lowest layer (expansions):
  - `level: "lowest"` - Request lowest layer
  - `include_expansions: true` - Include expansions competencies
  - `granularity: "nano"` - Request nano-level granularity (most detailed)
- Added `includeExpansions` option (default: `true`) to the `requestSkillBreakdown` method
- Updated documentation to clarify that we explicitly request expansions competencies

**Request Body (Before):**
```json
{
  "competencies": ["Competency_Name_1", "Competency_Name_2"]
}
```

**Request Body (After):**
```json
{
  "competencies": ["Competency_Name_1", "Competency_Name_2"],
  "level": "lowest",
  "include_expansions": true,
  "granularity": "nano"
}
```

### 2. **GenerateLearningPathUseCase.js** - Explicit Expansions Request

**File:** `backend/src/application/useCases/GenerateLearningPathUseCase.js`

**Changes:**
- Updated call to `requestSkillBreakdown` to explicitly pass `includeExpansions: true`
- Added logging to indicate we're requesting lowest layer/expansions

**Code:**
```javascript
skillBreakdown = await this.skillsEngineClient.requestSkillBreakdown(competencies, {
  maxRetries: 3,
  retryDelay: 1000,
  useMockData: false,
  includeExpansions: true // Explicitly request lowest layer (expansions competencies)
});
```

---

## 🔍 All Micro/Nano Skills Usage Locations

### ✅ **SkillsEngineClient.js** - **UPDATED**
- **Purpose:** Requests skill breakdown from Skills Engine
- **Status:** ✅ Now explicitly requests lowest layer (expansions)
- **Location:** `backend/src/infrastructure/clients/SkillsEngineClient.js`

### ✅ **GenerateLearningPathUseCase.js** - **UPDATED**
- **Purpose:** Uses skill breakdown for learning path generation
- **Status:** ✅ Now explicitly requests expansions when calling Skills Engine
- **Location:** `backend/src/application/useCases/GenerateLearningPathUseCase.js`

### ✅ **ProcessSkillsGapUpdateUseCase.js** - **NO CHANGE NEEDED**
- **Purpose:** Processes incoming skills gap updates (receives data, doesn't request)
- **Status:** ✅ No change needed - receives micro/nano skills from Skills Engine
- **Location:** `backend/src/application/useCases/ProcessSkillsGapUpdateUseCase.js`

### ✅ **Skills Gap Routes** - **NO CHANGE NEEDED**
- **Purpose:** Receives skills gaps from Skills Engine (doesn't request breakdown)
- **Status:** ✅ No change needed - receives lowest layer data from Skills Engine
- **Location:** `backend/src/api/routes/skillsGaps.js`

### ✅ **Learning Path Routes** - **NO CHANGE NEEDED**
- **Purpose:** Receives micro/nano skills in request body (doesn't request from Skills Engine)
- **Status:** ✅ No change needed - receives data from client
- **Location:** `backend/src/api/routes/learningPaths.js`

---

## 📊 Skills Hierarchy

```
Competency (Highest Level)
  └─> Micro Skills (Mid Level)
      └─> Nano Skills (Lowest Level)
```

**Key Point:** 
- The **initial skills gap** contains the **lowest layer** (nano/micro skills)
- When requesting breakdown for **expanded competencies**, we now **explicitly request the lowest layer (expansions)** to ensure consistency

---

## 🎯 What This Ensures

1. **Consistency:** Both initial gap and expanded breakdown are at the same granularity level (lowest layer)
2. **Completeness:** We get all micro/nano skills for each competency, including expansions
3. **Explicit Request:** No ambiguity - we explicitly tell Skills Engine we want the lowest layer
4. **Expansions Support:** We get the lowest layer for both base competencies and their expansions

---

## 🔄 Request Flow

### Before Update:
```
LearnerAI → Skills Engine: { competencies: [...] }
Skills Engine → LearnerAI: { microSkills: [...], nanoSkills: [...] }
```
❓ **Unclear if lowest layer/expansions are included**

### After Update:
```
LearnerAI → Skills Engine: {
  competencies: [...],
  level: "lowest",
  include_expansions: true,
  granularity: "nano"
}
Skills Engine → LearnerAI: { microSkills: [...], nanoSkills: [...] }
```
✅ **Explicitly requests lowest layer (expansions)**

---

## 📝 API Parameters

The Skills Engine API now receives these parameters:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `competencies` | Array<string> | ✅ Yes | Array of competency names |
| `level` | string | ✅ Yes | `"lowest"` - Request lowest layer |
| `include_expansions` | boolean | ✅ Yes | `true` - Include expansions competencies |
| `granularity` | string | ✅ Yes | `"nano"` - Request nano-level granularity |

---

## 🧪 Testing

To verify the update works:

1. **Check Logs:**
   - Look for: `📤 Requesting skill breakdown for X competencies (lowest layer/expansions: true)`
   - Look for: `✅ Skills Engine returned breakdown for X competencies`

2. **Verify Request:**
   - Check Skills Engine logs to confirm it receives:
     - `level: "lowest"`
     - `include_expansions: true`
     - `granularity: "nano"`

3. **Verify Response:**
   - Confirm response contains `microSkills` and `nanoSkills` arrays
   - Verify these are from the lowest layer (expansions)

---

## 📚 Related Files

- `backend/src/infrastructure/clients/SkillsEngineClient.js` - Main client for Skills Engine communication
- `backend/src/application/useCases/GenerateLearningPathUseCase.js` - Uses skill breakdown for path generation
- `docs/guides/SKILLS_HIERARCHY_VERIFICATION.md` - Skills hierarchy documentation
- `docs/guides/MICROSERVICES_COMMUNICATION.md` - Skills Engine communication details

---

## ✅ Status

- ✅ **SkillsEngineClient updated** - Explicitly requests lowest layer (expansions)
- ✅ **GenerateLearningPathUseCase updated** - Passes `includeExpansions: true`
- ✅ **All micro/nano skills usage locations checked** - No other changes needed
- ⏳ **Documentation** - This document created

---

**Last Updated:** 2025-01-XX
**Status:** ✅ Complete

