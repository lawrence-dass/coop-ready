/**
 * Retry Functionality Store Tests
 *
 * Unit tests for retry state management in Zustand store including:
 * - Retry count tracking
 * - Retry state (isRetrying)
 * - Retry count reset on new input
 * - Error retriability selector
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useOptimizationStore } from '@/store';
import { act, renderHook } from '@testing-library/react';

// ============================================================================
// SETUP & TEARDOWN
// ============================================================================

beforeEach(() => {
  // Reset store before each test
  const { result } = renderHook(() => useOptimizationStore());
  act(() => {
    result.current.reset();
  });
});

// ============================================================================
// RETRY STATE INITIALIZATION TESTS
// ============================================================================

describe('retry state initialization', () => {
  it('should initialize retryCount to 0', () => {
    const { result } = renderHook(() => useOptimizationStore());
    expect(result.current.retryCount).toBe(0);
  });

  it('should initialize isRetrying to false', () => {
    const { result } = renderHook(() => useOptimizationStore());
    expect(result.current.isRetrying).toBe(false);
  });

  it('should initialize lastError to null', () => {
    const { result } = renderHook(() => useOptimizationStore());
    expect(result.current.lastError).toBe(null);
  });
});

// ============================================================================
// RETRY COUNT MANAGEMENT TESTS
// ============================================================================

describe('retryCount management', () => {
  it('should increment retryCount when incrementRetryCount is called', () => {
    const { result } = renderHook(() => useOptimizationStore());

    act(() => {
      result.current.incrementRetryCount();
    });

    expect(result.current.retryCount).toBe(1);
  });

  it('should increment retryCount multiple times', () => {
    const { result } = renderHook(() => useOptimizationStore());

    act(() => {
      result.current.incrementRetryCount();
      result.current.incrementRetryCount();
      result.current.incrementRetryCount();
    });

    expect(result.current.retryCount).toBe(3);
  });

  it('should reset retryCount to 0 when resetRetryCount is called', () => {
    const { result } = renderHook(() => useOptimizationStore());

    act(() => {
      result.current.incrementRetryCount();
      result.current.incrementRetryCount();
      result.current.resetRetryCount();
    });

    expect(result.current.retryCount).toBe(0);
  });

  it('should reset retryCount when new resume content is set', () => {
    const { result } = renderHook(() => useOptimizationStore());

    act(() => {
      result.current.incrementRetryCount();
      result.current.incrementRetryCount();
      result.current.setResumeContent({ rawText: 'New resume' } as any);
    });

    expect(result.current.retryCount).toBe(0);
  });

  it('should reset retryCount when new job description is set', () => {
    const { result } = renderHook(() => useOptimizationStore());

    act(() => {
      result.current.incrementRetryCount();
      result.current.incrementRetryCount();
      result.current.setJobDescription('New job description');
    });

    expect(result.current.retryCount).toBe(0);
  });

  it('should reset retryCount on successful optimization', () => {
    const { result } = renderHook(() => useOptimizationStore());

    act(() => {
      result.current.incrementRetryCount();
      result.current.incrementRetryCount();
      // Simulate successful optimization
      result.current.setAnalysisResult({} as any);
    });

    expect(result.current.retryCount).toBe(0);
  });
});

// ============================================================================
// RETRY STATE MANAGEMENT TESTS
// ============================================================================

describe('isRetrying state', () => {
  it('should set isRetrying to true when setIsRetrying(true) is called', () => {
    const { result } = renderHook(() => useOptimizationStore());

    act(() => {
      result.current.setIsRetrying(true);
    });

    expect(result.current.isRetrying).toBe(true);
  });

  it('should set isRetrying to false when setIsRetrying(false) is called', () => {
    const { result } = renderHook(() => useOptimizationStore());

    act(() => {
      result.current.setIsRetrying(true);
      result.current.setIsRetrying(false);
    });

    expect(result.current.isRetrying).toBe(false);
  });
});

// ============================================================================
// LAST ERROR TRACKING TESTS
// ============================================================================

describe('lastError tracking', () => {
  it('should set lastError when setLastError is called', () => {
    const { result } = renderHook(() => useOptimizationStore());

    act(() => {
      result.current.setLastError('LLM_TIMEOUT');
    });

    expect(result.current.lastError).toBe('LLM_TIMEOUT');
  });

  it('should clear lastError when set to null', () => {
    const { result } = renderHook(() => useOptimizationStore());

    act(() => {
      result.current.setLastError('LLM_ERROR');
      result.current.setLastError(null);
    });

    expect(result.current.lastError).toBe(null);
  });
});

// ============================================================================
// RESET BEHAVIOR TESTS
// ============================================================================

describe('reset behavior', () => {
  it('should reset all retry state when reset() is called', () => {
    const { result } = renderHook(() => useOptimizationStore());

    act(() => {
      result.current.incrementRetryCount();
      result.current.incrementRetryCount();
      result.current.setIsRetrying(true);
      result.current.setLastError('LLM_TIMEOUT');
      result.current.reset();
    });

    expect(result.current.retryCount).toBe(0);
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.lastError).toBe(null);
  });
});
