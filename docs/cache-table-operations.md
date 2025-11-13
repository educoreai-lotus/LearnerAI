# Cache Table Operations

## Overview

The `cache_skills` table in Supabase stores Micro and Nano Skill divisions for each learner. This cache is automatically updated whenever a new skills gap is received and processed.

## How It Works

### Automatic Caching Flow

1. **Skills Gap Received** → Learning path generation starts
2. **Prompt 1 & 2** → Expanded competencies identified
3. **Skills Engine** → Returns Micro/Nano skill breakdown
4. **Cache Repository** → Automatically saves to `cache_skills` table (UPSERT operation)
5. **Prompt 3** → Uses cached + new data to create learning path

### Cache Repository Methods

The `CacheRepository` class provides these methods:

#### `upsertSkills(learnerId, competencyName, microSkills, nanoSkills)`
- Upserts (insert or update) skills for a specific competency
- Replaces old data with fresh data (not keeping historical versions)
- Uses UNIQUE constraint: `(learner_id, skill_id, skill_type)`

#### `upsertSkillBreakdown(learnerId, skillBreakdown)`
- Processes entire skill breakdown from Skills Engine
- Automatically handles multiple competencies
- Format: `{ "Competency Name": { microSkills: [...], nanoSkills: [...] } }`

#### `getLearnerSkills(learnerId)`
- Retrieves all cached skills for a learner
- Returns array of skill records

#### `getSkillsByCompetency(learnerId, competencyName)`
- Gets skills for a specific competency
- Useful for querying specific skill sets

#### `clearLearnerCache(learnerId)` (optional)
- Clears all cached skills for a learner
- Useful for testing or resetting

## Database Schema

```sql
CREATE TABLE cache_skills (
    id UUID PRIMARY KEY,
    learner_id VARCHAR(255) NOT NULL,
    skill_id VARCHAR(255) NOT NULL,
    skill_type VARCHAR(50) CHECK (skill_type IN ('micro', 'nano')),
    competency_name TEXT NOT NULL,
    skill_name TEXT NOT NULL,
    skill_description TEXT,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    UNIQUE(learner_id, skill_id, skill_type)
);
```

## Integration Points

### In GenerateLearningPathUseCase

After receiving skill breakdown from Skills Engine:

```javascript
// Cache the skill breakdown in Supabase (upsert operation)
if (this.cacheRepository && skillBreakdown) {
  try {
    await this.cacheRepository.upsertSkillBreakdown(skillsGap.userId, skillBreakdown);
    console.log(`✅ Cached skills for learner ${skillsGap.userId}`);
  } catch (error) {
    console.warn(`⚠️ Failed to cache skills: ${error.message}`);
    // Don't fail the entire process if caching fails
  }
}
```

## Benefits

1. **Performance**: Fast lookups for existing skills
2. **Consistency**: Single source of truth for skill divisions
3. **Efficiency**: Avoids redundant Skills Engine calls
4. **Auditability**: Track skill updates with `updated_at` timestamp

## Notes

- **Upsert Behavior**: If a skill already exists (same learner_id, skill_id, skill_type), it's updated. Otherwise, it's inserted.
- **No History**: Old data is replaced, not kept (as per requirements)
- **Error Handling**: Caching failures don't stop the learning path generation process
- **Indexing**: Table is indexed on `learner_id` and `skill_id` for fast queries

## Testing

To verify cache operations:

1. Generate a learning path
2. Check Supabase Table Editor → `cache_skills` table
3. Verify skills are stored with correct `learner_id`, `competency_name`, and `skill_type`
4. Generate another path for the same learner - verify updates (not duplicates)

