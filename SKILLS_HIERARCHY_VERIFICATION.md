# Skills Hierarchy Verification

This document verifies that the system correctly handles the skills hierarchy and requests the lowest layer (nano/micro skills) from Skills Engine.

---

## 📊 Skills Hierarchy Structure

```
Competency (Highest Level)
  └─> Micro Skills (Mid Level)
      └─> Nano Skills (Lowest Level)
```

**Key Point:** The **gap** contains the **lowest layer** (nano/micro skills that are missing).

---

## ✅ Current Implementation Status

### **1. Skills Gap (Incoming from Skills Engine)**

**Status:** ✅ **CORRECT**

**What we receive:**
- Skills Engine sends gap with `microSkills` and `nanoSkills` (lowest layer)
- Stored in `skills_gap.skills_raw_data` as JSONB

**Example:**
```json
{
  "gap": {
    "missing_skills_map": {
      "microSkills": [
        { "id": "MGS_ES6_Syntax", "name": "ES6+ Syntax" }
      ],
      "nanoSkills": [
        { "id": "MGS_Async_Await", "name": "Async/Await Patterns" }
      ]
    }
  }
}
```

**Location:** `backend/src/api/routes/skillsGaps.js` - Processes incoming gap

---

### **2. Requesting Breakdown for Expanded Competencies**

**Status:** ⚠️ **NEEDS VERIFICATION**

**Current Implementation:**
- Endpoint: `POST {SKILLS_ENGINE_URL}/api/skills/breakdown`
- Request Body: `{ "competencies": ["Competency_Name_1", "Competency_Name_2"] }`
- **No explicit parameter requesting lowest layer**

**What we receive:**
```json
{
  "Competency_Name_1": {
    "microSkills": [...],
    "nanoSkills": [...]
  }
}
```

**Location:** `backend/src/infrastructure/clients/SkillsEngineClient.js`

**Question:** Does Skills Engine's `/api/skills/breakdown` endpoint:
1. Always return the lowest layer (nano/micro) by default?
2. Require a parameter to specify we want the lowest layer?
3. Return different levels based on the competency?

---

### **3. Using Breakdown in Prompt 3**

**Status:** ✅ **CORRECT**

**What we do:**
- Combine initial gap (nano/micro) + expanded breakdown (nano/micro)
- Pass both to Prompt 3 for path creation

**Location:** `backend/src/application/useCases/GenerateLearningPathUseCase.js` (line 268-270)

```javascript
const expandedBreakdownForPrompt3 = {
  competencies: prompt2OutputFromDB, // From prompt_2_output
  skillBreakdown: skillBreakdown // From Skills Engine (micro/nano skills)
};
```

---

## 🔍 Verification Checklist

### ✅ **Confirmed Working:**

- [x] Skills gap contains nano/micro skills (lowest layer)
- [x] Breakdown response structure shows microSkills and nanoSkills
- [x] Prompt 3 uses both initial gap and expanded breakdown
- [x] Mock data returns nano/micro skills

### ⚠️ **Needs Confirmation:**

- [ ] Does Skills Engine `/api/skills/breakdown` always return lowest layer?
- [ ] Should we add a parameter like `level: "lowest"` or `granularity: "nano"`?
- [ ] Does the endpoint accept any parameters to specify skill level?

---

## 📝 Recommendations

### **Option 1: If Skills Engine Always Returns Lowest Layer**

**Action:** No changes needed. The current implementation is correct.

**Documentation:** Add a note that the endpoint returns the lowest layer by default.

### **Option 2: If Skills Engine Requires a Parameter**

**Action:** Update `SkillsEngineClient.requestSkillBreakdown()` to include the parameter:

```javascript
const response = await this.httpClient.post(
  `${this.baseUrl}/api/skills/breakdown`,
  {
    competencies: competencyNames,
    level: "lowest", // or granularity: "nano", or depth: "full"
    // Check Skills Engine API docs for exact parameter name
  },
  // ... headers
);
```

### **Option 3: If Skills Engine Returns Different Levels**

**Action:** 
1. Check Skills Engine API documentation
2. Add parameter to request specific level
3. Verify response contains nano/micro skills

---

## 🔧 Files to Check/Update

1. **`backend/src/infrastructure/clients/SkillsEngineClient.js`**
   - Verify request body format
   - Check if parameter needed for lowest layer

2. **`MICROSERVICES_COMMUNICATION.md`**
   - Document that we request lowest layer
   - Specify if parameter is needed

3. **`PROJECT_FLOW.md`**
   - Confirm flow description mentions lowest layer

4. **`TEST_FULL_LEARNING_PATH_FLOW.md`**
   - Verify test examples show nano/micro skills

---

## ✅ Expected Behavior

When requesting breakdown for expanded competencies:

1. **Request:** Send competency names to Skills Engine
2. **Response:** Receive breakdown with `microSkills` and `nanoSkills` (lowest layer)
3. **Usage:** Combine with initial gap (also lowest layer) for Prompt 3

**Both the initial gap and expanded breakdown should be at the same level (lowest layer: nano/micro skills).**

---

## 🧪 Testing

To verify the Skills Engine returns lowest layer:

1. **Test Request:**
```powershell
$body = @{
    competencies = @("React Hooks", "TypeScript Fundamentals")
} | ConvertTo-Json

Invoke-RestMethod -Uri "$SKILLS_ENGINE_URL/api/skills/breakdown" `
    -Method POST `
    -Headers @{
        "Authorization" = "Bearer $SKILLS_ENGINE_TOKEN"
        "Content-Type" = "application/json"
    } `
    -Body $body
```

2. **Verify Response:**
   - Check that response contains `microSkills` array
   - Check that response contains `nanoSkills` array
   - Verify these are the lowest level (not higher-level skills)

3. **Check Backend Logs:**
   - Look for "Skills Engine responded with breakdown"
   - Verify the breakdown structure in logs

---

## 📚 Related Documentation

- `MICROSERVICES_COMMUNICATION.md` - Skills Engine communication details
- `PROJECT_FLOW.md` - Overall flow description
- `TEST_FULL_LEARNING_PATH_FLOW.md` - Testing guide

---

**Next Step:** Verify with Skills Engine API documentation or test the endpoint to confirm it returns the lowest layer (nano/micro skills) by default.

