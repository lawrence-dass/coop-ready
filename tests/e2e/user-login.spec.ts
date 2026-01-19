import { test, expect } from '../support/fixtures';

/**
 * User Login E2E Tests
 *
 * Tests for Story 1.4: User Login
 * Covers login flow, error handling, session persistence, and email verification.
 *
 * Priority breakdown:
 * - P0: Valid login flow (AC1) - 1 test
 * - P0: Incorrect password handling (AC2) - 1 test
 * - P0: Non-existent email handling (AC3) - 1 test
 * - P1: Session persistence (AC4) - 1 test
 * - P0: Email verification toast (AC5) - 1 test
 *
 * NOTE: These tests will FAIL initially (RED phase) until implementation is complete.
 * This is expected and required for TDD red-green-refactor cycle.
 */

test.describe('User Login', () => {
  test('[P0][AC1] should log in with valid credentials and redirect to dashboard', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: A registered user exists
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    // AND: User is on the login page
    await page.goto('/auth/login');

    // WHEN: User enters valid credentials
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', testPassword);

    // Register session expectation BEFORE clicking (network-first pattern)
    const sessionPromise = page.waitForResponse((resp) =>
      resp.url().includes('/auth/v1/token') && resp.request().method() === 'POST'
    );

    await page.click('[data-testid="login-button"]');

    // THEN: Authentication succeeds via Supabase
    const sessionResponse = await sessionPromise;
    expect(sessionResponse.status()).toBe(200);

    // AND: Session cookie is set (handled by Supabase SSR)
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(
      (c) => c.name.includes('sb-') && c.name.includes('-auth-token')
    );
    expect(sessionCookie).toBeDefined();

    // AND: User is redirected to dashboard
    await expect(page).toHaveURL(/\/dashboard/);

    // AND: Dashboard loads successfully
    await expect(page.getByTestId('dashboard-header')).toBeVisible();
  });

  test('[P0][AC2] should display error message for incorrect password', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: A registered user exists
    const user = await userFactory.createWithPassword({
      password: 'CorrectPassword123',
    });

    // AND: User is on the login page
    await page.goto('/auth/login');

    // WHEN: User enters incorrect password
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', 'WrongPassword456');

    await page.click('[data-testid="login-button"]');

    // THEN: Error message is displayed (generic for security)
    await expect(
      page.getByText(/invalid email or password/i)
    ).toBeVisible({ timeout: 10000 });

    // AND: User remains on login page
    await expect(page).toHaveURL(/\/auth\/login/);

    // AND: No session cookie is created
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(
      (c) => c.name.includes('sb-') && c.name.includes('-auth-token')
    );
    expect(sessionCookie).toBeUndefined();
  });

  test('[P0][AC3] should display generic error for non-existent email (security)', async ({
    page,
  }) => {
    // GIVEN: User is on the login page
    await page.goto('/auth/login');

    // WHEN: User enters an email that does not exist
    const nonExistentEmail = `nonexistent-${Date.now()}@example.com`;
    await page.fill('[data-testid="email-input"]', nonExistentEmail);
    await page.fill('[data-testid="password-input"]', 'AnyPassword123');

    await page.click('[data-testid="login-button"]');

    // THEN: Generic error message is displayed (does NOT reveal email doesn't exist)
    await expect(
      page.getByText(/invalid email or password/i)
    ).toBeVisible({ timeout: 10000 });

    // AND: Error message is IDENTICAL to incorrect password error (AC2)
    // This prevents email enumeration attacks

    // AND: User remains on login page
    await expect(page).toHaveURL(/\/auth\/login/);

    // AND: No session cookie is created
    const cookies = await page.context().cookies();
    const sessionCookie = cookies.find(
      (c) => c.name.includes('sb-') && c.name.includes('-auth-token')
    );
    expect(sessionCookie).toBeUndefined();
  });

  test('[P1][AC4] should persist session after browser close and reopen', async ({
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
    await page.click('[data-testid="login-button"]');
    await page.waitForURL(/\/dashboard/);

    // AND: Session cookie exists
    const cookiesAfterLogin = await context.cookies();
    const sessionCookie = cookiesAfterLogin.find(
      (c) => c.name.includes('sb-') && c.name.includes('-auth-token')
    );
    expect(sessionCookie).toBeDefined();

    // WHEN: User simulates browser close and reopen (new page with same context)
    const newPage = await context.newPage();

    // AND: User navigates directly to dashboard
    await newPage.goto('/dashboard');

    // THEN: User is still authenticated (no redirect to login)
    await expect(newPage).toHaveURL(/\/dashboard/, { timeout: 10000 });

    // AND: Dashboard content loads (user is authenticated)
    await expect(newPage.getByTestId('dashboard-header')).toBeVisible();

    await newPage.close();
  });

  test('[P0][AC5] should display email verification success toast when redirected from confirmation', async ({
    page,
  }) => {
    // GIVEN: User has just verified their email
    // AND: Confirmation flow redirects to login with verified=true query param
    await page.goto('/auth/login?verified=true');

    // THEN: Success toast is displayed
    await expect(
      page.getByText(/email verified successfully/i)
    ).toBeVisible({ timeout: 10000 });

    // AND: User can proceed to log in normally
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('password-input')).toBeVisible();
    await expect(page.getByTestId('login-button')).toBeVisible();
  });

  test('[P1] should validate email format before submission', async ({ page }) => {
    // GIVEN: User is on the login page
    await page.goto('/auth/login');

    // WHEN: User enters invalid email format
    await page.fill('[data-testid="email-input"]', 'invalid-email-format');
    await page.fill('[data-testid="password-input"]', 'AnyPassword123');

    await page.click('[data-testid="login-button"]');

    // THEN: Validation error is displayed
    await expect(
      page.getByText(/please enter a valid email/i)
    ).toBeVisible();

    // AND: Form is not submitted (remains on login page)
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('[P1] should validate password is not empty', async ({ page }) => {
    // GIVEN: User is on the login page
    await page.goto('/auth/login');

    // WHEN: User enters email but leaves password empty
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', '');

    await page.click('[data-testid="login-button"]');

    // THEN: Validation error is displayed
    await expect(
      page.getByText(/password is required/i)
    ).toBeVisible();

    // AND: Form is not submitted
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
