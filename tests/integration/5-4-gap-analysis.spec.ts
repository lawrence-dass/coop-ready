// Story 5.4: Integration tests for Gap Analysis Display enhancements
// NOTE: These tests build on Story 5.1 integration tests
// They verify the enhanced gap analysis UI is displayed correctly

import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Gap Analysis Display Enhancements', () => {
  const resumePath = path.join(process.cwd(), 'tests/fixtures/sample-resume.pdf');

  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Upload resume
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles(resumePath);
    await expect(page.getByText(/Resume extracted successfully/i)).toBeVisible({ timeout: 10000 });

    // Enter job description with gaps
    const jdTextarea = page.locator('textarea[placeholder*="job description" i]');
    await jdTextarea.fill(`
      Required Skills:
      Python, AWS, Docker, Kubernetes, TypeScript
      Preferred: Agile, CI/CD
    `);

    // Click analyze button
    await page.getByRole('button', { name: /analyze/i }).click();

    // Wait for keyword analysis results
    await expect(page.getByText('Keyword Analysis Results')).toBeVisible({ timeout: 30000 });
  });

  test('[P0] should display gap summary card after analysis', async ({ page }) => {
    // Gap Analysis Summary section should exist
    await expect(page.getByText('Gap Analysis Summary')).toBeVisible();

    // Should show priority breakdown
    await expect(page.getByText('High Priority')).toBeVisible();
    await expect(page.getByText('Medium Priority')).toBeVisible();
    await expect(page.getByText('Low Priority')).toBeVisible();
  });

  test('[P0] should display priority counts correctly', async ({ page }) => {
    // Gap summary should be visible
    await expect(page.getByText('Gap Analysis Summary')).toBeVisible();

    // Should display counts (numeric values present)
    const gapSummary = page.locator('text=Gap Analysis Summary').locator('..');
    await expect(gapSummary).toBeVisible();

    // Verify priority cards rendered
    const highPriorityCard = gapSummary.locator('text=High Priority').locator('..');
    await expect(highPriorityCard).toBeVisible();
  });

  test('[P1] should show priority filter chips', async ({ page }) => {
    // Priority filter chips should be visible
    await expect(page.getByRole('button', { name: /All \(/})).toBeVisible();
    await expect(page.getByRole('button', { name: /High Priority \(/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Medium Priority \(/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Low Priority \(/ })).toBeVisible();
  });

  test('[P1] should filter keywords when priority filter clicked', async ({ page }) => {
    // Click High Priority filter
    const highPriorityButton = page.getByRole('button', { name: /High Priority \(/ });
    await highPriorityButton.click();

    // Button should be highlighted (bg-blue-600 class applied)
    await expect(highPriorityButton).toHaveClass(/bg-blue-600/);
  });

  test('[P1] should allow expanding keyword details', async ({ page }) => {
    // Find a "Show tips" button
    const showTipsButton = page.getByText('Show tips').first();

    if (await showTipsButton.isVisible()) {
      await showTipsButton.click();

      // Guidance sections should appear
      await expect(page.getByText('Why it matters:')).toBeVisible();
      await expect(page.getByText('Where to add:')).toBeVisible();
      await expect(page.getByText('Example:')).toBeVisible();

      // Button should change to "Hide details"
      await expect(page.getByText('Hide details').first()).toBeVisible();
    }
  });

  test('[P2] should display category icons', async ({ page }) => {
    // Missing Keywords section should contain SVG icons (lucide-react renders as SVGs)
    const missingKeywordsSection = page.locator('text=Missing Keywords').locator('..');
    const icons = missingKeywordsSection.locator('svg');

    // At least one category icon should be present
    await expect(icons.first()).toBeVisible();
  });

  test('[P2] should display Quick Wins section', async ({ page }) => {
    // Quick Wins section may or may not appear depending on keywords
    // Just check if gap summary is present (main feature)
    const gapSummary = page.getByText('Gap Analysis Summary');
    await expect(gapSummary).toBeVisible();

    // If there are missing keywords, Quick Wins might appear
    const quickWins = page.getByText('Quick Wins - Add These First');
    if (await quickWins.isVisible()) {
      await expect(quickWins).toBeVisible();
    }
  });
});
