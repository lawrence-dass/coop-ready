/**
 * E2E Tests for Onboarding Flow
 * Story 8-5: Implement Onboarding Flow
 *
 * Tests the complete onboarding flow after signup:
 * - Redirect to onboarding after signup
 * - Complete onboarding with answers
 * - Skip onboarding
 * - Redirect to /optimize after completion
 */

import { test, expect } from '@playwright/test';

test.describe('Onboarding Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Start from the signup page
    await page.goto('/auth/signup');
  });

  test('should redirect to onboarding after signup', async ({ page }) => {
    // Generate unique email for this test
    const uniqueEmail = `test-${Date.now()}@example.com`;

    // Fill out signup form
    await page.getByTestId('email-input').fill(uniqueEmail);
    await page.getByTestId('password-input').fill('TestPassword123!');
    await page.getByTestId('confirm-password-input').fill('TestPassword123!');
    await page.getByTestId('terms-checkbox').check();

    // Submit signup form
    await page.getByTestId('signup-button').click();

    // Wait for redirect to onboarding
    await expect(page).toHaveURL('/auth/onboarding');

    // Verify onboarding form is displayed
    await expect(page.getByTestId('onboarding-form')).toBeVisible();
  });

  test('should complete onboarding and redirect to /optimize', async ({
    page,
  }) => {
    // Navigate directly to onboarding (assumes user is authenticated)
    await page.goto('/auth/onboarding');

    // Wait for form to be visible
    await expect(page.getByTestId('onboarding-form')).toBeVisible();

    // Question 1: Career Goal
    await page.getByTestId('career-goal-advancing').check();

    // Question 2: Experience Level
    await page.getByTestId('experience-level-mid').check();

    // Question 3: Target Industries (select multiple)
    await page.getByTestId('industry-technology').check();
    await page.getByTestId('industry-finance').check();

    // Complete onboarding
    await page.getByTestId('complete-button').click();

    // Wait for redirect to /optimize
    await expect(page).toHaveURL('/optimize');
  });

  test('should skip onboarding and redirect to /optimize', async ({ page }) => {
    // Navigate to onboarding
    await page.goto('/auth/onboarding');

    // Wait for form to be visible
    await expect(page.getByTestId('onboarding-form')).toBeVisible();

    // Click skip button
    await page.getByTestId('skip-button').click();

    // Wait for redirect to /optimize
    await expect(page).toHaveURL('/optimize');
  });

  test('should show validation error when no questions answered', async ({
    page,
  }) => {
    // Navigate to onboarding
    await page.goto('/auth/onboarding');

    // Try to complete without answering any questions
    await page.getByTestId('complete-button').click();

    // Should show error toast
    await expect(page.getByText('Please answer all questions')).toBeVisible();

    // Should still be on onboarding page
    await expect(page).toHaveURL('/auth/onboarding');
  });

  test('should show all career goal options', async ({ page }) => {
    await page.goto('/auth/onboarding');

    // Verify all career goal options are visible
    await expect(page.getByTestId('career-goal-first-job')).toBeVisible();
    await expect(
      page.getByTestId('career-goal-switching-careers')
    ).toBeVisible();
    await expect(page.getByTestId('career-goal-advancing')).toBeVisible();
    await expect(page.getByTestId('career-goal-promotion')).toBeVisible();
    await expect(page.getByTestId('career-goal-returning')).toBeVisible();
  });

  test('should show all experience level options', async ({ page }) => {
    await page.goto('/auth/onboarding');

    // Verify all experience level options are visible
    await expect(page.getByTestId('experience-level-entry')).toBeVisible();
    await expect(page.getByTestId('experience-level-mid')).toBeVisible();
    await expect(page.getByTestId('experience-level-senior')).toBeVisible();
    await expect(page.getByTestId('experience-level-executive')).toBeVisible();
  });

  test('should allow selecting multiple industries', async ({ page }) => {
    await page.goto('/auth/onboarding');

    // Select multiple industries
    await page.getByTestId('industry-technology').check();
    await page.getByTestId('industry-healthcare').check();
    await page.getByTestId('industry-finance').check();

    // Verify all three are checked
    await expect(page.getByTestId('industry-technology')).toBeChecked();
    await expect(page.getByTestId('industry-healthcare')).toBeChecked();
    await expect(page.getByTestId('industry-finance')).toBeChecked();
  });

  test('should show progress indicators', async ({ page }) => {
    await page.goto('/auth/onboarding');

    // Verify step indicators are visible
    await expect(page.getByText('Step 1 of 3')).toBeVisible();
    await expect(page.getByText('Step 2 of 3')).toBeVisible();
    await expect(page.getByText('Step 3 of 3')).toBeVisible();
  });

  test('should show welcome message', async ({ page }) => {
    await page.goto('/auth/onboarding');

    // Verify welcome message
    await expect(page.getByText('Welcome!')).toBeVisible();
    await expect(
      page.getByText(
        "Let's personalize your experience with a few quick questions."
      )
    ).toBeVisible();
  });
});
