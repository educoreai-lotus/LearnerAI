# Skills Terminology Update

## Summary

Updated codebase to use "lowest level skills" terminology instead of "micro/nano skills". The key point is that Skills Engine sends a **list of skills at the lowest level** in its hierarchy, and we don't need to categorize them as "micro" or "nano".

---

## Changes Made

### 1. SkillsEngineClient.js
- ✅ Updated comments to say "lowest level skills" instead of "micro/nano skills"
- ✅ Updated request parameters to use `granularity: "lowest"` instead of `granularity: "nano"`
- ✅ Updated mock data to return `skills` array instead of `microSkills`/`nanoSkills`
- ✅ Updated logging to say "lowest level" instead of "lowest layer"

### 2. GenerateLearningPathUseCase.js
- ✅ Updated comments to say "lowest level skills" instead of "micro/nano skills"
- ✅ Updated logging to say "lowest level skills" instead of "lowest layer"

### 3. ProcessSkillsGapUpdateUseCase.js
- ✅ Updated comments to say "list of skills at the lowest level" instead of "micro/nano skills"

### 4. prompt3-path-creation.txt
- ✅ Updated prompt text to say "skills at the lowest level" instead of "Nano and Micro Skills"
- ✅ Updated example structure to show `skills` array instead of `microSkills`/`nanoSkills`

---

## Key Concept

**Before:**
- Skills Engine sends gap with "microSkills" and "nanoSkills"
- We categorize skills as "micro" or "nano"

**After:**
- Skills Engine sends gap with a **list of skills at the lowest level** in its hierarchy
- We treat them as just "skills" - no need to categorize as "micro" or "nano"
- What matters is that they are at the **lowest level** in Skills Engine's hierarchy

---

## Request Format

**Request to Skills Engine:**
```json
{
  "competencies": ["Competency_Name_1", "Competency_Name_2"],
  "level": "lowest",
  "include_expansions": true,
  "granularity": "lowest"
}
```

**Response from Skills Engine:**
```json
{
  "Competency_Name_1": {
    "skills": [
      { "id": "skill-1", "name": "Skill Name 1" },
      { "id": "skill-2", "name": "Skill Name 2" }
    ]
  }
}
```

---

## Important Notes

1. **No Categorization Needed:** We don't need to call them "micro" or "nano" - they're just skills at the lowest level
2. **Structure:** The gap from Skills Engine is a list of skills at the lowest level
3. **Request:** We explicitly request the lowest level skills from Skills Engine
4. **Usage:** Both initial gap and expanded breakdown contain lists of skills at the lowest level

---

**Last Updated:** 2025-01-XX
**Status:** ✅ Complete

