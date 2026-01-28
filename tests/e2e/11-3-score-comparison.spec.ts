/**
 * E2E Tests for Score Comparison
 * Story 11.3: Implement Score Comparison
 *
 * Tests the complete user flow including score comparison display.
 */

import { test, expect } from '@playwright/test';

// ============================================================================
// TEST DATA
// ============================================================================

const SAMPLE_RESUME = `
JOHN DOE
Software Engineer
john.doe@email.com | (555) 123-4567

SUMMARY
Experienced software engineer with 5 years in web development.

SKILLS
JavaScript, HTML, CSS, React

EXPERIENCE
Software Engineer | Tech Company | 2020 - Present
- Developed web applications
- Worked with team members
- Fixed bugs

EDUCATION
Bachelor of Science in Computer Science | University | 2019
`.trim();

const SAMPLE_JOB_DESCRIPTION = `
We are looking for a Senior Software Engineer with:
- 5+ years experience in React and TypeScript
- Strong problem-solving skills
- Experience with Node.js and Express
- Knowledge of Docker and Kubernetes
- Excellent communication skills
`.trim();

// ============================================================================
// TESTS
// ============================================================================

test.describe('Score Comparison Feature', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('should display score comparison after optimization', async ({ page }) => {
    // Step 1: Upload resume (paste text)
    const resumeInput = page.getByLabel(/paste your resume/i);
    await resumeInput.fill(SAMPLE_RESUME);
    await resumeInput.blur();

    // Step 2: Enter job description
    const jdInput = page.getByLabel(/paste the job description/i);
    await jdInput.fill(SAMPLE_JOB_DESCRIPTION);
    await jdInput.blur();

    // Step 3: Click analyze button
    const analyzeButton = page.getByRole('button', { name: /analyze/i });
    await analyzeButton.click();

    // Step 4: Wait for analysis to complete
    await page.waitForSelector('[data-testid="ats-score-display"]', { timeout: 90000 });

    // Step 5: Wait for suggestions to generate
    await page.waitForSelector('[data-testid="suggestions-display"]', { timeout: 90000 });

    // Step 6: Verify score comparison appears
    const scoreComparison = page.getByTestId('score-comparison');
    await expect(scoreComparison).toBeVisible();

    // Step 7: Verify original score is displayed
    const originalScore = page.getByTestId('original-score');
    await expect(originalScore).toBeVisible();
    const originalScoreText = await originalScore.textContent();
    expect(originalScoreText).toMatch(/^\d+$/); // Should be a number

    // Step 8: Verify projected score is displayed
    const projectedScore = page.getByTestId('projected-score');
    await expect(projectedScore).toBeVisible();
    const projectedScoreText = await projectedScore.textContent();
    expect(projectedScoreText).toMatch(/^\d+$/); // Should be a number

    // Step 9: Verify delta is displayed
    const scoreDelta = page.getByTestId('score-delta');
    await expect(scoreDelta).toBeVisible();
    const deltaText = await scoreDelta.textContent();
    expect(deltaText).toMatch(/^\+\d+$/); // Should be +N format
  });

  test('should show breakdown by category', async ({ page }) => {
    // Upload resume and JD
    const resumeInput = page.getByLabel(/paste your resume/i);
    await resumeInput.fill(SAMPLE_RESUME);

    const jdInput = page.getByLabel(/paste the job description/i);
    await jdInput.fill(SAMPLE_JOB_DESCRIPTION);

    // Analyze
    const analyzeButton = page.getByRole('button', { name: /analyze/i });
    await analyzeButton.click();

    // Wait for suggestions
    await page.waitForSelector('[data-testid="suggestions-display"]', { timeout: 90000 });

    // Check if category breakdown is present (at least one category should have contribution)
    const categorySummary = page.getByTestId('category-summary');
    const categorySkills = page.getByTestId('category-skills');
    const categoryExperience = page.getByTestId('category-experience');

    // At least one category should be visible
    const hasCategories = await Promise.race([
      categorySummary.isVisible().catch(() => false),
      categorySkills.isVisible().catch(() => false),
      categoryExperience.isVisible().catch(() => false),
    ]);

    expect(hasCategories).toBe(true);
  });

  test('should update projected score when suggestions are regenerated', async ({ page }) => {
    // Upload resume and JD
    const resumeInput = page.getByLabel(/paste your resume/i);
    await resumeInput.fill(SAMPLE_RESUME);

    const jdInput = page.getByLabel(/paste the job description/i);
    await jdInput.fill(SAMPLE_JOB_DESCRIPTION);

    // Analyze
    const analyzeButton = page.getByRole('button', { name: /analyze/i });
    await analyzeButton.click();

    // Wait for suggestions
    await page.waitForSelector('[data-testid="suggestions-display"]', { timeout: 90000 });

    // Get initial projected score
    const projectedScore = page.getByTestId('projected-score');
    await expect(projectedScore).toBeVisible();
    const initialScore = await projectedScore.textContent();

    // Find and click the first regenerate button
    const regenerateButtons = page.getByRole('button', { name: /regenerate/i });
    const firstButton = regenerateButtons.first();

    if (await firstButton.isVisible()) {
      await firstButton.click();

      // Wait for regeneration to complete
      await page.waitForTimeout(5000); // Give time for LLM to respond

      // Verify projected score is still visible (may have changed)
      await expect(projectedScore).toBeVisible();
      const newScore = await projectedScore.textContent();

      // Score should still be a valid number
      expect(newScore).toMatch(/^\d+$/);
    }
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // Upload resume and JD
    const resumeInput = page.getByLabel(/paste your resume/i);
    await resumeInput.fill(SAMPLE_RESUME);

    const jdInput = page.getByLabel(/paste the job description/i);
    await jdInput.fill(SAMPLE_JOB_DESCRIPTION);

    // Analyze
    const analyzeButton = page.getByRole('button', { name: /analyze/i });
    await analyzeButton.click();

    // Wait for suggestions
    await page.waitForSelector('[data-testid="suggestions-display"]', { timeout: 90000 });

    // Verify score comparison is visible on mobile
    const scoreComparison = page.getByTestId('score-comparison');
    await expect(scoreComparison).toBeVisible();

    // Verify all key elements are visible
    await expect(page.getByTestId('original-score')).toBeVisible();
    await expect(page.getByTestId('projected-score')).toBeVisible();
    await expect(page.getByTestId('score-delta')).toBeVisible();
  });

  test('should have accessible labels for screen readers', async ({ page }) => {
    // Upload resume and JD
    const resumeInput = page.getByLabel(/paste your resume/i);
    await resumeInput.fill(SAMPLE_RESUME);

    const jdInput = page.getByLabel(/paste the job description/i);
    await jdInput.fill(SAMPLE_JOB_DESCRIPTION);

    // Analyze
    const analyzeButton = page.getByRole('button', { name: /analyze/i });
    await analyzeButton.click();

    // Wait for suggestions
    await page.waitForSelector('[data-testid="suggestions-display"]', { timeout: 90000 });

    // Verify accessible text labels are present
    await expect(page.getByText('Original Score')).toBeVisible();
    await expect(page.getByText('Projected Score')).toBeVisible();
    await expect(page.getByText('point improvement')).toBeVisible();
    await expect(page.getByText('ATS Score Comparison')).toBeVisible();
  });
});
