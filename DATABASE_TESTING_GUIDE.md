# Database Testing Guide

This guide shows you how to test your database connection, schema, and operations.

---

## 🚀 Quick Start

### Step 1: Run Database Migration

First, ensure your database schema is set up:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste the contents of `database/migrations/init_schema_migration.sql`
3. Click **Run** to execute the migration
4. Verify tables are created (check Table Editor)

---

## 🧪 Testing Methods

### Method 1: Using API Seed Endpoints (Recommended)

This is the easiest way to test your database with sample data.

#### 1. Start the Backend Server

```powershell
cd backend
npm start
```

#### 2. Test Database Connection

```powershell
# Check if server is running and can connect to database
Invoke-RestMethod -Uri http://localhost:5000/health
```

#### 3. View Mock Data (Without Seeding)

```powershell
# See what data will be seeded (doesn't write to database)
Invoke-RestMethod -Uri http://localhost:5000/api/seed
```

#### 4. Seed Database with Test Data

```powershell
# Add sample data to all tables
Invoke-RestMethod -Uri http://localhost:5000/api/seed -Method POST
```

**Expected Response:**
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

#### 5. Test CRUD Operations

```powershell
# Get all learners
Invoke-RestMethod -Uri http://localhost:5000/api/v1/learners

# Get all courses
Invoke-RestMethod -Uri http://localhost:5000/api/v1/courses

# Get all skills gaps
Invoke-RestMethod -Uri http://localhost:5000/api/v1/skills-gaps

# Get all companies
Invoke-RestMethod -Uri http://localhost:5000/api/v1/companies

# Get all recommendations
Invoke-RestMethod -Uri http://localhost:5000/api/v1/recommendations

# Get all skills expansions
Invoke-RestMethod -Uri http://localhost:5000/api/v1/skills-expansions
```

#### 6. Test Specific Queries

```powershell
# Get learner by ID
Invoke-RestMethod -Uri http://localhost:5000/api/v1/learners/{user_id}

# Get course by competency_target_name
Invoke-RestMethod -Uri http://localhost:5000/api/v1/courses/{competency_target_name}

# Get skills gaps by user
Invoke-RestMethod -Uri http://localhost:5000/api/v1/skills-gaps/user/{user_id}

# Get skills gaps by competency
Invoke-RestMethod -Uri http://localhost:5000/api/v1/skills-gaps/competency/{competency_target_name}
```

#### 7. Test Skills Engine Update Flow

```powershell
# Simulate Skills Engine POST (with new missing_skills_map structure)
$body = @{
    user_id = "a1b2c3d4-e5f6-4789-a012-345678901234"
    user_name = "Test User"
    company_id = "c1d2e3f4-5678-9012-3456-789012345678"
    company_name = "Test Company"
    exam_status = "FAIL"
    competency_target_name = "JavaScript Fundamentals"
    missing_skills_map = @{
        "Competency_Front_End_Development" = @(
            "MGS_React_Hooks_Advanced",
            "MGS_Flexbox_Grid_System",
            "MGS_Async_Await_Handling"
        )
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri http://localhost:5000/api/v1/skills-gaps -Method POST -Body $body -ContentType "application/json"
```

#### 8. Clear Test Data

```powershell
# Remove all seeded data
Invoke-RestMethod -Uri http://localhost:5000/api/seed -Method DELETE
```

---

### Method 2: Using Supabase SQL Editor

Test directly in Supabase Dashboard:

#### 1. Check Tables Exist

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

#### 2. Check Table Structure

```sql
-- Check learners table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'learners'
ORDER BY ordinal_position;
```

#### 3. Insert Test Data Manually

```sql
-- Insert a test company
INSERT INTO companies (company_id, company_name, decision_maker_policy, decision_maker)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'Test Company',
    'auto',
    '{"employee_id": "emp-001", "employee_name": "John Doe", "employee_email": "john@test.com"}'::jsonb
);

-- Insert a test learner
INSERT INTO learners (user_id, company_id, company_name, user_name)
VALUES (
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'Test Company',
    'Test User'
);

-- Insert a test skills gap
INSERT INTO skills_gap (
    user_id, 
    company_id, 
    company_name, 
    user_name,
    competency_target_name,
    skills_raw_data,
    exam_status
)
VALUES (
    '660e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440001',
    'Test Company',
    'Test User',
    'JavaScript Fundamentals',
    '{
        "Competency_Front_End_Development": [
            "MGS_React_Hooks_Advanced",
            "MGS_Flexbox_Grid_System"
        ]
    }'::jsonb,
    'FAIL'
);
```

#### 4. Query Test Data

```sql
-- Get all learners with their companies
SELECT 
    l.user_id,
    l.user_name,
    l.company_name,
    c.decision_maker_policy
FROM learners l
JOIN companies c ON l.company_id = c.company_id;

-- Get skills gaps with missing skills
SELECT 
    gap_id,
    user_name,
    competency_target_name,
    exam_status,
    skills_raw_data
FROM skills_gap;

-- Get courses with learning paths
SELECT 
    competency_target_name,
    user_id,
    approved,
    learning_path->'steps' as steps
FROM courses;
```

#### 5. Test Foreign Key Constraints

```sql
-- This should fail (user doesn't exist)
INSERT INTO skills_gap (user_id, company_id, company_name, user_name, competency_target_name, skills_raw_data)
VALUES (
    '00000000-0000-0000-0000-000000000000', -- Invalid user_id
    '550e8400-e29b-41d4-a716-446655440001',
    'Test Company',
    'Test User',
    'Test Competency',
    '{}'::jsonb
);
```

---

### Method 3: Using Node.js Scripts

#### Test Database Connection

```powershell
cd backend
node help-get-db-connection.js
```

This script will:
- Test Supabase connection
- List all tables
- Show table structures
- Display sample queries

---

### Method 4: Using Sample SQL File

Load the sample backup file:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Copy and paste contents of `database/20251112_sample_backup.sql`
3. Click **Run** to insert sample data
4. Verify data in Table Editor

---

## ✅ Verification Checklist

After testing, verify:

- [ ] All tables exist (`companies`, `learners`, `skills_gap`, `skills_expansions`, `courses`, `recommendations`, `jobs`)
- [ ] Foreign key constraints work (try inserting invalid data)
- [ ] JSONB columns accept the new `missing_skills_map` structure
- [ ] `competency_target_name` is used as primary key for `courses` table
- [ ] `exam_status` field accepts "PASS" or "FAIL"
- [ ] Timestamps are auto-updated (`created_at`, `last_modified_at`)
- [ ] Triggers work (updating a row updates `last_modified_at`)

---

## 🧹 Clean Up

### Clear All Test Data

**Option 1: Using API**
```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/seed -Method DELETE
```

**Option 2: Using SQL**
```sql
-- Delete all data (in order to respect foreign keys)
DELETE FROM recommendations;
DELETE FROM courses;
DELETE FROM skills_expansions;
DELETE FROM skills_gap;
DELETE FROM jobs;
DELETE FROM learners;
DELETE FROM companies;
```

**Option 3: Drop and Recreate Schema**
```sql
-- Run the drop script first
-- Then run init_schema_migration.sql again
```

---

## 🔍 Common Test Scenarios

### Test 1: Skills Engine Update Flow

```powershell
# 1. POST skills gap update
$gapUpdate = @{
    user_id = "a1b2c3d4-e5f6-4789-a012-345678901234"
    user_name = "Alice Johnson"
    company_id = "c1d2e3f4-5678-9012-3456-789012345678"
    company_name = "TechCorp Inc."
    exam_status = "FAIL"
    competency_target_name = "JavaScript ES6+ Syntax"
    missing_skills_map = @{
        "Competency_Front_End_Development" = @(
            "MGS_React_Hooks_Advanced",
            "MGS_Flexbox_Grid_System"
        )
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri http://localhost:5000/api/v1/skills-gaps -Method POST -Body $gapUpdate -ContentType "application/json"

# 2. Verify it was created/updated
Invoke-RestMethod -Uri http://localhost:5000/api/v1/skills-gaps/user/a1b2c3d4-e5f6-4789-a012-345678901234
```

### Test 2: Company Registration Flow

```powershell
# POST company update from Directory microservice
$companyUpdate = @{
    company_id = "c1d2e3f4-5678-9012-3456-789012345678"
    company_name = "New Company"
    approval_policy = "manual"
    decision_maker = @{
        employee_id = "emp-001"
        employee_name = "John Manager"
        employee_email = "john@company.com"
    }
} | ConvertTo-Json -Depth 10

Invoke-RestMethod -Uri http://localhost:5000/api/v1/companies -Method POST -Body $companyUpdate -ContentType "application/json"
```

### Test 3: Learning Path Generation

```powershell
# POST learning path generation request
$pathRequest = @{
    userId = "a1b2c3d4-e5f6-4789-a012-345678901234"
    companyId = "c1d2e3f4-5678-9012-3456-789012345678"
    competencyTargetName = "JavaScript ES6+ Syntax"
    microSkills = @()
    nanoSkills = @()
} | ConvertTo-Json

Invoke-RestMethod -Uri http://localhost:5000/api/v1/learning-paths/generate -Method POST -Body $pathRequest -ContentType "application/json"
```

---

## 📊 Expected Results

### After Seeding:

- **3 learners** in `learners` table
- **2 skills gaps** in `skills_gap` table (with `missing_skills_map` structure)
- **2 courses** in `courses` table (with `competency_target_name` as primary key)
- **1 skills expansion** in `skills_expansions` table
- **1 recommendation** in `recommendations` table
- **2 jobs** in `jobs` table

### Data Relationships:

- All foreign keys should be valid
- `skills_gap.competency_target_name` should match `courses.competency_target_name`
- `learners.company_id` should match `companies.company_id`
- `recommendations.base_course_name` should match `courses.competency_target_name`

---

## 🐛 Troubleshooting

### Error: "Table does not exist"
- **Solution**: Run `database/migrations/init_schema_migration.sql` in Supabase SQL Editor

### Error: "Foreign key constraint violation"
- **Solution**: Ensure parent records exist (companies before learners, learners before skills_gap)

### Error: "Invalid JSONB format"
- **Solution**: Check that `missing_skills_map` structure is correct (object with competency names as keys, arrays as values)

### Error: "Connection refused" or "Cannot connect to database"
- **Solution**: 
  1. Check `.env` file has correct `SUPABASE_URL` and `SUPABASE_KEY`
  2. Verify Supabase project is active
  3. Check network connectivity

---

## 📝 Quick Reference

```powershell
# Start server
cd backend
npm start

# Seed database
Invoke-RestMethod -Uri http://localhost:5000/api/seed -Method POST

# View all learners
Invoke-RestMethod -Uri http://localhost:5000/api/v1/learners

# View all courses
Invoke-RestMethod -Uri http://localhost:5000/api/v1/courses

# Clear data
Invoke-RestMethod -Uri http://localhost:5000/api/seed -Method DELETE
```

---

**Happy Testing!** 🎉

