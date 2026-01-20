import { test, expect } from '../support/fixtures';

/**
 * Profile Settings - Display & Navigation
 *
 * Tests for Story 2.2: AC1 - Navigate to settings and display current profile
 * Covers settings navigation, page display, and current profile data visibility.
 *
 * Priority: P0
 *
 * @see _bmad-output/implementation-artifacts/2-2-profile-settings-page.md
 */

test.describe('Profile Settings - Display & Navigation', () => {
  test('[P0][AC1] should display settings link in navigation for users with completed onboarding', async ({
    page,
    userFactory,
    profileFactory,
  }) => {
    // GIVEN: A user with completed onboarding profile
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await profileFactory.create({
      userId: user.id,
      experienceLevel: 'student',
      targetRole: 'Software Engineer',
      onboardingCompleted: true,
    });

    // WHEN: User logs in and navigates to dashboard
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('/dashboard');

    // THEN: Settings navigation link is visible
    await expect(page.getByTestId('settings-nav-link')).toBeVisible();
  });

  test('[P0][AC1] should navigate to settings page and display profile section', async ({
    page,
    userFactory,
    profileFactory,
  }) => {
    // GIVEN: A user with completed onboarding is logged in
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await profileFactory.create({
      userId: user.id,
      experienceLevel: 'career_changer',
      targetRole: 'Data Analyst',
      onboardingCompleted: true,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('/dashboard');

    // WHEN: User clicks settings navigation link
    await page.click('[data-testid="settings-nav-link"]');

    // THEN: User is navigated to settings page
    await expect(page).toHaveURL('/settings', { timeout: 10000 });

    // AND: Settings page displays with profile section
    await expect(page.getByTestId('settings-page')).toBeVisible();
    await expect(page.getByTestId('profile-section')).toBeVisible();
  });

  test('[P0][AC1] should display current experience level and target role in profile section', async ({
    page,
    userFactory,
    profileFactory,
  }) => {
    // GIVEN: A user with completed profile
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await profileFactory.create({
      userId: user.id,
      experienceLevel: 'student',
      targetRole: 'UX Designer',
      onboardingCompleted: true,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('/dashboard');

    // WHEN: User navigates to settings
    await page.goto('/settings');

    // THEN: Current profile data is displayed
    await expect(page.getByText(/student/i)).toBeVisible();
    await expect(page.getByText(/UX Designer/i)).toBeVisible();
  });

  test('[P0][AC5] should require experience level selection in onboarding before proceeding', async ({
    page,
    userFactory,
  }) => {
    // NOTE: AC5 validation is tested via onboarding flow since settings always has
    // a pre-existing profile with experience level set. In settings, the validation
    // error cannot appear because RadioGroup cannot be deselected.
    //
    // GIVEN: User is on onboarding page (no profile yet)
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    // Don't create profile - user goes to onboarding
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    // User should be redirected to onboarding (no profile)
    await expect(page).toHaveURL(/onboarding/, { timeout: 10000 });

    // WHEN: Next button is clicked without selecting experience level
    // THEN: Button is disabled (cannot proceed without selection)
    await expect(page.getByTestId('onboarding-next-button')).toBeDisabled();

    // WHEN: User selects an experience level
    await page.click('[data-testid="experience-level-student"]');

    // THEN: Next button becomes enabled
    await expect(page.getByTestId('onboarding-next-button')).toBeEnabled();
  });
});
