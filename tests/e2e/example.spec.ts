import { test, expect } from '../support/fixtures';

/**
 * Example Test Suite - CoopReady Testing Patterns
 *
 * This file demonstrates production-ready E2E testing patterns:
 *
 * 1. **Fixture Usage**: Custom fixtures for authenticated pages and data factories
 * 2. **Auto-cleanup**: All test data automatically cleaned up after test completion
 * 3. **Locator Strategies**: Prefer getByRole > data-testid > CSS selectors
 * 4. **Wait Patterns**: Use Playwright's auto-waiting, avoid hardcoded delays
 * 5. **Screenshot on Failure**: Automatically captured by playwright.config.ts
 *
 * @see tests/README.md for complete testing guide
 * @see playwright.config.ts for artifact configuration
 */

test.describe('Homepage', () => {
  test('should display hero section', async ({ page }) => {
    await page.goto('/');

    // Check main heading is visible
    await expect(page.locator('h1')).toBeVisible();

    // Check CTA button exists
    await expect(page.getByRole('link', { name: /get started|try free/i })).toBeVisible();
  });

  test('should navigate to pricing page', async ({ page }) => {
    await page.goto('/');

    // Click pricing link
    await page.click('[data-testid="nav-pricing"]');

    // Verify navigation
    await expect(page).toHaveURL(/pricing/);
  });
});

/**
 * Pattern 1: Authenticated Page Fixture
 *
 * The `authenticatedPage` fixture provides a browser page with an active user session.
 * This avoids repetitive login flows in every test.
 *
 * Requirements:
 * - TEST_USER_EMAIL and TEST_USER_PASSWORD must be set in .env.local
 * - User must exist in Supabase Auth (create via seed script or manually)
 */
test.describe('Authenticated Dashboard Access', () => {
  test('should access dashboard when authenticated', async ({ authenticatedPage }) => {
    // Navigate to protected route - already authenticated!
    await authenticatedPage.goto('/dashboard');

    // Verify we're on dashboard (not redirected to login)
    await expect(authenticatedPage).toHaveURL(/dashboard/);

    // Verify authenticated UI elements are visible
    // Using getByRole is preferred - it's more resilient to UI changes
    await expect(
      authenticatedPage.getByRole('heading', { name: /dashboard/i })
    ).toBeVisible();
  });

  test('should display user menu when authenticated', async ({ authenticatedPage }) => {
    await authenticatedPage.goto('/dashboard');

    // Use data-testid for custom components without semantic roles
    const userMenu = authenticatedPage.locator('[data-testid="user-menu"]');
    await expect(userMenu).toBeVisible();
  });
});

/**
 * Pattern 2: Data Factories for Test Data
 *
 * Factories create test data via API endpoints and automatically clean up.
 * This ensures test isolation and prevents test data pollution.
 *
 * Available factories:
 * - userFactory: Create test users (student, career changer)
 * - resumeFactory: Create test resumes with generated content
 * - scanFactory: Create scan results linked to user/resume
 * - profileFactory: Create user profiles
 */
test.describe('Resume Scan Flow', () => {
  test.skip('should display ATS score after scan', async ({ userFactory, resumeFactory }) => {
    // This test is skipped until API endpoints are implemented
    // Demonstrates factory usage pattern

    // 1. Create test user via API
    const user = await userFactory.createStudent({
      email: 'student@test.com',
    });

    // 2. Create test resume
    const resume = await resumeFactory.create({
      userId: user.id,
      fileName: 'test-resume.pdf',
    });

    // 3. Navigate to results (would need auth setup)
    // await page.goto(`/results/${resume.id}`);

    // 4. Verify score display
    // await expect(page.locator('[data-testid="ats-score"]')).toBeVisible();

    // Cleanup happens automatically via fixture teardown
    expect(user.id).toBeTruthy();
    expect(resume.id).toBeTruthy();
  });
});

/**
 * Pattern 3: Proper Wait Patterns and Assertions
 *
 * Playwright has built-in auto-waiting for most actions:
 * - click(), fill(), etc. wait for element to be actionable
 * - expect() assertions auto-retry until timeout
 *
 * AVOID: Hardcoded delays like page.waitForTimeout(5000)
 * PREFER: Semantic waits like waitForURL, waitForSelector, or expect assertions
 */
test.describe('Authentication Flow', () => {
  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Attempt to access protected route
    await page.goto('/dashboard');

    // Auto-waits for URL to match pattern (retries until timeout)
    await expect(page).toHaveURL(/login/);

    // Verify login form elements are present
    await expect(page.getByLabel(/email/i)).toBeVisible();
    await expect(page.getByLabel(/password/i)).toBeVisible();
  });

  test.skip('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/login');

    // Fill form with invalid credentials
    await page.fill('#email', 'invalid@example.com');
    await page.fill('#password', 'wrongpassword');
    await page.click('button[type="submit"]');

    // Wait for error message to appear (auto-retries)
    await expect(page.locator('.text-red-500')).toBeVisible();

    // Should NOT redirect to dashboard
    await expect(page).toHaveURL(/login/);
  });
});
