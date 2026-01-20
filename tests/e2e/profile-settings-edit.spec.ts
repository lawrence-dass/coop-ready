import { test, expect } from '../support/fixtures';

/**
 * Profile Settings - Edit Mode
 *
 * Tests for Story 2.2: AC2 - Edit profile fields
 * Covers entering edit mode, changing experience level and target role.
 *
 * Priority: P0
 *
 * @see _bmad-output/implementation-artifacts/2-2-profile-settings-page.md
 */

test.describe('Profile Settings - Edit Mode', () => {
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
