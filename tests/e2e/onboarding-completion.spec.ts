import { test, expect } from '../support/fixtures';

/**
 * Onboarding Flow - Completion
 *
 * Tests for Story 2.1: AC4 - Profile save and redirect
 * Covers saving profile, success toast, and redirect to dashboard.
 *
 * Priority: P0
 *
 * @see _bmad-output/implementation-artifacts/2-1-onboarding-flow-experience-level-target-role.md
 */

test.describe('Onboarding Flow - Completion', () => {
  test('[P0][AC4] should save profile and redirect to dashboard on completion', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User has completed both onboarding steps
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('/onboarding');

    // Complete Step 1: Experience Level
    await page.click('[data-testid="experience-level-career-changer"]');
    await page.click('[data-testid="onboarding-next-button"]');

    // Complete Step 2: Target Role
    await page.click('[data-testid="target-role-select"]');
    await page.click('text=Data Analyst');

    // WHEN: User clicks "Complete Setup"
    await page.click('[data-testid="onboarding-complete-button"]');

    // AND: User is redirected to /dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // AND: Dashboard loads successfully
    await expect(page.getByTestId('dashboard-header')).toBeVisible();

    // AND: Welcome message acknowledges selections
    await expect(
      page.getByText(/career changer|data analyst/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('[P0][AC4] should display success toast after completing onboarding', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User completes onboarding successfully
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('/onboarding');

    await page.click('[data-testid="experience-level-student"]');
    await page.click('[data-testid="onboarding-next-button"]');

    await page.click('[data-testid="target-role-select"]');
    await page.click('text=Software Engineer');

    // WHEN: User completes setup
    await page.click('[data-testid="onboarding-complete-button"]');

    // THEN: Success toast is displayed
    await expect(
      page.getByText(/profile.*complete|setup.*complete|welcome/i)
    ).toBeVisible({ timeout: 10000 });
  });
});
