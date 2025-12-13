# Skill Difficulty Inference (Pattern-Based)

## ✅ General Solution - No Domain-Specific Code

This file (`skillPrerequisites.js`) provides **pattern-based difficulty inference** that works for **ANY domain/language**.

## What This File Does

1. **Pattern-Based Difficulty Scoring**: Infers difficulty from skill name patterns (works for any skill)
2. **General Heuristics**: Uses keywords like "basic", "advanced", "fundamentals" to determine difficulty
3. **No Hardcoded Skills**: All skills come dynamically from Skills Engine

## How It Works

### Difficulty Inference (Pattern Matching)
```javascript
// Works for ANY domain:
inferDifficultyFromName('Basic JavaScript Syntax')
// Returns: 1 (foundational) - from "Basic" keyword

inferDifficultyFromName('Advanced React Patterns')
// Returns: 3 (advanced) - from "Advanced" keyword

inferDifficultyFromName('GraphQL Queries')
// Returns: 2 (intermediate) - default
```

### Prerequisite Validation
- **NOT done here** - Prerequisites should come from Skills Engine
- This file only provides difficulty scoring
- Prerequisite ordering is validated by Prompt 3 instructions

## How It Works

### 1. Prerequisite Validation
```javascript
// Only validates if BOTH skills exist in knowledge base
validatePrerequisiteOrder(['Variables and Data Types', 'Pointers'])
// ✅ Works: Both skills are in knowledge base

validatePrerequisiteOrder(['Unknown Skill A', 'Unknown Skill B'])
// ⚠️ Skips: Unknown skills are ignored (no error)
```

### 2. Difficulty Scoring
```javascript
// First tries knowledge base
getDifficultyScoreWithFallback('Variables and Data Types')
// Returns: 1 (foundational) - from knowledge base

// Falls back to pattern matching
getDifficultyScoreWithFallback('Advanced Memory Management')
// Returns: 3 (advanced) - inferred from "Advanced" keyword
```

## Better Solutions (Future)

### Option 1: Get Prerequisites from Skills Engine
- Skills Engine should provide prerequisite relationships
- Request prerequisites when getting skill breakdown
- Use dynamic data instead of hardcoded knowledge base

### Option 2: Remove This File Entirely
- Rely on prompt-based validation (Prompt 3 instructions)
- Use heuristic validation only (pattern matching)
- Accept that validation is best-effort without prerequisite data

### Option 3: Pattern-Based Matching
- Use fuzzy matching to find similar skills
- Infer prerequisites from skill name patterns
- Build prerequisite graph dynamically

## Current Usage

This file is used in:
- `GenerateLearningPathUseCase._validateLearningPath()` - Module difficulty progression
- `GenerateLearningPathUseCase._validateLearningPath()` - Prerequisite validation (optional)

**Note**: Validation gracefully handles unknown skills (skips them, doesn't fail).

## Recommendation

**Short-term**: Keep this file as an optional fallback for known skills.

**Long-term**: 
1. Request prerequisite data from Skills Engine
2. Remove hardcoded knowledge base
3. Use dynamic prerequisite graph from Skills Engine

---

**Status**: Optional fallback, not required for system operation.

