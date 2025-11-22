# Test Approvals Data Setup

This guide will help you populate the database with test approval data so the Approvals page shows real data instead of being empty.

## Steps to Run

### 1. Ensure Schema is Up to Date

The `path_approvals` table should already include:
- `changes_requested` status support
- `changes_requested_at` column

If you're setting up a new database, run the complete schema migration first:

**File:** `database/migrations/init_schema_migration.sql`

This creates all tables including `path_approvals` with full approval workflow support.

### 2. Insert Test Data

**File:** `database/insert_test_approvals.sql`

Run this in your Supabase SQL Editor. This will:
- Create/update a company (TechCorp Solutions) with decision maker John Manager
- Create/update a learner (Alice Johnson)
- Create test courses (React Advanced Patterns, TypeScript Fundamentals, Node.js Backend Development)
- Insert 3 test approval requests:
  - 2 pending approvals
  - 1 changes_requested approval (if schema supports it)

### 3. Verify the Data

After running the scripts, you can verify the data was inserted by running this query in Supabase:

```sql
SELECT 
  pa.id,
  pa.learning_path_id,
  pa.status,
  pa.feedback,
  pa.created_at,
  c.company_name,
  l.user_name
FROM path_approvals pa
INNER JOIN companies c ON pa.company_id = c.company_id
INNER JOIN courses co ON pa.learning_path_id = co.competency_target_name
INNER JOIN learners l ON co.user_id = l.user_id
WHERE pa.decision_maker_id = '550e8400-e29b-41d4-a716-446655440010'
ORDER BY pa.created_at DESC;
```

### 4. Test in Frontend

1. Make sure your backend server is running
2. Navigate to the Approvals page (`/approvals`)
3. You should now see 2-3 approval requests listed

## Decision Maker ID

The test data uses decision maker ID: `550e8400-e29b-41d4-a716-446655440010` (John Manager)

This matches the ID used in the frontend (`ApprovalsList.jsx`), so the approvals will appear correctly.

## Troubleshooting

- **No approvals showing?** Check that the decision maker ID in the frontend matches the one in the database
- **Schema error?** Make sure you ran `init_schema_migration.sql` first to create all tables with the correct schema
- **Missing `changes_requested_at` column?** Your schema should already include this if you ran `init_schema_migration.sql`. If not, the table needs to be updated.
- **Foreign key errors?** Make sure the sample data from `20251112_sample_backup.sql` has been inserted first

