import { test, expect } from '../support/fixtures';

/**
 * Onboarding Flow - Experience Level Selection
 *
 * Tests for Story 2.1: AC2 - Experience level selection
 * Covers display, selection, and validation of experience level step.
 *
 * Priority: P0
 *
 * @see _bmad-output/implementation-artifacts/2-1-onboarding-flow-experience-level-target-role.md
 */

test.describe('Onboarding Flow - Experience Level', () => {
  test('[P0][AC2] should display experience level selection with two options', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User is on the onboarding page
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('/onboarding');

    // THEN: Experience level selection is visible
    await expect(
      page.getByRole('heading', { name: /experience level/i })
    ).toBeVisible();

    // AND: "Student/Recent Graduate" option is visible with description
    await expect(page.getByTestId('experience-level-student')).toBeVisible();
    await expect(
      page.getByText(/currently studying or graduated within/i)
    ).toBeVisible();

    // AND: "Career Changer" option is visible with description
    await expect(
      page.getByTestId('experience-level-career-changer')
    ).toBeVisible();
    await expect(
      page.getByText(/transitioning from another field/i)
    ).toBeVisible();
  });

  test('[P0][AC2] should require experience level selection to proceed', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User is on onboarding page
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('/onboarding');

    // WHEN: User tries to proceed without selecting experience level
    const nextButton = page.getByTestId('onboarding-next-button');

    // THEN: Next button should be disabled (or show validation error if clicked)
    await expect(nextButton).toBeDisabled();
  });

  test('[P0][AC2] should enable next button when experience level is selected', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User is on onboarding page
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('/onboarding');

    // WHEN: User selects "Student/Recent Graduate"
    await page.click('[data-testid="experience-level-student"]');

    // THEN: Next button becomes enabled
    await expect(page.getByTestId('onboarding-next-button')).toBeEnabled();
  });

  test('[P1] should allow back navigation between onboarding steps', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User is on target role step (step 2)
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

    // WHEN: User clicks Back button
    await page.click('[data-testid="onboarding-back-button"]');

    // THEN: User returns to experience level step (step 1)
    await expect(
      page.getByRole('heading', { name: /experience level/i })
    ).toBeVisible();

    // AND: Previous selection is still selected
    await expect(page.getByTestId('experience-level-student')).toHaveAttribute(
      'aria-checked',
      'true'
    );
  });
});
