import { test, expect } from '../support/fixtures';

/**
 * Example Test Suite
 *
 * Demonstrates CoopReady testing patterns:
 * - Fixture-based test data
 * - Auto-cleanup
 * - data-testid selectors
 *
 * Remove or modify these tests as you build real ones.
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

test.describe('Authentication', () => {
  test.skip('should allow user login', async ({ page }) => {
    // This test is skipped until auth is implemented

    await page.goto('/login');

    // Fill login form
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'password123');
    await page.click('[data-testid="login-button"]');

    // Verify redirect to dashboard
    await expect(page).toHaveURL(/dashboard/);
  });
});
