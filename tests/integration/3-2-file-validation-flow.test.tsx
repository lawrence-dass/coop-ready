import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { FileValidationError } from '@/components/shared/FileValidationError';
import { useOptimizationStore } from '@/store';

/**
 * Story 3.2: File Validation Integration Tests
 *
 * Tests the FileValidationError component in integration with the Zustand store.
 *
 * Architecture note: The upload flow now lives at /scan/new (NewScanClient),
 * and app/page.tsx is a Server Component (LandingPage) that redirects
 * authenticated users to /dashboard. These tests validate the
 * FileValidationError component behavior with store state.
 */

/**
 * Helper: renders FileValidationError driven by store state
 */
function FileValidationErrorFromStore() {
  const fileError = useOptimizationStore((s) => s.fileError);
  const setFileError = useOptimizationStore((s) => s.setFileError);

  if (!fileError) return null;

  return (
    <FileValidationError
      code={fileError.code as 'FILE_TOO_LARGE' | 'INVALID_FILE_TYPE'}
      message={fileError.message}
      onDismiss={() => setFileError(null)}
    />
  );
}

describe('Story 3.2: File Validation Integration', () => {
  beforeEach(() => {
    useOptimizationStore.getState().reset();
  });

  test('[P0] 3.2-INT-001: should display FileValidationError when file error exists in store', () => {
    // Set a file error in the store
    useOptimizationStore.getState().setFileError({
      code: 'FILE_TOO_LARGE',
      message: 'File too large. Maximum size is 5MB.',
    });

    render(<FileValidationErrorFromStore />);

    // Error should be displayed
    expect(screen.getByText(/file too large/i)).toBeInTheDocument();
    expect(screen.getByText(/FILE_TOO_LARGE/i)).toBeInTheDocument();
  });

  test('[P0] 3.2-INT-002: should hide FileValidationError when no error in store', () => {
    render(<FileValidationErrorFromStore />);

    // No error should be displayed
    expect(screen.queryByText(/file too large/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/invalid file type/i)).not.toBeInTheDocument();
  });

  test('[P0] 3.2-INT-003: should clear error when dismiss button clicked', () => {
    useOptimizationStore.getState().setFileError({
      code: 'INVALID_FILE_TYPE',
      message: 'Invalid file type. Please upload a PDF or DOCX file.',
    });

    render(<FileValidationErrorFromStore />);

    expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();

    const closeButton = screen.getByRole('button', { name: /close error/i });
    act(() => {
      closeButton.click();
    });

    expect(useOptimizationStore.getState().fileError).toBeNull();
  });

  test('[P1] 3.2-INT-004: should display correct error for FILE_TOO_LARGE', () => {
    useOptimizationStore.getState().setFileError({
      code: 'FILE_TOO_LARGE',
      message: 'File too large. Maximum size is 5MB.',
    });

    render(<FileValidationErrorFromStore />);

    expect(screen.getByText('File too large. Maximum size is 5MB.')).toBeInTheDocument();
  });

  test('[P1] 3.2-INT-005: should display correct error for INVALID_FILE_TYPE', () => {
    useOptimizationStore.getState().setFileError({
      code: 'INVALID_FILE_TYPE',
      message: 'Invalid file type. Please upload a PDF or DOCX file.',
    });

    render(<FileValidationErrorFromStore />);

    expect(screen.getByText('Invalid file type. Please upload a PDF or DOCX file.')).toBeInTheDocument();
  });
});
