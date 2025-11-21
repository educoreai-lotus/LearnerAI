# Skills Engine Gap Update Flow (Updated)

This document describes the exact flow when Skills Engine POSTs gap updates to your API.

---

## 📥 What Skills Engine POSTs

**Endpoint:** `POST /api/v1/skills-gaps`

**Body from Skills Engine:**
```json
{
  "user_id": "string (UUID or numeric ID)",
  "user_name": "string",
  "company_id": "string (UUID or company identifier)",
  "company_name": "string",
  "exam_status": "PASS" | "FAIL",
  "competency_target_name": "string",
  "missing_skills_map": {
    "Competency_Name_1": [
      "MGS_Skill_ID_1",
      "MGS_Skill_ID_2",
      "MGS_Skill_ID_3"
    ],
    "Competency_Name_2": [
      "MGS_Skill_ID_4",
      "MGS_Skill_ID_5"
    ],
    "Competency_Name_3": [
      "MGS_Skill_ID_6"
    ]
    // ... can contain any number of competencies
  }
}
```

**Note:** The `missing_skills_map` is an object where:
- **Keys** are competency names (strings)
- **Values** are arrays of missing skill IDs (strings, typically prefixed with "MGS_")
- **Can contain any number of competencies** - the object is not limited to a specific count
- This structure is saved directly to `skills_raw_data` and sent to Learning Analytics

---

## 🔄 What Your Backend Does

**Important:** The `missing_skills_map` field contains a simplified structure where competencies map to arrays of missing skill IDs. This is saved directly to `skills_raw_data` and later sent to Learning Analytics.

### Step 1: Check Skills Gap Table

```
Check if (user_id + competency_target_name) exists in skills_gap table
    │
    ├─> YES ──────────────────────────────┐
    │                                     │
    │   └─> Get existing skills_raw_data  │
    │       │                             │
    │       └─> Filter: Keep only skills   │
    │           that ARE in new            │
    │           missing_skills_map        │
    │           Delete skills NOT in       │
    │           new missing_skills_map     │
    │           │                          │
    │           └─> Update skills_gap      │
    │               table with new         │
    │               missing_skills_map    │
    │                                     │
    └─> NO ──────────────────────────────┤
                                          │
        └─> Create new row in             │
            skills_gap table              │
            with new missing_skills_map    │
            (saved to skills_raw_data)     │
                                          │
Step 2: Check Learners Table ────────────┘
    │
    ├─> Check if user_id exists
    │
    ├─> YES ──> Update if company_name/user_name changed
    │
    └─> NO ──> Create new learner
        │
        └─> Company details (decision_maker_policy, decision_maker_id)
            are in companies table (populated by Directory)
            Accessed via company_id when needed
```

---

## 📋 Detailed Implementation

### 1. Skills Gap Update/Create Logic

```javascript
// Check if gap exists
const existingGap = await skillsGapRepository.getSkillsGapByUserAndCompetency(
  user_id, 
  competency_target_name
);

if (existingGap) {
  // UPDATE: Filter existing skills_raw_data
  // Keep only skills that ARE in new missing_skills_map
  const filteredSkills = filterSkillsByNewGap(
    existingGap.skills_raw_data,  // Existing data
    missing_skills_map            // New missing_skills_map from Skills Engine
  );
  
  // Update skills_gap table
  await skillsGapRepository.updateSkillsGap(existingGap.gap_id, {
    skills_raw_data: filteredSkills,
    exam_status: exam_status,  // "PASS" or "FAIL"
    company_name,
    user_name
  });
} else {
  // CREATE: New skills gap
  await skillsGapRepository.createSkillsGap({
    user_id,
    company_id,
    company_name,
    user_name,
    competency_target_name: competency_target_name,
    skills_raw_data: missing_skills_map,
    exam_status: exam_status  // "PASS" or "FAIL"
  });
}
```

### 2. Learner Creation

```javascript
// Check if learner exists
const existingLearner = await learnerRepository.getLearnerById(user_id);

if (!existingLearner) {
  // Create learner
  // Company details (decision_maker_policy, decision_maker_id) 
  // are in companies table, accessed via company_id when needed
  await learnerRepository.createLearner({
    user_id,
    company_id,
    company_name,
    user_name
  });
}
```

---

## 🔗 Complete Flow

```
Skills Engine POSTs gap update
        │
        ▼
┌───────────────────────────────┐
│ POST /api/v1/skills-gaps      │
│ Body: {                        │
│   user_id, user_name,          │
│   company_id, company_name,    │
│   competency_target_name,      │
│   exam_status,                 │
│   missing_skills_map           │
│ }                              │
└───────────┬───────────────────┘
            │
            ▼
┌───────────────────────────────┐
│ ProcessSkillsGapUpdateUseCase │
└───────────┬───────────────────┘
            │
            ├─> Step 1: Check skills_gap table
            │   │
            │   ├─> (user_id + competency_target_name) exists?
            │   │
            │   ├─> YES: Update skills_raw_data
            │   │   └─> Filter: Keep only skills in new missing_skills_map
            │   │
            │   └─> NO: Create new skills_gap row
            │       └─> Save missing_skills_map to skills_raw_data
            │
            ├─> Step 2: Check learners table
            │   │
            │   ├─> user_id exists?
            │   │
            │   ├─> YES: Update if names changed
            │   │
            │   └─> NO: Create new learner
            │       └─> Company details in companies table
            │
            └─> Return updated skills_gap
```

---

## ✅ After Skills Gap is Updated

Once the skills gap is updated in the database:

1. **Skills Engine can trigger learning path generation:**
   - `POST /api/v1/learning-paths/generate`
   - Your backend will fetch the **updated** `skills_raw_data` (containing `missing_skills_map`) from database
   - Use it for Prompt 1 (Skill Expansion)
   - Update learning path using `user_id` and `competency_target_name`

2. **When learning path is ready:**
   - Send to Course Builder:
     - `user_id`, `user_name`, `company_id`, `company_name`, `competency_target_name`, `learning_path`
   - Send to Learning Analytics:
     - Same data for analytics tracking

3. **Other tables are used after Gemini processing:**
   - `skills_expansions` - After Prompt 1 & 2
   - `courses` - After Prompt 3 (learning path created, keyed by `competency_target_name`)

---

## 🔑 Key Points

1. **Skills Engine POSTs to you** - You receive gap updates with `missing_skills_map`
2. **competency_target_name** - Directly used as the competency identifier
3. **exam_status** - "PASS" or "FAIL" (replaces old `status` field)
4. **missing_skills_map** - Object where keys are competencies, values are arrays of missing skill IDs
5. **Update or Create** - Check if gap exists, update or create accordingly
6. **Filter Skills** - Keep only skills that ARE in new `missing_skills_map`, delete others
7. **Company Details** - Stored in `companies` table (populated by Directory), accessed via `company_id`
8. **Updated Data Used** - When generating path, use updated `skills_raw_data` (containing `missing_skills_map`) from database
9. **Learning Path Distribution** - Send to Course Builder + Learning Analytics when ready

---

**This flow ensures your database always has the latest gap data from Skills Engine!** ✅

