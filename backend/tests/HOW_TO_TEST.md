# How to Run Tests

## Prerequisites

1. **Install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Ensure Node.js 20+ is installed:**
   ```bash
   node --version  # Should be 20.0.0 or higher
   ```

## Running Tests

### Run All Tests

```bash
npm test
```

This will:
- Run all test files in the `tests/` directory
- Show verbose output for each test
- Display a summary at the end

### Run Specific Test File

```bash
# Run a specific feature test
npm test -- tests/learning-path-generation.test.js

# Run API routes tests
npm test -- tests/api-routes.test.js

# Run approval workflow tests
npm test -- tests/approval-workflow.test.js
```

### Run Tests in Watch Mode

Automatically re-run tests when files change:

```bash
npm run test:watch
```

Press `a` to run all tests, or `p` to filter by filename pattern.

### Run Tests with Coverage

See which code is covered by tests:

```bash
npm test -- --coverage
```

This will:
- Run all tests
- Generate a coverage report
- Create a `coverage/` directory with HTML reports
- Show coverage summary in terminal

### Run Tests Matching a Pattern

```bash
# Run all tests matching "approval"
npm test -- --testNamePattern="approval"

# Run all tests in files matching "workflow"
npm test -- --testPathPattern="workflow"
```

## Test Files Available

1. **learning-path-generation.test.js** - Learning path generation (3-prompt flow)
2. **skills-gap-processing.test.js** - Skills gap processing from Skills Engine
3. **company-updates.test.js** - Company registration/updates
4. **approval-workflow.test.js** - Approval workflow (auto/manual)
5. **path-distribution.test.js** - Distributing paths to microservices
6. **course-suggestions.test.js** - Course suggestions generation
7. **completion-detection.test.js** - Course completion detection
8. **jobs-management.test.js** - Background job tracking
9. **api-routes.test.js** - API endpoint tests
10. **repositories.test.js** - Database repository tests

## Understanding Test Output

### Successful Test
```
✓ should create a job and return job ID (5ms)
✓ should validate required fields (2ms)
```

### Failed Test
```
✕ should create a job and return job ID (10ms)
  Error: Expected mock to have been called
```

### Test Summary
```
Test Suites: 10 passed, 10 total
Tests:       45 passed, 45 total
Time:        2.345 s
```

## Writing Tests

### Test Structure

```javascript
import { describe, it, expect, beforeEach, jest } from '@jest/globals';

describe('Feature: My Feature', () => {
  let useCase;
  let mockDependency;

  beforeEach(() => {
    // Setup mocks before each test
    mockDependency = {
      method: jest.fn()
    };
    
    useCase = new MyUseCase({
      dependency: mockDependency
    });
  });

  describe('Specific Functionality', () => {
    it('should do something', async () => {
      // Arrange
      mockDependency.method.mockResolvedValue({ data: 'test' });
      
      // Act
      const result = await useCase.execute();
      
      // Assert
      expect(result).toBeDefined();
      expect(mockDependency.method).toHaveBeenCalled();
    });
  });
});
```

### Using Test Helpers

```javascript
import { 
  createMockSkillsGap, 
  createMockLearningPath,
  testRoute 
} from './testHelpers.js';

// Use mock factories
const skillsGap = createMockSkillsGap({ userId: 'user-123' });

// Test Express routes
const { res } = await testRoute(router, 'get', '/:id', {
  params: { id: '123' }
});
```

## Troubleshooting

### Tests Not Found

If tests aren't being found:
1. Check `jest.config.js` has correct `testMatch` pattern
2. Ensure test files end with `.test.js`
3. Verify files are in `tests/` directory

### Import Errors

If you see import errors:
1. Check file paths use `.js` extension
2. Verify imports use correct relative paths from `tests/` folder
3. Example: `import { UseCase } from '../src/application/useCases/UseCase.js'`

### Module Not Found

If dependencies aren't found:
```bash
npm install
```

### ES Module Issues

Jest is configured for ES modules. Ensure:
- `package.json` has `"type": "module"`
- Imports use `.js` extension
- Jest uses `--experimental-vm-modules` flag (already in package.json)

## Next Steps

1. **Fill in test implementations** - The test files have structure but need actual test cases
2. **Add more test cases** - Cover edge cases and error scenarios
3. **Run tests regularly** - Use `npm run test:watch` during development
4. **Check coverage** - Aim for >80% code coverage

