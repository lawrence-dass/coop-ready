/**
 * Unit tests for timeout recovery in optimization store
 * Story 7.3: Implement Timeout Recovery
 *
 * Tests timeout handling, error state management, and state preservation
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useOptimizationStore } from '@/store';
import { isErrorRetriable } from '@/lib/retryUtils';

describe('Timeout Recovery (Story 7.3)', () => {
  beforeEach(() => {
    // Reset store before each test
    useOptimizationStore.getState().reset();
  });

  describe('Error state management', () => {
    it('should set general error with LLM_TIMEOUT code', () => {
      const { setGeneralError } = useOptimizationStore.getState();

      setGeneralError({ code: 'LLM_TIMEOUT', message: 'Timeout after 60000ms' });

      const state = useOptimizationStore.getState();
      expect(state.generalError).toEqual({
        code: 'LLM_TIMEOUT',
        message: 'Timeout after 60000ms',
      });
    });

    it('should clear loading state when general error is set', () => {
      const store = useOptimizationStore.getState();

      // Set loading state
      store.setLoading(true, 'Analyzing keywords...');

      // Get fresh state
      let state = useOptimizationStore.getState();
      expect(state.isLoading).toBe(true);
      expect(state.loadingStep).toBe('Analyzing keywords...');

      // Set general error (should clear loading)
      store.setGeneralError({ code: 'LLM_TIMEOUT' });

      // Get fresh state after error set
      state = useOptimizationStore.getState();
      expect(state.isLoading).toBe(false);
      expect(state.loadingStep).toBeNull();
      expect(state.generalError).toEqual({ code: 'LLM_TIMEOUT' });
    });
  });

  describe('State preservation after timeout', () => {
    it('should preserve resume content after timeout error', () => {
      const store = useOptimizationStore.getState();

      // Set resume content
      const mockResume = { rawText: 'John Doe Software Engineer' };
      store.setResumeContent(mockResume);

      // Set timeout error
      store.setGeneralError({ code: 'LLM_TIMEOUT' });

      // Verify resume preserved
      const state = useOptimizationStore.getState();
      expect(state.resumeContent).toEqual(mockResume);
    });

    it('should preserve job description after timeout error', () => {
      const store = useOptimizationStore.getState();

      // Set job description
      const mockJD = 'Senior Software Engineer position';
      store.setJobDescription(mockJD);

      // Set timeout error
      store.setGeneralError({ code: 'LLM_TIMEOUT' });

      // Verify JD preserved
      const state = useOptimizationStore.getState();
      expect(state.jobDescription).toBe(mockJD);
    });

    it('should not store partial results after timeout', () => {
      const store = useOptimizationStore.getState();

      // Start with no analysis
      expect(store.keywordAnalysis).toBeNull();
      expect(store.atsScore).toBeNull();

      // Set timeout error (no results stored)
      store.setGeneralError({ code: 'LLM_TIMEOUT' });

      // Verify no partial results
      const state = useOptimizationStore.getState();
      expect(state.keywordAnalysis).toBeNull();
      expect(state.atsScore).toBeNull();
    });
  });

  describe('Retry integration', () => {
    it('should mark LLM_TIMEOUT as retriable error', () => {
      expect(isErrorRetriable('LLM_TIMEOUT')).toBe(true);
    });

    it('should reset retry count when new input provided', () => {
      const store = useOptimizationStore.getState();

      // Simulate failed attempts
      store.incrementRetryCount();
      store.incrementRetryCount();

      // Get fresh state to verify retry count incremented
      let state = useOptimizationStore.getState();
      expect(state.retryCount).toBe(2);

      // User provides new input (this resets retry count)
      store.setResumeContent({ rawText: 'New resume content' });

      // Retry count should reset
      state = useOptimizationStore.getState();
      expect(state.retryCount).toBe(0);
    });

    it('should reset retry count when JD is changed', () => {
      const store = useOptimizationStore.getState();

      // Simulate failed attempts
      store.incrementRetryCount();
      store.incrementRetryCount();

      // Get fresh state to verify retry count incremented
      let state = useOptimizationStore.getState();
      expect(state.retryCount).toBe(2);

      // User changes JD (this resets retry count)
      store.setJobDescription('New job description');

      // Retry count should reset
      state = useOptimizationStore.getState();
      expect(state.retryCount).toBe(0);
    });
  });

  describe('Error clearing', () => {
    it('should allow manually clearing general error', () => {
      const store = useOptimizationStore.getState();

      // Set timeout error
      store.setGeneralError({ code: 'LLM_TIMEOUT' });

      // Get fresh state to verify error set
      let state = useOptimizationStore.getState();
      expect(state.generalError).not.toBeNull();

      // Manually clear error (user dismisses or retry succeeds)
      store.clearGeneralError();

      // Error should be cleared
      state = useOptimizationStore.getState();
      expect(state.generalError).toBeNull();
    });

    it('should clear general error when clearGeneralError is called after retry', () => {
      const store = useOptimizationStore.getState();

      // Simulate failed attempt with timeout
      store.setGeneralError({ code: 'LLM_TIMEOUT' });
      store.incrementRetryCount();

      // Verify error is set
      let state = useOptimizationStore.getState();
      expect(state.generalError).toEqual({ code: 'LLM_TIMEOUT' });
      expect(state.retryCount).toBe(1);

      // Simulate successful retry clearing error and resetting count
      store.clearGeneralError();
      store.resetRetryCount();

      state = useOptimizationStore.getState();
      expect(state.generalError).toBeNull();
      expect(state.retryCount).toBe(0);
    });
  });

  describe('UI responsiveness', () => {
    it('should allow dismissing error without clearing inputs', () => {
      const store = useOptimizationStore.getState();

      // Set inputs
      const mockResume = { rawText: 'Resume content' };
      const mockJD = 'JD content';
      store.setResumeContent(mockResume);
      store.setJobDescription(mockJD);

      // Set timeout error
      store.setGeneralError({ code: 'LLM_TIMEOUT' });

      // User dismisses error
      store.clearGeneralError();

      // Error cleared, inputs preserved
      const state = useOptimizationStore.getState();
      expect(state.generalError).toBeNull();
      expect(state.resumeContent).toEqual(mockResume);
      expect(state.jobDescription).toBe(mockJD);
    });
  });
});
