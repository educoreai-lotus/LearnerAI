# Testing Learning Path Generation Endpoint in Postman

This guide shows you how to test the `/api/v1/learning-paths/generate` endpoint in Postman.

---

## 🔧 Setup

### 1. Make Sure Backend is Running

```powershell
cd backend
node server.js
```

You should see:
```
✅ API routes registered
🚀 Server running on port 5000
```

---

## 📝 Postman Request Configuration

### **Request Type:** `POST`

### **URL:**
```
http://localhost:5000/api/v1/learning-paths/generate
```

**Note:** Make sure there's only **one slash** after the port number (not `//api`)

---

## 📋 Headers

Add these headers in Postman:

| Header Name | Value |
|-------------|-------|
| `Content-Type` | `application/json` |

---

## 📦 Request Body

Select **Body** tab → **raw** → **JSON**

### **Required Fields:**
- `userId` (string, UUID)
- `companyId` (string, UUID)
- `competencyTargetName` (string)

### **Optional Fields:**
- `microSkills` (array, optional)
- `nanoSkills` (array, optional)

---

## ✅ Example Request Bodies

### **Example 1: Minimal Request (Required Fields Only)**

```json
{
  "userId": "a1b2c3d4-e5f6-4789-a012-345678901234",
  "companyId": "c1d2e3f4-5678-9012-3456-789012345678",
  "competencyTargetName": "JavaScript Basics"
}
```

### **Example 2: With Micro and Nano Skills**

```json
{
  "userId": "a1b2c3d4-e5f6-4789-a012-345678901234",
  "companyId": "c1d2e3f4-5678-9012-3456-789012345678",
  "competencyTargetName": "React Advanced",
  "microSkills": [
    {
      "id": "MGS_React_Hooks_Advanced",
      "name": "Advanced React Hooks"
    },
    {
      "id": "MGS_Context_API",
      "name": "React Context API"
    }
  ],
  "nanoSkills": [
    {
      "id": "MGS_Nano_1",
      "name": "useReducer Hook"
    },
    {
      "id": "MGS_Nano_2",
      "name": "Custom Hooks Pattern"
    }
  ]
}
```

### **Example 3: Using Mock Data UUIDs**

```json
{
  "userId": "a1b2c3d4-e5f6-4789-a012-345678901234",
  "companyId": "c1d2e3f4-5678-9012-3456-789012345678",
  "competencyTargetName": "JavaScript Fundamentals"
}
```

---

## ✅ Expected Response

### **Success (202 Accepted):**

```json
{
  "message": "Learning path generation started",
  "jobId": "550e8400-e29b-41d4-a716-446655440001",
  "status": "pending"
}
```

**Note:** This endpoint returns immediately with a `jobId`. The actual learning path generation happens in the background.

---

## 🔍 Check Job Status

After getting the `jobId`, check the job status:

### **Endpoint:**
```
GET http://localhost:5000/api/v1/jobs/{jobId}/status
```

### **Example:**
```
GET http://localhost:5000/api/v1/jobs/550e8400-e29b-41d4-a716-446655440001/status
```

### **Response (While Processing):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "status": "processing",
  "progress": 30,
  "currentStage": "skill-expansion"
}
```

### **Response (When Completed):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "status": "completed",
  "progress": 100,
  "currentStage": "completed",
  "result": {
    "learningPathId": "JavaScript Basics"
  }
}
```

---

## 📊 Job Progress Stages

The job will progress through these stages:

1. **`pending`** (0%) - Job created
2. **`processing`** → **`skill-expansion`** (10-30%) - Prompt 1 executing
3. **`processing`** → **`competency-identification`** (30-50%) - Prompt 2 executing
4. **`processing`** → **`skill-breakdown`** (50-70%) - Skills Engine integration
5. **`processing`** → **`path-creation`** (70-90%) - Prompt 3 executing
6. **`completed`** (100%) - Learning path saved

---

## 🧪 Step-by-Step in Postman

1. **Open Postman**
2. **Create New Request**
   - Click "New" → "HTTP Request"
3. **Set Method to POST**
   - Select "POST" from dropdown
4. **Enter URL**
   - `http://localhost:5000/api/v1/learning-paths/generate`
   - **Important:** Only one slash after port (not `//api`)
5. **Go to Headers Tab**
   - Add: `Content-Type: application/json`
6. **Go to Body Tab**
   - Select "raw"
   - Select "JSON" from dropdown
   - Paste one of the JSON examples above
7. **Click Send**

---

## 🔍 View the Generated Learning Path

After the job completes, view the learning path:

### **Via API:**
```
GET http://localhost:5000/api/v1/courses/user/{userId}
```

### **Via Database:**
```sql
SELECT 
  competency_target_name,
  user_id,
  learning_path
FROM courses
WHERE user_id = 'a1b2c3d4-e5f6-4789-a012-345678901234'
ORDER BY created_at DESC
LIMIT 1;
```

---

## ⚠️ Common Errors

### Error: `Missing required fields`
**Solution:** Make sure all required fields are present:
- `userId`
- `companyId`
- `competencyTargetName`

### Error: `ECONNREFUSED 127.0.0.1:5000`
**Solution:** 
1. Make sure backend is running: `node server.js`
2. Check if port 5000 is available

### Error: `Failed to start learning path generation`
**Solution:**
- Check backend logs for detailed error
- Verify Gemini API key is set
- Check Supabase connection

---

## 📝 Complete Test Flow

1. **Generate Learning Path**
   ```
   POST http://localhost:5000/api/v1/learning-paths/generate
   Body: { userId, companyId, competencyTargetName }
   ```
   → Get `jobId`

2. **Check Job Status** (Poll every 5-10 seconds)
   ```
   GET http://localhost:5000/api/v1/jobs/{jobId}/status
   ```
   → Wait for `status: "completed"`

3. **View Learning Path**
   ```
   GET http://localhost:5000/api/v1/courses/user/{userId}
   ```
   → See the generated learning path in `learning_path` field

---

## 💡 Tips

- The generation process takes **2-5 minutes** (3 Gemini prompts + Skills Engine call)
- Poll the job status endpoint to track progress
- Check backend terminal logs to see real-time progress
- The learning path is saved in the `courses` table with `competency_target_name` as the key

---

**Ready to test! Use the example JSON body above in Postman.** ✅

