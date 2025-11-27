# Learning Path Update: Filtering Approach

## The Problem with Regeneration

If we regenerate Prompt 1, it might create **NEW competencies** that weren't in the original expansion:
- Original: Competencies A, B, C
- Regenerated: Competencies A, B, D (new competency D added)
- This is NOT just "updating" - it's adding new content

## What You Want

**True Update Mode:**
- ✅ Keep existing expansions (don't regenerate Prompts 1 & 2)
- ✅ Filter existing learning path to remove finished skills
- ✅ Don't add new competencies
- ✅ Only remove what's finished

## Proposed Solution: Path Filtering

### Option 1: Filter Learning Path Structure Directly (Recommended)

**Approach:**
1. Get existing learning path
2. Get updated gap (finished skills removed)
3. Filter learning path modules/steps to remove those covering finished skills
4. Update path structure (no AI regeneration needed)

**Pros:**
- ✅ Fast (no AI calls)
- ✅ Preserves existing structure
- ✅ Only removes finished skills
- ✅ No new competencies added

**Cons:**
- ⚠️ Requires mapping skills to modules (complex)
- ⚠️ Need to identify which modules cover which skills

### Option 2: Filter Competencies + Regenerate Prompt 3

**Approach:**
1. Keep existing Prompt 1 & 2 outputs
2. Filter competencies programmatically (match to remaining skills)
3. Regenerate only Prompt 3 with filtered competencies
4. This ensures path structure matches remaining skills

**Pros:**
- ✅ Keeps existing competencies (no new ones)
- ✅ Updates path structure correctly
- ✅ Only one AI call (Prompt 3)

**Cons:**
- ⚠️ Requires mapping skills to competencies
- ⚠️ Still regenerates path structure

### Option 3: Smart Filtering with Minimal Regeneration

**Approach:**
1. Keep existing Prompt 1 & 2 outputs
2. Extract competencies from existing Prompt 2
3. Filter competencies by matching to remaining skills in gap
4. If competencies match remaining skills → Use existing, regenerate Prompt 3
5. If competencies don't match → Regenerate Prompt 1 (but this adds new competencies)

**This is what we currently do, but it has the problem you identified.**

## Recommendation

I suggest **Option 2** with a filtering mechanism:
1. Use existing Prompt 1 & 2 outputs
2. Filter competencies to only those relevant to remaining skills
3. Regenerate Prompt 3 with filtered competencies

This way:
- ✅ No new competencies added (we filter existing ones)
- ✅ Path structure updated correctly
- ✅ Only one AI call (Prompt 3)

