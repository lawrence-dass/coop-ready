import { test, expect } from '../support/fixtures';

/**
 * User Logout E2E Tests
 *
 * Tests for Story 1.5: User Logout
 * Covers logout flow, session invalidation, and browser back button protection.
 *
 * Priority breakdown:
 * - P0: Logout from user menu (AC1) - 1 test
 * - P0: Protected route access after logout (AC2) - 1 test
 * - P0: Browser back button protection (AC3) - 1 test
 *
 * NOTE: These tests will FAIL initially (RED phase) until implementation is complete.
 * This is expected and required for TDD red-green-refactor cycle.
 */

test.describe('User Logout', () => {
  test('[P0][AC1] should log out from user menu and redirect to login page', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User is logged in and on dashboard
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/\/dashboard/);

    // Verify session cookie exists before logout
    const cookiesBeforeLogout = await page.context().cookies();
    const sessionCookieBefore = cookiesBeforeLogout.find(
      (c) => c.name.includes('sb-') && c.name.includes('-auth-token')
    );
    expect(sessionCookieBefore).toBeDefined();

    // WHEN: User clicks logout in user menu
    // Note: Actual selector depends on header implementation
    // This assumes a user menu dropdown with logout button
    await page.click('[data-testid="user-menu-button"]');
    await page.click('[data-testid="logout-button"]');

    // THEN: User is redirected to login page
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });

    // AND: Session cookie is cleared
    const cookiesAfterLogout = await page.context().cookies();
    const sessionCookieAfter = cookiesAfterLogout.find(
      (c) => c.name.includes('sb-') && c.name.includes('-auth-token')
    );
    expect(sessionCookieAfter).toBeUndefined();
  });

  test('[P0][AC2] should prevent access to protected routes after logout', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User has logged out
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    // Login
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/\/dashboard/);

    // Logout
    await page.click('[data-testid="user-menu-button"]');
    await page.click('[data-testid="logout-button"]');
    await page.waitForURL(/\/auth\/login/);

    // WHEN: User tries to access protected route directly via URL
    await page.goto('/dashboard');

    // THEN: User is redirected to login page
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });

    // AND: Dashboard content is NOT accessible
    await expect(page.getByTestId('dashboard-header')).not.toBeVisible();

    // Verify with another protected route (settings)
    await page.goto('/settings');

    // THEN: User is redirected to login page
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });

  test('[P0][AC3] should prevent cached page access via browser back button', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User is on dashboard
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    // Login and navigate to dashboard
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/\/dashboard/);

    // Verify dashboard loads
    await expect(page.getByTestId('dashboard-header')).toBeVisible();

    // WHEN: User logs out
    await page.click('[data-testid="user-menu-button"]');
    await page.click('[data-testid="logout-button"]');
    await page.waitForURL(/\/auth\/login/);

    // AND: User presses browser back button
    await page.goBack();

    // THEN: User cannot access cached dashboard content
    // (should either stay on login or redirect back to login)
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });

    // AND: Dashboard content is NOT visible
    await expect(page.getByTestId('dashboard-header')).not.toBeVisible();
  });

  test('[P1] should handle logout errors gracefully', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User is logged in
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/\/dashboard/);

    // AND: Network is intercepted to simulate logout failure
    await page.route('**/auth/v1/logout', (route) => {
      route.abort('failed');
    });

    // WHEN: User clicks logout
    await page.click('[data-testid="user-menu-button"]');
    await page.click('[data-testid="logout-button"]');

    // THEN: Error toast is displayed
    // (using sonner toast from established pattern)
    await expect(
      page.getByText(/failed to sign out|something went wrong/i)
    ).toBeVisible({ timeout: 10000 });

    // AND: User remains on current page
    await expect(page).toHaveURL(/\/dashboard/);

    // AND: Session is still active (user can retry)
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(
      (c) => c.name.includes('sb-') && c.name.includes('-auth-token')
    );
    expect(sessionCookie).toBeDefined();
  });

  test('[P1] should show loading state during logout', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User is logged in
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/\/dashboard/);

    // WHEN: User initiates logout
    await page.click('[data-testid="user-menu-button"]');

    // THEN: Logout button shows loading state before completing
    const logoutButton = page.getByTestId('logout-button');

    // Click and immediately check for loading text
    const clickPromise = logoutButton.click();

    // Check for loading text during transition
    // (based on story dev notes: "Logging out..." text)
    await expect(logoutButton).toHaveText(/logging out/i, { timeout: 2000 });

    await clickPromise;

    // AND: Eventually redirects to login
    await expect(page).toHaveURL(/\/auth\/login/, { timeout: 10000 });
  });
});
