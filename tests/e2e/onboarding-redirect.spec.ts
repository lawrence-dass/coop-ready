import { test, expect } from '../support/fixtures';

/**
 * Onboarding Flow - Redirect Tests
 *
 * Tests for Story 2.1: AC1 - First-time login redirect to onboarding
 * Covers redirect behavior and protected route blocking for new users.
 *
 * Priority: P0
 *
 * @see _bmad-output/implementation-artifacts/2-1-onboarding-flow-experience-level-target-role.md
 */

test.describe('Onboarding Flow - Redirect', () => {
  test('[P0][AC1] should redirect new user to onboarding after first login', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: A new user has just registered and verified email
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
      // NOTE: User factory should create WITHOUT onboarding_completed flag
    });

    // AND: User logs in for the first time
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);

    // Register session expectation BEFORE clicking (network-first pattern)
    const sessionPromise = page.waitForResponse((resp) =>
      resp.url().includes('/auth/v1/token') && resp.request().method() === 'POST'
    );

    await page.click('[data-testid="login-button"]');

    // WHEN: Login succeeds
    const sessionResponse = await sessionPromise;
    expect(sessionResponse.status()).toBe(200);

    // THEN: User is redirected to /onboarding (NOT /dashboard)
    await expect(page).toHaveURL('/onboarding', { timeout: 10000 });

    // AND: Onboarding page displays
    await expect(page.getByTestId('onboarding-container')).toBeVisible();
  });

  test('[P0][AC1] should block access to protected routes until onboarding complete', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: A new user is authenticated but has not completed onboarding
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');

    await page.waitForURL('/onboarding');

    // WHEN: User tries to navigate to protected routes directly
    const protectedRoutes = ['/dashboard', '/settings', '/history', '/scan/new'];

    for (const route of protectedRoutes) {
      await page.goto(route);

      // THEN: User is redirected back to /onboarding
      await expect(page).toHaveURL('/onboarding', { timeout: 5000 });
    }
  });

  test('[P0][AC5] should skip onboarding for users with completed profiles', async ({
    page,
    userFactory,
    profileFactory,
  }) => {
    // GIVEN: An existing user with completed onboarding
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    // Create completed profile for this user
    await profileFactory.create({
      userId: user.id,
      experienceLevel: 'student',
      targetRole: 'Software Engineer',
      onboardingCompleted: true,
    });

    // WHEN: User logs in
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);

    const sessionPromise = page.waitForResponse((resp) =>
      resp.url().includes('/auth/v1/token') && resp.request().method() === 'POST'
    );

    await page.click('[data-testid="login-button"]');
    await sessionPromise;

    // THEN: User is taken directly to dashboard (NOT onboarding)
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // AND: Onboarding page is not shown
    await expect(page.getByTestId('onboarding-container')).not.toBeVisible();

    // AND: Dashboard content loads normally
    await expect(page.getByTestId('dashboard-header')).toBeVisible();
  });

  test('[P0][AC5] should prevent completed users from accessing /onboarding', async ({
    page,
    userFactory,
    profileFactory,
  }) => {
    // GIVEN: User with completed onboarding is logged in
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

    await page.waitForURL('/dashboard');

    // WHEN: User tries to access /onboarding directly
    await page.goto('/onboarding');

    // THEN: User is redirected to /dashboard
    await expect(page).toHaveURL('/dashboard', { timeout: 5000 });
  });
});
