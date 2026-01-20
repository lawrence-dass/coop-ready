import { test, expect } from '../support/fixtures';

/**
 * Profile Settings - Save & Cancel
 *
 * Tests for Story 2.2: AC3-AC4 - Save and cancel profile changes
 * Covers saving changes, displaying success toast, and canceling edits.
 *
 * Priority: P0
 *
 * @see _bmad-output/implementation-artifacts/2-2-profile-settings-page.md
 */

test.describe('Profile Settings - Save & Cancel', () => {
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
});
