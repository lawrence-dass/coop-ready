/**
 * Retry Utilities
 *
 * Provides utilities for implementing retry logic with exponential backoff:
 * - Backoff delay calculation (1s → 2s → 4s)
 * - Error retriability determination (which errors should allow retry)
 * - Constants for retry configuration
 *
 * **Usage:**
 * ```typescript
 * const delay = calculateBackoffDelay(1); // 1000ms
 * const canRetry = isErrorRetriable('LLM_TIMEOUT'); // true
 * ```
 *
 * **Retry Strategy:**
 * - Attempt 1: 1000ms delay (1s)
 * - Attempt 2: 2000ms delay (2s)
 * - Attempt 3: 4000ms delay (4s)
 * - Max attempts: 3
 *
 * **Retriable Errors:**
 * - LLM_TIMEOUT: Temporary timeout, worth retrying
 * - LLM_ERROR: Could be temporary API issue
 * - RATE_LIMITED: Exponential backoff helps
 *
 * **Non-Retriable Errors:**
 * - INVALID_FILE_TYPE: User error, won't fix on retry
 * - FILE_TOO_LARGE: File size won't change on retry
 * - PARSE_ERROR: Corrupted file won't fix on retry
 * - VALIDATION_ERROR: Input validation won't fix on retry
 */

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Maximum number of retry attempts allowed
 */
export const MAX_RETRY_ATTEMPTS = 3;

/**
 * Base delay in milliseconds for exponential backoff (1 second)
 */
const BASE_DELAY_MS = 1000;

// ============================================================================
// RETRIABLE ERROR CODES
// ============================================================================

/**
 * Error codes that are eligible for retry
 *
 * These errors are typically transient and may succeed on retry.
 */
const RETRIABLE_ERROR_CODES = [
  'LLM_TIMEOUT',   // LLM processing exceeded 60s limit
  'LLM_ERROR',     // Temporary API failure
  'RATE_LIMITED',  // Too many requests, backoff helps
] as const;

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Calculate exponential backoff delay for a retry attempt
 *
 * Uses formula: BASE_DELAY_MS * 2^(retryCount - 1)
 *
 * @param retryCount - Current retry attempt number (1-based, e.g., 1, 2, 3)
 * @returns Delay in milliseconds before retry
 *
 * @example
 * ```typescript
 * calculateBackoffDelay(1); // 1000ms (1s)
 * calculateBackoffDelay(2); // 2000ms (2s)
 * calculateBackoffDelay(3); // 4000ms (4s)
 * ```
 */
export function calculateBackoffDelay(retryCount: number): number {
  if (retryCount < 1) {
    return 0;
  }
  return BASE_DELAY_MS * Math.pow(2, retryCount - 1);
}

/**
 * Determine if an error code is eligible for retry
 *
 * Only transient errors that may succeed on retry should return true.
 * Permanent errors (validation, file issues) return false.
 *
 * @param errorCode - Standardized error code
 * @returns True if error can be retried, false otherwise
 *
 * @example
 * ```typescript
 * isErrorRetriable('LLM_TIMEOUT');     // true
 * isErrorRetriable('LLM_ERROR');       // true
 * isErrorRetriable('RATE_LIMITED');    // true
 * isErrorRetriable('INVALID_FILE_TYPE'); // false
 * isErrorRetriable('PARSE_ERROR');     // false
 * ```
 */
export function isErrorRetriable(errorCode: string): boolean {
  return RETRIABLE_ERROR_CODES.includes(errorCode as typeof RETRIABLE_ERROR_CODES[number]);
}

/**
 * Create a promise that resolves after the specified delay
 *
 * Used for implementing exponential backoff delays.
 *
 * @param ms - Delay in milliseconds
 * @returns Promise that resolves after delay
 *
 * @example
 * ```typescript
 * await delay(1000); // Wait 1 second
 * ```
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
