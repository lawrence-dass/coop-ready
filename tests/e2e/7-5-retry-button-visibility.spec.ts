/**
 * Test ID: 7.5-E2E-001
 * Priority: P1
 * Story: 7.5 - Epic 7 Integration and Verification Testing
 *
 * Purpose: Verify retry button visibility based on error type
 * Coverage: AC-2 - Retry across all errors
 *
 * Gap: Missing E2E test verifying retry button shows only for retriable errors in real UI
 */

import { test, expect } from '@playwright/test';

test.describe('[P1] Retry Button Visibility - Error Types', () => {
  test('[P1] should show retry button for LLM_TIMEOUT error', async ({ page }) => {
    // GIVEN: User navigates to app
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

    // WHEN: User triggers optimization (after uploading resume and JD)
    // Simulate file upload
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content'),
    });

    // Wait for resume to be processed
    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });

    // Enter job description
    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer position');

    // Trigger optimization
    await page.locator('[data-testid="optimize-button"]').click();

    // THEN: Error display shows with retry button
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-title"]')).toContainText('Optimization Took Too Long');
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeEnabled();
  });

  test('[P1] should show retry button for LLM_ERROR error', async ({ page }) => {
    // GIVEN: User navigates to app
    await page.goto('/');

    // Mock API to return LLM_ERROR
    await page.route('**/api/optimize', async (route) => {
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
    });

    // WHEN: User uploads resume and JD, then triggers optimization
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer position');
    await page.locator('[data-testid="optimize-button"]').click();

    // THEN: Error display shows with retry button
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeEnabled();
  });

  test('[P1] should show retry button for RATE_LIMITED error', async ({ page }) => {
    // GIVEN: User navigates to app
    await page.goto('/');

    // Mock API to return RATE_LIMITED
    await page.route('**/api/optimize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: null,
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please wait a moment and try again.',
          },
        }),
      });
    });

    // WHEN: User triggers optimization
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content'),
    });

    await expect(page.locator('[data-testid="resume-parsed"]')).toBeVisible({ timeout: 3000 });
    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer position');
    await page.locator('[data-testid="optimize-button"]').click();

    // THEN: Error display shows with retry button
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).toBeEnabled();
  });

  test('[P1] should NOT show retry button for INVALID_FILE_TYPE error', async ({ page }) => {
    // GIVEN: User navigates to app
    await page.goto('/');

    // Mock file validation to return INVALID_FILE_TYPE
    await page.route('**/api/optimize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: null,
          error: {
            code: 'INVALID_FILE_TYPE',
            message: 'Please upload a PDF or DOCX file.',
          },
        }),
      });
    });

    // WHEN: User uploads invalid file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('Mock text content'),
    });

    // THEN: Error display shows WITHOUT retry button
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).not.toBeVisible();
  });

  test('[P1] should NOT show retry button for FILE_TOO_LARGE error', async ({ page }) => {
    // GIVEN: User navigates to app
    await page.goto('/');

    // Mock validation to return FILE_TOO_LARGE
    await page.route('**/api/optimize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: null,
          error: {
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds 5MB limit.',
          },
        }),
      });
    });

    // WHEN: User uploads large file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'large-resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(6 * 1024 * 1024), // 6MB
    });

    // THEN: Error display shows WITHOUT retry button
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).not.toBeVisible();
  });

  test('[P1] should NOT show retry button for PARSE_ERROR', async ({ page }) => {
    // GIVEN: User navigates to app
    await page.goto('/');

    // Mock parse to return PARSE_ERROR
    await page.route('**/api/optimize', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          data: null,
          error: {
            code: 'PARSE_ERROR',
            message: 'Could not read file contents. The file may be corrupted.',
          },
        }),
      });
    });

    // WHEN: User uploads corrupted file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'corrupted.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Corrupted PDF data'),
    });

    // THEN: Error display shows WITHOUT retry button
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="retry-button"]')).not.toBeVisible();
  });

  test('[P1] should NOT show retry button for VALIDATION_ERROR', async ({ page }) => {
    // GIVEN: User navigates to app
    await page.goto('/');

    // WHEN: User tries to optimize without uploading resume
    await page.locator('[data-testid="job-description-input"]').fill('Software Engineer position');
    await page.locator('[data-testid="optimize-button"]').click();

    // THEN: Validation error shows WITHOUT retry button
    await expect(page.locator('[data-testid="error-display"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-title"]')).toContainText('Missing Information');
    await expect(page.locator('[data-testid="retry-button"]')).not.toBeVisible();
  });
});
