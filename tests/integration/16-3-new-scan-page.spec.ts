/**
 * Integration Tests for Story 16.3 - New Scan Page
 *
 * Tests the complete new scan page flow:
 * - Upload resume and enter JD
 * - Select preferences
 * - Click Analyze → redirects to results
 * - Error handling and retry
 * - Resume library integration
 * - Accessibility (keyboard nav, screen readers)
 */

import { test, expect } from '@playwright/test';
import { login } from '../helpers/auth';

test.describe('Story 16.3: New Scan Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page);
    // Navigate to new scan page
    await page.goto('/scan/new');
  });

  test('renders all required sections', async ({ page }) => {
    // AC #1: Page loads with Resume Upload, JD Input, and Analyze button
    await expect(page.getByRole('heading', { name: /new resume scan/i })).toBeVisible();
    await expect(page.getByText(/upload resume/i)).toBeVisible();
    await expect(page.getByText(/enter job description/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /analyze/i })).toBeVisible();
  });

  test('renders configuration options for Job Type and Modification Level', async ({ page }) => {
    // AC #2: Configuration options visible
    await expect(page.getByText(/job type/i)).toBeVisible();
    await expect(page.getByText(/modification level/i)).toBeVisible();

    // Job Type options
    await expect(page.getByText(/co-op.*internship/i)).toBeVisible();
    await expect(page.getByText(/full-time position/i)).toBeVisible();

    // Modification Level options
    await expect(page.getByText(/conservative/i)).toBeVisible();
    await expect(page.getByText(/moderate/i)).toBeVisible();
    await expect(page.getByText(/aggressive/i)).toBeVisible();
  });

  test('analyze button is disabled until resume and JD are provided', async ({ page }) => {
    // Initially disabled
    const analyzeButton = page.getByRole('button', { name: /analyze/i });
    await expect(analyzeButton).toBeDisabled();

    // Upload resume
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'test-resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test pdf content'),
    });

    // Still disabled (no JD)
    await expect(analyzeButton).toBeDisabled();

    // Enter job description
    const jdTextarea = page.getByTestId('job-description-input');
    await jdTextarea.fill(
      'Software Engineer position requiring React, TypeScript, and Node.js experience with 3+ years building scalable web applications.'
    );

    // Now enabled
    await expect(analyzeButton).toBeEnabled();
  });

  test('preferences persist during scan session', async ({ page }) => {
    // Select preferences
    await page.getByLabel(/co-op.*internship/i).click();
    await page.getByLabel(/aggressive/i).click();

    // Reload page
    await page.reload();

    // Preferences should still be selected
    await expect(page.getByRole('radio', { name: /co-op.*internship/i })).toBeChecked();
    await expect(page.getByRole('radio', { name: /aggressive/i })).toBeChecked();
  });

  test('full upload and analyze flow', async ({ page }) => {
    // AC #4: Full flow from upload to redirect

    // Upload resume
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('mock resume pdf content with skills and experience'),
    });

    // Wait for file to be processed
    await expect(page.getByText('resume.pdf')).toBeVisible();

    // Enter job description
    const jdTextarea = page.getByTestId('job-description-input');
    await jdTextarea.fill(
      'Full Stack Developer with React and Node.js. 3+ years experience building modern web applications. Must have strong TypeScript skills.'
    );

    // Select preferences
    await page.getByLabel(/full-time position/i).click();
    await page.getByLabel(/moderate/i).click();

    // Click analyze
    await page.getByRole('button', { name: /analyze/i }).click();

    // Should show loading state
    await expect(page.getByText(/analyzing/i)).toBeVisible();

    // Should redirect to /scan/[sessionId]
    await page.waitForURL(/\/app\/scan\/.+/, { timeout: 65000 });
    expect(page.url()).toMatch(/\/app\/scan\/[a-f0-9\-]+/);
  });

  test('error handling: invalid file type', async ({ page }) => {
    // AC #5: Error display for invalid file type

    // Try to upload invalid file type
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('text resume'),
    });

    // Should show error
    await expect(page.getByTestId('error-display')).toBeVisible();
    await expect(page.getByText(/INVALID_FILE_TYPE/i)).toBeVisible();
    await expect(page.getByText(/PDF.*DOCX/i)).toBeVisible();
  });

  test('error handling: file too large', async ({ page }) => {
    // AC #5: Error display for file size

    // Create large file (> 5MB)
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024); // 6MB
    await page.locator('input[type="file"]').setInputFiles({
      name: 'large-resume.pdf',
      mimeType: 'application/pdf',
      buffer: largeBuffer,
    });

    // Should show error
    await expect(page.getByTestId('error-display')).toBeVisible();
    await expect(page.getByText(/FILE_TOO_LARGE/i)).toBeVisible();
    await expect(page.getByText(/5MB/i)).toBeVisible();
  });

  test('clear resume functionality', async ({ page }) => {
    // Upload resume
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('test content'),
    });

    await expect(page.getByText('resume.pdf')).toBeVisible();

    // Click clear button
    await page.getByRole('button', { name: /remove file/i }).click();

    // Resume should be cleared
    await expect(page.getByText('resume.pdf')).not.toBeVisible();
    await expect(page.getByText(/upload resume/i)).toBeVisible();
  });

  test('clear job description functionality', async ({ page }) => {
    // Enter JD
    const jdTextarea = page.getByTestId('job-description-input');
    await jdTextarea.fill('Software Engineer position with React and TypeScript experience.');

    // Clear JD
    await page.getByTestId('clear-jd-button').click();

    // JD should be empty
    await expect(jdTextarea).toHaveValue('');
  });

  test('keyboard navigation works', async ({ page }) => {
    // Tab through form elements
    await page.keyboard.press('Tab'); // Focus on file input
    await page.keyboard.press('Tab'); // Focus on JD textarea
    await page.keyboard.press('Tab'); // Focus on first preference radio
    await page.keyboard.press('Space'); // Select radio

    // Check that radio was selected
    const firstRadio = page.locator('input[type="radio"]').first();
    await expect(firstRadio).toBeChecked();
  });

  test('screen reader labels are present', async ({ page }) => {
    // Check ARIA labels
    await expect(page.locator('input[type="file"]')).toHaveAttribute('aria-label');
    await expect(page.getByTestId('job-description-input')).toHaveAttribute('id');

    // Check label associations
    const jdLabel = page.getByText(/job description/i);
    await expect(jdLabel).toBeVisible();
  });

  test('responsive layout on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    // All sections should still be visible (stacked)
    await expect(page.getByText(/upload resume/i)).toBeVisible();
    await expect(page.getByText(/enter job description/i)).toBeVisible();
    await expect(page.getByText(/configure preferences/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /analyze/i })).toBeVisible();
  });

  test('responsive layout on desktop', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1280, height: 800 });

    // Check that content uses available width
    const main = page.locator('main').first();
    await expect(main).toBeVisible();

    // All sections should be visible
    await expect(page.getByText(/upload resume/i)).toBeVisible();
    await expect(page.getByText(/enter job description/i)).toBeVisible();
    await expect(page.getByText(/configure preferences/i)).toBeVisible();
  });
});
