# SubmitSmart Test Suite

Production-ready test framework powered by Playwright for E2E, API, and integration testing.

---

## Quick Start

### Installation

```bash
# Install dependencies
npm install

# Install Playwright browsers
npx playwright install
```

### Running Tests

```bash
# Run all tests
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Run specific file
npm run test:e2e -- tests/e2e/anonymous-auth.spec.ts

# Run with UI mode (interactive debugging)
npm run test:e2e -- --ui

# Debug specific test
npm run test:e2e -- tests/e2e/session-persistence.spec.ts --debug

# Run by priority tag
npm run test:e2e -- --grep "@P0"    # Critical paths only
npm run test:e2e -- --grep "@P1"    # High priority
npm run test:e2e -- --grep "@P0|@P1"  # P0 + P1
```

### View Test Reports

```bash
# Open HTML report
npx playwright show-report test-results/html
```

---

## Directory Structure

```
tests/
├── e2e/                      # End-to-end tests
│   └── *.spec.ts            # Test files
├── api/                      # API integration tests
│   └── *.api.spec.ts        # API test files
├── support/                  # Test infrastructure
│   ├── fixtures/            # Test fixtures
│   │   ├── index.ts        # Fixture definitions
│   │   └── factories/      # Data factories
│   │       └── user.factory.ts
│   └── helpers/             # Utility functions
└── README.md                # This file
```

---

## Test Structure

### Given-When-Then Format

All tests follow the Given-When-Then pattern for clarity:

```typescript
test('[P1] should login with valid credentials', async ({ page }) => {
  // GIVEN: User is on login page
  await page.goto('/login');

  // WHEN: User enters valid credentials and submits
  await page.fill('[data-testid="email-input"]', 'user@example.com');
  await page.fill('[data-testid="password-input"]', 'Password123!');
  await page.click('[data-testid="login-button"]');

  // THEN: User is redirected to dashboard
  await expect(page).toHaveURL('/dashboard');
});
```

### Priority Tags

Every test must have a priority tag in the test name:

- **[P0]**: Critical paths - run every commit, must always pass
- **[P1]**: High priority - run on PR to main
- **[P2]**: Medium priority - run nightly
- **[P3]**: Low priority - run on-demand

---

## Fixtures & Factories

### Using Fixtures

Fixtures provide reusable setup/teardown logic:

```typescript
import { test, expect } from '../support/fixtures';

test('my test', async ({ page, authenticatedUser }) => {
  // 'authenticatedUser' fixture automatically created and cleaned up
});
```

### Using Factories

Factories generate realistic test data:

```typescript
import { createUser, createResume } from '../support/fixtures/factories/user.factory';

const user = createUser(); // Random user data
const specificUser = createUser({ email: 'lawrence.dass@outlook.in' }); // Override fields
const resume = createResume({ fileName: 'my-resume.pdf' });
```

---

## Best Practices

### ✅ DO

- Use `data-testid` selectors for stability
- Follow Given-When-Then format
- Tag tests with priority ([P0], [P1], etc.)
- Use explicit waits (no hard timeouts)
- Write deterministic tests (no randomness)
- Keep tests isolated (no shared state)
- Clean up test data automatically

### ❌ DON'T

- Don't use hard waits: `await page.waitForTimeout(2000)` ❌
- Don't use conditional logic in tests: `if (await element.isVisible()) { ... }` ❌
- Don't use try-catch for test logic (use for cleanup only)
- Don't create page objects (keep tests simple and direct)
- Don't share state between tests
- Don't hardcode test data (use factories)

---

## Selector Strategy

**Priority order:**

1. `data-testid` attributes (best) ✅
2. ARIA roles (good)
3. Text content (acceptable for stable text)
4. CSS classes (avoid - brittle)

```typescript
// ✅ BEST: data-testid
await page.click('[data-testid="submit-button"]');

// ✅ GOOD: ARIA role
await page.click('button[role="submit"]');

// ⚠️ ACCEPTABLE: Stable text
await page.click('button:has-text("Submit")');

// ❌ AVOID: CSS classes
await page.click('.btn-primary.submit-btn');
```

---

## Environment Configuration

Copy `.env.test.example` to `.env.test` and configure:

```bash
cp .env.test.example .env.test
```

Required variables:

- `BASE_URL`: Application URL (default: http://localhost:3000)
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key

---

## CI/CD Integration

Tests run automatically in CI with:

- **Retries**: 2 retries on failure (CI only)
- **Workers**: 1 worker in CI (sequential execution)
- **Artifacts**: Screenshots, videos, traces retained on failure only
- **Reports**: JUnit XML + HTML report

---

## Debugging

### Using Playwright Inspector

```bash
# Debug specific test
npm run test:e2e -- tests/e2e/my-test.spec.ts --debug

# Debug from specific line
npm run test:e2e -- tests/e2e/my-test.spec.ts:42 --debug
```

### Using Playwright Trace Viewer

```bash
# Open trace for failed test
npx playwright show-trace test-results/.../trace.zip
```

### Using Headed Mode

```bash
# See browser during test execution
npm run test:e2e -- --headed

# Slow down execution
npm run test:e2e -- --headed --slow-mo=1000
```

---

## Writing Tests

### E2E Test Example

```typescript
import { test, expect } from '../support/fixtures';

test.describe('Anonymous Authentication', () => {
  test('[P0] should create anonymous session on app visit', async ({ page }) => {
    // GIVEN: User navigates to the app
    await page.goto('/');

    // WHEN: Page loads
    // (implicit)

    // THEN: Anonymous session should be created
    await expect(page.locator('[data-testid="app-container"]')).toBeVisible();
    // Verify session exists (check cookie or local storage)
  });
});
```

### API Test Example

```typescript
import { test, expect } from '@playwright/test';

test.describe('Session API', () => {
  test('[P1] POST /api/sessions - should create session', async ({ request }) => {
    // GIVEN: Valid session data
    const sessionData = {
      anonymousId: 'test-uuid',
      resumeContent: '{"name": "John Doe"}',
    };

    // WHEN: Creating session via API
    const response = await request.post('/api/sessions', {
      data: sessionData,
    });

    // THEN: Returns 200 and session ID
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toHaveProperty('sessionId');
  });
});
```

---

## Knowledge Base References

For advanced patterns and best practices, consult:

- **Test Levels Framework**: When to use E2E vs API vs Component vs Unit
- **Test Priorities Matrix**: P0-P3 classification
- **Fixture Architecture**: Pure function → fixture → mergeTests
- **Data Factories**: Factory patterns with faker
- **Selective Testing**: Tag-based execution strategies
- **Test Quality**: Deterministic, isolated, explicit assertions

---

## Support

For issues or questions:

1. Check [Playwright Documentation](https://playwright.dev)
2. Review test patterns in this README
3. Ask in team chat or raise issue in repo

---

**Generated**: 2026-01-24
**Framework**: Playwright v1.x + TypeScript
**Test Pattern**: Given-When-Then with Priority Tags
