import { test, expect } from '../support/fixtures';

/**
 * Onboarding Flow - Target Role Selection
 *
 * Tests for Story 2.1: AC3 - Target role selection
 * Covers display, selection, and custom role input for target role step.
 *
 * Priority: P0
 *
 * @see _bmad-output/implementation-artifacts/2-1-onboarding-flow-experience-level-target-role.md
 */

test.describe('Onboarding Flow - Target Role', () => {
  test('[P0][AC3] should display target role selection after experience level', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User has selected experience level
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

    // WHEN: User clicks Next
    await page.click('[data-testid="onboarding-next-button"]');

    // THEN: Target role selection step is displayed
    await expect(
      page.getByRole('heading', { name: /target role/i })
    ).toBeVisible();

    // AND: Role selection dropdown is visible
    await expect(page.getByTestId('target-role-select')).toBeVisible();

    // AND: Common tech roles are available
    const roleSelect = page.getByTestId('target-role-select');
    await roleSelect.click();

    await expect(page.getByText('Software Engineer', { exact: true })).toBeVisible();
    await expect(page.getByText('Data Analyst', { exact: true })).toBeVisible();
    await expect(page.getByText('Product Manager', { exact: true })).toBeVisible();
    await expect(page.getByText('UX Designer', { exact: true })).toBeVisible();
    await expect(page.getByText('Other', { exact: true })).toBeVisible();
  });

  test('[P0][AC3] should allow selecting a standard target role', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User is on target role step
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('/onboarding');

    await page.click('[data-testid="experience-level-career-changer"]');
    await page.click('[data-testid="onboarding-next-button"]');

    // WHEN: User selects "Software Engineer"
    await page.click('[data-testid="target-role-select"]');
    await page.click('text=Software Engineer');

    // THEN: Selection is displayed
    await expect(page.getByTestId('target-role-select')).toContainText(
      'Software Engineer'
    );

    // AND: Complete button is enabled
    await expect(page.getByTestId('onboarding-complete-button')).toBeEnabled();
  });

  test('[P0][AC3] should show custom role input when "Other" is selected', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User is on target role step
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

    // WHEN: User selects "Other"
    await page.click('[data-testid="target-role-select"]');
    await page.click('text=Other');

    // THEN: Custom role input field appears
    await expect(page.getByTestId('custom-role-input')).toBeVisible();

    // AND: Input field is focused for immediate typing
    await expect(page.getByTestId('custom-role-input')).toBeFocused();

    // WHEN: User types custom role
    await page.fill('[data-testid="custom-role-input"]', 'Blockchain Developer');

    // THEN: Complete button becomes enabled
    await expect(page.getByTestId('onboarding-complete-button')).toBeEnabled();
  });

  test('[P1] should validate custom role is not empty when Other is selected', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User selected "Other" for target role
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
    await page.click('text=Other');

    // WHEN: User leaves custom role input empty
    await page.fill('[data-testid="custom-role-input"]', '');

    // THEN: Complete button is disabled
    await expect(page.getByTestId('onboarding-complete-button')).toBeDisabled();

    // WHEN: User enters custom role
    await page.fill('[data-testid="custom-role-input"]', 'DevRel Engineer');

    // THEN: Complete button becomes enabled
    await expect(page.getByTestId('onboarding-complete-button')).toBeEnabled();
  });
});
