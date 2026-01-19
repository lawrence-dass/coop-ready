import { test, expect } from '../support/fixtures';

/**
 * User Registration E2E Tests
 *
 * Tests for Story 1.3: User Registration
 * Covers signup flow, validation, duplicate handling, and email confirmation.
 *
 * Priority breakdown:
 * - P0: Valid registration flow (AC1) - 1 test
 * - P0: Duplicate email handling (AC2) - 1 test
 * - P1: Email validation (AC3) - 1 test
 * - P1: Password validation (AC4) - 1 test
 * - P0: Email confirmation flow (AC5) - 1 test
 *
 * NOTE: These tests will FAIL initially (RED phase) until implementation is complete.
 * This is expected and required for TDD red-green-refactor cycle.
 */

test.describe('User Registration', () => {
  test('[P0][AC1] should register new user with valid email and password', async ({ page }) => {
    // GIVEN: User is on the signup page
    await page.goto('/auth/sign-up');

    // WHEN: User enters valid email and password (min 8 characters)
    const testEmail = `test-${Date.now()}@example.com`; // Unique email to avoid collisions
    await page.fill('[data-testid="email-input"]', testEmail);
    await page.fill('[data-testid="password-input"]', 'SecurePass123');
    await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123');

    // Register interception BEFORE clicking submit (network-first pattern)
    const signUpPromise = page.waitForResponse((resp) =>
      resp.url().includes('/auth/v1/signup') && resp.status() === 200
    );

    await page.click('[data-testid="signup-button"]');

    // THEN: Account is created in Supabase Auth
    const signUpResponse = await signUpPromise;
    const responseData = await signUpResponse.json();
    expect(responseData.user).toBeDefined();
    expect(responseData.user.email).toBe(testEmail);

    // AND: User is redirected to "check your email" page
    await expect(page).toHaveURL(/\/auth\/sign-up-success/);

    // AND: Success message is displayed
    await expect(page.getByText(/check your email/i)).toBeVisible();
  });

  test('[P0][AC2] should display error for duplicate email', async ({ page }) => {
    // GIVEN: User is on the signup page
    await page.goto('/auth/sign-up');

    // AND: An email that is already registered exists
    const existingEmail = process.env.TEST_USER_EMAIL || 'existing@example.com';

    // WHEN: User enters an email that is already registered
    await page.fill('[data-testid="email-input"]', existingEmail);
    await page.fill('[data-testid="password-input"]', 'SecurePass123');
    await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123');

    await page.click('[data-testid="signup-button"]');

    // THEN: Error message is displayed
    await expect(page.getByText(/an account with this email already exists/i)).toBeVisible({
      timeout: 10000,
    });

    // AND: User is NOT redirected
    await expect(page).toHaveURL(/\/auth\/sign-up/);
  });

  test('[P1][AC3] should validate invalid email format', async ({ page }) => {
    // GIVEN: User is on the signup page
    await page.goto('/auth/sign-up');

    // WHEN: User enters an invalid email format
    await page.fill('[data-testid="email-input"]', 'invalid-email-no-at-sign');
    await page.fill('[data-testid="password-input"]', 'SecurePass123');
    await page.fill('[data-testid="confirm-password-input"]', 'SecurePass123');

    // Trigger validation by clicking signup or blurring email field
    await page.click('[data-testid="signup-button"]');

    // THEN: Validation error is displayed
    await expect(page.getByText(/please enter a valid email/i)).toBeVisible();

    // AND: Form is not submitted (no navigation occurred)
    await expect(page).toHaveURL(/\/auth\/sign-up/);
  });

  test('[P1][AC4] should validate password length (minimum 8 characters)', async ({ page }) => {
    // GIVEN: User is on the signup page
    await page.goto('/auth/sign-up');

    // WHEN: User enters a password shorter than 8 characters
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'short');
    await page.fill('[data-testid="confirm-password-input"]', 'short');

    await page.click('[data-testid="signup-button"]');

    // THEN: Validation error is displayed
    await expect(page.getByText(/password must be at least 8 characters/i)).toBeVisible();

    // AND: Form is not submitted
    await expect(page).toHaveURL(/\/auth\/sign-up/);
  });

  /**
   * AC5 Test - Email Confirmation Flow
   *
   * SKIPPED: This test cannot run in automated CI because:
   * 1. Supabase generates real cryptographic tokens that we cannot mock
   * 2. The token_hash parameter requires a valid OTP from Supabase Auth
   * 3. Testing email confirmation requires either:
   *    - Real email infrastructure (Mailhog, Mailtrap, etc.)
   *    - Supabase test mode with predictable tokens
   *
   * Manual Testing Instructions:
   * 1. Register a new user via the signup form
   * 2. Check the email inbox for the confirmation email
   * 3. Click the confirmation link
   * 4. Verify redirect to /auth/login?verified=true
   * 5. Verify success toast "Email verified successfully!"
   */
  test.skip('[P0][AC5] should verify email and redirect to login after confirmation', async ({ page }) => {
    // GIVEN: User has registered and received a confirmation email
    // AND: User clicks the confirmation link in the email

    // NOTE: This test is skipped because it requires real Supabase tokens
    // The route handler expects: /auth/confirm?token_hash=REAL_TOKEN&type=signup

    // WHEN: User navigates to confirmation URL with valid token_hash
    await page.goto('/auth/confirm?token_hash=REAL_TOKEN_HERE&type=signup');

    // THEN: Email is verified (handled by Supabase)
    // AND: User is redirected to login page with success message
    await expect(page).toHaveURL(/\/auth\/login\?verified=true/);

    // AND: Success message is displayed
    await expect(page.getByText(/email verified successfully/i)).toBeVisible({
      timeout: 10000,
    });
  });

  test('[P1] should validate password confirmation match', async ({ page }) => {
    // GIVEN: User is on the signup page
    await page.goto('/auth/sign-up');

    // WHEN: User enters passwords that don't match
    await page.fill('[data-testid="email-input"]', 'test@example.com');
    await page.fill('[data-testid="password-input"]', 'SecurePass123');
    await page.fill('[data-testid="confirm-password-input"]', 'DifferentPass456');

    await page.click('[data-testid="signup-button"]');

    // THEN: Validation error is displayed
    await expect(page.getByText(/passwords do not match/i)).toBeVisible();

    // AND: Form is not submitted
    await expect(page).toHaveURL(/\/auth\/sign-up/);
  });
});
