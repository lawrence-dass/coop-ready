import { test, expect } from '../support/fixtures';

/**
 * Profile Settings Page E2E Tests
 *
 * Tests for Story 2.2: Profile Settings Page
 * Covers viewing and updating user profile (experience level, target role).
 *
 * Priority breakdown:
 * - P0: Navigate to settings (AC1) - 2 tests
 * - P0: Edit profile fields (AC2) - 2 tests
 * - P0: Save profile changes (AC3) - 2 tests
 * - P0: Cancel changes (AC4) - 2 tests
 * - P0: Validation (AC5) - 1 test (tested via onboarding flow)
 *
 * @see _bmad-output/implementation-artifacts/2-2-profile-settings-page.md
 */

test.describe('Profile Settings Page', () => {
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

  test('[P0][AC2] should allow editing profile by clicking Edit button', async ({
    page,
    userFactory,
    profileFactory,
  }) => {
    // GIVEN: User is on settings page
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await profileFactory.create({
      userId: user.id,
      experienceLevel: 'career_changer',
      targetRole: 'Product Manager',
      onboardingCompleted: true,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.goto('/settings');

    // WHEN: User clicks Edit Profile button
    await page.click('[data-testid="edit-profile-button"]');

    // THEN: Profile form is displayed with editable fields
    await expect(page.getByTestId('profile-form')).toBeVisible();
    await expect(page.getByTestId('experience-level-student')).toBeVisible();
    await expect(
      page.getByTestId('experience-level-career-changer')
    ).toBeVisible();
    await expect(page.getByTestId('target-role-select')).toBeVisible();
  });

  test('[P0][AC2] should change experience level from Student to Career Changer', async ({
    page,
    userFactory,
    profileFactory,
  }) => {
    // GIVEN: User with "student" experience level is in edit mode
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

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.goto('/settings');
    await page.click('[data-testid="edit-profile-button"]');

    // WHEN: User changes experience level to Career Changer
    await page.click('[data-testid="experience-level-career-changer"]');

    // THEN: Career Changer option is selected
    await expect(
      page.getByTestId('experience-level-career-changer')
    ).toHaveAttribute('aria-checked', 'true');

    // AND: Save button is enabled
    await expect(page.getByTestId('save-button')).toBeEnabled();
  });

  test('[P0][AC2] should change target role including custom role option', async ({
    page,
    userFactory,
    profileFactory,
  }) => {
    // GIVEN: User is in edit mode
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

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.goto('/settings');
    await page.click('[data-testid="edit-profile-button"]');

    // WHEN: User selects "Other" for target role
    await page.click('[data-testid="target-role-select"]');
    await page.click('text=Other');

    // THEN: Custom role input appears and is focused
    await expect(page.getByTestId('custom-role-input')).toBeVisible();
    await expect(page.getByTestId('custom-role-input')).toBeFocused();

    // WHEN: User types custom role
    await page.fill('[data-testid="custom-role-input"]', 'DevOps Engineer');

    // THEN: Save button is enabled
    await expect(page.getByTestId('save-button')).toBeEnabled();
  });

  test('[P0][AC3] should save profile changes and display success toast', async ({
    page,
    userFactory,
    profileFactory,
  }) => {
    // GIVEN: User has made changes to profile
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

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.goto('/settings');
    await page.click('[data-testid="edit-profile-button"]');

    await page.click('[data-testid="experience-level-career-changer"]');
    await page.click('[data-testid="target-role-select"]');
    await page.click('text=Data Analyst');

    // WHEN: User clicks Save Changes
    await page.click('[data-testid="save-button"]');

    // THEN: Success toast is displayed (Server Actions don't use /api routes)
    await expect(
      page.getByText(/profile.*updated.*successfully/i)
    ).toBeVisible({ timeout: 10000 });
  });

  test('[P0][AC3] should display updated values after save', async ({
    page,
    userFactory,
    profileFactory,
  }) => {
    // GIVEN: User saves profile changes
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

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.goto('/settings');
    await page.click('[data-testid="edit-profile-button"]');

    await page.click('[data-testid="experience-level-career-changer"]');
    await page.click('[data-testid="target-role-select"]');
    await page.click('text=Product Manager');

    // WHEN: User saves changes
    await page.click('[data-testid="save-button"]');

    // Wait for save to complete
    await expect(
      page.getByText(/profile.*updated.*successfully/i)
    ).toBeVisible({ timeout: 10000 });

    // THEN: Updated values are displayed in read-only view
    await expect(page.getByText(/career changer/i)).toBeVisible();
    await expect(page.getByText(/Product Manager/i)).toBeVisible();

    // AND: Edit mode is exited (form is no longer visible)
    await expect(page.getByTestId('profile-form')).not.toBeVisible();
  });

  test('[P0][AC4] should discard changes when cancel button is clicked', async ({
    page,
    userFactory,
    profileFactory,
  }) => {
    // GIVEN: User has made changes but not saved
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

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.goto('/settings');
    await page.click('[data-testid="edit-profile-button"]');

    await page.click('[data-testid="experience-level-career-changer"]');
    await page.click('[data-testid="target-role-select"]');
    await page.click('text=Data Analyst');

    // WHEN: User clicks Cancel
    await page.click('[data-testid="cancel-button"]');

    // THEN: Edit mode is exited
    await expect(page.getByTestId('profile-form')).not.toBeVisible();

    // AND: Original values are still displayed (not changed)
    await expect(page.getByText(/student/i)).toBeVisible();
    await expect(page.getByText(/Software Engineer/i)).toBeVisible();

    // AND: Changed values are NOT displayed
    await expect(page.getByText(/career changer/i)).not.toBeVisible();
    await expect(page.getByText(/Data Analyst/i)).not.toBeVisible();
  });

  test('[P0][AC4] should not save changes when navigating away from settings', async ({
    page,
    userFactory,
    profileFactory,
  }) => {
    // GIVEN: User makes changes and navigates away without saving
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await profileFactory.create({
      userId: user.id,
      experienceLevel: 'career_changer',
      targetRole: 'Product Manager',
      onboardingCompleted: true,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.goto('/settings');
    await page.click('[data-testid="edit-profile-button"]');

    await page.click('[data-testid="experience-level-student"]');
    await page.click('[data-testid="target-role-select"]');
    await page.click('text=UX Designer');

    // WHEN: User navigates to dashboard without saving
    await page.goto('/dashboard');

    // AND: User returns to settings
    await page.goto('/settings');

    // THEN: Original values are displayed (changes were not saved)
    await expect(page.getByText(/career changer/i)).toBeVisible();
    await expect(page.getByText(/Product Manager/i)).toBeVisible();

    // AND: Changed values are NOT persisted
    await expect(page.getByText(/student/i)).not.toBeVisible();
    await expect(page.getByText(/UX Designer/i)).not.toBeVisible();
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

  test('[P1] should preserve target role when changing only experience level', async ({
    page,
    userFactory,
    profileFactory,
  }) => {
    // GIVEN: User changes only experience level
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

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.goto('/settings');
    await page.click('[data-testid="edit-profile-button"]');

    // WHEN: User changes only experience level
    await page.click('[data-testid="experience-level-career-changer"]');
    await page.click('[data-testid="save-button"]');

    await expect(
      page.getByText(/profile.*updated.*successfully/i)
    ).toBeVisible({ timeout: 10000 });

    // THEN: Experience level is updated
    await expect(page.getByText(/career changer/i)).toBeVisible();

    // AND: Target role is preserved
    await expect(page.getByText(/Software Engineer/i)).toBeVisible();
  });

  test('[P1] should update custom role when changing from standard to Other', async ({
    page,
    userFactory,
    profileFactory,
  }) => {
    // GIVEN: User has standard target role
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

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.goto('/settings');
    await page.click('[data-testid="edit-profile-button"]');

    // WHEN: User changes to custom role
    await page.click('[data-testid="target-role-select"]');
    await page.click('text=Other');
    await page.fill('[data-testid="custom-role-input"]', 'ML Engineer');
    await page.click('[data-testid="save-button"]');

    await expect(
      page.getByText(/profile.*updated.*successfully/i)
    ).toBeVisible({ timeout: 10000 });

    // THEN: Custom role is displayed
    await expect(page.getByText(/ML Engineer/i)).toBeVisible();
  });
});
