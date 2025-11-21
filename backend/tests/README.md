# Tests Directory

This directory contains **all** feature-based tests organized by functionality.

## Why Centralized Tests?

✅ **Single location** - All tests in one place, easy to find  
✅ **Feature-based organization** - Tests grouped by business feature, not code structure  
✅ **Better for integration tests** - Tests that span multiple modules are easier to organize  
✅ **Cleaner src/ directory** - Source code stays focused on implementation  

## Test Structure

Each test file focuses on a specific feature or use case:

- **learning-path-generation.test.js** - Tests for learning path generation (3-prompt flow)
- **skills-gap-processing.test.js** - Tests for processing skills gap updates from Skills Engine
- **company-updates.test.js** - Tests for processing company registration/updates from Directory
- **approval-workflow.test.js** - Tests for approval workflow (auto/manual, approve/reject)
- **path-distribution.test.js** - Tests for distributing paths to Course Builder and Analytics
- **course-suggestions.test.js** - Tests for generating course suggestions after completion
- **completion-detection.test.js** - Tests for detecting course completions
- **jobs-management.test.js** - Tests for background job status tracking
- **api-routes.test.js** - Tests for API endpoints (skills gaps, courses, learners, etc.)
- **repositories.test.js** - Tests for repository layer (database operations)

## Quick Start

```bash
# From backend directory
cd backend

# Run all tests
npm test

# Run specific test file
npm test -- tests/learning-path-generation.test.js

# Run tests in watch mode (auto-rerun on changes)
npm run test:watch

# Run with coverage report
npm test -- --coverage
```

See **[HOW_TO_TEST.md](HOW_TO_TEST.md)** for detailed testing instructions.

## 🎯 What to Test Next?

**Current Status:** 1/10 test suites passing (jobs-management)

**Recommended Order:**
1. **repositories.test.js** - Foundation (start here)
2. **skills-gap-processing.test.js** - Entry point
3. **learning-path-generation.test.js** - Core feature
4. **approval-workflow.test.js** - Business logic
5. **path-distribution.test.js** - Integration

See **[TESTING_PRIORITY.md](TESTING_PRIORITY.md)** for full priority list and **[QUICK_START_TESTING.md](QUICK_START_TESTING.md)** for step-by-step fixes.

## Test Helpers

- `testHelpers.js` - Shared utilities for testing (mocks, fixtures, etc.)

## Migration Complete ✅

All tests have been consolidated from `src/**/__tests__/` folders into this centralized `tests/` directory. The old `__tests__` folders have been removed to keep the codebase clean and organized.

