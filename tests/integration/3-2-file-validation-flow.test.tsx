import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import Home from '@/app/page';
import { useOptimizationStore } from '@/store';
import { AuthProvider } from '@/components/providers/AuthProvider';

// Mock Supabase client
vi.mock('@/lib/supabase/client', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null
      }),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      signInAnonymously: vi.fn().mockResolvedValue({
        data: { user: { id: 'anon-123', is_anonymous: true } },
        error: null
      }),
    },
  })),
}));

/**
 * Story 3.2: File Validation Integration Tests
 *
 * Tests the complete file validation flow from upload to error display.
 */

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

    render(
      <AuthProvider>
        <Home />
      </AuthProvider>
    );

    // Error should be displayed
    expect(screen.getByText(/file too large/i)).toBeInTheDocument();
    expect(screen.getByText(/FILE_TOO_LARGE/i)).toBeInTheDocument();
  });

  test('[P0] 3.2-INT-002: should hide FileValidationError when no error in store', () => {
    render(
      <AuthProvider>
        <Home />
      </AuthProvider>
    );

    // No error should be displayed
    expect(screen.queryByText(/file too large/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/invalid file type/i)).not.toBeInTheDocument();
  });

  test('[P0] 3.2-INT-003: should clear error when dismiss button clicked', () => {
    useOptimizationStore.getState().setFileError({
      code: 'INVALID_FILE_TYPE',
      message: 'Invalid file type. Please upload a PDF or DOCX file.',
    });

    render(
      <AuthProvider>
        <Home />
      </AuthProvider>
    );

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

    render(
      <AuthProvider>
        <Home />
      </AuthProvider>
    );

    expect(screen.getByText('File too large. Maximum size is 5MB.')).toBeInTheDocument();
  });

  test('[P1] 3.2-INT-005: should display correct error for INVALID_FILE_TYPE', () => {
    useOptimizationStore.getState().setFileError({
      code: 'INVALID_FILE_TYPE',
      message: 'Invalid file type. Please upload a PDF or DOCX file.',
    });

    render(
      <AuthProvider>
        <Home />
      </AuthProvider>
    );

    expect(screen.getByText('Invalid file type. Please upload a PDF or DOCX file.')).toBeInTheDocument();
  });
});
