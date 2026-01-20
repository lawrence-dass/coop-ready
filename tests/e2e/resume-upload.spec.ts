import { test, expect } from '../support/fixtures';
import path from 'path';

/**
 * Resume Upload E2E Tests
 *
 * Tests for Story 3.1: Resume Upload with Validation
 * Covers upload UI, drag-drop, file browser, and validation.
 *
 * Priority breakdown:
 * - P0: Upload UI display (AC1) - 1 test
 * - P0: Drag-drop PDF upload (AC2) - 1 test
 * - P0: Drag-drop DOCX upload (AC3) - 1 test
 * - P0: File size validation (AC4) - 1 test
 * - P0: File type validation (AC5) - 1 test
 * - P0: File browser filtering (AC6) - 1 test
 * - P1: Remove uploaded file - 1 test
 *
 * NOTE: These tests will FAIL initially (RED phase) until implementation is complete.
 * This is expected and required for TDD red-green-refactor cycle.
 *
 * REQUIRED TEST FILES: Create these files in tests/support/fixtures/test-files/
 * - valid-resume.pdf (< 2MB PDF)
 * - valid-resume.docx (< 2MB DOCX)
 * - oversized-resume.pdf (> 2MB PDF)
 * - invalid-resume.txt (text file for validation test)
 */

test.describe('Resume Upload', () => {
  test.beforeEach(async ({ authenticatedPage }) => {
    // GIVEN: User is authenticated and on the new scan page
    await authenticatedPage.goto('/scan/new');
  });

  test('[P0][AC1] should display upload UI with instructions and format info', async ({
    authenticatedPage,
  }) => {
    // THEN: Upload zone is visible
    await expect(authenticatedPage.getByTestId('upload-zone')).toBeVisible();

    // AND: Instructions are displayed
    await expect(
      authenticatedPage.getByText(/drag and drop your resume/i)
    ).toBeVisible();

    // AND: Accepted formats are listed (PDF or DOCX)
    await expect(authenticatedPage.getByText(/pdf/i)).toBeVisible();
    await expect(authenticatedPage.getByText(/docx/i)).toBeVisible();

    // AND: Max file size is displayed (2MB)
    await expect(authenticatedPage.getByText(/2mb/i)).toBeVisible();

    // AND: Browse files button is visible as alternative
    await expect(
      authenticatedPage.getByTestId('browse-button')
    ).toBeVisible();
  });

  test('[P0][AC2] should upload PDF file via drag and drop', async ({
    authenticatedPage,
  }) => {
    // GIVEN: User has a valid PDF file (< 2MB)
    const pdfFilePath = path.join(
      __dirname,
      '../support/fixtures/test-files/valid-resume.pdf'
    );

    // WHEN: User drags and drops the PDF file into upload zone
    const fileInput = authenticatedPage.getByTestId('file-input');
    await fileInput.setInputFiles(pdfFilePath);

    // THEN: Progress indicator is displayed during upload
    await expect(
      authenticatedPage.getByTestId('progress-indicator')
    ).toBeVisible({ timeout: 2000 });

    // AND: File is uploaded to Supabase Storage successfully
    // (Wait for upload to complete by checking for filename display)
    await expect(
      authenticatedPage.getByTestId('file-display')
    ).toBeVisible({ timeout: 10000 });

    // AND: Filename is displayed after successful upload
    await expect(
      authenticatedPage.getByTestId('file-display')
    ).toContainText('valid-resume.pdf');

    // AND: Remove button is visible to allow replacement
    await expect(
      authenticatedPage.getByTestId('remove-button')
    ).toBeVisible();

    // AND: Success toast is displayed
    await expect(
      authenticatedPage.getByText(/resume uploaded successfully/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('[P0][AC3] should upload DOCX file via drag and drop', async ({
    authenticatedPage,
  }) => {
    // GIVEN: User has a valid DOCX file (< 2MB)
    const docxFilePath = path.join(
      __dirname,
      '../support/fixtures/test-files/valid-resume.docx'
    );

    // WHEN: User drags and drops the DOCX file into upload zone
    const fileInput = authenticatedPage.getByTestId('file-input');
    await fileInput.setInputFiles(docxFilePath);

    // THEN: Progress indicator is displayed
    await expect(
      authenticatedPage.getByTestId('progress-indicator')
    ).toBeVisible({ timeout: 2000 });

    // AND: File is uploaded successfully
    await expect(
      authenticatedPage.getByTestId('file-display')
    ).toBeVisible({ timeout: 10000 });

    // AND: Filename is displayed (same experience as PDF)
    await expect(
      authenticatedPage.getByTestId('file-display')
    ).toContainText('valid-resume.docx');

    // AND: Remove button is visible
    await expect(
      authenticatedPage.getByTestId('remove-button')
    ).toBeVisible();

    // AND: Success toast is displayed
    await expect(
      authenticatedPage.getByText(/resume uploaded successfully/i)
    ).toBeVisible({ timeout: 5000 });
  });

  test('[P0][AC4] should reject file larger than 2MB with error message', async ({
    authenticatedPage,
  }) => {
    // GIVEN: User has a file larger than 2MB
    const oversizedFilePath = path.join(
      __dirname,
      '../support/fixtures/test-files/oversized-resume.pdf'
    );

    // WHEN: User attempts to upload the oversized file
    const fileInput = authenticatedPage.getByTestId('file-input');
    await fileInput.setInputFiles(oversizedFilePath);

    // THEN: Error message is displayed
    await expect(
      authenticatedPage.getByText(/file size must be under 2mb/i)
    ).toBeVisible({ timeout: 5000 });

    // AND: File is NOT uploaded (no filename displayed)
    await expect(
      authenticatedPage.getByTestId('file-display')
    ).not.toBeVisible();

    // AND: Upload zone remains visible for retry
    await expect(authenticatedPage.getByTestId('upload-zone')).toBeVisible();
  });

  test('[P0][AC5] should reject unsupported file type with error message', async ({
    authenticatedPage,
  }) => {
    // GIVEN: User has an unsupported file type (.txt, .jpg, etc.)
    const invalidFilePath = path.join(
      __dirname,
      '../support/fixtures/test-files/invalid-resume.txt'
    );

    // WHEN: User attempts to upload the invalid file type
    const fileInput = authenticatedPage.getByTestId('file-input');
    await fileInput.setInputFiles(invalidFilePath);

    // THEN: Error message is displayed
    await expect(
      authenticatedPage.getByText(/please upload a pdf or docx file/i)
    ).toBeVisible({ timeout: 5000 });

    // AND: File is NOT uploaded
    await expect(
      authenticatedPage.getByTestId('file-display')
    ).not.toBeVisible();

    // AND: Upload zone remains visible for retry
    await expect(authenticatedPage.getByTestId('upload-zone')).toBeVisible();
  });

  test('[P0][AC6] should filter file browser to PDF and DOCX only', async ({
    authenticatedPage,
  }) => {
    // GIVEN: User is on the upload page
    // (Already navigated in beforeEach)

    // WHEN: User clicks "Browse files" button
    const fileInput = authenticatedPage.getByTestId('file-input');

    // THEN: File input accept attribute is set to .pdf and .docx
    const acceptAttr = await fileInput.getAttribute('accept');
    expect(acceptAttr).toContain('.pdf');
    expect(acceptAttr).toContain('.docx');

    // NOTE: Actual file picker UI filtering is handled by the browser
    // and cannot be fully tested in E2E (browser native behavior)
  });

  test('[P1] should remove uploaded file and show upload zone again', async ({
    authenticatedPage,
  }) => {
    // GIVEN: User has uploaded a file successfully
    const pdfFilePath = path.join(
      __dirname,
      '../support/fixtures/test-files/valid-resume.pdf'
    );
    const fileInput = authenticatedPage.getByTestId('file-input');
    await fileInput.setInputFiles(pdfFilePath);

    // Wait for upload to complete
    await expect(
      authenticatedPage.getByTestId('file-display')
    ).toBeVisible({ timeout: 10000 });

    // WHEN: User clicks the remove button
    await authenticatedPage.getByTestId('remove-button').click();

    // THEN: Uploaded file is cleared
    await expect(
      authenticatedPage.getByTestId('file-display')
    ).not.toBeVisible();

    // AND: Upload zone is visible again for new upload
    await expect(authenticatedPage.getByTestId('upload-zone')).toBeVisible();

    // AND: User can upload a different file
    await expect(fileInput).toBeVisible();
  });

  test('[P1] should validate file client-side before upload attempt', async ({
    authenticatedPage,
  }) => {
    // GIVEN: User has an invalid file
    const invalidFilePath = path.join(
      __dirname,
      '../support/fixtures/test-files/invalid-resume.txt'
    );

    // WHEN: User selects the invalid file
    const fileInput = authenticatedPage.getByTestId('file-input');
    await fileInput.setInputFiles(invalidFilePath);

    // THEN: Client-side validation error is shown immediately
    // (No network request should be made for clearly invalid file)
    await expect(
      authenticatedPage.getByText(/please upload a pdf or docx file/i)
    ).toBeVisible({ timeout: 2000 });

    // AND: No upload attempt is made (no progress indicator)
    await expect(
      authenticatedPage.getByTestId('progress-indicator')
    ).not.toBeVisible();
  });

  test('[P1] should show upload progress percentage during upload', async ({
    authenticatedPage,
  }) => {
    // GIVEN: User has a valid PDF file
    const pdfFilePath = path.join(
      __dirname,
      '../support/fixtures/test-files/valid-resume.pdf'
    );

    // WHEN: User uploads the file
    const fileInput = authenticatedPage.getByTestId('file-input');
    await fileInput.setInputFiles(pdfFilePath);

    // THEN: Progress indicator shows percentage
    // Note: Progress may be very fast for small test files
    const progressIndicator = authenticatedPage.getByTestId(
      'progress-indicator'
    );

    // Progress indicator should appear and eventually show completion
    await expect(progressIndicator).toBeVisible({ timeout: 2000 });

    // Eventually completes and shows file display
    await expect(
      authenticatedPage.getByTestId('file-display')
    ).toBeVisible({ timeout: 10000 });
  });

  /**
   * Network Error Handling Test
   *
   * NOTE: This test is SKIPPED because Server Actions cannot be intercepted
   * via Playwright route mocking. The upload uses `actions/resume.ts` (Server Action),
   * not an API route. Network errors ARE handled in the component (catch block in
   * handleFileSelect), but this specific scenario cannot be E2E tested.
   *
   * Error handling IS verified through:
   * - AC4/AC5 tests (validation errors shown correctly)
   * - Client-side catch block displays "Upload failed. Please try again."
   * - Manual testing required for actual network failure scenarios
   */
  test.skip('[P1] should handle network errors gracefully during upload', async ({
    authenticatedPage,
  }) => {
    // This test cannot work as written - Server Actions don't use interceptable API routes
    // Keeping test structure for documentation purposes
    const pdfFilePath = path.join(
      __dirname,
      '../support/fixtures/test-files/valid-resume.pdf'
    );

    const fileInput = authenticatedPage.getByTestId('file-input');
    await fileInput.setInputFiles(pdfFilePath);

    // Network error handling is implemented in the component but not E2E testable
    await expect(authenticatedPage.getByTestId('upload-zone')).toBeVisible();
  });
});
