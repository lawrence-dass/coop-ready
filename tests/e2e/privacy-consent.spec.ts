/**
 * Privacy Consent E2E Tests (Playwright)
 *
 * Story 15.4: Epic 15 Integration & Verification Testing
 *
 * Browser-level validation for privacy consent flow:
 * - Real browser interaction (focus, keyboard, mouse)
 * - Accessibility validation (focus trap, ARIA)
 * - Cross-page persistence
 * - Link behavior (new tab opening)
 */

import { test, expect } from '@playwright/test';

test.describe('Privacy Consent Dialog - E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to home page
    await page.goto('/');
  });

  test('[P0] first-time authenticated user sees privacy dialog on file upload', async ({
    page,
  }) => {
    // GIVEN: User is authenticated but has not accepted privacy consent
    // TODO: Set up authenticated user without consent via API/database
    // For now, this test assumes mocked state from integration tests

    // WHEN: User attempts to upload a file
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content'),
    });

    // THEN: Privacy consent dialog appears
    const dialog = page.getByRole('dialog', { name: /Privacy.*Data Handling/i });
    await expect(dialog).toBeVisible();

    // Verify all 4 data handling points are visible
    await expect(
      page.getByText(/processed using Anthropic.*Claude API/i)
    ).toBeVisible();
    await expect(page.getByText(/stored securely/i)).toBeVisible();
    await expect(page.getByText(/not used to train AI models/i)).toBeVisible();
    await expect(page.getByText(/delete.*any time/i)).toBeVisible();
  });

  test('[P0] checkbox interaction enables "I Agree" button', async ({
    page,
  }) => {
    // GIVEN: Privacy dialog is visible
    // Trigger dialog (assumes mocked state)
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content'),
    });

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // WHEN: Dialog is initially displayed
    const agreeButton = page.getByRole('button', { name: /I Agree/i });

    // THEN: "I Agree" button is disabled
    await expect(agreeButton).toBeDisabled();

    // WHEN: User checks the checkbox
    const checkbox = page.getByRole('checkbox', {
      name: /I understand how my data will be handled/i,
    });
    await checkbox.click();

    // THEN: "I Agree" button becomes enabled
    await expect(agreeButton).toBeEnabled();
  });

  test('[P1] escape key closes privacy dialog', async ({ page }) => {
    // GIVEN: Privacy dialog is visible
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content'),
    });

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // WHEN: User presses Escape key
    await page.keyboard.press('Escape');

    // THEN: Dialog closes
    await expect(dialog).not.toBeVisible();
  });

  test('[P1] focus trap works in privacy dialog', async ({ page }) => {
    // GIVEN: Privacy dialog is visible
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content'),
    });

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // WHEN: User tabs through focusable elements
    await page.keyboard.press('Tab'); // Focus moves to first link (Privacy Policy)
    const privacyLink = page.getByRole('link', { name: /Privacy Policy/i });
    await expect(privacyLink).toBeFocused();

    await page.keyboard.press('Tab'); // Focus moves to second link (Terms of Service)
    const termsLink = page.getByRole('link', { name: /Terms of Service/i });
    await expect(termsLink).toBeFocused();

    await page.keyboard.press('Tab'); // Focus moves to checkbox
    const checkbox = page.getByRole('checkbox');
    await expect(checkbox).toBeFocused();

    await page.keyboard.press('Tab'); // Focus moves to Cancel button
    const cancelButton = page.getByRole('button', { name: /Cancel/i });
    await expect(cancelButton).toBeFocused();

    await page.keyboard.press('Tab'); // Focus moves to I Agree button
    const agreeButton = page.getByRole('button', { name: /I Agree/i });
    await expect(agreeButton).toBeFocused();

    await page.keyboard.press('Tab'); // Focus cycles back to first element (Privacy Policy)
    await expect(privacyLink).toBeFocused();

    // THEN: Focus is trapped within dialog (never escapes to page)
  });

  test('[P1] privacy policy and terms links open in new tab', async ({
    page,
    context,
  }) => {
    // GIVEN: Privacy dialog is visible
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content'),
    });

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // WHEN: User clicks Privacy Policy link
    const privacyLink = page.getByRole('link', { name: /Privacy Policy/i });

    // Listen for new page opening
    const [newPage] = await Promise.all([
      context.waitForEvent('page'),
      privacyLink.click(),
    ]);

    // THEN: Link opens in new tab
    expect(newPage).toBeTruthy();
    await expect(newPage).toHaveURL(/\/privacy/);

    // Verify link has security attributes
    const linkElement = await privacyLink.getAttribute('rel');
    expect(linkElement).toContain('noopener');
    expect(linkElement).toContain('noreferrer');

    // Close new page
    await newPage.close();
  });

  test('[P1] privacy consent persists after page reload', async ({ page }) => {
    // GIVEN: User has accepted privacy consent
    // Upload file to trigger dialog
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content'),
    });

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Accept consent
    const checkbox = page.getByRole('checkbox');
    await checkbox.click();
    const agreeButton = page.getByRole('button', { name: /I Agree/i });
    await agreeButton.click();

    // Wait for dialog to close
    await expect(dialog).not.toBeVisible();

    // WHEN: User reloads the page
    await page.reload();

    // Upload another file
    await fileInput.setInputFiles({
      name: 'resume2.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content 2'),
    });

    // THEN: Privacy dialog does NOT re-appear
    await expect(dialog).not.toBeVisible();

    // File upload should proceed normally (no blocking dialog)
  });

  test('[P2] privacy dialog is responsive on mobile viewport', async ({
    page,
  }) => {
    // GIVEN: Mobile viewport
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE

    // Trigger dialog
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content'),
    });

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // THEN: Dialog is visible and not cut off
    const dialogBox = await dialog.boundingBox();
    expect(dialogBox).toBeTruthy();
    expect(dialogBox!.width).toBeLessThanOrEqual(375);

    // All content is still visible
    await expect(
      page.getByText(/Privacy & Data Handling/i)
    ).toBeVisible();
    await expect(page.getByRole('checkbox')).toBeVisible();
    await expect(page.getByRole('button', { name: /I Agree/i })).toBeVisible();
  });

  test('[P1] cancel button closes dialog without accepting consent', async ({
    page,
  }) => {
    // GIVEN: Privacy dialog is visible
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content'),
    });

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // WHEN: User clicks Cancel button
    const cancelButton = page.getByRole('button', { name: /Cancel/i });
    await cancelButton.click();

    // THEN: Dialog closes
    await expect(dialog).not.toBeVisible();

    // Upload file again to verify consent was NOT accepted
    await fileInput.setInputFiles({
      name: 'resume2.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content 2'),
    });

    // Dialog should re-appear (consent not saved)
    await expect(dialog).toBeVisible();
  });
});

test.describe('Privacy Consent - Accessibility', () => {
  test('[P1] dialog has correct ARIA attributes', async ({ page }) => {
    await page.goto('/');

    // Trigger dialog
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content'),
    });

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Verify ARIA attributes
    const ariaLabelledBy = await dialog.getAttribute('aria-labelledby');
    expect(ariaLabelledBy).toBeTruthy();

    const ariaDescribedBy = await dialog.getAttribute('aria-describedby');
    expect(ariaDescribedBy).toBeTruthy();

    // Verify role
    const role = await dialog.getAttribute('role');
    expect(role).toBe('dialog');
  });

  test('[P2] checkbox has associated label', async ({ page }) => {
    await page.goto('/');

    // Trigger dialog
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles({
      name: 'resume.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('Mock PDF content'),
    });

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Verify checkbox is accessible by label
    const checkbox = page.getByRole('checkbox', {
      name: /I understand how my data will be handled/i,
    });
    await expect(checkbox).toBeVisible();

    // Clicking label should toggle checkbox
    const label = page.getByText(/I understand how my data will be handled/i);
    await label.click();
    await expect(checkbox).toBeChecked();
  });
});
