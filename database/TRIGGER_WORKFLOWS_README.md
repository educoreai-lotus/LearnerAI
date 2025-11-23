# Trigger Workflows Script

This script triggers the **actual learning path generation workflow** for skills gaps via API calls. Instead of inserting pre-generated data, it runs the real AI pipeline (Prompt 1, Prompt 2, Skills Engine, Prompt 3) to generate learning paths dynamically.

## Prerequisites

1. **Backend server must be running**
   ```bash
   cd backend
   npm run dev
   ```
   Server should be running on `http://localhost:5000`

2. **Skills gaps must exist in database**
   - Run `complete_workflow_example.sql` in Supabase SQL Editor
   - This will create the 6 skills gaps for Alice Johnson

3. **Company must be set to manual approval**
   ```sql
   UPDATE companies SET 
     decision_maker_policy = 'manual',
     decision_maker = '{"employee_id": "550e8400-e29b-41d4-a716-446655440010", "employee_name": "John Manager", "employee_email": "john.manager@techcorp.com"}'::jsonb,
     last_modified_at = NOW()
   WHERE company_id = 'c1d2e3f4-5678-9012-3456-789012345678';
   ```

## Usage

### Option 1: Run the Node.js Script

```bash
cd database
node trigger_workflows.js
```

### Option 2: Use curl/PowerShell

For each gap, call the API:

```bash
# Microservices Architecture
curl -X POST http://localhost:5000/api/v1/learning-paths/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "a1b2c3d4-e5f6-4789-a012-345678901234",
    "companyId": "c1d2e3f4-5678-9012-3456-789012345678",
    "competencyTargetName": "Microservices Architecture"
  }'

# CI/CD Pipeline Development
curl -X POST http://localhost:5000/api/v1/learning-paths/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "a1b2c3d4-e5f6-4789-a012-345678901234",
    "companyId": "c1d2e3f4-5678-9012-3456-789012345678",
    "competencyTargetName": "CI/CD Pipeline Development"
  }'

# Database Design & Optimization
curl -X POST http://localhost:5000/api/v1/learning-paths/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "a1b2c3d4-e5f6-4789-a012-345678901234",
    "companyId": "c1d2e3f4-5678-9012-3456-789012345678",
    "competencyTargetName": "Database Design & Optimization"
  }'

# Cloud Security Fundamentals
curl -X POST http://localhost:5000/api/v1/learning-paths/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "a1b2c3d4-e5f6-4789-a012-345678901234",
    "companyId": "c1d2e3f4-5678-9012-3456-789012345678",
    "competencyTargetName": "Cloud Security Fundamentals"
  }'

# API Gateway Patterns
curl -X POST http://localhost:5000/api/v1/learning-paths/generate \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "a1b2c3d4-e5f6-4789-a012-345678901234",
    "companyId": "c1d2e3f4-5678-9012-3456-789012345678",
    "competencyTargetName": "API Gateway Patterns"
  }'
```

## What Happens

When you trigger a workflow:

1. **Job Created** - A job is created in the `jobs` table with status `pending`
2. **Prompt 1** - AI expands the skills gap into related competencies
3. **Prompt 2** - AI identifies which competencies to send to Skills Engine
4. **Skills Engine** - Gets micro/nano skills breakdown for each competency
5. **Prompt 3** - AI creates the complete learning path structure
6. **Course Saved** - Learning path saved to `courses` table
7. **Approval Request** - If company has manual approval, creates approval request in `path_approvals` table
8. **Job Completed** - Job status updated to `completed`

## Monitoring Progress

Check job status:

```bash
GET http://localhost:5000/api/v1/jobs/{jobId}/status
```

Example response:
```json
{
  "id": "job-uuid",
  "status": "processing",
  "progress": 60,
  "current_stage": "prompt-3-execution"
}
```

## Expected Results

After all workflows complete, you should have:

- ✅ 6 jobs in `jobs` table (status: `completed`)
- ✅ 6 entries in `skills_expansions` table (Prompt 1 & 2 outputs)
- ✅ 6 courses in `courses` table (with `approved: false`)
- ✅ 6 approval requests in `path_approvals` table (status: `pending`)

## Troubleshooting

**Error: "Skills gap not found"**
- Make sure you ran `complete_workflow_example.sql` first
- Verify the `competency_target_name` matches exactly

**Error: "Connection refused"**
- Make sure backend server is running
- Check the API_URL in the script matches your backend URL

**Jobs stuck in "pending" or "processing"**
- Check backend logs for errors
- Verify Gemini API key is set in environment variables
- Check Skills Engine connection if jobs fail at that stage


