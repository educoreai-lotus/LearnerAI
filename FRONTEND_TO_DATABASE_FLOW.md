# Frontend to Database Data Flow

This document explains how data flows from the frontend React components to the Supabase database.

## 📊 Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ 1. FRONTEND COMPONENT (React)                                    │
│    CompanyDashboard.jsx                                          │
│    - Calls: api.getLearnersByCompany(companyId)                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 2. API SERVICE (Frontend)                                        │
│    frontend/src/services/api.js                                   │
│    - Method: getLearnersByCompany(companyId)                     │
│    - Makes HTTP request: GET /api/v1/learners/company/:id      │
│    - Base URL: http://localhost:5000 (from env)                 │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼ HTTP Request
┌─────────────────────────────────────────────────────────────────┐
│ 3. BACKEND API ROUTE (Express.js)                                │
│    backend/src/api/routes/learners.js                            │
│    - Route: GET /api/v1/learners/company/:companyId              │
│    - Handler: router.get('/company/:companyId', ...)            │
│    - Calls: learnerRepository.getLearnersByCompany(companyId)    │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 4. REPOSITORY (Data Access Layer)                                │
│    backend/src/infrastructure/repositories/LearnerRepository.js  │
│    - Method: getLearnersByCompany(companyId)                     │
│    - Uses Supabase client to query database                      │
│    - SQL: SELECT * FROM learners WHERE company_id = ?            │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 5. DATABASE (Supabase/PostgreSQL)                                │
│    - Table: learners                                              │
│    - Returns: Array of learner records                            │
└─────────────────────────────────────────────────────────────────┘
                         │
                         ▼ Data flows back up
┌─────────────────────────────────────────────────────────────────┐
│ 6. REPOSITORY maps data to domain entities                       │
│    - _mapToLearner() transforms DB record to object              │
│    - Returns: Array of learner objects                           │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 7. API ROUTE formats response                                    │
│    - Wraps in JSON: { company_id, count, learners }              │
│    - Sends HTTP 200 response                                     │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼ HTTP Response
┌─────────────────────────────────────────────────────────────────┐
│ 8. API SERVICE receives response                                 │
│    - Parses JSON                                                 │
│    - Returns data to component                                   │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────────┐
│ 9. FRONTEND COMPONENT updates state                            │
│    - setUsers(userMap)                                           │
│    - React re-renders with new data                              │
└─────────────────────────────────────────────────────────────────┘
```

## 🔍 Step-by-Step Example: Getting Learners by Company

### Step 1: Frontend Component
**File:** `frontend/src/pages/CompanyDashboard.jsx`

```javascript
// Line 31: Component calls API service
const learnersResponse = await api.getLearnersByCompany(companyId);
const learners = learnersResponse.learners || [];
```

### Step 2: API Service
**File:** `frontend/src/services/api.js`

```javascript
// Line 77-79: API service method
async getLearnersByCompany(companyId) {
  return this.request(`/learners/company/${companyId}`);
}

// Line 14-41: Base request method
async request(endpoint, options = {}) {
  const url = `${this.baseUrl}${endpoint}`;  // http://localhost:5000/api/v1/learners/company/xxx
  const response = await fetch(url, config);
  const data = await response.json();
  return data;
}
```

**What happens:**
- Constructs URL: `http://localhost:5000/api/v1/learners/company/c1d2e3f4-5678-9012-3456-789012345678`
- Makes GET request
- Returns JSON response

### Step 3: Backend API Route
**File:** `backend/src/api/routes/learners.js`

```javascript
// Line 107-124: Express route handler
router.get('/company/:companyId', async (req, res) => {
  const { companyId } = req.params;  // Extract from URL
  const learners = await learnerRepository.getLearnersByCompany(companyId);
  
  res.json({
    company_id: companyId,
    count: learners.length,
    learners
  });
});
```

**What happens:**
- Express extracts `companyId` from URL parameter
- Calls repository method
- Formats response as JSON
- Sends HTTP 200 response

### Step 4: Repository (Database Access)
**File:** `backend/src/infrastructure/repositories/LearnerRepository.js`

```javascript
// Line 84-96: Repository method
async getLearnersByCompany(companyId) {
  const { data, error } = await this.client
    .from('learners')                    // Supabase table name
    .select('*')                         // Select all columns
    .eq('company_id', companyId)         // WHERE company_id = companyId
    .order('created_at', { ascending: false });  // ORDER BY created_at DESC

  if (error) {
    throw new Error(`Failed to get learners: ${error.message}`);
  }

  return data.map(item => this._mapToLearner(item));  // Transform to domain entity
}
```

**What happens:**
- Uses Supabase client to query PostgreSQL
- Executes: `SELECT * FROM learners WHERE company_id = ? ORDER BY created_at DESC`
- Maps database records to domain entities
- Returns array of learner objects

### Step 5: Database Query
**Actual SQL executed:**
```sql
SELECT * 
FROM learners 
WHERE company_id = 'c1d2e3f4-5678-9012-3456-789012345678'
ORDER BY created_at DESC;
```

**Returns:**
```json
[
  {
    "user_id": "a1b2c3d4-e5f6-4789-a012-345678901234",
    "company_id": "c1d2e3f4-5678-9012-3456-789012345678",
    "company_name": "TechCorp Inc.",
    "user_name": "Alice Johnson",
    "created_at": "2025-11-12T10:00:00Z",
    "last_modified_at": "2025-11-12T10:00:00Z"
  },
  {
    "user_id": "b2c3d4e5-f6a7-8901-2345-678901234567",
    "company_id": "c1d2e3f4-5678-9012-3456-789012345678",
    "company_name": "TechCorp Inc.",
    "user_name": "Sara Neer",
    "created_at": "2025-11-12T09:00:00Z",
    "last_modified_at": "2025-11-12T09:00:00Z"
  }
]
```

## 📁 Key Files to Understand

### Frontend Files:
1. **`frontend/src/pages/CompanyDashboard.jsx`** - React component that displays data
2. **`frontend/src/services/api.js`** - API service that makes HTTP requests

### Backend Files:
1. **`backend/src/api/routes/learners.js`** - Express routes for learner endpoints
2. **`backend/src/infrastructure/repositories/LearnerRepository.js`** - Database access layer
3. **`backend/server.js`** - Registers all routes

## 🔗 Other Data Flows

### Getting Courses by User:
```
CompanyDashboard.jsx
  → api.getCoursesByUser(userId)
  → GET /api/v1/courses/user/:userId
  → CourseRepository.getCoursesByUser(userId)
  → SELECT * FROM courses WHERE user_id = ?
```

### Getting Learning Paths:
```
UserView.jsx
  → api.getLearningPaths(userId)
  → GET /api/v1/learning-paths/:userId
  → LearningPathRepository.getLearningPathsByUser(userId)
  → SELECT * FROM courses WHERE user_id = ? (courses contain learning_path JSONB)
```

## 🛠️ How to Debug Data Flow

1. **Frontend Console:**
   - Open browser DevTools → Console
   - Look for API calls and responses
   - Check Network tab for HTTP requests

2. **Backend Logs:**
   - Check terminal where backend is running
   - Look for route handler logs
   - Check for database errors

3. **Database:**
   - Supabase Dashboard → Table Editor
   - View data directly in tables
   - Check SQL Editor for query logs

## 📝 Example: Complete Request/Response Cycle

**Request:**
```
GET http://localhost:5000/api/v1/learners/company/c1d2e3f4-5678-9012-3456-789012345678
```

**Response:**
```json
{
  "company_id": "c1d2e3f4-5678-9012-3456-789012345678",
  "count": 5,
  "learners": [
    {
      "user_id": "a1b2c3d4-e5f6-4789-a012-345678901234",
      "company_id": "c1d2e3f4-5678-9012-3456-789012345678",
      "company_name": "TechCorp Inc.",
      "user_name": "Alice Johnson"
    },
    {
      "user_id": "b2c3d4e5-f6a7-8901-2345-678901234567",
      "company_id": "c1d2e3f4-5678-9012-3456-789012345678",
      "company_name": "TechCorp Inc.",
      "user_name": "Sara Neer"
    }
    // ... more learners
  ]
}
```

