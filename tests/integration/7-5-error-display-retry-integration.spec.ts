/**
 * Test ID: 7.5-INTEGRATION-001
 * Priority: P1
 * Story: 7.5 - Epic 7 Integration and Verification Testing
 *
 * Purpose: Integration test for ErrorDisplay component + retry state management
 * Coverage: AC-2 - Retry across all errors (integration level)
 *
 * Gap: Missing integration test of ErrorDisplay + retry button behavior
 */

import { test, expect } from '@playwright/test';

test.describe('[P1] ErrorDisplay + Retry Integration', () => {
  test('[P1] should integrate error display with retry state for retriable errors', async ({ page }) => {
    // GIVEN: App is loaded with mock API
    await page.goto('/');

    let callCount = 0;

    await page.route('**/api/optimize', async (route) => {
      callCount++;

      if (callCount <= 2) {
        // First two calls: retriable error
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: null,
            error: {
              code: 'LLM_ERROR',
              message: 'The AI service encountered an error. Please try again.',
            },
          }),
        });
      } else {
        // Third call: success
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              suggestions: {
                summary: ['Success after retry'],
                skills: ['Success after retry'],
                experience: ['Success after retry'],
              },
              analysis: {
                score: 80,
                matchedKeywords: [],
                missingKeywords: [],
                gaps: [],
              },
            },
            error: null,
          }),
        });
      }
    });

    // WHEN: User triggers error
    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock resume'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Test JD');
    await page.locator('[data-testid="optimize-button"]').click();

    // THEN: Error display shows with retry integration
    // 1. Error message displayed
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/AI service encountered an error/i);

    // 2. Retry button visible and enabled
    const retryButton = page.locator('[data-testid="retry-button"]');
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();

    // 3. Retry button shows "Retry" text
    await expect(retryButton).toContainText(/retry/i);

    // WHEN: User clicks retry
    await retryButton.click();

    // THEN: Retry state updates
    // 1. Button shows loading state during retry
    await expect(retryButton).toBeDisabled();

    // 2. Error persists if retry fails
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();

    // 3. Retry count increments (internal state - verify via retry button still available)
    await expect(retryButton).toBeEnabled();

    // WHEN: User retries again
    await retryButton.click();

    // THEN: Success clears error
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="error-display"]')).not.toBeVisible();
    await expect(retryButton).not.toBeVisible();
  });

  test('[P1] should disable retry button after max attempts (3)', async ({ page }) => {
    // GIVEN: App with mock API that always fails
    await page.goto('/');

    await page.route('**/api/optimize', async (route) => {
      // Always fail
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: null,
          error: {
            code: 'LLM_ERROR',
            message: 'Persistent error',
          },
        }),
      });
    });

    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock resume'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Test JD');

    // Initial attempt
    await page.locator('[data-testid="optimize-button"]').click();
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();

    const retryButton = page.locator('[data-testid="retry-button"]');

    // Retry attempt 1
    await expect(retryButton).toBeEnabled();
    await retryButton.click();
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    await expect(retryButton).toBeEnabled();

    // Retry attempt 2
    await retryButton.click();
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    await expect(retryButton).toBeEnabled();

    // Retry attempt 3
    await retryButton.click();
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();

    // THEN: After 3 retries, button should be disabled or show max retries message
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    // Note: Implementation may disable button or show different message
    // Verify one of these behaviors exists
    const maxRetriesReached =
      (await retryButton.isDisabled()) ||
      (await page.locator('[data-testid="max-retries-message"]').isVisible());

    expect(maxRetriesReached).toBeTruthy();
  });

  test('[P1] should clear error state when new optimization starts', async ({ page }) => {
    // GIVEN: User has encountered an error
    await page.goto('/');

    await page.route('**/api/optimize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: null,
          error: {
            code: 'LLM_TIMEOUT',
            message: 'Timeout error',
          },
        }),
      });
    });

    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock resume'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Test JD');
    await page.locator('[data-testid="optimize-button"]').click();

    // Verify error displayed
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();

    // WHEN: User changes resume or JD and retriggers optimization
    await page.locator('[data-testid="job-description-input"]').fill('New JD content');

    // Update mock to succeed
    await page.route('**/api/optimize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            suggestions: {
              summary: ['New suggestion'],
              skills: ['New suggestion'],
              experience: ['New suggestion'],
            },
            analysis: { score: 85, matchedKeywords: [], missingKeywords: [], gaps: [] },
          },
          error: null,
        }),
      });
    });

    await page.locator('[data-testid="optimize-button"]').click();

    // THEN: Error clears, retry count resets
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="error-display"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).not.toBeVisible();
  });

  test('[P1] should show retry button only for retriable errors (integration verification)', async ({ page }) => {
    // GIVEN: App loads
    await page.goto('/');

    // Test each error type
    const errorTypes = [
      { code: 'LLM_ERROR', retriable: true },
      { code: 'LLM_TIMEOUT', retriable: true },
      { code: 'RATE_LIMITED', retriable: true },
      { code: 'INVALID_FILE_TYPE', retriable: false },
      { code: 'FILE_TOO_LARGE', retriable: false },
      { code: 'PARSE_ERROR', retriable: false },
      { code: 'VALIDATION_ERROR', retriable: false },
    ];

    for (const errorType of errorTypes) {
      // Mock error response
      await page.route('**/api/optimize', async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: null,
            error: {
              code: errorType.code,
              message: `Test ${errorType.code} error`,
            },
          }),
        });
      });

      // Upload and trigger error
      await page.locator('input[type="file"]').setInputFiles({
        name: 'resume.pdf',
        mimeType: 'application/pdf',
        buffer: Buffer.from('Mock resume'),
      });

      await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
      await page.locator('[data-testid="job-description-input"]').fill('Test JD');
      await page.locator('[data-testid="optimize-button"]').click();

      // Verify error display
      await expect(page.locator('[data-testid="error-display"]')).toBeVisible();

      // Verify retry button visibility based on retriable status
      const retryButton = page.locator('[data-testid="retry-button"]');

      if (errorType.retriable) {
        await expect(retryButton).toBeVisible();
      } else {
        await expect(retryButton).not.toBeVisible();
      }

      // Clear error for next iteration
      await page.reload();
    }
  });
});
