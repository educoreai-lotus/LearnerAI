# Deployment Seeding Guide

## Problem
The mock data is not automatically seeded when you deploy. The database seeding must be done manually after deployment.

## Solution
Call the seeding API endpoint on your deployed backend.

## Steps to Seed Production Database

### Option 1: Using cURL (Recommended)

Replace `YOUR_RAILWAY_URL` with your actual Railway deployment URL (e.g., `https://learnerai-production.up.railway.app`):

```bash
# Seed the database
curl -X POST https://YOUR_RAILWAY_URL/api/seed
```

### Option 2: Using PowerShell (Windows)

```powershell
# Seed the database
Invoke-RestMethod -Uri "https://YOUR_RAILWAY_URL/api/seed" -Method POST
```

### Option 3: Using Browser or Postman

1. Open your browser or Postman
2. Make a POST request to: `https://YOUR_RAILWAY_URL/api/seed`
3. You should see a response with all the seeded data

### Option 4: Using JavaScript/Fetch (Browser Console)

Open your browser's developer console on your deployed frontend and run:

```javascript
fetch('https://YOUR_RAILWAY_URL/api/seed', {
  method: 'POST'
})
  .then(res => res.json())
  .then(data => {
    console.log('✅ Database seeded:', data);
    console.log('Counts:', data.counts);
  })
  .catch(err => console.error('❌ Error:', err));
```

## Expected Response

You should receive a JSON response like:

```json
{
  "success": true,
  "message": "Database seeded successfully",
  "data": {
    "learners": [...],
    "skillsGaps": [...],
    "courses": [...],
    "skillsExpansions": [...],
    "recommendations": [...],
    "jobs": [...]
  },
  "counts": {
    "learners": 4,
    "skillsGaps": 3,
    "courses": 3,
    "skillsExpansions": 1,
    "recommendations": 1,
    "jobs": 2
  }
}
```

## Verify Seeding

After seeding, verify the data in your Supabase dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor**
3. Check these tables:
   - `companies` - Should have 2 companies
   - `learners` - Should have 4 learners (including Sara Neer)
   - `skills_gap` - Should have 3 skills gaps (including 3 for Sara Neer)
   - `courses` - Should have 3 courses (including 3 for Sara Neer)
   - `skills_expansions` - Should have 1 expansion
   - `recommendations` - Should have 1 recommendation
   - `jobs` - Should have 2 jobs

## Troubleshooting

### Error: "Supabase credentials not configured"
- Check that `SUPABASE_URL` and `SUPABASE_KEY` environment variables are set in Railway
- Go to Railway dashboard → Your service → Variables → Add/Update these variables

### Error: "Route /api/seed not found"
- Verify your backend is deployed and running
- Check the Railway logs for any startup errors
- Ensure the seed route is registered (should be at `/api/seed`)

### Data not appearing in frontend
- Clear your browser cache
- Check that the frontend is pointing to the correct backend URL
- Verify the API calls in browser DevTools → Network tab

## Re-seeding

If you need to re-seed the database:

1. **Option A: Clear and re-seed** (if you have DELETE endpoint):
   ```bash
   curl -X DELETE https://YOUR_RAILWAY_URL/api/seed
   curl -X POST https://YOUR_RAILWAY_URL/api/seed
   ```

2. **Option B: Just POST again** - The seeding script handles duplicates gracefully:
   - Existing records will be skipped or updated (for courses)
   - New records will be added
   - This is safe to run multiple times

## Important Notes

- **Seeding is safe to run multiple times** - The script handles duplicates
- **Courses are updated** - If a course with the same `competency_target_name` exists, it will be updated with the new learning path
- **Companies and learners are upserted** - Existing records are updated, new ones are created
- **Skills gaps use ON CONFLICT DO NOTHING** - Duplicate `gap_id`s are skipped

## Quick Reference

```bash
# Get your Railway URL (check Railway dashboard)
RAILWAY_URL="https://your-app.up.railway.app"

# Seed database
curl -X POST $RAILWAY_URL/api/seed

# Check health
curl $RAILWAY_URL/health

# Get all learners
curl $RAILWAY_URL/api/v1/learners

# Get all courses
curl $RAILWAY_URL/api/v1/courses
```

