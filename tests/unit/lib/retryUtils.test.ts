/**
 * Retry Utilities Tests
 *
 * Unit tests for retry logic utilities including:
 * - Exponential backoff delay calculation
 * - Error retriability determination
 * - Constants validation
 */

import { describe, it, expect, vi } from 'vitest';
import { calculateBackoffDelay, isErrorRetriable, delay, MAX_RETRY_ATTEMPTS } from '@/lib/retryUtils';

// ============================================================================
// BACKOFF DELAY CALCULATION TESTS
// ============================================================================

describe('calculateBackoffDelay', () => {
  it('should return 1000ms for first retry attempt', () => {
    const delay = calculateBackoffDelay(1);
    expect(delay).toBe(1000);
  });

  it('should return 2000ms for second retry attempt', () => {
    const delay = calculateBackoffDelay(2);
    expect(delay).toBe(2000);
  });

  it('should return 4000ms for third retry attempt', () => {
    const delay = calculateBackoffDelay(3);
    expect(delay).toBe(4000);
  });

  it('should return 0 for retry count less than 1', () => {
    const delay = calculateBackoffDelay(0);
    expect(delay).toBe(0);
  });

  it('should return 0 for negative retry count', () => {
    const delay = calculateBackoffDelay(-1);
    expect(delay).toBe(0);
  });

  it('should handle larger retry counts correctly', () => {
    const delay = calculateBackoffDelay(4);
    expect(delay).toBe(8000); // 1000 * 2^3
  });
});

// ============================================================================
// ERROR RETRIABILITY TESTS
// ============================================================================

describe('isErrorRetriable', () => {
  // Retriable errors (transient, may succeed on retry)
  describe('retriable errors', () => {
    it('should return true for LLM_TIMEOUT', () => {
      expect(isErrorRetriable('LLM_TIMEOUT')).toBe(true);
    });

    it('should return true for LLM_ERROR', () => {
      expect(isErrorRetriable('LLM_ERROR')).toBe(true);
    });

    it('should return true for RATE_LIMITED', () => {
      expect(isErrorRetriable('RATE_LIMITED')).toBe(true);
    });
  });

  // Non-retriable errors (permanent, won't fix on retry)
  describe('non-retriable errors', () => {
    it('should return false for INVALID_FILE_TYPE', () => {
      expect(isErrorRetriable('INVALID_FILE_TYPE')).toBe(false);
    });

    it('should return false for FILE_TOO_LARGE', () => {
      expect(isErrorRetriable('FILE_TOO_LARGE')).toBe(false);
    });

    it('should return false for PARSE_ERROR', () => {
      expect(isErrorRetriable('PARSE_ERROR')).toBe(false);
    });

    it('should return false for VALIDATION_ERROR', () => {
      expect(isErrorRetriable('VALIDATION_ERROR')).toBe(false);
    });
  });

  // Unknown errors
  describe('unknown errors', () => {
    it('should return false for unknown error code', () => {
      expect(isErrorRetriable('UNKNOWN_ERROR')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(isErrorRetriable('')).toBe(false);
    });

    it('should return false for random string', () => {
      expect(isErrorRetriable('some_random_error')).toBe(false);
    });
  });
});

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('MAX_RETRY_ATTEMPTS', () => {
  it('should be defined', () => {
    expect(MAX_RETRY_ATTEMPTS).toBeDefined();
  });

  it('should equal 3', () => {
    expect(MAX_RETRY_ATTEMPTS).toBe(3);
  });

  it('should be a number', () => {
    expect(typeof MAX_RETRY_ATTEMPTS).toBe('number');
  });
});

// ============================================================================
// DELAY FUNCTION TESTS
// ============================================================================

describe('delay', () => {
  it('should resolve after the specified time', async () => {
    vi.useFakeTimers();

    let resolved = false;
    const promise = delay(1000).then(() => { resolved = true; });

    expect(resolved).toBe(false);

    vi.advanceTimersByTime(1000);
    await promise;

    expect(resolved).toBe(true);

    vi.useRealTimers();
  });

  it('should resolve immediately for 0ms delay', async () => {
    vi.useFakeTimers();

    let resolved = false;
    const promise = delay(0).then(() => { resolved = true; });

    vi.advanceTimersByTime(0);
    await promise;

    expect(resolved).toBe(true);

    vi.useRealTimers();
  });
});
