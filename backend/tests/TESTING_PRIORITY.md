# Testing Priority Guide

## ✅ Currently Passing

1. **jobs-management.test.js** - ✅ All 4 tests passing
   - Job status retrieval
   - 404 handling
   - Completed status
   - Failed status

## 🔴 High Priority - Core Features (Test Next)

### 1. **repositories.test.js** - Database Layer
**Why first:** All other features depend on repositories working correctly.

**What to test:**
- Company CRUD operations
- Course/learning path storage
- Learner management
- Skills gap queries

**How to test:**
```bash
npm test -- tests/repositories.test.js
```

**Status:** Needs implementation - currently skeleton tests

---

### 2. **skills-gap-processing.test.js** - Skills Engine Integration
**Why important:** This is the entry point for learning path generation.

**What to test:**
- Processing new skills gaps from Skills Engine
- Updating existing gaps
- Filtering skills_raw_data
- Creating learners if they don't exist

**How to test:**
```bash
npm test -- tests/skills-gap-processing.test.js
```

**Status:** Failing - needs mock setup for ProcessSkillsGapUpdateUseCase

---

### 3. **learning-path-generation.test.js** - Core Feature
**Why critical:** This is the main feature - generating learning paths.

**What to test:**
- Job creation
- 3-prompt flow (Prompt 1, 2, 3)
- Approval workflow integration
- Exam failure update (skips approval)

**How to test:**
```bash
npm test -- tests/learning-path-generation.test.js
```

**Status:** Failing - needs SkillsExpansionRepository mocks

---

## 🟡 Medium Priority - Workflow Features

### 4. **approval-workflow.test.js** - Approval System
**What to test:**
- Auto vs manual approval
- Creating approval requests
- Approve/reject logic
- Distribution after approval

**How to test:**
```bash
npm test -- tests/approval-workflow.test.js
```

**Status:** Failing - needs implementation

---

### 5. **path-distribution.test.js** - Microservice Integration
**What to test:**
- Sending to Course Builder
- Updating Learning Analytics
- Updating Management Reports
- Error handling

**How to test:**
```bash
npm test -- tests/path-distribution.test.js
```

**Status:** Failing - needs implementation

---

### 6. **company-updates.test.js** - Directory Integration
**What to test:**
- Company registration
- Company updates
- Syncing learner data
- Approval policy changes

**How to test:**
```bash
npm test -- tests/company-updates.test.js
```

**Status:** Failing - needs implementation

---

## 🟢 Lower Priority - Secondary Features

### 7. **completion-detection.test.js**
**What to test:**
- Detecting course completions
- Triggering suggestions
- Status updates

### 8. **course-suggestions.test.js**
**What to test:**
- Generating suggestions with AI
- Sending to RAG microservice
- Storing recommendations

### 9. **api-routes.test.js**
**What to test:**
- API endpoint validation
- Request/response handling
- Error responses

---

## 🎯 Recommended Testing Order

1. **Start with repositories** - Foundation for everything else
2. **Then skills-gap-processing** - Entry point for data
3. **Then learning-path-generation** - Core feature
4. **Then approval-workflow** - Business logic
5. **Then path-distribution** - Integration
6. **Then company-updates** - Secondary integration
7. **Finally secondary features** - Completions, suggestions, API routes

---

## 📝 How to Fix Tests

### Step 1: Check What's Failing
```bash
npm test -- tests/[test-file].test.js
```

### Step 2: Read the Error Messages
Look for:
- Missing mocks
- Wrong function names
- Missing dependencies
- Type mismatches

### Step 3: Fix Mocks
Add missing mock methods:
```javascript
mockRepository = {
  methodName: jest.fn().mockResolvedValue(expectedValue)
};
```

### Step 4: Run Again
```bash
npm test -- tests/[test-file].test.js
```

### Step 5: Repeat Until Passing
Fix one error at a time, run tests, fix next error.

---

## 🛠️ Quick Fix Template

When a test fails with "is not a function":

1. Find the use case/class being tested
2. Check what methods it calls
3. Add those methods to your mocks:

```javascript
// Example: If GenerateLearningPathUseCase calls
// skillsExpansionRepository.createSkillsExpansion()

mockSkillsExpansionRepository = {
  createSkillsExpansion: jest.fn().mockResolvedValue({ id: 'exp-123' }),
  updateSkillsExpansion: jest.fn().mockResolvedValue({}),
  getSkillsExpansionById: jest.fn().mockResolvedValue(null)
};
```

---

## 📊 Test Coverage Goal

Aim for:
- **80%+ code coverage** for critical paths
- **All happy paths** tested
- **Key error cases** tested
- **Edge cases** where possible

Check coverage:
```bash
npm test -- --coverage
```

