/**
 * Test ID: 7.5-E2E-002
 * Priority: P1
 * Story: 7.5 - Epic 7 Integration and Verification Testing
 *
 * Purpose: Verify feedback persistence across page refresh for all suggestion types
 * Coverage: AC-5 - Feedback recording complete
 *
 * Gap: Missing E2E test for feedback on all suggestion types + persistence verification
 */

import { test, expect } from '@playwright/test';

test.describe('[P1] Feedback Persistence - All Suggestion Types', () => {
  test.beforeEach(async ({ page }) => {
    // Mock successful optimization response with all suggestion types
    await page.route('**/api/optimize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            suggestions: {
              summary: [
                'First summary suggestion',
                'Second summary suggestion',
                'Third summary suggestion',
              ],
              skills: [
                'First skills suggestion',
                'Second skills suggestion',
              ],
              experience: [
                'First experience suggestion',
                'Second experience suggestion',
                'Third experience suggestion',
              ],
            },
            analysis: {
              score: 88,
              matchedKeywords: ['software', 'engineer'],
              missingKeywords: ['kubernetes'],
              gaps: ['Add cloud experience'],
            },
          },
          error: null,
        }),
      });
    });
  });

  test('[P1] should persist feedback on summary suggestions across refresh', async ({ page }) => {
    // GIVEN: User completes optimization and provides feedback on summary
    await page.goto('/');

    // Upload resume and trigger optimization
    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock resume content'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer position');
    await page.locator('[data-testid="optimize-button"]').click();

    // Wait for suggestions
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });

    // Provide feedback on multiple summary suggestions
    await page.locator('[data-testid="feedback-up-summary-0"]').click();
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);

    await page.locator('[data-testid="feedback-down-summary-1"]').click();
    await expect(page.locator('[data-testid="feedback-down-summary-1"]')).toHaveClass(/active/);

    await page.locator('[data-testid="feedback-up-summary-2"]').click();
    await expect(page.locator('[data-testid="feedback-up-summary-2"]')).toHaveClass(/active/);

    // WHEN: User refreshes page
    await page.reload();

    // THEN: All summary feedback persists
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-down-summary-1"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-up-summary-2"]')).toHaveClass(/active/);
  });

  test('[P1] should persist feedback on skills suggestions across refresh', async ({ page }) => {
    // GIVEN: User provides feedback on skills suggestions
    await page.goto('/');

    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock resume content'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer position');
    await page.locator('[data-testid="optimize-button"]').click();

    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });

    // Provide feedback on skills
    await page.locator('[data-testid="feedback-up-skills-0"]').click();
    await expect(page.locator('[data-testid="feedback-up-skills-0"]')).toHaveClass(/active/);

    await page.locator('[data-testid="feedback-down-skills-1"]').click();
    await expect(page.locator('[data-testid="feedback-down-skills-1"]')).toHaveClass(/active/);

    // WHEN: Refresh
    await page.reload();

    // THEN: Skills feedback persists
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="feedback-up-skills-0"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-down-skills-1"]')).toHaveClass(/active/);
  });

  test('[P1] should persist feedback on experience suggestions across refresh', async ({ page }) => {
    // GIVEN: User provides feedback on experience suggestions
    await page.goto('/');

    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock resume content'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer position');
    await page.locator('[data-testid="optimize-button"]').click();

    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });

    // Provide feedback on experience
    await page.locator('[data-testid="feedback-down-experience-0"]').click();
    await expect(page.locator('[data-testid="feedback-down-experience-0"]')).toHaveClass(/active/);

    await page.locator('[data-testid="feedback-up-experience-1"]').click();
    await expect(page.locator('[data-testid="feedback-up-experience-1"]')).toHaveClass(/active/);

    await page.locator('[data-testid="feedback-down-experience-2"]').click();
    await expect(page.locator('[data-testid="feedback-down-experience-2"]')).toHaveClass(/active/);

    // WHEN: Refresh
    await page.reload();

    // THEN: Experience feedback persists
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="feedback-down-experience-0"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-up-experience-1"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-down-experience-2"]')).toHaveClass(/active/);
  });

  test('[P1] should persist mixed feedback across all suggestion types', async ({ page }) => {
    // GIVEN: User provides feedback on all suggestion types
    await page.goto('/');

    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock resume content'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer position');
    await page.locator('[data-testid="optimize-button"]').click();

    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });

    // Mixed feedback: some positive, some negative, across all types
    await page.locator('[data-testid="feedback-up-summary-0"]').click();
    await page.locator('[data-testid="feedback-down-summary-1"]').click();

    await page.locator('[data-testid="feedback-down-skills-0"]').click();
    await page.locator('[data-testid="feedback-up-skills-1"]').click();

    await page.locator('[data-testid="feedback-up-experience-0"]').click();
    await page.locator('[data-testid="feedback-down-experience-1"]').click();
    await page.locator('[data-testid="feedback-up-experience-2"]').click();

    // Verify all feedback active
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-down-summary-1"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-down-skills-0"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-up-skills-1"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-up-experience-0"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-down-experience-1"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-up-experience-2"]')).toHaveClass(/active/);

    // WHEN: Refresh
    await page.reload();

    // THEN: All feedback persists exactly as provided
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible();

    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-down-summary-1"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-down-skills-0"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-up-skills-1"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-up-experience-0"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-down-experience-1"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-up-experience-2"]')).toHaveClass(/active/);
  });

  test('[P1] should allow toggling feedback and persist toggle state', async ({ page }) => {
    // GIVEN: User provides feedback, then toggles it off
    await page.goto('/');

    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock resume content'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer position');
    await page.locator('[data-testid="optimize-button"]').click();

    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });

    // Provide thumbs up
    await page.locator('[data-testid="feedback-up-summary-0"]').click();
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);

    // WHEN: Click same button again to toggle off
    await page.locator('[data-testid="feedback-up-summary-0"]').click();
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).not.toHaveClass(/active/);

    // Refresh to verify toggle-off persists
    await page.reload();

    // THEN: Feedback remains toggled off
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).not.toHaveClass(/active/);
  });

  test('[P1] should allow changing feedback (thumbs up → thumbs down) and persist change', async ({ page }) => {
    // GIVEN: User provides thumbs up, then changes to thumbs down
    await page.goto('/');

    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock resume content'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer position');
    await page.locator('[data-testid="optimize-button"]').click();

    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });

    // Initial feedback: thumbs up
    await page.locator('[data-testid="feedback-up-skills-0"]').click();
    await expect(page.locator('[data-testid="feedback-up-skills-0"]')).toHaveClass(/active/);

    // WHEN: Change to thumbs down
    await page.locator('[data-testid="feedback-down-skills-0"]').click();
    await expect(page.locator('[data-testid="feedback-down-skills-0"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-up-skills-0"]')).not.toHaveClass(/active/);

    // Refresh to verify change persists
    await page.reload();

    // THEN: Changed feedback persists (thumbs down active, thumbs up not active)
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="feedback-down-skills-0"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-up-skills-0"]')).not.toHaveClass(/active/);
  });
});
