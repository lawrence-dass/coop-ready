import { describe, test, expect, beforeEach } from 'vitest';
import { useOptimizationStore } from '@/store';

/**
 * Story 3.2: Store File Validation Tests
 *
 * Tests fileError state management in the optimization store.
 */

describe('Story 3.2: Store File Validation', () => {
  beforeEach(() => {
    // Reset store before each test
    useOptimizationStore.getState().reset();
  });

  test('[P0] 3.2-UNIT-007: should set file error in store', () => {
    const { setFileError, fileError } = useOptimizationStore.getState();

    expect(fileError).toBeNull();

    setFileError({
      code: 'FILE_TOO_LARGE',
      message: 'File too large. Maximum size is 5MB.',
    });

    expect(useOptimizationStore.getState().fileError).toEqual({
      code: 'FILE_TOO_LARGE',
      message: 'File too large. Maximum size is 5MB.',
    });
  });

  test('[P0] 3.2-UNIT-008: should clear file error when set to null', () => {
    const { setFileError } = useOptimizationStore.getState();

    setFileError({
      code: 'INVALID_FILE_TYPE',
      message: 'Invalid file type. Please upload a PDF or DOCX file.',
    });

    expect(useOptimizationStore.getState().fileError).not.toBeNull();

    setFileError(null);

    expect(useOptimizationStore.getState().fileError).toBeNull();
  });

  test('[P0] 3.2-UNIT-009: should clear file error when setting pending file', () => {
    const { setFileError, setPendingFile } = useOptimizationStore.getState();

    // Set an error
    setFileError({
      code: 'FILE_TOO_LARGE',
      message: 'File too large. Maximum size is 5MB.',
    });

    expect(useOptimizationStore.getState().fileError).not.toBeNull();

    // Set a valid file - should clear error
    const validFile = new File(['content'], 'resume.pdf', {
      type: 'application/pdf',
    });
    setPendingFile(validFile);

    expect(useOptimizationStore.getState().fileError).toBeNull();
  });

  test('[P0] 3.2-UNIT-010: should reset file error on store reset', () => {
    const { setFileError, reset } = useOptimizationStore.getState();

    setFileError({
      code: 'FILE_TOO_LARGE',
      message: 'File too large. Maximum size is 5MB.',
    });

    expect(useOptimizationStore.getState().fileError).not.toBeNull();

    reset();

    expect(useOptimizationStore.getState().fileError).toBeNull();
  });
});
