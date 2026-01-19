import { test, expect } from '../support/fixtures';

/**
 * Password Reset E2E Tests
 *
 * Tests for Story 1.6: Password Reset
 * Covers forgot password flow, reset link handling, password update, and security.
 *
 * Priority breakdown:
 * - P0: Forgot password link navigation (AC1) - 1 test
 * - P0: Request password reset with valid email (AC2) - 1 test
 * - P0: Non-existent email handling - no enumeration (AC3) - 1 test
 * - P0: Reset link navigation (AC4) - 1 test
 * - P0: Password update flow (AC5) - 1 test
 * - P0: Expired link handling (AC6) - 1 test
 *
 * NOTE: These tests will FAIL initially (RED phase) until implementation is complete.
 * This is expected and required for TDD red-green-refactor cycle.
 */

test.describe('Password Reset Flow', () => {
  test('[P0][AC1] should navigate to password reset request page when clicking forgot password link', async ({
    page,
  }) => {
    // GIVEN: User is on the login page
    await page.goto('/auth/login');

    // WHEN: User clicks "Forgot password?" link
    await page.click('[data-testid="forgot-password-link"]');

    // THEN: User is taken to the password reset request page
    await expect(page).toHaveURL(/\/auth\/forgot-password/);

    // AND: Password reset form is displayed
    await expect(page.getByTestId('email-input')).toBeVisible();
    await expect(page.getByTestId('reset-password-button')).toBeVisible();

    // AND: Instructions are shown
    await expect(
      page.getByText(/enter your email address/i)
    ).toBeVisible();
  });

  test('[P0][AC2] should send password reset email for registered email and show success message', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: A registered user exists
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    // AND: User is on the password reset request page
    await page.goto('/auth/forgot-password');

    // WHEN: User enters registered email
    await page.fill('[data-testid="email-input"]', user.email);

    // Register network request expectation BEFORE clicking (network-first pattern)
    // Use flexible endpoint matching to handle Supabase SDK version differences
    const resetRequestPromise = page.waitForResponse(
      (resp) =>
        (resp.url().includes('/auth/v1/recover') ||
          resp.url().includes('/auth/v1/otp') ||
          resp.url().includes('supabase') && resp.url().includes('recover')) &&
        resp.request().method() === 'POST',
      { timeout: 15000 }
    );

    await page.click('[data-testid="reset-password-button"]');

    // THEN: Password reset email is sent via Supabase
    const resetResponse = await resetRequestPromise;
    expect(resetResponse.status()).toBe(200);

    // AND: Success message is displayed
    await expect(
      page.getByText(/check your email for reset instructions/i)
    ).toBeVisible({ timeout: 10000 });

    // AND: Form is hidden (success state)
    await expect(page.getByTestId('email-input')).not.toBeVisible();
  });

  test('[P0][AC3] should show same success message for non-existent email (security - no enumeration)', async ({
    page,
  }) => {
    // GIVEN: User is on the password reset request page
    await page.goto('/auth/forgot-password');

    // WHEN: User enters an email that is NOT registered
    const nonExistentEmail = `nonexistent-${Date.now()}@example.com`;
    await page.fill('[data-testid="email-input"]', nonExistentEmail);

    await page.click('[data-testid="reset-password-button"]');

    // THEN: SAME success message is displayed (does NOT reveal email doesn't exist)
    await expect(
      page.getByText(/check your email for reset instructions/i)
    ).toBeVisible({ timeout: 10000 });

    // AND: Success message is IDENTICAL to AC2 (prevents email enumeration attacks)
    // Security requirement: Attacker cannot determine if email exists in system

    // AND: Form is hidden (same UX as valid email)
    await expect(page.getByTestId('email-input')).not.toBeVisible();
  });

  test('[P0][AC4] should navigate to password reset form when clicking valid reset link within 1 hour', async ({
    page,
  }) => {
    // GIVEN: A user has clicked a password reset link
    // Simulate password reset email sent (via Supabase)
    // In real flow: User receives email → clicks link → Supabase validates token → redirects to update-password
    // For test: We'll directly navigate with a valid recovery token

    // WHEN: User clicks the reset link within 1 hour (valid token)
    // NOTE: This test requires manual verification or Supabase test helper to generate valid token
    // For now, we test the page navigation and UI presence

    await page.goto('/auth/update-password');

    // THEN: User is taken to the password reset form
    await expect(page).toHaveURL(/\/auth\/update-password/);

    // AND: Password update form is displayed
    await expect(page.getByTestId('new-password-input')).toBeVisible();
    await expect(page.getByTestId('confirm-password-input')).toBeVisible();
    await expect(page.getByTestId('update-password-button')).toBeVisible();

    // AND: Instructions are shown
    await expect(
      page.getByText(/enter your new password/i)
    ).toBeVisible();
  });

  test('[P0][AC5] should update password and redirect to login with success message', async ({
    page,
    userFactory,
  }) => {
    // GIVEN: User has a valid password reset session
    // (Simulated by navigating to update-password page after clicking valid reset link)
    const testPassword = 'SecurePass123';
    const user = await userFactory.createWithPassword({
      password: testPassword,
    });

    // NOTE: In real flow, user would have clicked reset link from email
    // For this test, we assume user is on update-password page with valid session
    await page.goto('/auth/update-password');

    // WHEN: User enters new password (min 8 characters) and confirms it
    const newPassword = 'NewSecurePass456';
    await page.fill('[data-testid="new-password-input"]', newPassword);
    await page.fill('[data-testid="confirm-password-input"]', newPassword);

    // Register session update expectation BEFORE clicking (network-first pattern)
    // Use flexible endpoint matching to handle Supabase SDK version differences
    const updatePromise = page.waitForResponse(
      (resp) =>
        (resp.url().includes('/auth/v1/user') ||
          resp.url().includes('supabase') && resp.url().includes('user')) &&
        resp.request().method() === 'PUT',
      { timeout: 15000 }
    );

    await page.click('[data-testid="update-password-button"]');

    // THEN: Password is updated via Supabase
    const updateResponse = await updatePromise;
    expect(updateResponse.status()).toBe(200);

    // AND: User is redirected to login page with reset=true query param
    await expect(page).toHaveURL(/\/auth\/login\?reset=true/, {
      timeout: 10000,
    });

    // AND: Success toast is displayed
    await expect(
      page.getByText(/password updated successfully/i)
    ).toBeVisible({ timeout: 10000 });

    // AND: User can now log in with new password
    await page.fill('[data-testid="email-input"]', user.email);
    await page.fill('[data-testid="password-input"]', newPassword);
    await page.click('[data-testid="login-button"]');

    // Verify login succeeds with new password
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('[P0][AC6] should show error message for expired reset link and allow new request', async ({
    page,
  }) => {
    // GIVEN: User clicks a password reset link
    // AND: The link is expired (>1 hour old)
    // NOTE: Testing expired tokens requires either:
    // 1. Mock Supabase response to return expired error
    // 2. Wait 1 hour (not practical)
    // 3. Use Supabase test helpers to generate expired token
    // For now, we'll test the error handling UI when session is invalid

    await page.goto('/auth/update-password');

    // Simulate expired session by trying to update password without valid session
    // (In real scenario, Supabase would return 401/403 for expired token)

    // WHEN: User tries to update password with expired session
    await page.fill('[data-testid="new-password-input"]', 'NewPassword123');
    await page.fill('[data-testid="confirm-password-input"]', 'NewPassword123');

    await page.click('[data-testid="update-password-button"]');

    // THEN: Error message is displayed
    await expect(
      page.getByText(/this reset link has expired/i)
    ).toBeVisible({ timeout: 10000 });

    // AND: User can request a new reset email
    await expect(
      page.getByText(/request a new reset email/i)
    ).toBeVisible();

    // AND: Link to forgot-password page is available
    const requestNewLink = page.locator('a[href*="/auth/forgot-password"]');
    await expect(requestNewLink).toBeVisible();
  });

  test('[P1] should validate email format before submitting password reset request', async ({
    page,
  }) => {
    // GIVEN: User is on the password reset request page
    await page.goto('/auth/forgot-password');

    // WHEN: User enters invalid email format
    await page.fill('[data-testid="email-input"]', 'invalid-email-format');
    await page.click('[data-testid="reset-password-button"]');

    // THEN: Validation error is displayed
    await expect(
      page.getByText(/please enter a valid email/i)
    ).toBeVisible();

    // AND: Form is not submitted
    await expect(page).toHaveURL(/\/auth\/forgot-password/);
  });

  test('[P1] should validate password requirements in update password form', async ({
    page,
  }) => {
    // GIVEN: User is on the password update page
    await page.goto('/auth/update-password');

    // WHEN: User enters password less than 8 characters
    await page.fill('[data-testid="new-password-input"]', 'Short1');
    await page.fill('[data-testid="confirm-password-input"]', 'Short1');
    await page.click('[data-testid="update-password-button"]');

    // THEN: Validation error is displayed
    await expect(
      page.getByText(/password must be at least 8 characters/i)
    ).toBeVisible();

    // AND: Form is not submitted
    await expect(page).toHaveURL(/\/auth\/update-password/);
  });

  test('[P1] should validate password confirmation matches in update password form', async ({
    page,
  }) => {
    // GIVEN: User is on the password update page
    await page.goto('/auth/update-password');

    // WHEN: User enters mismatched passwords
    await page.fill('[data-testid="new-password-input"]', 'NewPassword123');
    await page.fill('[data-testid="confirm-password-input"]', 'DifferentPass456');
    await page.click('[data-testid="update-password-button"]');

    // THEN: Validation error is displayed
    await expect(
      page.getByText(/passwords do not match/i)
    ).toBeVisible();

    // AND: Form is not submitted
    await expect(page).toHaveURL(/\/auth\/update-password/);
  });
});
