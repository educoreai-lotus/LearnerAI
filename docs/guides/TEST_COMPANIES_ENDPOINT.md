# Testing Companies Endpoint in Postman

This guide shows you how to test the `/api/v1/companies/register` endpoint in Postman.

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

### 2. Check the Correct Port

**Important:** The backend runs on port **5000**, not 3000!

---

## 📝 Postman Request Configuration

### **Request Type:** `POST`

### **URL:**
```
http://localhost:5000/api/v1/companies/register
```

**Note:** Use port **5000**, not 3000!

---

## 📋 Headers

Add these headers in Postman:

| Header Name | Value |
|-------------|-------|
| `Content-Type` | `application/json` |
| `Authorization` | `Bearer YOUR_LEARNER_AI_SERVICE_TOKEN` (optional, if auth is required) |

---

## 📦 Request Body

Select **Body** tab → **raw** → **JSON**

### **Correct Format:**

```json
{
  "company_id": "550e8400-e29b-41d4-a716-446655440001",
  "company_name": "TechCorp Solutions",
  "approval_policy": "auto",
  "decision_maker": {
    "employee_id": "660e8400-e29b-41d4-a716-446655440001",
    "employee_name": "John Manager",
    "employee_email": "john@techcorp.com"
  }
}
```

### **For Manual Approval:**

```json
{
  "company_id": "550e8400-e29b-41d4-a716-446655440001",
  "company_name": "TechCorp Solutions",
  "approval_policy": "manual",
  "decision_maker": {
    "employee_id": "660e8400-e29b-41d4-a716-446655440001",
    "employee_name": "John Manager",
    "employee_email": "john@techcorp.com"
  }
}
```

### **For Auto Approval (decision_maker optional):**

```json
{
  "company_id": "550e8400-e29b-41d4-a716-446655440001",
  "company_name": "TechCorp Solutions",
  "approval_policy": "auto",
  "decision_maker": null
}
```

---

## ⚠️ Common Mistakes

### ❌ Wrong Port
```
http://localhost:3000/api/v1/companies/register  ❌
```
**Error:** `ECONNREFUSED 127.0.0.1:3000`

### ✅ Correct Port
```
http://localhost:5000/api/v1/companies/register  ✅
```

### ❌ Wrong company_id Format
```json
{
  "company_id": "13",  ❌ (should be UUID)
  ...
}
```

### ✅ Correct company_id Format
```json
{
  "company_id": "550e8400-e29b-41d4-a716-446655440001",  ✅
  ...
}
```

### ❌ Wrong decision_maker Format
```json
{
  "decision_maker": "null"  ❌ (string, not object)
}
```

### ✅ Correct decision_maker Format
```json
{
  "decision_maker": null  ✅ (null value)
}
```
OR
```json
{
  "decision_maker": {  ✅ (object)
    "employee_id": "uuid",
    "employee_name": "string",
    "employee_email": "string"
  }
}
```

---

## ✅ Expected Response

### **Success (200 OK):**

```json
{
  "message": "Company processed successfully",
  "company": {
    "company_id": "550e8400-e29b-41d4-a716-446655440001",
    "company_name": "TechCorp Solutions",
    "decision_maker_policy": "auto",
    "decision_maker": {
      "employee_id": "660e8400-e29b-41d4-a716-446655440001",
      "employee_name": "John Manager",
      "employee_email": "john@techcorp.com"
    }
  }
}
```

### **Error - Missing Fields (400 Bad Request):**

```json
{
  "error": "Missing required fields",
  "message": "company_id, company_name, and approval_policy are required"
}
```

### **Error - Invalid Policy (400 Bad Request):**

```json
{
  "error": "Invalid approval_policy",
  "message": "approval_policy must be \"auto\" or \"manual\""
}
```

### **Error - Missing Decision Maker (400 Bad Request):**

```json
{
  "error": "Missing decision_maker",
  "message": "decision_maker is required when approval_policy is \"manual\""
}
```

---

## 🧪 Step-by-Step in Postman

1. **Open Postman**
2. **Create New Request**
   - Click "New" → "HTTP Request"
3. **Set Method to POST**
   - Select "POST" from dropdown
4. **Enter URL**
   - `http://localhost:5000/api/v1/companies/register`
5. **Go to Headers Tab**
   - Add: `Content-Type: application/json`
6. **Go to Body Tab**
   - Select "raw"
   - Select "JSON" from dropdown
   - Paste the JSON body (see examples above)
7. **Click Send**

---

## 🔍 Verify It Worked

### Check Database:

```sql
SELECT * FROM companies 
WHERE company_id = '550e8400-e29b-41d4-a716-446655440001';
```

### Check Backend Logs:

You should see in your terminal:
```
✅ Company processed successfully
```

---

## 📝 Quick Test Examples

### Example 1: Auto Approval
```json
{
  "company_id": "550e8400-e29b-41d4-a716-446655440001",
  "company_name": "TechCorp Solutions",
  "approval_policy": "auto",
  "decision_maker": null
}
```

### Example 2: Manual Approval
```json
{
  "company_id": "550e8400-e29b-41d4-a716-446655440001",
  "company_name": "TechCorp Solutions",
  "approval_policy": "manual",
  "decision_maker": {
    "employee_id": "660e8400-e29b-41d4-a716-446655440001",
    "employee_name": "John Manager",
    "employee_email": "john@techcorp.com"
  }
}
```

---

## 🐛 Troubleshooting

### Error: `ECONNREFUSED 127.0.0.1:3000`
**Solution:** Change port to **5000** in the URL

### Error: `ECONNREFUSED 127.0.0.1:5000`
**Solution:** 
1. Make sure backend is running: `node server.js`
2. Check if port 5000 is available
3. Check backend logs for errors

### Error: `Missing required fields`
**Solution:** Make sure all required fields are present:
- `company_id` (UUID format)
- `company_name` (string)
- `approval_policy` ("auto" or "manual")

### Error: `Invalid approval_policy`
**Solution:** Use exactly `"auto"` or `"manual"` (lowercase, with quotes)

---

**Remember: Use port 5000, not 3000!** ✅

