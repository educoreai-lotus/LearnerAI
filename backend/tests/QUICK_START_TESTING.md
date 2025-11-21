# Quick Start: Testing Guide

## Current Status
- ✅ **1 test suite passing** (jobs-management)
- ❌ **9 test suites failing** (need fixes)
- **Total: 8 passing tests, 31 failing tests**

## 🚀 Start Here: Fix Repositories Tests

### Why First?
Repositories are the foundation - everything else depends on them.

### Step 1: Run the Test
```bash
npm test -- tests/repositories.test.js
```

### Step 2: Fix Missing Mocks

The test needs these repository methods mocked. Check the actual repository files to see what methods exist:

```bash
# Check what methods CompanyRepository has
cat src/infrastructure/repositories/CompanyRepository.js | grep "async"

# Check CourseRepository
cat src/infrastructure/repositories/CourseRepository.js | grep "async"
```

### Step 3: Update Test Mocks

In `tests/repositories.test.js`, make sure mocks have all required methods:

```javascript
mockSupabaseClient = {
  from: jest.fn(() => mockSupabaseClient),
  select: jest.fn(() => mockSupabaseClient),
  insert: jest.fn(() => mockSupabaseClient),
  update: jest.fn(() => mockSupabaseClient),
  eq: jest.fn(() => mockSupabaseClient),
  single: jest.fn().mockResolvedValue({
    data: { /* your test data */ },
    error: null
  })
};
```

---

## 🔧 Fix Learning Path Generation Tests

### The Problem
Tests are failing because `SkillsExpansionRepository` methods aren't mocked.

### The Fix

In `tests/learning-path-generation.test.js`, update the mock:

```javascript
mockSkillsExpansionRepository = {
  createSkillsExpansion: jest.fn().mockResolvedValue({ expansionId: 'exp-123' }),
  updateSkillsExpansion: jest.fn().mockResolvedValue({}),
  getSkillsExpansionById: jest.fn().mockResolvedValue(null),
  getSkillsExpansionsByGapId: jest.fn().mockResolvedValue([]),
  deleteSkillsExpansion: jest.fn().mockResolvedValue({})
};
```

### Run Test
```bash
npm test -- tests/learning-path-generation.test.js
```

---

## 📋 Common Test Fixes

### Fix 1: Missing Mock Methods

**Error:** `this.repository.methodName is not a function`

**Solution:** Add the method to your mock:
```javascript
mockRepository = {
  methodName: jest.fn().mockResolvedValue(expectedValue)
};
```

### Fix 2: Wrong Return Value

**Error:** `Expected X but received Y`

**Solution:** Check what the actual code expects and mock accordingly:
```javascript
// Check the actual use case to see what it expects
// Then mock the correct return value
mockRepository.methodName.mockResolvedValue({
  // Match the expected structure
  id: 'test-id',
  name: 'Test Name'
});
```

### Fix 3: Router Not Found

**Error:** `Route not found in router`

**Solution:** Make sure router is created fresh for each test:
```javascript
function createRouter() {
  return createRouterFunction({ dependencies });
}

it('should test route', async () => {
  const router = createRouter(); // Fresh router
  // ... test code
});
```

---

## 🎯 Testing Workflow

### 1. Pick a Test File
Start with `repositories.test.js` (foundation)

### 2. Run It
```bash
npm test -- tests/repositories.test.js
```

### 3. Read the First Error
Look at the first failing test and error message

### 4. Fix the Error
- Add missing mocks
- Fix return values
- Check method names

### 5. Run Again
```bash
npm test -- tests/repositories.test.js
```

### 6. Repeat
Fix one error at a time until all tests pass

### 7. Move to Next Test File
Once repositories pass, move to skills-gap-processing

---

## 📊 Test Progress Tracker

- [x] jobs-management.test.js - ✅ Passing
- [ ] repositories.test.js - 🔴 Next priority
- [ ] skills-gap-processing.test.js - 🔴 High priority
- [ ] learning-path-generation.test.js - 🔴 High priority
- [ ] approval-workflow.test.js - 🟡 Medium priority
- [ ] path-distribution.test.js - 🟡 Medium priority
- [ ] company-updates.test.js - 🟡 Medium priority
- [ ] completion-detection.test.js - 🟢 Lower priority
- [ ] course-suggestions.test.js - 🟢 Lower priority
- [ ] api-routes.test.js - 🟢 Lower priority

---

## 💡 Pro Tips

1. **Fix one test at a time** - Don't try to fix everything at once
2. **Read error messages carefully** - They tell you exactly what's wrong
3. **Check the actual code** - Look at the use case/repository to see what it needs
4. **Use `mockResolvedValueOnce`** - For tests that need specific values
5. **Run tests frequently** - After each fix, run the test again

---

## 🆘 Getting Help

If you're stuck:
1. Check the error message - it usually tells you what's missing
2. Look at the actual code being tested
3. Check `jobs-management.test.js` - it's working, use it as a reference
4. Compare your mocks with what the code actually calls

---

## ✅ Success Criteria

You're done when:
- All test suites pass
- You have >80% code coverage
- All critical paths are tested
- Error cases are handled

Check overall status:
```bash
npm test
```

Check coverage:
```bash
npm test -- --coverage
```

