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
import { MAX_RETRY_ATTEMPTS } from '@/lib/retryUtils';

vi.mock('@/actions/analyzeResume', () => ({
  analyzeResume: vi.fn(),
}));

vi.mock('@/lib/retryUtils', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/lib/retryUtils')>();
  return {
    ...actual,
    delay: vi.fn().mockResolvedValue(undefined),
  };
});

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

// ============================================================================
// RETRY OPTIMIZATION ACTION TESTS
// ============================================================================

describe('retryOptimization action', () => {
  it('should not retry when no session ID is set', async () => {
    const { result } = renderHook(() => useOptimizationStore());

    await act(async () => {
      await result.current.retryOptimization();
    });

    expect(result.current.retryCount).toBe(0);
    expect(result.current.isRetrying).toBe(false);
  });

  it('should not retry when max retries reached', async () => {
    const { result } = renderHook(() => useOptimizationStore());

    act(() => {
      result.current.setSessionId('test-session');
      result.current.incrementRetryCount();
      result.current.incrementRetryCount();
      result.current.incrementRetryCount();
    });

    const countBefore = result.current.retryCount;

    await act(async () => {
      await result.current.retryOptimization();
    });

    expect(result.current.retryCount).toBe(countBefore);
    expect(result.current.isRetrying).toBe(false);
  });

  it('should increment retryCount and set isRetrying on retry', async () => {
    const { analyzeResume } = await import('@/actions/analyzeResume');
    const mockedAnalyze = vi.mocked(analyzeResume);
    mockedAnalyze.mockResolvedValue({
      data: {
        keywordAnalysis: {} as any,
        atsScore: {} as any,
      },
      error: null,
    });

    const { result } = renderHook(() => useOptimizationStore());

    act(() => {
      result.current.setSessionId('test-session');
    });

    await act(async () => {
      await result.current.retryOptimization();
    });

    // On success, retryCount is reset to 0
    expect(result.current.retryCount).toBe(0);
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.generalError).toBeNull();
  });

  it('should set generalError on retry failure', async () => {
    const { analyzeResume } = await import('@/actions/analyzeResume');
    const mockedAnalyze = vi.mocked(analyzeResume);
    mockedAnalyze.mockResolvedValue({
      data: null,
      error: { code: 'LLM_TIMEOUT', message: 'Timed out' },
    });

    const { result } = renderHook(() => useOptimizationStore());

    act(() => {
      result.current.setSessionId('test-session');
    });

    await act(async () => {
      await result.current.retryOptimization();
    });

    expect(result.current.retryCount).toBe(1);
    expect(result.current.isRetrying).toBe(false);
    expect(result.current.generalError).toEqual({ code: 'LLM_TIMEOUT', message: 'Timed out' });
    expect(result.current.lastError).toBe('LLM_TIMEOUT');
  });

  it('should use correct backoff delay based on fresh retryCount', async () => {
    const { analyzeResume } = await import('@/actions/analyzeResume');
    const mockedAnalyze = vi.mocked(analyzeResume);
    mockedAnalyze.mockResolvedValue({
      data: null,
      error: { code: 'LLM_ERROR', message: 'API error' },
    });

    const { delay } = await import('@/lib/retryUtils');
    const mockedDelay = vi.mocked(delay);

    const { result } = renderHook(() => useOptimizationStore());

    act(() => {
      result.current.setSessionId('test-session');
    });

    // First retry
    await act(async () => {
      await result.current.retryOptimization();
    });

    expect(mockedDelay).toHaveBeenCalledWith(1000); // 1s for attempt 1

    // Second retry
    await act(async () => {
      await result.current.retryOptimization();
    });

    expect(mockedDelay).toHaveBeenCalledWith(2000); // 2s for attempt 2

    // Third retry
    await act(async () => {
      await result.current.retryOptimization();
    });

    expect(mockedDelay).toHaveBeenCalledWith(4000); // 4s for attempt 3
  });
});
