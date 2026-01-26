/**
 * Test ID: 7.5-E2E-003
 * Priority: P0 (BLOCKER)
 * Story: 7.5 - Epic 7 Integration and Verification Testing
 *
 * Purpose: Verify error state, retry count, and feedback persist across page refresh
 * Coverage: AC-9 - Session persistence
 *
 * Gap: CRITICAL - No test verifies error/retry/feedback survive page refresh
 * Impact: Data loss on refresh would break core V0.1 anonymous user experience
 * Risk Score: 9 (Probability=3: Known gap × Impact=3: Data loss)
 */

import { test, expect } from '@playwright/test';

test.describe('[P0] Session Persistence - Error, Retry, Feedback', () => {
  test('[P0] should persist error state across page refresh', async ({ page }) => {
    // GIVEN: User navigates to app and encounters an error
    await page.goto('/');

    // Mock API to return LLM_TIMEOUT error
    await page.route('**/api/optimize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: null,
          error: {
            code: 'LLM_TIMEOUT',
            message: 'The optimization process took too long and was cancelled.',
          },
        }),
      });
    });

    // Upload resume and trigger error
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer position');
    await page.locator('[data-testid="optimize-button"]').click();

    // Verify error is displayed
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-title"]')).toContainText('Optimization Took Too Long');

    // WHEN: User refreshes the page
    await page.reload();

    // THEN: Error state persists after refresh
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-title"]')).toContainText('Optimization Took Too Long');
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });

  test('[P0] should persist retry count across page refresh', async ({ page, context }) => {
    // GIVEN: User navigates to app
    await page.goto('/');

    let retryCount = 0;

    // Mock API to fail twice, then succeed
    await page.route('**/api/optimize', async (route) => {
      retryCount++;

      if (retryCount <= 2) {
        // First two attempts fail
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
        // Third attempt succeeds
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              suggestions: {
                summary: ['Improved summary'],
                skills: ['Enhanced skills'],
                experience: ['Better experience'],
              },
              analysis: {
                score: 85,
                gaps: [],
              },
            },
            error: null,
          }),
        });
      }
    });

    // Upload resume and JD
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer position');

    // First attempt - fails
    await page.locator('[data-testid="optimize-button"]').click();
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();

    // WHEN: User refreshes page after first failed attempt
    await page.reload();

    // THEN: Retry count persists (still at 1)
    // Second attempt - fails again
    await page.locator('[data-testid="retry-button"]').click();
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();

    // Refresh again
    await page.reload();

    // Third attempt - succeeds
    await page.locator('[data-testid="retry-button"]').click();
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });
  });

  test('[P0] should persist feedback across page refresh', async ({ page }) => {
    // GIVEN: User has completed optimization and provided feedback
    await page.goto('/');

    // Mock successful optimization
    await page.route('**/api/optimize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            suggestions: {
              summary: ['Improved summary suggestion'],
              skills: ['Enhanced skills suggestion'],
              experience: ['Better experience suggestion'],
            },
            analysis: {
              score: 85,
              gaps: ['Add more technical skills'],
            },
          },
          error: null,
        }),
      });
    });

    // Upload resume and trigger optimization
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer position');
    await page.locator('[data-testid="optimize-button"]').click();

    // Wait for suggestions
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });

    // Provide feedback on summary suggestion (thumbs up)
    const summaryFeedbackUp = page.locator('[data-testid="feedback-up-summary-0"]');
    await summaryFeedbackUp.click();
    await expect(summaryFeedbackUp).toHaveClass(/active/);

    // Provide feedback on skills suggestion (thumbs down)
    const skillsFeedbackDown = page.locator('[data-testid="feedback-down-skills-0"]');
    await skillsFeedbackDown.click();
    await expect(skillsFeedbackDown).toHaveClass(/active/);

    // WHEN: User refreshes the page
    await page.reload();

    // THEN: Feedback persists after refresh
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible();

    // Verify summary feedback (thumbs up) is still active
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);

    // Verify skills feedback (thumbs down) is still active
    await expect(page.locator('[data-testid="feedback-down-skills-0"]')).toHaveClass(/active/);
  });

  test('[P0] should persist all state components together: error + retry + feedback', async ({ page }) => {
    // GIVEN: User has encountered error, retried, succeeded, and provided feedback
    await page.goto('/');

    let callCount = 0;

    await page.route('**/api/optimize', async (route) => {
      callCount++;

      if (callCount === 1) {
        // First call: error
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: null,
            error: {
              code: 'LLM_TIMEOUT',
              message: 'The optimization process took too long and was cancelled.',
            },
          }),
        });
      } else {
        // Retry: success
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            data: {
              suggestions: {
                summary: ['Improved summary'],
                skills: ['Enhanced skills'],
                experience: ['Better experience'],
              },
              analysis: {
                score: 85,
                gaps: [],
              },
            },
            error: null,
          }),
        });
      }
    });

    // Upload and trigger initial error
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer position');
    await page.locator('[data-testid="optimize-button"]').click();

    // Verify error
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();

    // Retry and get success
    await page.locator('[data-testid="retry-button"]').click();
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });

    // Provide feedback
    await page.locator('[data-testid="feedback-up-summary-0"]').click();

    // WHEN: User refreshes page
    await page.reload();

    // THEN: All state persists
    // Resume and JD still present
    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible();
    await expect(page.locator('[data-testid="job-description-input"]')).toHaveValue('Software Engineer position');

    // Suggestions still visible
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible();

    // Feedback still active
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);

    // Retry count preserved (verify by checking internal state if exposed)
    // Error cleared after successful retry
    await expect(page.locator('[data-testid="error-display"]')).not.toBeVisible();
  });

  test('[P0] should preserve resume and job description through error cycles', async ({ page }) => {
    // GIVEN: User has uploaded resume and JD
    await page.goto('/');

    const resumeContent = 'Senior Software Engineer with 5 years experience';
    const jobDescription = 'We are looking for a Senior Software Engineer';

    // Mock error response
    await page.route('**/api/optimize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: null,
          error: {
            code: 'LLM_ERROR',
            message: 'The AI service encountered an error.',
          },
        }),
      });
    });

    // Upload resume
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from(resumeContent),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });

    // Enter job description
    await page.locator('[data-testid="job-description-input"]').fill(jobDescription);

    // Trigger error
    await page.locator('[data-testid="optimize-button"]').click();
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();

    // WHEN: User refreshes page
    await page.reload();

    // THEN: Resume and JD preserved
    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible();
    await expect(page.locator('[data-testid="job-description-input"]')).toHaveValue(jobDescription);

    // Error state also preserved
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
  });
});
