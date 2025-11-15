# How to Update Database with New Detailed Learning Paths

This guide shows you how to update your database with the new fully detailed learning paths.

---

## 🎯 Quick Method: Using API Seed Endpoint (Recommended)

This is the easiest and safest method. The seeding script now automatically **updates** existing courses with new learning paths.

### Step 1: Start the Backend Server

```powershell
cd backend
npm start
```

Make sure the server is running on `http://localhost:5000`

### Step 2: Update Courses with New Learning Paths

```powershell
# This will update existing courses with new detailed learning paths
Invoke-RestMethod -Uri http://localhost:5000/api/seed -Method POST
```

**What happens:**
- ✅ Creates new courses if they don't exist
- 🔄 **Updates existing courses** with new detailed learning paths
- Preserves all other data (learners, skills gaps, etc.)

**Expected Output:**
```
📚 Seeding courses...
  🔄 Updated course: JavaScript ES6+ Syntax (with new detailed learning path)
  🔄 Updated course: React Hooks (with new detailed learning path)
  🔄 Updated course: TypeScript Fundamentals (with new detailed learning path)
  🔄 Updated course: Node.js Backend Development (with new detailed learning path)
  ...
```

### Step 3: Verify the Update

```powershell
# Check a specific course to see the new learning path structure
Invoke-RestMethod -Uri "http://localhost:5000/api/v1/courses/React%20Hooks"
```

You should see the new `steps` array with:
- `resources` (array)
- `objectives` (array)
- `estimatedTime`
- `duration`
- And all other detailed fields

---

## 🔄 Alternative Method: Clear and Re-seed (Fresh Start)

If you want to start completely fresh:

### Step 1: Clear All Seeded Data

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/seed -Method DELETE
```

### Step 2: Re-seed Everything

```powershell
Invoke-RestMethod -Uri http://localhost:5000/api/seed -Method POST
```

This will create all courses from scratch with the new detailed learning paths.

---

## 🗄️ Method 3: Direct SQL Update (Advanced)

If you prefer to update via SQL directly in Supabase:

### Step 1: Go to Supabase SQL Editor

1. Open Supabase Dashboard
2. Navigate to **SQL Editor**
3. Create a new query

### Step 2: Update Each Course

For each course, you'll need to update the `learning_path` JSONB column. Here's an example for "React Hooks":

```sql
UPDATE courses
SET learning_path = '{
  "steps": [
    {
      "step": 1,
      "title": "React Hooks Basics",
      "duration": "1 week",
      "resources": [
        "React Docs: Introducing Hooks",
        "React Docs: useState Hook",
        "Video: React Hooks Tutorial by Traversy Media",
        "Interactive: React Hooks Practice on CodeSandbox",
        "Article: Understanding React Hooks"
      ],
      "objectives": [
        "Understand why React Hooks were introduced",
        "Master useState hook for state management",
        "Learn useEffect hook for side effects",
        "Understand the Rules of Hooks",
        "Build functional components with hooks"
      ],
      "estimatedTime": "6 hours",
      "stepId": "step-004",
      "description": "Introduction to React Hooks and fundamental hooks",
      "skills": ["micro-008"]
    },
    {
      "step": 2,
      "title": "Advanced Hooks and Custom Hooks",
      "duration": "1.5 weeks",
      "resources": [
        "React Docs: useCallback and useMemo",
        "React Docs: useContext Hook",
        "React Docs: Building Your Own Hooks",
        "Video: Advanced React Hooks Patterns",
        "Article: Custom Hooks Best Practices"
      ],
      "objectives": [
        "Master useCallback and useMemo for performance",
        "Use useContext for global state management",
        "Create custom hooks for reusable logic",
        "Understand hook dependencies and optimization",
        "Apply hooks in complex real-world scenarios"
      ],
      "estimatedTime": "8 hours",
      "stepId": "step-005",
      "description": "useEffect, custom hooks, and advanced patterns",
      "skills": ["micro-009", "micro-010"]
    }
  ],
  "estimatedCompletion": "2-3 weeks",
  "totalSteps": 2,
  "createdAt": "2025-11-05T14:30:00Z",
  "updatedAt": "2025-11-05T14:30:00Z",
  "pathTitle": "React Hooks Mastery",
  "totalDurationHours": 14,
  "learningModules": [
    { "moduleId": "module-003", "name": "Hooks Fundamentals", "duration": 6, "module_title": "Hooks Fundamentals" },
    { "moduleId": "module-004", "name": "Advanced Patterns", "duration": 8, "module_title": "Advanced Patterns" }
  ]
}'::jsonb
WHERE competency_target_name = 'React Hooks';
```

**Note:** You'll need to do this for each course. The full learning paths are in `backend/src/utils/mockData.js`.

---

## ✅ Verification Checklist

After updating, verify that:

1. **All courses have the new structure:**
   ```powershell
   Invoke-RestMethod -Uri http://localhost:5000/api/v1/courses
   ```

2. **Steps array exists with resources and objectives:**
   - Check that each course has a `steps` array
   - Each step should have `resources` and `objectives` arrays
   - Each step should have `estimatedTime` and `duration`

3. **Root level fields are present:**
   - `estimatedCompletion`
   - `totalSteps`
   - `createdAt`
   - `updatedAt`

4. **Frontend displays correctly:**
   - Open the frontend
   - Navigate to User View (Sara Neer)
   - Select a course
   - Verify you see:
     - Learning Objectives
     - Resources
     - Skills Covered
     - Step details

---

## 🐛 Troubleshooting

### Issue: "Course already exists" but not updating

**Solution:** The seeding script now handles this automatically. If you still see issues:
1. Check that the backend server is running
2. Verify your Supabase credentials are correct
3. Try the clear and re-seed method

### Issue: Learning path not showing in frontend

**Solution:**
1. Check browser console for errors
2. Verify the API is returning the correct data:
   ```powershell
   Invoke-RestMethod -Uri "http://localhost:5000/api/v1/courses/user/b2c3d4e5-f6a7-8901-2345-678901234567"
   ```
3. Make sure the frontend is reading from the correct fields (`steps` vs `pathSteps`)

### Issue: JSON parsing errors

**Solution:** Make sure the `learning_path` JSONB is valid JSON. You can validate it in Supabase SQL Editor:
```sql
SELECT 
  competency_target_name,
  jsonb_pretty(learning_path) as formatted_path
FROM courses
WHERE competency_target_name = 'React Hooks';
```

---

## 📊 What Changed

The new learning paths include:

1. **Proper `steps` array** (per LEARNING_ANALYTICS_JSON.md spec):
   - `step` (number)
   - `title` (string)
   - `duration` (string, e.g., "1 week")
   - `resources` (array of learning resources)
   - `objectives` (array of learning objectives)
   - `estimatedTime` (string, e.g., "6 hours")

2. **Root level metadata:**
   - `estimatedCompletion` (string)
   - `totalSteps` (number)
   - `createdAt` (ISO DateTime)
   - `updatedAt` (ISO DateTime)

3. **Backward compatibility:**
   - `pathSteps` (for existing frontend code)
   - `learningModules` (for module display)
   - `pathTitle` and `totalDurationHours`

---

## 🎉 Success!

Once updated, all learning paths will be fully detailed with:
- ✅ Learning objectives for each step
- ✅ Resources (links, videos, articles)
- ✅ Step duration and estimated time
- ✅ Skills covered (with human-readable names)
- ✅ Proper structure matching the API specification

Your database is now ready with production-quality learning paths! 🚀

