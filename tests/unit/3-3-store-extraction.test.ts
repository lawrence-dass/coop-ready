import { describe, test, expect, beforeEach } from 'vitest';
import { useOptimizationStore } from '@/store';

/**
 * Story 3.3: Store Extraction State Unit Tests
 *
 * Tests Zustand store updates for PDF extraction including:
 * - isExtracting state management
 * - resumeContent storage after extraction
 * - Clearing pendingFile after successful extraction
 *
 * Priority Distribution:
 * - P0: Core state management
 */

describe('Story 3.3: Store Extraction State', () => {
  beforeEach(() => {
    // Reset store before each test
    useOptimizationStore.getState().reset();
  });

  test('[P0] 3.3-UNIT-009: should have isExtracting field with default false', () => {
    // GIVEN: Fresh store
    const state = useOptimizationStore.getState();

    // THEN: isExtracting should default to false
    expect(state.isExtracting).toBe(false);
  });

  test('[P0] 3.3-UNIT-010: should update isExtracting state', () => {
    // GIVEN: Store with default state
    const store = useOptimizationStore.getState();

    // WHEN: Setting isExtracting to true
    store.setIsExtracting(true);

    // THEN: State should be updated
    expect(useOptimizationStore.getState().isExtracting).toBe(true);

    // WHEN: Setting back to false
    store.setIsExtracting(false);

    // THEN: State should be updated
    expect(useOptimizationStore.getState().isExtracting).toBe(false);
  });

  test('[P0] 3.3-UNIT-011: should store resumeContent after extraction', () => {
    // GIVEN: Extracted text from PDF
    const extractedText = 'John Doe\nSoftware Engineer\nSkills: React, TypeScript';

    // WHEN: Setting resume content
    useOptimizationStore.getState().setResumeContent(extractedText);

    // THEN: Content should be stored
    expect(useOptimizationStore.getState().resumeContent).toBe(extractedText);
  });

  test('[P0] 3.3-UNIT-012: should clear pendingFile after successful extraction', () => {
    // GIVEN: Store with a pending file
    const mockFile = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    useOptimizationStore.getState().setPendingFile(mockFile);

    expect(useOptimizationStore.getState().pendingFile).toBe(mockFile);

    // WHEN: Clearing pending file after extraction
    useOptimizationStore.getState().setPendingFile(null);

    // THEN: Pending file should be null
    expect(useOptimizationStore.getState().pendingFile).toBeNull();
  });

  test('[P0] 3.3-UNIT-013: should reset isExtracting when store is reset', () => {
    // GIVEN: Store with isExtracting true
    useOptimizationStore.getState().setIsExtracting(true);
    expect(useOptimizationStore.getState().isExtracting).toBe(true);

    // WHEN: Resetting the store
    useOptimizationStore.getState().reset();

    // THEN: isExtracting should be back to false
    expect(useOptimizationStore.getState().isExtracting).toBe(false);
  });

  test('[P1] 3.3-UNIT-014: should maintain resumeContent after extraction completes', () => {
    // GIVEN: Complete extraction flow simulation
    const mockFile = new File(['content'], 'resume.pdf', { type: 'application/pdf' });
    const extractedText = 'Resume content here...';

    // WHEN: Simulating extraction flow
    useOptimizationStore.getState().setPendingFile(mockFile);
    useOptimizationStore.getState().setIsExtracting(true);
    useOptimizationStore.getState().setResumeContent(extractedText);
    useOptimizationStore.getState().setIsExtracting(false);
    useOptimizationStore.getState().setPendingFile(null);

    // THEN: Resume content should persist
    const state = useOptimizationStore.getState();
    expect(state.resumeContent).toBe(extractedText);
    expect(state.isExtracting).toBe(false);
    expect(state.pendingFile).toBeNull();
  });
});
