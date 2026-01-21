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

# Run by priority tag
npm run test:e2e:p0  # Critical paths only
npm run test:e2e:p1  # P0 + P1 tests

# Run tests with UI mode (recommended for development)
npx playwright test --ui

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run specific test file
npx playwright test tests/e2e/dashboard-layout.spec.ts

# Debug a test
npx playwright test --debug
```

## Priority System

All tests are tagged with priority levels for selective execution:

| Priority | Description | When to Run |
|----------|-------------|-------------|
| **[P0]** | Critical user paths that must always work | Every commit, pre-commit hooks |
| **[P1]** | High priority features with significant user impact | PR checks, before merge to main |
| **[P2]** | Medium priority edge cases and variations | Nightly CI builds |
| **[P3]** | Low priority nice-to-have validations | On-demand, weekly runs |

**Example:**
```typescript
test('[P0] should login with valid credentials', async ({ page }) => { ... });
test('[P1] should display error for invalid credentials', async ({ page }) => { ... });
test('[P2] should remember login preference', async ({ page }) => { ... });
```

## Directory Structure

```
tests/
├── e2e/                      # E2E test files
│   ├── dashboard-layout.spec.ts  # Dashboard layout & design system tests
│   └── example.spec.ts           # Example tests (modify/replace)
├── support/                  # Test infrastructure
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
| `timeout` | 30s | Max test duration |
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

## Test Coverage

### Dashboard Layout Tests (Story 1.2)

Comprehensive tests for design system and layout:
- **[P0]** Dashboard layout renders with sidebar and main content
- **[P1]** Navigation items visible and functional
- **[P1]** Sidebar collapse/expand functionality
- **[P1]** Theme colors applied correctly
- **[P1]** Mobile responsive behavior (<768px)
- **[P1]** Desktop responsive behavior (>1024px)
- **[P2]** Full-width layout optimization

Location: `tests/e2e/dashboard-layout.spec.ts`

## CI/CD Integration

### GitHub Actions Workflow

The E2E tests run automatically in CI/CD via GitHub Actions.

**Workflow Triggers:**
- Pull requests to `main` branch
- Direct pushes to `main` branch

**Workflow Location:** `.github/workflows/e2e-tests.yml`

**Key CI Configuration:**
- Single worker (`--workers 1`) for test stability
- 2 retries for flaky test recovery
- 15-minute timeout for entire workflow
- Artifacts uploaded only on test failure (30-day retention)

**Status Badge:**
The README.md includes a workflow status badge showing pass/fail status.

### Viewing Test Results in CI

**When tests pass:**
- Green checkmark appears on PR
- PR is eligible for merge

**When tests fail:**
- Red X appears on PR
- PR merge is blocked until tests pass (requires branch protection - see below)
- Artifacts available for download:
  - `playwright-report/` - HTML report with detailed test results
  - `test-results/` - Raw test results including traces and screenshots

**Accessing Artifacts:**
1. Go to the failed workflow run in GitHub Actions tab
2. Scroll to "Artifacts" section
3. Download `playwright-report` or `test-results`
4. Unzip and open `index.html` from playwright-report

### Troubleshooting CI Failures

**Common Issues:**

1. **Timeout errors:**
   - Tests exceed 30-second timeout
   - **Fix:** Optimize test setup, use API factories instead of UI setup

2. **Flaky tests:**
   - Tests pass locally but fail in CI
   - **Fix:** Remove hardcoded waits, use Playwright's auto-waiting
   - **Check:** Data factories cleaning up properly

3. **Authentication failures:**
   - Missing TEST_USER_EMAIL or TEST_USER_PASSWORD
   - **Fix:** Add GitHub Secrets in repository settings

4. **Database connection errors:**
   - Cannot connect to Supabase in CI
   - **Fix:** Ensure Supabase credentials in GitHub Secrets
   - **Alternative:** Use test-only API endpoints (Story 8-3)

5. **Dependency installation errors:**
   - `npm ci` fails or Playwright browsers fail to install
   - **Fix:** Update package-lock.json, ensure Node 18+ specified

**Debugging Failed Tests:**
1. Download the `playwright-report` artifact
2. Open `index.html` in browser
3. Click failed test to see:
   - Screenshots at failure point
   - Trace timeline showing each step
   - Console logs and network requests
4. Fix issue locally and push new commit

### Local vs CI Differences

| Aspect | Local | CI |
|--------|-------|-----|
| Workers | Parallel (faster) | Single (`--workers 1`) |
| Retries | 0 | 2 |
| Browser | Headed available | Headless only |
| Artifacts | Manual capture | Automatic on failure |
| Timeout | 30s per test | 30s per test, 15min total |

### Required: Branch Protection Setup

To enforce that tests must pass before merging PRs:

1. Go to GitHub repo → Settings → Branches
2. Click "Add branch protection rule"
3. Set branch name pattern: `main`
4. Enable "Require status checks to pass before merging"
5. Search and select "Run E2E Tests" status check
6. Save changes

**Without this setup**, failed tests show as warnings but don't block merges.

### Updating the Workflow

If you need to modify the CI/CD workflow:

1. Edit `.github/workflows/e2e-tests.yml`
2. Common changes:
   - Add environment variables
   - Change timeout limits
   - Modify trigger branches
   - Add notification steps
3. Test changes by creating a PR
4. Verify workflow runs as expected

## Test API Endpoints

Test data management endpoints for E2E test factories.

**SECURITY**: These endpoints are ONLY available in test/development environments (`NODE_ENV !== 'production'`).

### User Endpoints

**Create Test User:**
```bash
POST /api/test/users
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "testpassword123",
  "experienceLevel": "student"  # or "career_changer"
}

# Response:
{
  "data": {
    "userId": "uuid-here",
    "email": "test@example.com",
    "experienceLevel": "student"
  },
  "error": null
}
```

**Delete Test User:**
```bash
DELETE /api/test/users/:userId

# Response:
{
  "data": { "success": true },
  "error": null
}
```

### Resume Endpoints

**Create Test Resume:**
```bash
POST /api/test/resumes
Content-Type: application/json

{
  "userId": "user-uuid",
  "fileName": "test-resume.pdf",
  "textContent": "John Doe\nSoftware Engineer\n..."
}

# Response:
{
  "data": {
    "resumeId": "uuid-here",
    "fileName": "test-resume.pdf",
    "fileUrl": "https://...",
    "userId": "user-uuid"
  },
  "error": null
}
```

**Delete Test Resume:**
```bash
DELETE /api/test/resumes/:resumeId

# Response:
{
  "data": { "success": true },
  "error": null
}
```

### Scan Endpoints

**Create Test Scan:**
```bash
POST /api/test/scans
Content-Type: application/json

{
  "userId": "user-uuid",
  "resumeId": "resume-uuid",
  "jobDescription": "We are looking for a software engineer..."
}

# Response:
{
  "data": {
    "scanId": "uuid-here",
    "userId": "user-uuid",
    "resumeId": "resume-uuid",
    "createdAt": "2026-01-20T..."
  },
  "error": null
}
```

**Delete Test Scan:**
```bash
DELETE /api/test/scans/:scanId

# Response:
{
  "data": { "success": true },
  "error": null
}
```

### Error Responses

All endpoints follow the `ActionResponse<T>` pattern:

```json
{
  "data": null,
  "error": {
    "message": "User with this email already exists",
    "code": "DUPLICATE_EMAIL"
  }
}
```

**Error Codes:**
- `VALIDATION_ERROR` (400): Invalid request body
- `DUPLICATE_EMAIL` (400): User email already exists
- `MISSING_USER` (400): User not found for resume/scan creation
- `NOT_FOUND` (404): Resource not found for deletion
- `FORBIDDEN` (403): Endpoint accessed in production
- `INTERNAL_ERROR` (500): Database or system error

### Environment Variables

Required for test endpoints (add to `.env.local`):

```bash
# Supabase (for auth and database)
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Required for test endpoints

# Test environment
NODE_ENV=development  # or test (NOT production)
```

**Note**: Dashboard layout tests require Supabase authentication to be properly configured for testing environment.

## Knowledge Base References

This test architecture follows patterns from:
- `_bmad/bmm/testarch/knowledge/fixture-architecture.md`
- `_bmad/bmm/testarch/knowledge/data-factories.md`

---

*Generated by TEA (Test Architect) - BMAD Framework*
