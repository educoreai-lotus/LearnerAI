# Fill-Fields Endpoints Documentation

This document describes the fill-fields protocol implementation for LearnerAI microservice communication.

---

## 📋 Overview

LearnerAI implements two types of endpoints:

1. **Incoming Fill-Fields Endpoint**: Receives requests from other microservices to fill data
2. **Outgoing Fill-Fields Clients**: Sends requests to other microservices to fill data

---

## 1️⃣ Incoming Fill-Fields Endpoint

### **Endpoint (in LearnerAI)**
```
POST /api/fill-content-metrics
```

### **Protocol**
- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "serviceName": "Directory" | "SkillsEngine" | "LearningAnalytics" | "CourseBuilder" | "ManagementReporting",
    "payload": "<stringified JSON>"
  }
  ```
- **Response**:
  ```json
  {
    "serviceName": "Directory",
    "payload": "<stringified JSON with filled fields>"
  }
  ```

### **Supported Services**

#### **Directory**
Fills:
- `company_name` (from `companies` table)
- `decision_maker_policy` (from `companies` table)
- `decision_maker` (from `companies` table)
- `user_name` (from `learners` table)
- `company_id`, `company_name` (from `learners` table)

**Example Request:**
```json
{
  "serviceName": "Directory",
  "payload": "{\"company_id\":\"uuid\",\"company_name\":\"\",\"decision_maker_policy\":null}"
}
```

#### **Skills Engine**
Fills:
- `learning_path` (from `courses` table)
- `approved` (from `courses` table)
- `user_id` (from `courses` table)
- `gap_id` (from `skills_gap` table)
- `skills_raw_data` (from `skills_gap` table)
- `exam_status` (from `skills_gap` table)

**Example Request:**
```json
{
  "serviceName": "SkillsEngine",
  "payload": "{\"competency_target_name\":\"React Hooks\",\"learning_path\":null,\"approved\":null}"
}
```

#### **Learning Analytics**
Fills user analytics data (on-demand mode).

**Note:** LearnerAI does NOT send `learning_path` unless Learning Analytics specifically requests it.

**If only `user_id` is provided:**
- Returns array of all courses for that user (without `learning_path`)
- Includes: `user_id`, `user_name`, `company_id`, `company_name`, `competency_target_name`, `gap_id`, `skills_raw_data`, `exam_status`

**If `user_id` + `competency_target_name` is provided:**
- Returns specific course data (with `learning_path` if `include_learning_path` is not false)

**Example Request (get all courses for user):**
```json
{
  "serviceName": "LearningAnalytics",
  "payload": "{\"user_id\":\"uuid\"}"
}
```

**Example Request (get specific course with learning_path):**
```json
{
  "serviceName": "LearningAnalytics",
  "payload": "{\"user_id\":\"uuid\",\"competency_target_name\":\"React Hooks\",\"include_learning_path\":true}"
}
```

#### **Course Builder**
Fills:
- `learning_path` (from `courses` table)
- `user_id` (from `courses` table)
- `user_name` (from `skills_gap` table)
- `company_id` (from `skills_gap` table)
- `company_name` (from `skills_gap` table)
- `approved` (from `courses` table)

**Example Request:**
```json
{
  "serviceName": "CourseBuilder",
  "payload": "{\"competency_target_name\":\"React Hooks\",\"learning_path\":null,\"user_id\":\"\",\"user_name\":\"\"}"
}
```

#### **Management Reporting**
Fills:
- `company_name` (from `companies` table)
- `decision_maker_policy` (from `companies` table)
- `courses_count` (count from `courses` table)
- `approved_courses_count` (count from `courses` table where `approved = true`)

**Example Request:**
```json
{
  "serviceName": "ManagementReporting",
  "payload": "{\"company_id\":\"uuid\",\"company_name\":\"\",\"courses_count\":null}"
}
```

---

## 2️⃣ Outgoing Fill-Fields Clients

LearnerAI can request data from other microservices using fill-fields clients.

### **Available Clients**

1. **DirectoryClient** (`backend/src/infrastructure/clients/DirectoryClient.js`)
   - `fetchCompanyData(companyId)` - Fills company information
   - `fetchLearnerData(userId)` - Fills learner information

2. **SkillsEngineFillClient** (`backend/src/infrastructure/clients/SkillsEngineFillClient.js`)
   - `fetchLearningPathData(competencyTargetName)` - Fills learning path data
   - `fetchSkillsGapData(userId, competencyTargetName)` - Fills skills gap data

3. **LearningAnalyticsFillClient** (`backend/src/infrastructure/clients/LearningAnalyticsFillClient.js`)
   - `fetchAnalyticsData(userId, competencyTargetName)` - Fills analytics data

4. **CourseBuilderFillClient** (`backend/src/infrastructure/clients/CourseBuilderFillClient.js`)
   - `fetchCourseData(competencyTargetName, userId)` - Fills course data

5. **ManagementReportingFillClient** (`backend/src/infrastructure/clients/ManagementReportingFillClient.js`)
   - `fetchCompanyReportingData(companyId)` - Fills company reporting data
   - `fetchUserReportingData(userId)` - Fills user reporting data

### **Client Usage Pattern**

All clients follow the same pattern:

```javascript
// Initialize client
const client = new DirectoryClient({
  baseUrl: process.env.DIRECTORY_URL,
  serviceToken: process.env.DIRECTORY_TOKEN,
  httpClient: new HttpClient()
});

// Send request with null/empty fields
const payload = {
  company_id: 'uuid',
  company_name: '',
  decision_maker_policy: null
};

// Client sends to: POST {DIRECTORY_URL}/api/fill-directory-fields
// Body: serviceName="LearnerAI" + payload=JSON.stringify(payload)
// Response: { serviceName: "LearnerAI", payload: "<filled JSON>" }
const filledData = await client.sendRequest(payload);
```

### **Rollback Behavior**

All clients implement rollback behavior:
- If microservice is unavailable → Returns mock data
- If request fails → Returns mock data
- If response is invalid → Returns mock data
- Logs warnings but never throws errors

---

## 🔧 Implementation Details

### **Route Registration**
- **File**: `backend/src/api/routes/endpoints.js`
- **Registered in**: `backend/server.js` line 263
- **Route**: `/api/fill-content-metrics`

### **Client Files Location**
- `backend/src/infrastructure/clients/DirectoryClient.js`
- `backend/src/infrastructure/clients/SkillsEngineFillClient.js`
- `backend/src/infrastructure/clients/LearningAnalyticsFillClient.js`
- `backend/src/infrastructure/clients/CourseBuilderFillClient.js`
- `backend/src/infrastructure/clients/ManagementReportingFillClient.js`

### **HttpClient Support**
- Updated `HttpClient.js` to support `application/x-www-form-urlencoded` content type
- Automatically handles JSON vs form-urlencoded based on Content-Type header

---

## 📝 Example Usage

### **Example 1: Directory requests company data from LearnerAI**

```bash
curl -X POST http://learner-ai-url/api/fill-content-metrics \
  -H "Content-Type: application/json" \
  -d '{
    "serviceName": "Directory",
    "payload": "{\"company_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"company_name\":\"\",\"decision_maker_policy\":null}"
  }'
```

**Response:**
```json
{
  "serviceName": "Directory",
  "payload": "{\"company_id\":\"550e8400-e29b-41d4-a716-446655440001\",\"company_name\":\"TechCorp Inc.\",\"decision_maker_policy\":\"auto\",\"decision_maker\":null}"
}
```

### **Example 2: LearnerAI requests company data from Directory**

```javascript
import { DirectoryClient } from './infrastructure/clients/DirectoryClient.js';

const directoryClient = new DirectoryClient({
  baseUrl: process.env.DIRECTORY_URL,
  serviceToken: process.env.DIRECTORY_TOKEN,
  httpClient: new HttpClient()
});

const companyData = await directoryClient.fetchCompanyData('550e8400-e29b-41d4-a716-446655440001');
// Returns: { company_id, company_name, decision_maker_policy, decision_maker }
```

---

## ✅ Error Handling

- **Invalid JSON**: Returns 400 with error message
- **Unknown serviceName**: Returns 400 with list of supported services
- **Database errors**: Returns 500 with error details
- **Missing repositories**: Gracefully handles null repositories (returns original data)

---

## 🔐 Authentication

The fill-fields endpoint does not require authentication by default, but can be secured by adding middleware to the route if needed.

Clients send authentication tokens when calling other microservices:
- `Authorization: Bearer {SERVICE_TOKEN}` header

---

**This implementation follows the same pattern as Content Studio's fill-fields protocol!** ✅

