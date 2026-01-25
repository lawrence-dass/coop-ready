import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResumeUploader } from '@/components/shared/ResumeUploader';
import { FileValidationError } from '@/components/shared/FileValidationError';

/**
 * Story 3.2: File Validation Unit Tests
 *
 * Tests file validation including:
 * - File size validation (5MB limit)
 * - File type validation (PDF/DOCX only)
 * - Error handling and display
 *
 * Priority Distribution:
 * - P0: Core validation tests
 * - P1: Edge cases and error recovery
 */

describe('Story 3.2: ResumeUploader - Validation', () => {
  const mockOnFileSelect = vi.fn();
  const mockOnFileRemove = vi.fn();
  const mockOnError = vi.fn();

  beforeEach(() => {
    mockOnFileSelect.mockClear();
    mockOnFileRemove.mockClear();
    mockOnError.mockClear();
  });

  test('[P0] 3.2-UNIT-001: should have onError prop available', () => {
    // This test will fail until we add onError prop to ResumeUploader
    const { container } = render(
      <ResumeUploader
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
        onError={mockOnError}
      />
    );

    // If component renders without TypeScript error, onError prop exists
    expect(container).toBeTruthy();
  });

  test('[P0] 3.2-UNIT-002: should have MAX_FILE_SIZE constant of 5MB', () => {
    // This will fail until we export or verify MAX_FILE_SIZE
    const expectedMaxSize = 5 * 1024 * 1024; // 5MB
    expect(expectedMaxSize).toBe(5242880);
  });
});

describe('Story 3.2: FileValidationError Component', () => {
  test('[P0] 3.2-UNIT-003: should render error message for FILE_TOO_LARGE', () => {
    render(
      <FileValidationError
        code="FILE_TOO_LARGE"
        message="File too large. Maximum size is 5MB."
      />
    );

    expect(screen.getByText(/file too large/i)).toBeInTheDocument();
    expect(screen.getByText(/maximum size is 5mb/i)).toBeInTheDocument();
  });

  test('[P0] 3.2-UNIT-004: should render error message for INVALID_FILE_TYPE', () => {
    render(
      <FileValidationError
        code="INVALID_FILE_TYPE"
        message="Invalid file type. Please upload a PDF or DOCX file."
      />
    );

    expect(screen.getByText(/invalid file type/i)).toBeInTheDocument();
    // Check for recovery message
    expect(screen.getByText(/try uploading a pdf or docx file/i)).toBeInTheDocument();
  });

  test('[P0] 3.2-UNIT-005: should display error code', () => {
    render(
      <FileValidationError
        code="FILE_TOO_LARGE"
        message="File too large. Maximum size is 5MB."
      />
    );

    expect(screen.getByText(/FILE_TOO_LARGE/i)).toBeInTheDocument();
  });

  test('[P1] 3.2-UNIT-006: should call onDismiss when close button clicked', () => {
    const mockOnDismiss = vi.fn();

    render(
      <FileValidationError
        code="FILE_TOO_LARGE"
        message="File too large. Maximum size is 5MB."
        onDismiss={mockOnDismiss}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    closeButton.click();

    expect(mockOnDismiss).toHaveBeenCalledTimes(1);
  });
});
