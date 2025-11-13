# Next Steps - Getting Started with New Schema

## ✅ What's Done
- ✅ Database migration file created (`database/migrations/init_schema_migration.sql`)
- ✅ Sample data file created (`database/20251112_sample_backup.sql`)
- ✅ All API endpoints created and registered
- ✅ Repositories implemented for all tables
- ✅ Server.js updated with all dependencies

## 🚀 Step 1: Run Database Migration

### In Supabase Dashboard:
1. Go to your Supabase project
2. Navigate to **SQL Editor**
3. Open the file: `learnerAI/database/migrations/init_schema_migration.sql`
4. Copy the entire contents
5. Paste into the SQL Editor
6. Click **Run** (or press `Ctrl+Enter`)

**Expected Result:** All 5 tables created:
- ✅ `learners`
- ✅ `courses`
- ✅ `skills_gap`
- ✅ `skills_expansions`
- ✅ `recommendations`

---

## 🧪 Step 2: (Optional) Load Sample Data

If you want to test with sample data:

1. In Supabase SQL Editor
2. Open: `learnerAI/database/20251112_sample_backup.sql`
3. Copy and paste the contents
4. Click **Run**

This will create:
- 3 sample learners (Alice, Wajdan, Sarah)
- 3 sample courses
- 3 sample skills gaps
- 2 sample skills expansions
- 3 sample recommendations

---

## 🖥️ Step 3: Start Your Backend Server

```bash
cd backend
npm start
```

**Expected Output:**
```
✅ Dependencies initialized successfully
✅ API routes registered
🚀 LearnerAI Backend server running on port 5000
📍 Health check: http://localhost:5000/health
📍 API endpoint: http://localhost:5000/api
```

---

## 🧪 Step 4: Test the Endpoints

### Health Check
```bash
curl http://localhost:5000/health
```

### View All Endpoints
```bash
curl http://localhost:5000/api
```

### Test Creating a Learner
```bash
curl -X POST http://localhost:5000/api/v1/learners \
  -H "Content-Type: application/json" \
  -d '{
    "company_id": "c1d2e3f4-5678-9012-3456-789012345678",
    "company_name": "TechCorp Inc.",
    "user_name": "Test User",
    "decision_maker_policy": "auto"
  }'
```

### Test Getting All Learners
```bash
curl http://localhost:5000/api/v1/learners/company/c1d2e3f4-5678-9012-3456-789012345678
```

---

## 📋 Available Endpoints

### Learners
- `POST /api/v1/learners` - Create learner
- `GET /api/v1/learners/:userId` - Get learner
- `GET /api/v1/learners/company/:companyId` - Get by company
- `PUT /api/v1/learners/:userId` - Update learner
- `DELETE /api/v1/learners/:userId` - Delete learner

### Courses
- `POST /api/v1/courses` - Create course
- `GET /api/v1/courses/:courseId` - Get course
- `GET /api/v1/courses/user/:userId` - Get by user
- `GET /api/v1/courses/approved/:status` - Get by approval status
- `PUT /api/v1/courses/:courseId` - Update course
- `DELETE /api/v1/courses/:courseId` - Delete course

### Skills Gaps
- `POST /api/v1/skills-gaps` - Create skills gap
- `GET /api/v1/skills-gaps/:gapId` - Get skills gap
- `GET /api/v1/skills-gaps/user/:userId` - Get by user
- `GET /api/v1/skills-gaps/company/:companyId` - Get by company
- `GET /api/v1/skills-gaps/course/:courseId` - Get by course
- `GET /api/v1/skills-gaps/test-status/:status` - Get by test status
- `PUT /api/v1/skills-gaps/:gapId` - Update skills gap
- `DELETE /api/v1/skills-gaps/:gapId` - Delete skills gap

### Skills Expansions
- `POST /api/v1/skills-expansions` - Create expansion
- `GET /api/v1/skills-expansions/:expansionId` - Get expansion
- `GET /api/v1/skills-expansions?limit=50&offset=0` - Get all (paginated)
- `PUT /api/v1/skills-expansions/:expansionId` - Update expansion
- `DELETE /api/v1/skills-expansions/:expansionId` - Delete expansion

### Recommendations
- `POST /api/v1/recommendations` - Create recommendation
- `GET /api/v1/recommendations/:recommendationId` - Get recommendation
- `GET /api/v1/recommendations/user/:userId` - Get by user
- `GET /api/v1/recommendations/course/:baseCourseId` - Get by base course
- `GET /api/v1/recommendations/rag/:status` - Get by RAG status
- `PUT /api/v1/recommendations/:recommendationId` - Update recommendation
- `DELETE /api/v1/recommendations/:recommendationId` - Delete recommendation

---

## 📚 Documentation

- **Full API Documentation:** `backend/API_ENDPOINTS.md`
- **Database Schema:** `database/migrations/init_schema_migration.sql`
- **Sample Data:** `database/20251112_sample_backup.sql`

---

## 🔍 Troubleshooting

### Server won't start?
- Check that `.env` file has `SUPABASE_URL` and `SUPABASE_KEY`
- Verify database connection in Supabase dashboard

### Endpoints return 404?
- Make sure server is running
- Check that routes are registered (should see "✅ API routes registered" in console)

### Database errors?
- Verify migration ran successfully
- Check table names match exactly (case-sensitive)
- Ensure foreign key relationships are correct

---

## 🎯 What's Next?

After testing:
1. **Integrate with your microservices** - Start sending data to the endpoints
2. **Update frontend** - Connect UI to new endpoints if needed
3. **Add authentication** - Secure endpoints if required
4. **Add validation** - Enhance input validation as needed

---

**Ready to go!** 🚀

