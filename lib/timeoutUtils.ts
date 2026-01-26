/**
 * Timeout utilities for handling long-running operations
 * Story 7.3: Implement Timeout Recovery
 *
 * Provides Promise-based timeout mechanisms with automatic cleanup.
 * Used for client-side timeout detection that races against server actions.
 *
 * Note: Client-side timeout via Promise.race rejects the client promise
 * but does NOT cancel server-side execution. The server action continues
 * running. This provides UX protection (user isn't stuck waiting) but
 * doesn't free server resources.
 */

/**
 * Timeout duration in milliseconds (60 seconds)
 * Matches NFR4 and project constraint from architecture
 */
export const TIMEOUT_MS = 60000;

/**
 * Race a promise against a timeout
 *
 * Wraps any promise with a timeout that rejects if the promise doesn't
 * resolve within the specified duration. Automatically cleans up the
 * timeout on completion to avoid timer leaks.
 *
 * @param promise - The promise to wrap
 * @param timeoutMs - Timeout duration in milliseconds
 * @returns Promise that resolves with promise result or rejects on timeout
 *
 * @example
 * ```typescript
 * const result = await withTimeout(
 *   analyzeResume(sessionId),
 *   60000
 * );
 * ```
 */
export function fetchWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number
): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout>;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Timeout after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timeoutId);
  });
}
