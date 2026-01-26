/**
 * Unit tests for timeout utilities
 * Story 7.3: Implement Timeout Recovery
 *
 * Tests createTimeoutPromise and fetch with timeout functionality
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchWithTimeout, TIMEOUT_MS } from '@/lib/timeoutUtils';

describe('timeoutUtils', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('fetchWithTimeout', () => {
    it('should resolve if promise resolves before timeout', async () => {
      const fastPromise = Promise.resolve('success');
      const result = fetchWithTimeout(fastPromise, 5000);

      // Fast promise resolves immediately
      await expect(result).resolves.toBe('success');
    });

    it('should reject if promise exceeds timeout', async () => {
      const slowPromise = new Promise((resolve) => {
        setTimeout(() => resolve('too-slow'), 10000);
      });

      const result = fetchWithTimeout(slowPromise, 1000);

      // Advance time past timeout
      vi.advanceTimersByTime(1000);

      await expect(result).rejects.toThrow('Timeout after 1000ms');
    });

    it('should clean up timeout if promise resolves first', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const fastPromise = Promise.resolve('quick');

      await fetchWithTimeout(fastPromise, 5000);

      // Verify clearTimeout was called (cleanup)
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should clean up timeout if promise rejects with timeout', async () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const slowPromise = new Promise((resolve) => {
        setTimeout(() => resolve('slow'), 10000);
      });

      const result = fetchWithTimeout(slowPromise, 1000);
      vi.advanceTimersByTime(1000);

      try {
        await result;
      } catch {
        // Expected to throw
      }

      // Verify clearTimeout was called (cleanup)
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });
  });

  describe('TIMEOUT_MS constant', () => {
    it('should be 60000ms (60 seconds)', () => {
      expect(TIMEOUT_MS).toBe(60000);
    });
  });
});
