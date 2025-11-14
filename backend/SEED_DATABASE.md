# Database Seeding Guide

## Overview

The backend includes a comprehensive mock data seeding system to test all database operations and verify the schema is working correctly.

## Files

- `src/utils/mockData.js` - Contains all mock data matching the database schema
- `src/utils/seedDatabase.js` - Seeding utility functions
- `src/api/routes/seed.js` - API endpoints for seeding

## Mock Data Included

### 1. **Learners** (3 records)
- Alice Johnson (TechCorp Inc., auto approval)
- Wajdan Al-Mansouri (TechCorp Inc., manual approval)
- Bob Smith (InnovateLabs, auto approval)

### 2. **Skills Gaps** (2 records)
- JavaScript ES6+ Syntax gaps for Alice
- React Hooks gaps for Wajdan
- Includes complete `skills_raw_data` JSONB structure with micro and nano skills

### 3. **Courses** (2 records)
- JavaScript Modern Development Path for Alice
- React Hooks Mastery for Wajdan
- Includes complete `learning_path` JSONB structure

### 4. **Skills Expansions** (1 record)
- TypeScript Fundamentals and Testing with Jest expansions
- Includes `prompt_1_output` and `prompt_2_output` JSONB data

### 5. **Recommendations** (1 record)
- Course suggestions for Alice based on completed course
- Includes `suggested_courses` JSONB array

### 6. **Jobs** (2 records)
- Completed path generation job
- Processing path generation job

## API Endpoints

### GET `/api/seed`
Get all mock data without seeding the database.

**Response:**
```json
{
  "success": true,
  "message": "Mock data retrieved",
  "data": {
    "learners": [...],
    "skillsGaps": [...],
    "courses": [...],
    "skillsExpansions": [...],
    "recommendations": [...],
    "jobs": [...]
  },
  "counts": {
    "learners": 3,
    "skillsGaps": 2,
    "courses": 2,
    "skillsExpansions": 1,
    "recommendations": 1,
    "jobs": 2
  }
}
```

### POST `/api/seed`
Seed the database with all mock data.

**Response:**
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
    "learners": 3,
    "skillsGaps": 2,
    "courses": 2,
    "skillsExpansions": 1,
    "recommendations": 1,
    "jobs": 2
  }
}
```

**Note:** The seeding process handles duplicate entries gracefully - if data already exists, it will skip and continue.

### DELETE `/api/seed`
Clear all seeded data from the database.

**Response:**
```json
{
  "success": true,
  "message": "Seeded data cleared successfully"
}
```

## Usage Examples

### Using cURL

**Get mock data:**
```bash
curl http://localhost:5000/api/seed
```

**Seed database:**
```bash
curl -X POST http://localhost:5000/api/seed
```

**Clear seeded data:**
```bash
curl -X DELETE http://localhost:5000/api/seed
```

### Using JavaScript/Fetch

```javascript
// Get mock data
const response = await fetch('http://localhost:5000/api/seed');
const data = await response.json();
console.log(data);

// Seed database
const seedResponse = await fetch('http://localhost:5000/api/seed', {
  method: 'POST'
});
const seedData = await seedResponse.json();
console.log(seedData);

// Clear seeded data
const clearResponse = await fetch('http://localhost:5000/api/seed', {
  method: 'DELETE'
});
const clearData = await clearResponse.json();
console.log(clearData);
```

## Testing Workflow

1. **Run database migration first:**
   - Execute `database/migrations/init_schema_migration.sql` in Supabase SQL Editor

2. **Start the backend server:**
   ```bash
   cd backend
   npm start
   ```

3. **Seed the database:**
   ```bash
   curl -X POST http://localhost:5000/api/seed
   ```

4. **Verify data in Supabase:**
   - Go to Supabase Dashboard → Table Editor
   - Check all tables have data

5. **Test API endpoints:**
   ```bash
   # Get all learners
   curl http://localhost:5000/api/v1/learners
   
   # Get all courses
   curl http://localhost:5000/api/v1/courses
   
   # Get all skills gaps
   curl http://localhost:5000/api/v1/skills-gaps
   ```

6. **Clear data when done:**
   ```bash
   curl -X DELETE http://localhost:5000/api/seed
   ```

## Data Relationships

The mock data maintains proper relationships:

- **Learners** → **Skills Gaps** (via `user_id`)
- **Learners** → **Courses** (via `user_id`)
- **Courses** → **Skills Gaps** (via `course_id`)
- **Learners** → **Recommendations** (via `user_id`)
- **Courses** → **Recommendations** (via `base_course_id`)
- **Learners** → **Jobs** (via `user_id`)
- **Courses** → **Jobs** (via `course_id`)

## Notes

- Seeding is **idempotent** - safe to run multiple times
- Duplicate entries are skipped gracefully
- Foreign key constraints are respected
- All UUIDs are consistent across related records
- JSONB data structures match the expected schema

## Troubleshooting

**Error: "Supabase credentials not configured"**
- Make sure `SUPABASE_URL` and `SUPABASE_KEY` are set in `.env`

**Error: "Foreign key constraint violation"**
- Make sure to seed in order: learners → skills gaps → courses → recommendations
- The seeding function handles this automatically

**Error: "Table does not exist"**
- Run the migration file first: `database/migrations/init_schema_migration.sql`

