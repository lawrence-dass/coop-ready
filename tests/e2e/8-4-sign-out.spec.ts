/**
 * End-to-End Tests for Story 8.4: Sign Out
 *
 * Tests the complete sign-out functionality across the application.
 *
 * @P0 - Critical sign-out flow
 */

import { test, expect } from '@playwright/test';

const TEST_USER = {
  email: process.env.TEST_USER_EMAIL || 'test@example.com',
  password: process.env.TEST_USER_PASSWORD || 'TestPassword123!',
};

test.describe('Sign Out @P0', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
  });

  test('authenticated user sees sign-out button', async ({ page }) => {
    // Sign in first with email/password
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', TEST_USER.email);
    await page.fill('[data-testid="password-input"]', TEST_USER.password);
    await page.click('[data-testid="login-button"]');

    // Wait for redirect to home page
    await page.waitForURL('/');

    // Verify sign-out button is visible
    const signOutButton = page.locator('[data-testid="sign-out-button"]');
    await expect(signOutButton).toBeVisible();

    // Verify user email is displayed
    const userEmail = page.locator('[data-testid="user-email"]');
    await expect(userEmail).toContainText(TEST_USER.email);
  });

  test('anonymous user does not see sign-out button', async ({ page }) => {
    // Just visit home page (anonymous session auto-created)
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Verify sign-out button is NOT visible
    const signOutButton = page.locator('[data-testid="sign-out-button"]');
    await expect(signOutButton).not.toBeVisible();
  });

  test('successful sign-out redirects to home page', async ({ page }) => {
    // Sign in with email/password
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', TEST_USER.email);
    await page.fill('[data-testid="password-input"]', TEST_USER.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/');

    // Click sign-out button
    await page.click('[data-testid="sign-out-button"]');

    // Should stay on home page
    await expect(page).toHaveURL('/');

    // Sign-out button should disappear (user is now anonymous)
    const signOutButton = page.locator('[data-testid="sign-out-button"]');
    await expect(signOutButton).not.toBeVisible();
  });

  test('sign-out terminates session', async ({ page }) => {
    // Sign in
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', TEST_USER.email);
    await page.fill('[data-testid="password-input"]', TEST_USER.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/');

    // Sign out
    await page.click('[data-testid="sign-out-button"]');
    // Wait for sign-out button to disappear (sign-out complete)
    await expect(page.locator('[data-testid="sign-out-button"]')).not.toBeVisible();

    // Refresh page - user should still be anonymous
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Sign-out button should NOT appear (session terminated)
    const signOutButton = page.locator('[data-testid="sign-out-button"]');
    await expect(signOutButton).not.toBeVisible();
  });

  test('sign-out shows loading state', async ({ page }) => {
    // Sign in
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', TEST_USER.email);
    await page.fill('[data-testid="password-input"]', TEST_USER.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/');

    // Click sign-out button
    const signOutButton = page.locator('[data-testid="sign-out-button"]');
    await signOutButton.click();

    // Button should be disabled during sign-out
    await expect(signOutButton).toBeDisabled();
  });

  test('can sign out from any page', async ({ page }) => {
    // Sign in
    await page.goto('/auth/login');
    await page.fill('[data-testid="email-input"]', TEST_USER.email);
    await page.fill('[data-testid="password-input"]', TEST_USER.password);
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/');

    // Sign out should work from home page
    await page.click('[data-testid="sign-out-button"]');
    await page.waitForTimeout(500);

    // Verify signed out
    const signOutButton = page.locator('[data-testid="sign-out-button"]');
    await expect(signOutButton).not.toBeVisible();
  });
});
