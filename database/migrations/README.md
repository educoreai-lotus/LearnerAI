# Database Migration Guide

This directory contains SQL migration files for the LearnerAI database schema.

## Files

- `drop_all_tables.sql` - Drops all tables, triggers, functions, and related objects
- `init_schema_migration.sql` - Creates the complete database schema

## How to Reset Your Database

### Step 1: Drop All Existing Tables

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open `drop_all_tables.sql`
3. Copy and paste the entire contents into the SQL Editor
4. Click **Run** to execute

This will:
- Drop all triggers
- Drop all tables (in correct order to respect foreign keys)
- Drop all functions
- Clean up all related objects

### Step 2: Run the Migration

1. In the same SQL Editor (or a new query)
2. Open `init_schema_migration.sql`
3. Copy and paste the entire contents
4. Click **Run** to execute

This will create:
- All 7 tables (companies, learners, skills_gap, skills_expansions, courses, recommendations, jobs)
- All indexes for performance
- All triggers for auto-updating timestamps
- All foreign key constraints

### Step 3: Verify

After running both scripts, verify in Supabase Dashboard → **Table Editor** that all tables exist:
- ✅ companies
- ✅ learners
- ✅ skills_gap
- ✅ skills_expansions
- ✅ courses
- ✅ recommendations
- ✅ jobs

## Quick Reset Command (Supabase SQL Editor)

You can also run both scripts in sequence:

```sql
-- First, drop everything
-- (paste contents of drop_all_tables.sql here)

-- Then, create fresh schema
-- (paste contents of init_schema_migration.sql here)
```

## Important Notes

⚠️ **WARNING**: The `drop_all_tables.sql` script will **DELETE ALL DATA** in your database. Make sure you have a backup if you need to preserve any data.

✅ **Safe to run multiple times**: Both scripts use `IF EXISTS` and `IF NOT EXISTS` clauses, so they're idempotent and safe to run multiple times.

## Troubleshooting

### Error: "Cannot drop table because other objects depend on it"
- The drop script uses `CASCADE` to automatically drop dependent objects
- If you still get errors, run the drop script again (it's idempotent)

### Error: "Table does not exist"
- This is normal if you're running the drop script on a fresh database
- The script uses `IF EXISTS` so it won't fail

### After dropping, migration fails
- Make sure you ran `drop_all_tables.sql` first
- Check that all tables were dropped (use Table Editor in Supabase)
- Run `init_schema_migration.sql` again

## What Gets Dropped

The `drop_all_tables.sql` script removes:
1. **Triggers**: All 7 triggers for auto-updating timestamps
2. **Tables**: All 7 tables (in dependency order)
3. **Functions**: `update_last_modified_at()` and `update_updated_at_column()`
4. **Indexes**: Automatically dropped with tables
5. **Constraints**: Automatically dropped with tables

## What Gets Created

The `init_schema_migration.sql` script creates:
1. **Tables**: 7 tables with proper structure
2. **Indexes**: Performance indexes on frequently queried columns
3. **Functions**: 2 trigger functions for timestamp updates
4. **Triggers**: 7 triggers to auto-update timestamps
5. **Constraints**: Foreign keys and check constraints

---

**Need help?** Check the `DATABASE_TESTING_GUIDE.md` in the root directory for testing instructions.

