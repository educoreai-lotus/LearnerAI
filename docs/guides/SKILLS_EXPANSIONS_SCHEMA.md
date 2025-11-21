# Skills Expansions Table Schema

## Overview

The `skills_expansions` table stores the outputs from Prompt 1 and Prompt 2, linking them to the original skills gap and user.

---

## Table Structure

```sql
CREATE TABLE skills_expansions (
    expansion_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    gap_id UUID,                                    -- Links to skills_gap.gap_id (nullable)
    user_id UUID NOT NULL,                          -- Links to learners.user_id
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    last_modified_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    prompt_1_output JSONB,                           -- Prompt 1 result (skill expansion)
    prompt_2_output JSONB,                          -- Prompt 2 result (competency identification)
    CONSTRAINT fk_skills_expansions_gap FOREIGN KEY (gap_id) 
        REFERENCES skills_gap(gap_id) ON DELETE CASCADE,
    CONSTRAINT fk_skills_expansions_user FOREIGN KEY (user_id) 
        REFERENCES learners(user_id) ON DELETE CASCADE
);
```

---

## Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `expansion_id` | UUID | Yes (PK) | Unique identifier for the expansion record |
| `gap_id` | UUID | No (nullable) | Links to the original skills gap. Nullable because learning path might be generated before gap is saved. |
| `user_id` | UUID | Yes | Links to the learner who owns this expansion |
| `created_at` | TIMESTAMP | Yes | When the expansion record was created |
| `last_modified_at` | TIMESTAMP | Yes | When the expansion was last updated |
| `prompt_1_output` | JSONB | No | Output from Prompt 1 (skill expansion) |
| `prompt_2_output` | JSONB | No | Output from Prompt 2 (competency identification) |

---

## Relationships

### Foreign Keys

1. **`gap_id` → `skills_gap.gap_id`**
   - Links expansion to the original skills gap
   - `ON DELETE CASCADE` - if gap is deleted, expansion is deleted
   - **Nullable** - allows expansion without gap link (edge case)

2. **`user_id` → `learners.user_id`**
   - Links expansion to the learner
   - `ON DELETE CASCADE` - if learner is deleted, expansion is deleted
   - **Required** - always present

---

## Query Examples

### Get all expansions for a user

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

### Get expansions for a specific gap

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

### Get latest expansion for a user

```sql
SELECT 
  expansion_id,
  gap_id,
  prompt_1_output,
  prompt_2_output
FROM skills_expansions
WHERE user_id = 'a1b2c3d4-e5f6-4789-a012-345678901234'
ORDER BY created_at DESC
LIMIT 1;
```

### Join with skills_gap to see full context

```sql
SELECT 
  se.expansion_id,
  se.gap_id,
  se.user_id,
  sg.competency_target_name,
  sg.exam_status,
  se.prompt_1_output,
  se.prompt_2_output,
  se.created_at
FROM skills_expansions se
LEFT JOIN skills_gap sg ON se.gap_id = sg.gap_id
WHERE se.user_id = 'a1b2c3d4-e5f6-4789-a012-345678901234'
ORDER BY se.created_at DESC;
```

---

## Repository Methods

### `SkillsExpansionRepository`

- `createSkillsExpansion(expansionData)` - Create new expansion
- `getSkillsExpansionById(expansionId)` - Get by expansion_id
- `getAllSkillsExpansions(options)` - Get all with filters (user_id, gap_id)
- `getSkillsExpansionsByUserId(userId)` - Get all for a user
- `getSkillsExpansionsByGapId(gapId)` - Get all for a gap
- `updateSkillsExpansion(expansionId, updates)` - Update prompt outputs
- `deleteSkillsExpansion(expansionId)` - Delete expansion

---

## Data Flow

```
1. Skills Gap Created (skills_gap table)
   └─> gap_id generated

2. Learning Path Generation Starts
   └─> Create skills_expansion record
       ├─> gap_id: from skills_gap (if found)
       └─> user_id: from skillsGap.userId

3. Prompt 1 Executes
   └─> Save output to prompt_1_output

4. Prompt 2 Executes
   └─> Reads prompt_1_output from DB
   └─> Saves output to prompt_2_output

5. Prompt 3 Executes
   └─> Reads prompt_2_output from DB
   └─> Saves output to courses.learning_path
```

---

## Benefits of Adding `gap_id` and `user_id`

1. **Traceability**: Know which gap and user each expansion belongs to
2. **Querying**: Easy to find all expansions for a user or gap
3. **Debugging**: Link expansions back to original skills gap data
4. **Analytics**: Track expansion patterns per user/gap
5. **Data Integrity**: Foreign keys ensure referential integrity

---

## Notes

- `gap_id` is **nullable** because in some edge cases, the learning path might be generated before the skills gap is fully saved to the database
- `user_id` is **required** because every expansion must be linked to a learner
- Both foreign keys use `ON DELETE CASCADE` to maintain referential integrity

---

**The `skills_expansions` table now properly tracks which gap and user each expansion belongs to!** ✅

