/**
 * Story 11.1: Point Values for Suggestions - E2E Tests
 *
 * E2E tests verifying point values display correctly in the optimization UI.
 * Uses route mocking to provide deterministic point value data.
 *
 * Priority Distribution:
 * - P0: 4 tests (point value display, total banner, copy excludes points, no console errors)
 * - P1: 2 tests (color coding, regenerate updates points)
 */

import { test, expect } from '@playwright/test';

test.describe('Story 11.1: Point Values for Suggestions', () => {
  /**
   * Mock optimization API response with point values included.
   * Provides deterministic data for all three suggestion sections.
   */
  function mockOptimizeWithPointValues(page: import('@playwright/test').Page) {
    return page.route('**/api/optimize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: {
            suggestions: {
              summary: {
                original: 'Junior developer with basic web experience.',
                suggested: 'Results-driven software engineer with expertise in React and TypeScript, delivering scalable web applications.',
                ats_keywords_added: ['React', 'TypeScript', 'scalable'],
                ai_tell_phrases_rewritten: [],
                point_value: 10,
              },
              skills: {
                original: 'JavaScript, HTML, CSS',
                existing_skills: ['JavaScript', 'HTML', 'CSS'],
                matched_keywords: ['JavaScript'],
                missing_but_relevant: [
                  { skill: 'React', reason: 'Required by JD', point_value: 5 },
                  { skill: 'TypeScript', reason: 'Required by JD', point_value: 4 },
                ],
                skill_additions: ['React', 'TypeScript'],
                skill_removals: [],
                summary: 'Add React and TypeScript to match JD requirements.',
                total_point_value: 9,
              },
              experience: {
                original: 'Built web apps at Tech Corp.',
                experience_entries: [
                  {
                    company: 'Tech Corp',
                    role: 'Software Engineer',
                    dates: '2021 - 2024',
                    original_bullets: [
                      'Built web applications',
                      'Collaborated with team members',
                    ],
                    suggested_bullets: [
                      {
                        original: 'Built web applications',
                        suggested: 'Developed 5+ scalable React web applications serving 10K+ users',
                        metrics_added: ['5+', '10K+'],
                        keywords_incorporated: ['React', 'scalable'],
                        point_value: 8,
                      },
                      {
                        original: 'Collaborated with team members',
                        suggested: 'Led cross-functional team of 4 engineers using Agile methodologies',
                        metrics_added: ['4'],
                        keywords_incorporated: ['Agile', 'cross-functional'],
                        point_value: 7,
                      },
                    ],
                  },
                ],
                summary: 'Added metrics and keywords to 2 bullets.',
                total_point_value: 15,
              },
            },
            analysis: {
              score: 52,
              matchedKeywords: ['JavaScript', 'web applications'],
              missingKeywords: ['React', 'TypeScript', 'Agile'],
              gaps: ['Add modern framework experience', 'Highlight team leadership'],
            },
          },
          error: null,
        }),
      });
    });
  }

  /**
   * Shared setup: upload mock resume, enter JD, and trigger optimization.
   */
  async function runOptimization(page: import('@playwright/test').Page) {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();

    // Upload mock resume
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\nJunior developer with basic web experience.\nSkills: JavaScript, HTML, CSS\nExperience: Built web apps at Tech Corp.'),
    });
    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 5000 });

    // Enter job description
    const jdInput = page.locator('[data-testid="job-description-input"]');
    await jdInput.fill('Senior Software Engineer with React, TypeScript, Agile experience required. Must have 5+ years experience building scalable web applications.');

    // Click optimize
    const optimizeButton = page.locator('[data-testid="optimize-button"]');
    await expect(optimizeButton).toBeEnabled();
    await optimizeButton.click();

    // Wait for suggestions to display
    await expect(page.locator('[data-testid="suggestions-display"]')).toBeVisible({ timeout: 15000 });
  }

  // ==========================================================================
  // P0: Core Point Value Display
  // ==========================================================================

  test('[P0] 11.1-E2E-001: Each suggestion displays a point value badge', async ({ page }) => {
    // GIVEN: Mock API returns suggestions with point values
    await mockOptimizeWithPointValues(page);

    // WHEN: User completes optimization
    await runOptimization(page);

    // THEN: Point value badges are visible on suggestions
    // Summary suggestion should show +10 pts
    const summarySection = page.locator('[data-testid="suggestions-summary"]');
    await expect(summarySection).toBeVisible();
    await expect(summarySection.locator('text=+10 pts')).toBeVisible();

    // Skills suggestion should show +9 pts (total)
    const skillsSection = page.locator('[data-testid="suggestions-skills"]');
    await expect(skillsSection).toBeVisible();
    await expect(skillsSection.locator('text=+9 pts')).toBeVisible();

    // Experience bullets should show individual point values
    const experienceSection = page.locator('[data-testid="suggestions-experience"]');
    await expect(experienceSection).toBeVisible();
    await expect(experienceSection.locator('text=+8 pts')).toBeVisible();
    await expect(experienceSection.locator('text=+7 pts')).toBeVisible();
  });

  test('[P0] 11.1-E2E-002: Total improvement banner displays at top', async ({ page }) => {
    // GIVEN: Mock API returns suggestions with point values
    await mockOptimizeWithPointValues(page);

    // WHEN: User completes optimization
    await runOptimization(page);

    // THEN: Total improvement banner is visible
    await expect(page.getByText('Total Potential Improvement')).toBeVisible();

    // Total = summary (10) + skills (9) + experience (15) = 34
    await expect(page.getByText('+34')).toBeVisible();
    await expect(page.getByText('points')).toBeVisible();

    // Description text is present
    await expect(
      page.getByText('Estimated ATS score increase if you apply all suggestions')
    ).toBeVisible();
  });

  test('[P0] 11.1-E2E-003: Point values are valid numbers (no NaN, no negative)', async ({ page }) => {
    // GIVEN: Mock API returns suggestions with point values
    await mockOptimizeWithPointValues(page);

    // WHEN: User completes optimization
    await runOptimization(page);

    // THEN: All point badges show valid positive numbers
    const pointBadges = page.locator('text=/\\+\\d+ pts/');
    const badgeCount = await pointBadges.count();
    expect(badgeCount).toBeGreaterThan(0);

    // Verify no NaN or negative values in badges
    const nanBadges = page.locator('text=/NaN|\\-\\d+ pts/');
    await expect(nanBadges).toHaveCount(0);
  });

  test('[P0] 11.1-E2E-004: Copied text does not include point values', async ({ page }) => {
    // GIVEN: Mock API returns suggestions with point values
    await mockOptimizeWithPointValues(page);
    await runOptimization(page);

    // WHEN: User clicks copy on summary suggestion
    const copyButton = page.locator('[data-testid="copy-summary-0"]').first();
    await expect(copyButton).toBeVisible();
    await copyButton.click();

    // THEN: Clipboard should contain only suggestion text, not point values
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).not.toContain('pts');
    expect(clipboardText).not.toContain('point');
    expect(clipboardText).toContain('Results-driven software engineer');
  });

  // ==========================================================================
  // P1: Enhanced Features
  // ==========================================================================

  test('[P1] 11.1-E2E-005: Point badges use color coding based on value', async ({ page }) => {
    // GIVEN: Mock API returns suggestions with varying point values
    await mockOptimizeWithPointValues(page);

    // WHEN: User completes optimization
    await runOptimization(page);

    // THEN: High-value badges (8+) use green color
    const experienceSection = page.locator('[data-testid="suggestions-experience"]');
    const greenBadge = experienceSection.locator('.bg-green-600').first();
    await expect(greenBadge).toBeVisible();

    // Summary badge (10 points) should also be green
    const summarySection = page.locator('[data-testid="suggestions-summary"]');
    await expect(summarySection.locator('.bg-green-600')).toBeVisible();
  });

  test('[P1] 11.1-E2E-006: No console errors during point value display', async ({ page }) => {
    const consoleErrors: string[] = [];

    // Capture console errors
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // GIVEN: Mock API returns suggestions with point values
    await mockOptimizeWithPointValues(page);

    // WHEN: User completes optimization
    await runOptimization(page);

    // THEN: No console errors during the flow
    expect(consoleErrors).toHaveLength(0);
  });
});
