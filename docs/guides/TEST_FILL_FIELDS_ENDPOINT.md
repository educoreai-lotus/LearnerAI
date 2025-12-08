# Testing `/api/fill-content-metrics` Endpoint in Postman

## Overview
This endpoint allows other microservices to request data from LearnerAI. It follows a protocol where the requesting service sends a `serviceName` and a `payload` (stringified JSON), and LearnerAI fills in the missing fields from its database.

## Endpoint Details
- **URL**: `POST http://localhost:5000/api/fill-content-metrics`
- **Content-Type**: `application/json`

## Request Format
```json
{
  "serviceName": "Directory" | "SkillsEngine" | "LearningAnalytics" | "CourseBuilder" | "ManagementReporting",
  "payload": "<stringified JSON>"
}
```

## Response Format
```json
{
  "serviceName": "ServiceName",
  "payload": "<stringified JSON with filled data>"
}
```

---

## Test Cases

### 1. Directory Service

**Purpose**: Fill company and learner information

#### Test 1.1: Fill Company Data
```json
{
  "serviceName": "Directory",
  "payload": "{\"company_id\":\"550e8400-e29b-41d4-a716-446655440000\"}"
}
```

**Expected Response:**
```json
{
  "serviceName": "Directory",
  "payload": "{\"company_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"company_name\":\"Acme Corp\",\"decision_maker_policy\":\"auto\",\"decision_maker\":{\"name\":\"John Doe\",\"email\":\"john@acme.com\"}}"
}
```

#### Test 1.2: Fill Learner Data
**Request Body:**
```json
{
  "serviceName": "Directory",
  "payload": "{\"user_id\":\"123e4567-e89b-12d3-a456-426614174000\"}"
}
```

**Expected Response:**
```json
{
  "serviceName": "Directory",
  "payload": "{\"user_id\":\"123e4567-e89b-12d3-a456-426614174000\",\"user_name\":\"Jane Smith\",\"company_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"company_name\":\"Acme Corp\"}"
}
```

#### Test 1.3: Fill Both Company and Learner
**Request Body:**
```json
{
  "serviceName": "Directory",
  "payload": "{\"company_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"user_id\":\"123e4567-e89b-12d3-a456-426614174000\"}"
}
```

---

### 2. Skills Engine Service

**Purpose**: Fill competency, learning path, and skills gap information

#### Test 2.1: Fill Learning Path by Competency
**Request Body:**
```json
{
  "serviceName": "SkillsEngine",
  "payload": "{\"competency_target_name\":\"Advanced JavaScript\"}"
}
```

**Expected Response:**
```json
{
  "serviceName": "SkillsEngine",
  "payload": "{\"competency_target_name\":\"Advanced JavaScript\",\"learning_path\":{\"modules\":[...]},\"approved\":true,\"user_id\":\"123e4567-e89b-12d3-a456-426614174000\"}"
}
```

#### Test 2.2: Fill Skills Gap Data
**Request Body:**
```json
{
  "serviceName": "SkillsEngine",
  "payload": "{\"user_id\":\"123e4567-e89b-12d3-a456-426614174000\",\"competency_target_name\":\"Advanced JavaScript\"}"
}
```

**Expected Response:**
```json
{
  "serviceName": "SkillsEngine",
  "payload": "{\"user_id\":\"123e4567-e89b-12d3-a456-426614174000\",\"competency_target_name\":\"Advanced JavaScript\",\"gap_id\":\"789e0123-e45b-67c8-d901-234567890123\",\"skills_raw_data\":{\"skills\":[...]},\"exam_status\":\"pending\"}"
}
```

---

### 3. Learning Analytics Service

**Purpose**: Fill analytics data for users and courses

#### Test 3.1: Get All Courses for User (On-Demand Mode)
**Request Body:**
```json
{
  "serviceName": "LearningAnalytics",
  "payload": "{\"user_id\":\"123e4567-e89b-12d3-a456-426614174000\"}"
}
```

**Expected Response:**
```json
{
  "serviceName": "LearningAnalytics",
  "payload": "[{\"user_id\":\"123e4567-e89b-12d3-a456-426614174000\",\"user_name\":\"Jane Smith\",\"company_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"company_name\":\"Acme Corp\",\"competency_target_name\":\"Advanced JavaScript\",\"gap_id\":\"789e0123-e45b-67c8-d901-234567890123\",\"skills_raw_data\":{...},\"exam_status\":\"pending\"},{\"user_id\":\"123e4567-e89b-12d3-a456-426614174000\",\"user_name\":\"Jane Smith\",\"company_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"company_name\":\"Acme Corp\",\"competency_target_name\":\"React Development\",\"gap_id\":\"...\",\"skills_raw_data\":{...},\"exam_status\":\"completed\"}]"
}
```

**Note**: This returns an **array** of courses. The `learning_path` is **NOT** included in on-demand mode.

#### Test 3.2: Get Specific Course with Learning Path
**Request Body:**
```json
{
  "serviceName": "LearningAnalytics",
  "payload": "{\"user_id\":\"123e4567-e89b-12d3-a456-426614174000\",\"competency_target_name\":\"Advanced JavaScript\",\"include_learning_path\":true}"
}
```

**Expected Response:**
```json
{
  "serviceName": "LearningAnalytics",
  "payload": "{\"user_id\":\"123e4567-e89b-12d3-a456-426614174000\",\"user_name\":\"Jane Smith\",\"company_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"company_name\":\"Acme Corp\",\"competency_target_name\":\"Advanced JavaScript\",\"gap_id\":\"789e0123-e45b-67c8-d901-234567890123\",\"skills_raw_data\":{...},\"exam_status\":\"pending\",\"learning_path\":{\"modules\":[...]},\"approved\":true}"
}
```

#### Test 3.3: Get Specific Course Without Learning Path
**Request Body:**
```json
{
  "serviceName": "LearningAnalytics",
  "payload": "{\"user_id\":\"123e4567-e89b-12d3-a456-426614174000\",\"competency_target_name\":\"Advanced JavaScript\",\"include_learning_path\":false}"
}
```

---

### 4. Course Builder Service

**Purpose**: Fill learning path and user information for course building

#### Test 4.1: Fill Learning Path for Course Building
**Request Body:**
```json
{
  "serviceName": "CourseBuilder",
  "payload": "{\"competency_target_name\":\"Advanced JavaScript\"}"
}
```

**Expected Response:**
```json
{
  "serviceName": "CourseBuilder",
  "payload": "{\"competency_target_name\":\"Advanced JavaScript\",\"learning_path\":{\"modules\":[...]},\"user_id\":\"123e4567-e89b-12d3-a456-426614174000\",\"approved\":true}"
}
```

#### Test 4.2: Fill User Info for Course Building
**Request Body:**
```json
{
  "serviceName": "CourseBuilder",
  "payload": "{\"user_id\":\"123e4567-e89b-12d3-a456-426614174000\",\"competency_target_name\":\"Advanced JavaScript\"}"
}
```

**Expected Response:**
```json
{
  "serviceName": "CourseBuilder",
  "payload": "{\"user_id\":\"123e4567-e89b-12d3-a456-426614174000\",\"competency_target_name\":\"Advanced JavaScript\",\"learning_path\":{\"modules\":[...]},\"approved\":true,\"user_name\":\"Jane Smith\",\"company_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"company_name\":\"Acme Corp\"}"
}
```

---

### 5. Management Reporting Service

**Purpose**: Fill company statistics and learner progress data

#### Test 5.1: Fill Company Stats
**Request Body:**
```json
{
  "serviceName": "ManagementReporting",
  "payload": "{\"company_id\":\"550e8400-e29b-41d4-a716-446655440000\"}"
}
```

**Expected Response:**
```json
{
  "serviceName": "ManagementReporting",
  "payload": "{\"company_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"company_name\":\"Acme Corp\",\"decision_maker_policy\":\"auto\"}"
}
```

#### Test 5.2: Fill Learner Progress
**Request Body:**
```json
{
  "serviceName": "ManagementReporting",
  "payload": "{\"user_id\":\"123e4567-e89b-12d3-a456-426614174000\"}"
}
```

**Expected Response:**
```json
{
  "serviceName": "ManagementReporting",
  "payload": "{\"user_id\":\"123e4567-e89b-12d3-a456-426614174000\",\"courses_count\":5,\"approved_courses_count\":3}"
}
```

#### Test 5.3: Fill Both Company and Learner Data
**Request Body:**
```json
{
  "serviceName": "ManagementReporting",
  "payload": "{\"company_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"user_id\":\"123e4567-e89b-12d3-a456-426614174000\"}"
}
```

---

## Postman Setup Instructions

### Step 1: Create a New Request
1. Open Postman
2. Click **New** → **HTTP Request**
3. Set method to **POST** (from the dropdown on the left)
4. **Important**: In the URL field, enter ONLY: `http://localhost:5000/api/fill-content-metrics`
   - Do NOT include "POST" in the URL field
   - Make sure there are no spaces before or after the URL
   - Type it manually or copy-paste carefully

### Step 2: Configure Headers
1. Go to **Headers** tab
2. Add header:
   - **Key**: `Content-Type`
   - **Value**: `application/json`

### Step 3: Configure Body
1. Go to **Body** tab
2. Select **raw**
3. Select **JSON** from dropdown
4. Paste one of the request body examples above

### Step 4: Send Request
1. Click **Send**
2. Check the response in the bottom panel

---

## Important Notes

### 1. Payload Must Be Stringified
The `payload` field must be a **string** containing JSON, not a JSON object. For example:

✅ **Correct:**
```json
{
  "serviceName": "Directory",
  "payload": "{\"company_id\":\"550e8400-e29b-41d4-a716-446655440000\"}"
}
```

❌ **Incorrect:**
```json
{
  "serviceName": "Directory",
  "payload": {
    "company_id": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### 2. Response Payload is Also Stringified
The response `payload` is a stringified JSON. You'll need to parse it:
```javascript
const response = JSON.parse(result.payload);
```

### 3. Learning Analytics Returns Array
When requesting all courses for a user (only `user_id` provided), Learning Analytics returns an **array** in the payload, not an object.

### 4. Learning Path Not Included by Default
For Learning Analytics, `learning_path` is **NOT** included unless:
- `competency_target_name` is provided AND
- `include_learning_path` is not `false`

### 5. UUID Format
All IDs should be valid UUIDs. Use the format: `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`

---

## Error Responses

### Invalid JSON in Payload
**Status**: `400 Bad Request`
```json
{
  "error": "Invalid JSON",
  "details": "Unexpected token ..."
}
```

### Unknown Service Name
**Status**: `400 Bad Request`
```json
{
  "error": "Unknown serviceName",
  "message": "Unknown service: InvalidService. Supported services: Directory, SkillsEngine, LearningAnalytics, CourseBuilder, ManagementReporting"
}
```

### Internal Server Error
**Status**: `500 Internal Server Error`
```json
{
  "error": "Internal Fill Error",
  "details": "Error message here",
  "serviceName": "Directory"
}
```

---

## Quick Test Checklist

- [ ] Test Directory with `company_id`
- [ ] Test Directory with `user_id`
- [ ] Test Skills Engine with `competency_target_name`
- [ ] Test Skills Engine with `user_id` + `competency_target_name`
- [ ] Test Learning Analytics with only `user_id` (returns array)
- [ ] Test Learning Analytics with `user_id` + `competency_target_name` + `include_learning_path: true`
- [ ] Test Course Builder with `competency_target_name`
- [ ] Test Course Builder with `user_id` + `competency_target_name`
- [ ] Test Management Reporting with `company_id`
- [ ] Test Management Reporting with `user_id`
- [ ] Test error case: Invalid JSON in payload
- [ ] Test error case: Unknown serviceName

---

## Example: Complete Postman Collection JSON

You can import this into Postman:

```json
{
  "info": {
    "name": "LearnerAI Fill Fields",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Directory - Fill Company",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"serviceName\": \"Directory\",\n  \"payload\": \"{\\\"company_id\\\":\\\"550e8400-e29b-41d4-a716-446655440000\\\"}\"\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/fill-content-metrics",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "fill-content-metrics"]
        }
      }
    },
    {
      "name": "Skills Engine - Fill Learning Path",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"serviceName\": \"SkillsEngine\",\n  \"payload\": \"{\\\"competency_target_name\\\":\\\"Advanced JavaScript\\\"}\"\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/fill-content-metrics",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "fill-content-metrics"]
        }
      }
    },
    {
      "name": "Learning Analytics - Get All Courses",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"serviceName\": \"LearningAnalytics\",\n  \"payload\": \"{\\\"user_id\\\":\\\"123e4567-e89b-12d3-a456-426614174000\\\"}\"\n}"
        },
        "url": {
          "raw": "http://localhost:5000/api/fill-content-metrics",
          "protocol": "http",
          "host": ["localhost"],
          "port": "5000",
          "path": ["api", "fill-content-metrics"]
        }
      }
    }
  ]
}
```

Save this as a `.json` file and import it into Postman via **Import** → **Upload Files**.

---

## Troubleshooting Common Errors

### Error: "Invalid protocol: post http:"

This error occurs when Postman misinterprets the URL. Here's how to fix it:

#### Solution 1: Clear and Re-enter URL
1. **Select the entire URL field** (Ctrl+A or Cmd+A)
2. **Delete everything**
3. **Type the URL manually**: `http://localhost:5000/api/fill-content-metrics`
4. Make sure there are **no spaces** before or after
5. Press **Enter** or click outside the field

#### Solution 2: Check Method Dropdown
1. Make sure the **method dropdown** (left of URL) shows **POST**
2. The URL field should **only** contain: `http://localhost:5000/api/fill-content-metrics`
3. Do NOT put "POST" in the URL field itself

#### Solution 3: Use Full URL Format
If the error persists, try:
1. Click the **Params** tab and make sure it's empty
2. In the URL field, use the full URL: `http://localhost:5000/api/fill-content-metrics`
3. Do NOT use variables or environment variables initially

#### Solution 4: Check Postman Settings
1. Go to **Settings** (gear icon) → **General**
2. Make sure **SSL certificate verification** is enabled
3. Try disabling **Proxy** if enabled
4. Restart Postman

#### Solution 5: Create New Request
1. Create a **completely new request**
2. Set method to **POST** first
3. Then enter the URL: `http://localhost:5000/api/fill-content-metrics`
4. Configure headers and body

### Error: "Could not get response"

#### Check if Server is Running
1. Open a browser and go to: `http://localhost:5000/health`
2. You should see: `{"status":"ok",...}`
3. If not, start your backend server:
   ```bash
   cd backend
   npm start
   ```

#### Check Port Number
- Make sure your backend is running on port **5000**
- If using a different port, update the URL accordingly

### Error: "Invalid JSON" in Response

This means the `payload` field is not properly stringified. Make sure:

✅ **Correct format:**
```json
{
  "serviceName": "Directory",
  "payload": "{\"company_id\":\"550e8400-e29b-41d4-a716-446655440000\"}"
}
```

The `payload` value is a **string** (notice the outer quotes), and the inner JSON has escaped quotes (`\"`).

### Error: "Unknown serviceName"

Make sure the `serviceName` is exactly one of:
- `Directory` (capital D)
- `SkillsEngine` (capital S, capital E)
- `LearningAnalytics` (capital L, capital A)
- `CourseBuilder` (capital C, capital B)
- `ManagementReporting` (capital M, capital R)

Case-sensitive!

---

## Sending Null or Empty JSON Values

### Option 1: Send `null` as the payload value

If you want to send `null` as the payload (the endpoint will try to parse it):

```json
{
  "serviceName": "Directory",
  "payload": "null"
}
```

**Note**: This will likely cause an error because `JSON.parse("null")` returns `null`, and the endpoint expects an object.

### Option 2: Send an empty JSON object `{}`

To send an empty object (no fields):

```json
{
  "serviceName": "Directory",
  "payload": "{}"
}
```

This is valid and will return the same empty object (or filled if the service adds fields).

### Option 3: Send a JSON object with null fields

To send a JSON object where specific fields are `null`:

```json
{
  "serviceName": "Directory",
  "payload": "{\"company_id\":null,\"user_id\":null}"
}
```

Or with some fields null and others with values:

```json
{
  "serviceName": "Directory",
  "payload": "{\"company_id\":\"550e8400-e29b-41d4-a716-446655440000\",\"user_id\":null}"
}
```

### Option 4: Send a JSON object with empty string

If you want to test with empty strings:

```json
{
  "serviceName": "Directory",
  "payload": "{\"company_id\":\"\",\"user_id\":\"\"}"
}
```

### Examples for Different Services

#### Directory Service - Empty Object
```json
{
  "serviceName": "Directory",
  "payload": "{}"
}
```

#### Skills Engine - Null Competency
```json
{
  "serviceName": "SkillsEngine",
  "payload": "{\"competency_target_name\":null}"
}
```

#### Learning Analytics - Empty User Request
```json
{
  "serviceName": "LearningAnalytics",
  "payload": "{\"user_id\":null}"
}
```

**Note**: This will return an empty array `[]` based on the endpoint logic.

### Important Notes

1. **`null` vs `"null"`**: 
   - `null` (without quotes) is a JSON null value
   - `"null"` (with quotes) is a string containing the word "null"

2. **In Postman**: When you type `null` in the JSON body, Postman will automatically format it correctly (without quotes).

3. **Stringified Payload**: Remember, the `payload` field must always be a **string**, so:
   - Empty object: `"payload": "{}"`
   - Null value: `"payload": "null"` (this is a string, not JSON null)
   - Object with null: `"payload": "{\"field\":null}"`

4. **Expected Behavior**: 
   - Empty object `{}` will be filled with available data
   - `null` as payload will likely cause a parsing error
   - Fields with `null` values will be replaced with actual data if available

