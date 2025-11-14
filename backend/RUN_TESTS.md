# Running Tests

## Quick Start

### Run All Tests
```powershell
npm test
```

### Run Tests in Watch Mode (auto-rerun on changes)
```powershell
npm run test:watch
```

## Test Commands

### 1. Run All Tests
```powershell
cd C:\Users\win10\Desktop\lotus\learnerAI\learnerAI\backend
npm test
```

This will:
- Run all test files matching `**/__tests__/**/*.test.js`
- Show test results and coverage
- Exit when done

### 2. Watch Mode (Development)
```powershell
npm run test:watch
```

This will:
- Run tests automatically when files change
- Keep running until you stop it (Ctrl+C)
- Great for TDD workflow

### 3. Run Specific Test File
```powershell
npm test -- GenerateLearningPathUseCase.test.js
```

### 4. Run Tests with Coverage
```powershell
npm test -- --coverage
```

## Current Test Files

- `src/application/__tests__/GenerateLearningPathUseCase.test.js` - Tests for learning path generation use case

## Test Structure

Tests are located in `__tests__` directories:
```
backend/
  src/
    application/
      __tests__/
        GenerateLearningPathUseCase.test.js
    infrastructure/
      __tests__/
        (add tests here)
    api/
      routes/
        __tests__/
          (add route tests here)
```

## Writing New Tests

### Example Test File

```javascript
import { describe, it, expect, beforeEach } from '@jest/globals';

describe('MyFeature', () => {
  beforeEach(() => {
    // Setup before each test
  });

  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

## Test Configuration

Jest is configured in `jest.config.js`:
- Test environment: Node.js
- Test files: `**/__tests__/**/*.test.js`
- Coverage: Collected from `src/**/*.js`

## Troubleshooting

### Error: "Cannot find module"
Make sure you're in the `backend` directory:
```powershell
cd C:\Users\win10\Desktop\lotus\learnerAI\learnerAI\backend
```

### Error: "Jest not found"
Install dependencies:
```powershell
npm install
```

### Tests are slow
- Use `test:watch` for faster feedback during development
- Run specific test files instead of all tests

## Integration with CI/CD

Tests can be run in CI/CD pipelines:
```yaml
# Example GitHub Actions
- name: Run tests
  run: npm test
```

## Next Steps

1. **Run existing tests:**
   ```powershell
   npm test
   ```

2. **Add more tests:**
   - Create test files in `__tests__` directories
   - Follow the existing test patterns

3. **Check coverage:**
   ```powershell
   npm test -- --coverage
   ```

