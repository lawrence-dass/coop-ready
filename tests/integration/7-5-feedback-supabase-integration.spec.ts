/**
 * Test ID: 7.5-INTEGRATION-002
 * Priority: P1
 * Story: 7.5 - Epic 7 Integration and Verification Testing
 *
 * Purpose: Integration test for feedback storage in Supabase sessions table
 * Coverage: AC-5 - Feedback recording complete (Supabase persistence)
 *
 * Gap: Missing integration test for feedback persistence across refresh in Supabase
 */

import { test, expect } from '@playwright/test';

test.describe('[P1] Feedback Supabase Storage Integration', () => {
  test('[P1] should store feedback in Supabase sessions table', async ({ page, context }) => {
    // GIVEN: User completes optimization
    await page.goto('/');

    await page.route('**/api/optimize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            suggestions: {
              summary: ['Test summary suggestion'],
              skills: ['Test skills suggestion'],
              experience: ['Test experience suggestion'],
            },
            analysis: {
              score: 85,
              matchedKeywords: [],
              missingKeywords: [],
              gaps: [],
            },
          },
          error: null,
        }),
      });
    });

    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock resume'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer');
    await page.locator('[data-testid="optimize-button"]').click();

    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });

    // WHEN: User provides feedback
    await page.locator('[data-testid="feedback-up-summary-0"]').click();
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);

    // Wait for Supabase update (debounced save)
    await page.waitForTimeout(1000);

    // THEN: Feedback persists through session storage
    // Verify by refreshing page and checking feedback state
    await page.reload();

    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);
  });

  test('[P1] should persist multiple feedback entries in session', async ({ page }) => {
    // GIVEN: User completes optimization
    await page.goto('/');

    await page.route('**/api/optimize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            suggestions: {
              summary: ['S1', 'S2'],
              skills: ['K1', 'K2'],
              experience: ['E1', 'E2'],
            },
            analysis: {
              score: 85,
              matchedKeywords: [],
              missingKeywords: [],
              gaps: [],
            },
          },
          error: null,
        }),
      });
    });

    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock resume'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer');
    await page.locator('[data-testid="optimize-button"]').click();

    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });

    // WHEN: User provides multiple feedback entries
    await page.locator('[data-testid="feedback-up-summary-0"]').click();
    await page.locator('[data-testid="feedback-down-summary-1"]').click();
    await page.locator('[data-testid="feedback-up-skills-0"]').click();
    await page.locator('[data-testid="feedback-down-skills-1"]').click();
    await page.locator('[data-testid="feedback-up-experience-0"]').click();

    // Wait for Supabase batch update
    await page.waitForTimeout(1500);

    // THEN: All feedback persists
    await page.reload();

    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-down-summary-1"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-up-skills-0"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-down-skills-1"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-up-experience-0"]')).toHaveClass(/active/);
  });

  test('[P1] should update feedback when user changes selection', async ({ page }) => {
    // GIVEN: User has provided feedback
    await page.goto('/');

    await page.route('**/api/optimize', async (route) => {
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
            analysis: {
              score: 85,
              matchedKeywords: [],
              missingKeywords: [],
              gaps: [],
            },
          },
          error: null,
        }),
      });
    });

    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock resume'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer');
    await page.locator('[data-testid="optimize-button"]').click();

    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });

    // Initial feedback: thumbs up
    await page.locator('[data-testid="feedback-up-summary-0"]').click();
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);

    await page.waitForTimeout(1000);

    // Verify persists
    await page.reload();
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);

    // WHEN: User changes to thumbs down
    await page.locator('[data-testid="feedback-down-summary-0"]').click();
    await expect(page.locator('[data-testid="feedback-down-summary-0"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).not.toHaveClass(/active/);

    await page.waitForTimeout(1000);

    // THEN: Changed feedback persists in Supabase
    await page.reload();
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="feedback-down-summary-0"]')).toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).not.toHaveClass(/active/);
  });

  test('[P1] should clear feedback when user toggles off', async ({ page }) => {
    // GIVEN: User has provided feedback
    await page.goto('/');

    await page.route('**/api/optimize', async (route) => {
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
            analysis: {
              score: 85,
              matchedKeywords: [],
              missingKeywords: [],
              gaps: [],
            },
          },
          error: null,
        }),
      });
    });

    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock resume'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer');
    await page.locator('[data-testid="optimize-button"]').click();

    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });

    // Provide feedback
    await page.locator('[data-testid="feedback-up-skills-0"]').click();
    await expect(page.locator('[data-testid="feedback-up-skills-0"]')).toHaveClass(/active/);

    await page.waitForTimeout(1000);

    // WHEN: User clicks same button to toggle off
    await page.locator('[data-testid="feedback-up-skills-0"]').click();
    await expect(page.locator('[data-testid="feedback-up-skills-0"]')).not.toHaveClass(/active/);

    await page.waitForTimeout(1000);

    // THEN: Cleared feedback persists (no feedback stored)
    await page.reload();
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="feedback-up-skills-0"]')).not.toHaveClass(/active/);
    await expect(page.locator('[data-testid="feedback-down-skills-0"]')).not.toHaveClass(/active/);
  });

  test('[P1] should preserve feedback through new optimization (same session)', async ({ page }) => {
    // GIVEN: User has provided feedback on first optimization
    await page.goto('/');

    let callCount = 0;

    await page.route('**/api/optimize', async (route) => {
      callCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            suggestions: {
              summary: [`Suggestion ${callCount}`],
              skills: [`Suggestion ${callCount}`],
              experience: [`Suggestion ${callCount}`],
            },
            analysis: {
              score: 80 + callCount,
              matchedKeywords: [],
              missingKeywords: [],
              gaps: [],
            },
          },
          error: null,
        }),
      });
    });

    // First optimization
    await page.locator('input[type="file"]').setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock resume'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer');
    await page.locator('[data-testid="optimize-button"]').click();

    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });

    // Provide feedback on first optimization
    await page.locator('[data-testid="feedback-up-summary-0"]').click();
    await expect(page.locator('[data-testid="feedback-up-summary-0"]')).toHaveClass(/active/);

    await page.waitForTimeout(1000);

    // WHEN: User triggers new optimization (change JD)
    await page.locator('[data-testid="job-description-input"]').fill('Senior Software Engineer - new role');
    await page.locator('[data-testid="optimize-button"]').click();

    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 5000 });

    // THEN: Previous feedback should be cleared/reset for new suggestions
    // (New suggestions have different IDs, so previous feedback doesn't apply)
    // But feedback data structure in session should still exist

    // Provide new feedback
    await page.locator('[data-testid="feedback-down-summary-0"]').click();
    await expect(page.locator('[data-testid="feedback-down-summary-0"]')).toHaveClass(/active/);

    await page.waitForTimeout(1000);

    // Verify new feedback persists
    await page.reload();
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="feedback-down-summary-0"]')).toHaveClass(/active/);
  });
});
