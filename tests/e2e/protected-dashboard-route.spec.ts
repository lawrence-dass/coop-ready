import { test, expect } from '../support/fixtures';

/**
 * Protected Dashboard Route E2E Tests
 *
 * Tests for Story 1.7: Protected Dashboard Route
 * Covers middleware protection, authenticated/unauthenticated access,
 * redirect preservation, session expiry handling, and user menu verification.
 *
 * Priority breakdown:
 * - P0: Authenticated dashboard access (AC1) - 1 test
 * - P0: Unauthenticated redirect with URL preservation (AC2) - 1 test
 * - P0: All dashboard routes protected (AC3) - 1 test
 * - P0: User menu display (AC4) - 1 test
 * - P0: Session expiry handling (AC5) - 1 test
 *
 * NOTE: These tests will FAIL initially (RED phase) until implementation is complete.
 * This is expected and required for TDD red-green-refactor cycle.
 *
 * @see _bmad-output/implementation-artifacts/1-7-protected-dashboard-route.md
 */

test.describe('Protected Dashboard Route', () => {
  test('[P0][AC1] should allow authenticated user to access dashboard with user info', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: A logged-in user exists
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    // WHEN: User logs in via UI
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);

    // Register session expectation BEFORE clicking (network-first pattern)
    const sessionPromise = page.waitForResponse((resp) =>
      resp.url().includes('/auth/v1/token') && resp.request().method() === 'POST'
    );

    await page.click('[data-testid="login-button"]');

    // THEN: Session is created
    const sessionResponse = await sessionPromise;
    expect(sessionResponse.status()).toBe(200);

    // AND: User is redirected to dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // AND: Dashboard page displays with user info
    await expect(page.getByTestId('dashboard-header')).toBeVisible();

    // AND: Sidebar navigation is visible
    await expect(page.getByTestId('sidebar')).toBeVisible();

    // AND: Welcome message displays user email
    await expect(page.getByText(new RegExp(user.email, 'i'))).toBeVisible();
  });

  test('[P0][AC2] should redirect unauthenticated user to login with URL preservation', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User is not authenticated
    // AND: User tries to access /dashboard directly

    // WHEN: User navigates to /dashboard
    await page.goto('/dashboard');

    // THEN: User is redirected to /auth/login
    await expect(page).toHaveURL(/\/auth\/login/);

    // AND: Original URL is preserved in redirectTo query parameter
    const url = new URL(page.url());
    const redirectTo = url.searchParams.get('redirectTo');
    expect(redirectTo).toBe('/dashboard');

    // GIVEN: User logs in with redirectTo parameter present
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);

    const sessionPromise = page.waitForResponse((resp) =>
      resp.url().includes('/auth/v1/token') && resp.request().method() === 'POST'
    );

    await page.click('[data-testid="login-button"]');

    await sessionPromise;

    // THEN: User is redirected back to original URL (/dashboard)
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // AND: Dashboard loads successfully
    await expect(page.getByTestId('dashboard-header')).toBeVisible();
  });

  test('[P0][AC3] should protect all dashboard routes from unauthenticated access', async ({
    page,
  }) => {
    // GIVEN: User is not authenticated
    // WHEN: User tries to access various protected routes

    const protectedRoutes = [
      '/dashboard',
      '/settings',
      '/history',
      '/scan/new',
    ];

    for (const route of protectedRoutes) {
      // WHEN: User navigates to protected route
      await page.goto(route);

      // THEN: User is redirected to login
      await expect(page).toHaveURL(/\/auth\/login/);

      // AND: Original route is preserved in redirectTo
      const url = new URL(page.url());
      const redirectTo = url.searchParams.get('redirectTo');
      expect(redirectTo).toBe(route);
    }
  });

  test('[P0][AC4] should display user menu with email, settings, and logout options', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User is authenticated and on dashboard
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);

    const sessionPromise = page.waitForResponse((resp) =>
      resp.url().includes('/auth/v1/token') && resp.request().method() === 'POST'
    );

    await page.click('[data-testid="login-button"]');
    await sessionPromise;

    await page.waitForURL(/\/dashboard/);

    // WHEN: User clicks on user menu
    await page.click('[data-testid="user-menu-button"]');

    // THEN: User email is displayed
    await expect(page.getByText(user.email)).toBeVisible();

    // AND: Settings option is visible
    await expect(page.getByTestId('settings-link')).toBeVisible();

    // AND: Logout option is visible
    await expect(page.getByTestId('logout-button')).toBeVisible();
  });

  test('[P0][AC5] should handle session expiry with redirect and toast message', async ({
    page,
    context,
    userFactory,
  }) => {
    // GIVEN: User has logged in successfully
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);

    const sessionPromise = page.waitForResponse((resp) =>
      resp.url().includes('/auth/v1/token') && resp.request().method() === 'POST'
    );

    await page.click('[data-testid="login-button"]');
    await sessionPromise;

    await page.waitForURL(/\/dashboard/);

    // WHEN: Session expires (simulate by clearing session cookies)
    const cookies = await context.cookies();
    const sessionCookies = cookies.filter(
      (c) => c.name.includes('sb-') && c.name.includes('-auth-token')
    );

    // Clear all Supabase session cookies
    for (const cookie of sessionCookies) {
      await context.clearCookies({ name: cookie.name });
    }

    // AND: User tries to navigate to a protected page
    await page.goto('/dashboard');

    // THEN: User is redirected to login with expired=true
    await expect(page).toHaveURL(/\/auth\/login\?.*expired=true/);

    // AND: Session expiry toast message is displayed
    await expect(
      page.getByText(/your session has expired/i)
    ).toBeVisible({ timeout: 10000 });

    // AND: Original URL is preserved for post-login redirect
    const url = new URL(page.url());
    const redirectTo = url.searchParams.get('redirectTo');
    expect(redirectTo).toBe('/dashboard');
  });

  test('[P1] should prevent open redirect vulnerability', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: Malicious user crafts URL with external redirectTo
    const maliciousUrl = '/auth/login?redirectTo=//evil.com/phishing';

    // WHEN: User logs in with malicious redirectTo
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.goto(maliciousUrl);

    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);

    const sessionPromise = page.waitForResponse((resp) =>
      resp.url().includes('/auth/v1/token') && resp.request().method() === 'POST'
    );

    await page.click('[data-testid="login-button"]');
    await sessionPromise;

    // THEN: User is redirected to safe default (/dashboard), NOT external URL
    await expect(page).toHaveURL('/dashboard', { timeout: 10000 });

    // AND: User remains on same origin
    expect(new URL(page.url()).origin).toContain('localhost');
  });
});
