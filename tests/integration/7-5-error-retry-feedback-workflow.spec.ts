/**
 * Test ID: 7.5-INTEGRATION-003
 * Priority: P1
 * Story: 7.5 - Epic 7 Integration and Verification Testing
 *
 * Purpose: Integration test for complete error → retry → success → feedback workflow
 * Coverage: AC-6 - Cross-error feedback
 *
 * Gap: Missing integration test for error → retry → success → feedback workflow
 */

import { test, expect } from '@playwright/test';

test.describe('[P1] Error → Retry → Feedback Workflow Integration', () => {
  test('[P1] should complete full workflow: error → retry → success → feedback', async ({ page }) => {
    // GIVEN: App with failing then succeeding API
    await page.goto('/');

    let attemptCount = 0;

    await page.route('**/api/optimize', async (route) => {
      attemptCount++;

      if (attemptCount === 1) {
        // First attempt: Error
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
        // Retry attempt: Success
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              suggestions: {
                summary: ['Suggestion after successful retry'],
                skills: ['Skills suggestion after retry'],
                experience: ['Experience suggestion after retry'],
              },
              analysis: {
                score: 88,
                matchedKeywords: ['software', 'engineer'],
                missingKeywords: [],
                gaps: [],
              },
            },
            error: null,
          }),
        });
      }
    });

    // WHEN: User uploads resume and triggers optimization
    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock resume content'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer position');
    await page.locator('[data-testid="optimize-button"]').click();

    // Step 1: Error occurs
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/AI service encountered an error/i);

    // Step 2: User retries
    const retryButton = page.locator('[data-testid="retry-button"]');
    await expect(retryButton).toBeVisible();
    await expect(retryButton).toBeEnabled();
    await retryButton.click();

    // Step 3: Success - suggestions displayed
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="error-display"]')).not.toBeVisible();

    // Verify suggestions loaded
    await expect(page.locator('[data-testid="suggestions-summary"]')).toContainText(/after successful retry/i);
    await expect(page.locator('[data-testid="score-display"]')).toContainText('88');

    // Step 4: User provides feedback
    await page.locator('[data-testid="feedback-up-summary-0"]').click();
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);

    await page.locator('[data-testid="feedback-down-skills-0"]').click();
    await expect(page.locator('[data-testid="feedback-down-skills-0"]')).toHaveClass(/active/);

    // THEN: Full workflow state persists
    await page.waitForTimeout(1000);
    await page.reload();

    // Verify final state
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-display"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-down-skills-0"]')).toHaveClass(/active/);
  });

  test('[P1] should handle multiple retry cycles before feedback', async ({ page }) => {
    // GIVEN: App with multiple failures before success
    await page.goto('/');

    let attemptCount = 0;

    await page.route('**/api/optimize', async (route) => {
      attemptCount++;

      if (attemptCount <= 3) {
        // First three attempts: Different errors
        const errors = [
          { code: 'LLM_TIMEOUT', message: 'Timeout error' },
          { code: 'LLM_ERROR', message: 'LLM error' },
          { code: 'RATE_LIMITED', message: 'Rate limited' },
        ];

        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: null,
            error: errors[attemptCount - 1],
          }),
        });
      } else {
        // Fourth attempt: Success
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              suggestions: {
                summary: ['Final success suggestion'],
                skills: ['Final success skills'],
                experience: ['Final success experience'],
              },
              analysis: { score: 90, matchedKeywords: [], missingKeywords: [], gaps: [] },
            },
            error: null,
          }),
        });
      }
    });

    // Upload and trigger
    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock resume'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer');
    await page.locator('[data-testid="optimize-button"]').click();

    // WHEN: User retries through multiple errors
    const retryButton = page.locator('[data-testid="retry-button"]');

    // Error 1: Timeout
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    await retryButton.click();

    // Error 2: LLM Error
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    await retryButton.click();

    // Error 3: Rate Limited
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    await retryButton.click();

    // Success
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });

    // THEN: User can provide feedback after multiple retry cycles
    await page.locator('[data-testid="feedback-up-summary-0"]').click();
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);

    // Verify feedback persists
    await page.waitForTimeout(1000);
    await page.reload();

    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);
  });

  test('[P1] should preserve resume and JD through error/retry/feedback cycle', async ({ page }) => {
    // GIVEN: User uploads specific resume and JD
    await page.goto('/');

    const resumeContent = 'Senior Software Engineer Resume Content';
    const jobDescription = 'Detailed job description for senior role';

    let attemptCount = 0;

    await page.route('**/api/optimize', async (route) => {
      attemptCount++;

      if (attemptCount === 1) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: null,
            error: { code: 'LLM_TIMEOUT', message: 'Timeout' },
          }),
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              suggestions: {
                summary: ['Test suggestion'],
                skills: ['Test suggestion'],
                experience: ['Test suggestion'],
              },
              analysis: { score: 85, matchedKeywords: [], missingKeywords: [], gaps: [] },
            },
            error: null,
          }),
        });
      }
    });

    // Upload resume with specific content
    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(resumeContent),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });

    // Enter specific JD
    await page.locator('[data-testid="job-description-input"]').fill(jobDescription);

    // Trigger optimization → error
    await page.locator('[data-testid="optimize-button"]').click();
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();

    // WHEN: User goes through full cycle
    // Retry
    await page.locator('[data-testid="retry-button"]').click();
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });

    // Provide feedback
    await page.locator('[data-testid="feedback-up-summary-0"]').click();

    await page.waitForTimeout(1000);

    // THEN: Resume and JD preserved throughout
    await page.reload();

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible();
    await expect(page.locator('[data-testid="job-description-input"]')).toHaveValue(jobDescription);
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);
  });

  test('[P1] should allow feedback after non-retriable error and new upload', async ({ page }) => {
    // GIVEN: User encounters non-retriable error
    await page.goto('/');

    let attemptCount = 0;

    await page.route('**/api/optimize', async (route) => {
      attemptCount++;

      if (attemptCount === 1) {
        // First attempt: Non-retriable error
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: null,
            error: {
              code: 'PARSE_ERROR',
              message: 'Could not read file. File may be corrupted.',
            },
          }),
        });
      } else {
        // Second attempt with new file: Success
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              suggestions: {
                summary: ['New file suggestion'],
                skills: ['New file skills'],
                experience: ['New file experience'],
              },
              analysis: { score: 82, matchedKeywords: [], missingKeywords: [], gaps: [] },
            },
            error: null,
          }),
        });
      }
    });

    // Upload file that causes parse error
    await page.locator('input[type="file"]').setInputFiles({
      name: 'corrupted.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Corrupted content'),
    });

    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer');
    await page.locator('[data-testid="optimize-button"]').click();

    // Error displayed, no retry button (non-retriable)
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/corrupted/i);
    await expect(page.locator('[data-testid="retry-button"]')).not.toBeVisible();

    // WHEN: User uploads new file
    await page.locator('input[type="file"]').setInputFiles({
      name: 'valid-resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Valid resume content'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });

    // Trigger new optimization
    await page.locator('[data-testid="optimize-button"]').click();

    // Success
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="error-display"]')).not.toBeVisible();

    // THEN: User can provide feedback
    await page.locator('[data-testid="feedback-up-summary-0"]').click();
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);

    // Feedback persists
    await page.waitForTimeout(1000);
    await page.reload();

    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);
  });

  test('[P1] should handle feedback → new optimization → error → retry → new feedback', async ({ page }) => {
    // GIVEN: User has completed first optimization with feedback
    await page.goto('/');

    let optimizationRound = 0;

    await page.route('**/api/optimize', async (route) => {
      optimizationRound++;

      if (optimizationRound === 1) {
        // First optimization: Success
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              suggestions: {
                summary: ['First round suggestion'],
                skills: ['First round skills'],
                experience: ['First round experience'],
              },
              analysis: { score: 80, matchedKeywords: [], missingKeywords: [], gaps: [] },
            },
            error: null,
          }),
        });
      } else if (optimizationRound === 2) {
        // Second optimization: Error
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: null,
            error: { code: 'LLM_ERROR', message: 'Error in second round' },
          }),
        });
      } else {
        // Retry of second optimization: Success
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              suggestions: {
                summary: ['Second round suggestion after retry'],
                skills: ['Second round skills after retry'],
                experience: ['Second round experience after retry'],
              },
              analysis: { score: 85, matchedKeywords: [], missingKeywords: [], gaps: [] },
            },
            error: null,
          }),
        });
      }
    });

    // First optimization
    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Resume'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('First JD');
    await page.locator('[data-testid="optimize-button"]').click();

    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });

    // Provide first feedback
    await page.locator('[data-testid="feedback-up-summary-0"]').click();
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);

    // WHEN: User changes JD and triggers second optimization
    await page.locator('[data-testid="job-description-input"]').fill('Second JD - different role');
    await page.locator('[data-testid="optimize-button"]').click();

    // Error occurs
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();

    // User retries
    await page.locator('[data-testid="retry-button"]').click();

    // Success
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });

    // THEN: User can provide new feedback on second optimization
    await page.locator('[data-testid="feedback-down-summary-0"]').click();
    await expect(page.locator('[data-testid="feedback-down-summary-0"]')).toHaveClass(/active/);

    // New feedback persists
    await page.waitForTimeout(1000);
    await page.reload();

    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="feedback-down-summary-0"]')).toHaveClass(/active/);
  });
});
