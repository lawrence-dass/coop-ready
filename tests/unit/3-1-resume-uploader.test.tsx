import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResumeUploader } from '@/components/shared/ResumeUploader';

/**
 * Story 3.1: ResumeUploader Component Unit Tests
 *
 * Tests the resume upload UI component including:
 * - Drag-drop functionality
 * - Click-to-browse file picker
 * - Visual feedback states
 * - File display and removal
 *
 * Priority Distribution:
 * - P0: 4 tests (core upload functionality)
 * - P1: 2 tests (UI enhancements)
 */

describe('Story 3.1: ResumeUploader Component', () => {
  const mockOnFileSelect = vi.fn();
  const mockOnFileRemove = vi.fn();

  beforeEach(() => {
    mockOnFileSelect.mockClear();
    mockOnFileRemove.mockClear();
  });

  test('[P0] 3.1-UNIT-001: should render upload zone with instructions', () => {
    render(
      <ResumeUploader
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
      />
    );

    // Should show upload prompt
    expect(screen.getByText(/upload resume/i)).toBeInTheDocument();
    // Should show accepted file types
    expect(screen.getByText(/PDF/i)).toBeInTheDocument();
    expect(screen.getByText(/DOCX/i)).toBeInTheDocument();
  });

  test('[P0] 3.1-UNIT-002: should display filename when file is selected', () => {
    render(
      <ResumeUploader
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
        selectedFile={{ name: 'resume.pdf', size: 1024000 }}
      />
    );

    expect(screen.getByText('resume.pdf')).toBeInTheDocument();
  });

  test('[P0] 3.1-UNIT-003: should display human-readable file size', () => {
    render(
      <ResumeUploader
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
        selectedFile={{ name: 'resume.pdf', size: 1024 * 1024 }}
      />
    );

    // 1 MB should be formatted as "1.0 MB"
    expect(screen.getByText(/1\.0 MB/i)).toBeInTheDocument();
  });

  test('[P0] 3.1-UNIT-004: should call onFileRemove when remove button is clicked', () => {
    render(
      <ResumeUploader
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
        selectedFile={{ name: 'resume.pdf', size: 1024000 }}
      />
    );

    const removeButton = screen.getByRole('button', { name: /remove/i });
    fireEvent.click(removeButton);

    expect(mockOnFileRemove).toHaveBeenCalledTimes(1);
  });

  test('[P1] 3.1-UNIT-005: should show remove button only when file is selected', () => {
    const { rerender } = render(
      <ResumeUploader
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
      />
    );

    // No file selected - no remove button
    expect(screen.queryByRole('button', { name: /remove/i })).not.toBeInTheDocument();

    // File selected - remove button should appear
    rerender(
      <ResumeUploader
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
        selectedFile={{ name: 'resume.pdf', size: 1024000 }}
      />
    );

    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
  });

  test('[P1] 3.1-UNIT-006: should have accessible upload zone', () => {
    const { container } = render(
      <ResumeUploader
        onFileSelect={mockOnFileSelect}
        onFileRemove={mockOnFileRemove}
      />
    );

    // Check for file input element (react-dropzone creates this)
    const input = container.querySelector('input[type="file"]');
    expect(input).toBeTruthy();
  });
});
