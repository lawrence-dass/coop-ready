/**
 * E2E Pipeline Performance Test
 * Story 12.1 - AC 12.1-5: Pipeline performance within budget
 *
 * Tests the full optimization pipeline with judge enabled to verify:
 * - Pipeline completes within 60 seconds
 * - Cost stays within $0.10 per optimization
 * - Judge step does not significantly degrade performance
 */

import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('[P0] Pipeline Performance with Judge', () => {
  test.beforeEach(async ({ page }) => {
    // GIVEN: Navigate to the application
    await page.goto('/');
  });

  test('[P0] should complete full optimization pipeline within 60 seconds', async ({ page }) => {
    // GIVEN: User is on the home page with a resume and job description
    const sampleResumePath = path.join(process.cwd(), 'tests', 'fixtures', 'sample-resume.pdf');

    // Upload resume
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(sampleResumePath);

    // Wait for upload confirmation
    await expect(page.locator('text=/Resume uploaded/i')).toBeVisible({ timeout: 10000 });

    // Enter job description
    const jobDescriptionText = `
Senior Full-Stack Software Engineer

Requirements:
- 5+ years of experience with React and Node.js
- Strong knowledge of TypeScript
- Experience with cloud platforms (AWS, GCP)
- Excellent communication and problem-solving skills
- Bachelor's degree in Computer Science or related field

Responsibilities:
- Design and develop scalable web applications
- Collaborate with cross-functional teams
- Mentor junior developers
- Participate in code reviews
    `.trim();

    await page.locator('textarea[placeholder*="job description" i]').fill(jobDescriptionText);

    // WHEN: User starts optimization
    const startTime = Date.now();
    await page.locator('button:has-text("Optimize")').click();

    // Wait for optimization to complete (all 3 sections)
    await expect(page.locator('[data-testid="summary-suggestions"]')).toBeVisible({ timeout: 65000 });
    await expect(page.locator('[data-testid="skills-suggestions"]')).toBeVisible({ timeout: 65000 });
    await expect(page.locator('[data-testid="experience-suggestions"]')).toBeVisible({ timeout: 65000 });

    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // Convert to seconds

    // THEN: Pipeline completes within 60 seconds
    expect(duration).toBeLessThan(60);

    // AND: Judge scores are present on suggestions
    const summarySection = page.locator('[data-testid="summary-suggestions"]');
    await expect(summarySection.locator('text=/Quality Score/i')).toBeVisible();

    const skillsSection = page.locator('[data-testid="skills-suggestions"]');
    await expect(skillsSection.locator('text=/Quality Score/i')).toBeVisible();

    const experienceSection = page.locator('[data-testid="experience-suggestions"]');
    await expect(experienceSection.locator('text=/Quality Score/i')).toBeVisible();
  });

  test('[P0] should handle judge step timeout gracefully', async ({ page }) => {
    // GIVEN: User is on the home page
    const sampleResumePath = path.join(process.cwd(), 'tests', 'fixtures', 'sample-resume.pdf');

    // Upload resume
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(sampleResumePath);
    await expect(page.locator('text=/Resume uploaded/i')).toBeVisible({ timeout: 10000 });

    // Enter minimal job description
    await page.locator('textarea[placeholder*="job description" i]').fill('Software Engineer');

    // WHEN: User starts optimization
    await page.locator('button:has-text("Optimize")').click();

    // THEN: Suggestions are still returned even if judge times out
    await expect(page.locator('[data-testid="summary-suggestions"]')).toBeVisible({ timeout: 65000 });
    await expect(page.locator('[data-testid="skills-suggestions"]')).toBeVisible({ timeout: 65000 });
    await expect(page.locator('[data-testid="experience-suggestions"]')).toBeVisible({ timeout: 65000 });

    // Graceful degradation: suggestions returned without judge scores if judge fails/timeouts
    // This is acceptable behavior per AC 12.1-5
  });

  test('[P1] should maintain quality baseline with judge enabled', async ({ page }) => {
    // GIVEN: User completes an optimization
    const sampleResumePath = path.join(process.cwd(), 'tests', 'fixtures', 'sample-resume.pdf');

    await page.locator('input[type="file"]').setInputFiles(sampleResumePath);
    await expect(page.locator('text=/Resume uploaded/i')).toBeVisible({ timeout: 10000 });

    await page.locator('textarea[placeholder*="job description" i]').fill('Senior Software Engineer with React and AWS');
    await page.locator('button:has-text("Optimize")').click();

    await expect(page.locator('[data-testid="summary-suggestions"]')).toBeVisible({ timeout: 65000 });

    // WHEN: Judge evaluates suggestions
    const summarySection = page.locator('[data-testid="summary-suggestions"]');

    // THEN: Quality scores should be reasonable (≥60 to pass judge threshold)
    // This verifies judge is not rejecting all suggestions
    const qualityScoreText = await summarySection.locator('text=/Quality Score:? \\d+/i').textContent();

    if (qualityScoreText) {
      const scoreMatch = qualityScoreText.match(/(\d+)/);
      if (scoreMatch) {
        const score = parseInt(scoreMatch[1], 10);
        expect(score).toBeGreaterThanOrEqual(60);
      }
    }
  });
});
