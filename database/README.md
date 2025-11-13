# Database Directory

This directory contains database schema files and SQL scripts for the LearnerAI microservice.

## Purpose

This directory stores all database-related files for Supabase (PostgreSQL) setup and maintenance.

## Current Status

✅ **Old tables have been dropped** - Ready for new schema creation

## Contents

- **`migrations/`** - Database migration files (will be created from your prompt)
  - Migration files are numbered sequentially (001, 002, 003...)
  - Each migration should be idempotent (safe to run multiple times)

- **`backup-before-drop.js`** - Script to backup database before major changes
  - Run with: `node database/backup-before-drop.js`
  - Requires database connection variables in `backend/.env`

## Next Steps

1. **Provide your prompt** describing the new table structure
2. **New migration files will be generated** based on your requirements
3. **New `schema.sql` will be created** with the complete schema
4. **Run migrations** in Supabase SQL Editor to create tables

## Related Directories

- `ai/prompts/` - AI prompt templates
- `backend/src/infrastructure/repositories/` - Repository implementations that use these tables
