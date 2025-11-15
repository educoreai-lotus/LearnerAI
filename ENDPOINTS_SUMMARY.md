# Microservices Endpoints Summary

This document lists all endpoints for microservice communication as documented in `MICROSERVICES_COMMUNICATION.md`.

---

## ✅ Incoming Endpoints (Other Services → LearnerAI)

### 1. Directory Microservice
**Endpoint:** `POST /api/v1/companies/register`
- **Status:** ✅ **IMPLEMENTED**
- **Route File:** `backend/src/api/routes/companies.js`
- **Registered in:** `server.js` line 246
- **Use Case:** `ProcessCompanyUpdateUseCase`

### 2. Skills Engine Microservice (Type 1)
**Endpoint:** `POST /api/v1/skills-gaps`
- **Status:** ✅ **IMPLEMENTED**
- **Route File:** `backend/src/api/routes/skillsGaps.js`
- **Registered in:** `server.js` line 254
- **Use Case:** `ProcessSkillsGapUpdateUseCase`

---

## ✅ Outgoing Endpoints (LearnerAI → Other Services)

### 3. Skills Engine Microservice (Type 2)
**Endpoint:** `POST {SKILLS_ENGINE_URL}/api/skills/breakdown`
- **Status:** ✅ **IMPLEMENTED**
- **Client:** `SkillsEngineClient` (`backend/src/infrastructure/clients/SkillsEngineClient.js`)
- **Method:** `requestSkillBreakdown(competencies, options)`
- **Used in:** `GenerateLearningPathUseCase`
- **Request Format:** Simple array of competency names: `["Competency_Name_1", "Competency_Name_2"]`

### 4. Learning Analytics Microservice
**Endpoint:** `POST {ANALYTICS_URL}/api/v1/paths/update`
- **Status:** ✅ **IMPLEMENTED**
- **Client:** `AnalyticsClient` (`backend/src/infrastructure/clients/AnalyticsClient.js`)
- **Method:** `updatePathAnalytics(pathData)`
- **Used in:** `DistributePathUseCase`
- **Payload Includes:** `user_id`, `user_name`, `company_id`, `company_name`, `competency_target_name`, `gap_id`, `skills_raw_data`, `exam_status`, `learning_path`

### 5. Course Builder Microservice
**Endpoint:** `POST {COURSE_BUILDER_URL}/api/v1/learning-paths`
- **Status:** ✅ **IMPLEMENTED**
- **Client:** `CourseBuilderClient` (`backend/src/infrastructure/clients/CourseBuilderClient.js`)
- **Method:** `sendLearningPath(learningPath)`
- **Used in:** `DistributePathUseCase`
- **Payload Includes:** `user_id`, `user_name`, `company_id`, `company_name`, `competency_target_name`, `learning_path`

---

## 📋 Complete Endpoint List

| # | Microservice | Direction | Endpoint | Status |
|---|--------------|-----------|----------|--------|
| 1 | **Directory** | Incoming | `POST /api/v1/companies/register` | ✅ Implemented |
| 2 | **Skills Engine** | Incoming | `POST /api/v1/skills-gaps` | ✅ Implemented |
| 3 | **Skills Engine** | Outgoing | `POST {SKILLS_ENGINE_URL}/api/skills/breakdown` | ✅ Implemented |
| 4 | **Learning Analytics** | Outgoing | `POST {ANALYTICS_URL}/api/v1/paths/update` | ✅ Implemented |
| 5 | **Course Builder** | Outgoing | `POST {COURSE_BUILDER_URL}/api/v1/learning-paths` | ✅ Implemented |

---

## 🔍 Verification

All endpoints from `MICROSERVICES_COMMUNICATION.md` are **fully implemented** in the codebase:

✅ **Incoming Endpoints:**
- Directory company registration route exists and is registered
- Skills Engine skills gap route exists and is registered

✅ **Outgoing Endpoints:**
- Skills Engine client sends to correct endpoint
- Learning Analytics client sends to correct endpoint
- Course Builder client sends to correct endpoint

✅ **All clients use correct:**
- HTTP methods (POST)
- Headers (Authorization Bearer tokens)
- Request body formats (as documented)

---

## 🚀 Ready to Use

All microservice communication endpoints are **ready to use**. Just configure the environment variables:

```env
# Incoming (what other services use to call LearnerAI)
LEARNER_AI_SERVICE_TOKEN=your-learner-ai-token

# Outgoing (what LearnerAI uses to call other services)
SKILLS_ENGINE_URL=http://localhost:5001
SKILLS_ENGINE_TOKEN=your-skills-engine-token

ANALYTICS_URL=http://localhost:5003
ANALYTICS_TOKEN=your-analytics-token

COURSE_BUILDER_URL=http://localhost:5002
COURSE_BUILDER_TOKEN=your-course-builder-token
```

---

**All endpoints match the documentation perfectly!** ✅

