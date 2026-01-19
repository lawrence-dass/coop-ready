# CoopReady Test Suite

End-to-end testing infrastructure using Playwright with fixture-based architecture.

## Quick Start

```bash
# Install dependencies (including Playwright)
npm install

# Install Playwright browsers
npx playwright install

# Run all tests
npm run test:e2e

# Run tests with UI mode (recommended for development)
npx playwright test --ui

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test tests/e2e/example.spec.ts

# Debug a test
npx playwright test --debug
```

## Directory Structure

```
tests/
├── e2e/                    # E2E test files
│   └── example.spec.ts     # Example tests (modify/replace)
├── support/                # Test infrastructure
│   ├── fixtures/           # Playwright fixtures
│   │   ├── index.ts        # Main fixture exports
│   │   └── factories/      # Data factories
│   │       ├── user-factory.ts
│   │       ├── resume-factory.ts
│   │       └── scan-factory.ts
│   ├── helpers/            # Utility functions
│   │   ├── auth-helper.ts
│   │   └── navigation-helper.ts
│   └── page-objects/       # Page objects (optional)
└── README.md               # This file
```

## Architecture

### Fixture Pattern

Tests use Playwright's fixture system for:
- **Data factories**: Create test data with auto-cleanup
- **API setup**: Seed data via API (fast!) instead of UI
- **Isolation**: Each test gets fresh factories

```typescript
import { test, expect } from '../support/fixtures';

test('user can view dashboard', async ({ page, userFactory }) => {
  // Factory creates user via API and tracks for cleanup
  const user = await userFactory.createStudent({
    email: 'test@example.com',
  });

  // Test UI behavior
  await page.goto('/dashboard');
  await expect(page.locator('[data-testid="welcome"]')).toContainText(user.name);

  // Cleanup happens automatically after test
});
```

### Data Factories

Each factory follows the same pattern:
- `build(overrides)` - Create object in memory (no API call)
- `create(overrides)` - Create and persist via API
- `cleanup()` - Delete all created entities (called automatically)

**Available Factories:**
- `UserFactory` - Users with experience level, target role
- `ResumeFactory` - Resumes with extracted text
- `ScanFactory` - Scan results with ATS scores

### Selector Strategy

**Always use `data-testid` attributes:**

```typescript
// Good - stable selector
await page.click('[data-testid="submit-button"]');

// Bad - brittle selectors
await page.click('.btn-primary');           // CSS class
await page.click('button:has-text("Submit")'); // Text content
```

Add `data-testid` to components:
```tsx
<Button data-testid="submit-button">Submit</Button>
```

## Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Required for tests
TEST_ENV=local
BASE_URL=http://localhost:3000
API_URL=http://localhost:3000/api
TEST_USER_EMAIL=test@example.com
TEST_USER_PASSWORD=your-test-password
```

### Playwright Config

Key settings in `playwright.config.ts`:

| Setting | Value | Purpose |
|---------|-------|---------|
| `timeout` | 60s | Max test duration |
| `actionTimeout` | 15s | Click, fill, etc. |
| `navigationTimeout` | 30s | page.goto() |
| `retries` | 2 (CI only) | Flaky test recovery |
| `trace` | retain-on-failure | Debug failed tests |

## Best Practices

### Test Isolation

Each test should be independent:
- Use factories to create fresh data
- Never rely on data from other tests
- Cleanup happens automatically via fixtures

### API-First Setup

Use API calls for test data setup (10-50x faster than UI):

```typescript
// Good - API setup
const user = await userFactory.create({ email: 'test@example.com' });

// Bad - UI setup (slow!)
await page.goto('/register');
await page.fill('[data-testid="email"]', 'test@example.com');
// ... many more steps
```

### Avoid Hardcoded Waits

```typescript
// Bad - arbitrary wait
await page.waitForTimeout(2000);

// Good - wait for specific condition
await page.waitForSelector('[data-testid="results"]');
await expect(page.locator('[data-testid="score"]')).toBeVisible();
```

## CI Integration

Tests run automatically in CI with:
- Single worker (`workers: 1`) for stability
- 2 retries for flaky recovery
- Failure artifacts: traces, screenshots, videos

View test results:
```bash
npx playwright show-report
```

## Before Tests Will Pass

You'll need to implement test API routes for the factories:
- `POST /api/test/users` - Create test user
- `DELETE /api/test/users/:id` - Delete test user
- `POST /api/test/resumes` - Create test resume
- `DELETE /api/test/resumes/:id` - Delete test resume
- `POST /api/test/scans` - Create test scan
- `DELETE /api/test/scans/:id` - Delete test scan

See Story 8.3 in Epic 8 for details.

## Knowledge Base References

This test architecture follows patterns from:
- `_bmad/bmm/testarch/knowledge/fixture-architecture.md`
- `_bmad/bmm/testarch/knowledge/data-factories.md`

---

*Generated by TEA (Test Architect) - BMAD Framework*
