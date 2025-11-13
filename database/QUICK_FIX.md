# Quick Fix: Create Missing learning_paths Table

## Problem
The backend code expects a `learning_paths` table, but the current migration (`init_schema_migration.sql`) doesn't create it. This causes the error:

```
Could not find the table 'public.learning_paths' in the schema cache
```

## Solution

Run the additional migration file to create the missing table.

### Step 1: Run the Migration

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open the file: `learnerAI/database/migrations/002_create_learning_paths_table.sql`
3. Copy the entire contents
4. Paste into the SQL Editor
5. Click **Run** (or press `Ctrl+Enter`)

### Step 2: Verify

After running the migration, verify the table was created:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'learning_paths';
```

You should see `learning_paths` in the results.

### Step 3: Restart Backend

Restart your backend server:

```bash
cd backend
npm start
```

The error should now be resolved!

## What This Migration Creates

- ✅ `learning_paths` table with all required columns
- ✅ Indexes for performance (user_id, company_id, course_id, etc.)
- ✅ Trigger for automatic `updated_at` timestamp
- ✅ JSONB index on `path_data` for efficient queries

## Table Structure

The `learning_paths` table includes:
- `id` (UUID, primary key)
- `user_id` (VARCHAR)
- `company_id` (VARCHAR)
- `course_id` (VARCHAR, nullable)
- `gap_id` (VARCHAR)
- `path_version` (INTEGER, default 1)
- `path_data` (JSONB) - stores complete learning path structure
- `status` (VARCHAR) - 'active', 'archived', or 'superseded'
- `generated_at` (TIMESTAMP)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

