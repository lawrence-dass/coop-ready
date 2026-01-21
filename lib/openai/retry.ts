/**
 * Retry Logic with Exponential Backoff
 *
 * Handles rate limiting and network errors with appropriate retry strategies.
 */

import { MAX_RETRIES, NETWORK_RETRY_COUNT } from './types'
import type { OpenAIError, OpenAIErrorType } from './types'

/**
 * Calculate exponential backoff delay
 *
 * Formula: delay = 2^attempt * 1000ms
 * - Retry 1 (attempt 0): 1 second
 * - Retry 2 (attempt 1): 2 seconds
 * - Retry 3 (attempt 2): 4 seconds
 * Total max wait: 7 seconds before giving up (1s + 2s + 4s)
 *
 * @param attempt - Current retry attempt number (0-indexed)
 * @returns Delay in milliseconds
 */
export function calculateBackoffDelay(attempt: number): number {
  return Math.pow(2, attempt) * 1000
}

/**
 * Check if error is a rate limit error (429)
 */
export function isRateLimitError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  const err = error as { status?: number; code?: string; type?: string }

  // Check for OpenAI rate limit status
  if (err.status === 429) {
    return true
  }

  // Check for rate limit in error code/type
  if (err.code === 'rate_limit_exceeded' || err.type === 'rate_limit') {
    return true
  }

  return false
}

/**
 * Check if error is a network error (connection, DNS, etc.)
 */
export function isNetworkError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  const err = error as { code?: string; message?: string; cause?: { code?: string } }

  // Common network error codes
  const networkErrorCodes = [
    'ECONNREFUSED',
    'ENOTFOUND',
    'ETIMEDOUT',
    'ECONNRESET',
    'EAI_AGAIN',
  ]

  // Check error code
  if (err.code && networkErrorCodes.includes(err.code)) {
    return true
  }

  // Check cause code (nested error)
  if (err.cause?.code && networkErrorCodes.includes(err.cause.code)) {
    return true
  }

  // Check message for network-related keywords
  const message = err.message?.toLowerCase() || ''
  if (
    message.includes('network') ||
    message.includes('connection') ||
    message.includes('dns')
  ) {
    return true
  }

  return false
}

/**
 * Check if error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false
  }

  const err = error as { code?: string; message?: string; name?: string }

  // Check for timeout-related codes/names
  if (err.code === 'ETIMEDOUT' || err.code === 'ESOCKETTIMEDOUT') {
    return true
  }

  if (err.name === 'TimeoutError') {
    return true
  }

  // Check message for timeout keywords
  const message = err.message?.toLowerCase() || ''
  if (message.includes('timeout') || message.includes('timed out')) {
    return true
  }

  return false
}

/**
 * Classify error type for appropriate handling
 */
export function classifyError(error: unknown): OpenAIErrorType {
  if (isRateLimitError(error)) {
    return 'rate_limit'
  }
  if (isTimeoutError(error)) {
    return 'timeout'
  }
  if (isNetworkError(error)) {
    return 'network'
  }

  // Check for configuration errors
  const err = error as { message?: string }
  const message = err.message?.toLowerCase() || ''
  if (
    message.includes('api key') ||
    message.includes('apikey') ||
    message.includes('authentication') ||
    message.includes('unauthorized')
  ) {
    return 'config'
  }

  return 'unknown'
}

/**
 * Get user-friendly error message based on error type
 */
export function getUserFriendlyMessage(errorType: OpenAIErrorType): string {
  switch (errorType) {
    case 'rate_limit':
      return 'The AI service is busy. Please wait a moment and try again.'
    case 'network':
      return 'Analysis service temporarily unavailable. Please check your connection and try again.'
    case 'timeout':
      return 'Analysis is taking longer than expected. Please try again.'
    case 'config':
      return 'Analysis service configuration error'
    case 'malformed':
      return 'Unexpected response from analysis service'
    default:
      return 'An unexpected error occurred. Please try again.'
  }
}

/**
 * Determine if error should be retried based on type and attempt count
 */
export function shouldRetry(
  errorType: OpenAIErrorType,
  attemptNumber: number
): boolean {
  switch (errorType) {
    case 'rate_limit':
      // Retry up to MAX_RETRIES times
      return attemptNumber < MAX_RETRIES
    case 'network':
      // Retry once for network errors
      return attemptNumber < NETWORK_RETRY_COUNT
    case 'timeout':
    case 'config':
    case 'malformed':
    case 'unknown':
      // Do not retry these errors
      return false
    default:
      return false
  }
}

/**
 * Create structured OpenAI error
 */
export function createOpenAIError(
  errorType: OpenAIErrorType,
  originalError?: unknown
): OpenAIError {
  return {
    type: errorType,
    message: getUserFriendlyMessage(errorType),
    originalError,
    retryable: errorType === 'rate_limit' || errorType === 'network',
  }
}

/**
 * Execute operation with retry logic
 *
 * @param operation - Async function to execute
 * @param operationName - Name for logging
 * @returns Result of operation or throws OpenAIError
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  operationName: string = 'OpenAI operation'
): Promise<T> {
  let lastError: unknown

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Execute operation
      const result = await operation()

      // Log success after retry
      if (attempt > 0) {
        console.info(`[OpenAI] ${operationName} succeeded after ${attempt} retries`)
      }

      return result
    } catch (error) {
      lastError = error
      const errorType = classifyError(error)

      // Log retry attempt
      console.warn(`[OpenAI] ${operationName} failed (attempt ${attempt + 1})`, {
        errorType,
        retryable: shouldRetry(errorType, attempt),
        error: error instanceof Error ? error.message : String(error),
      })

      // Check if should retry
      if (!shouldRetry(errorType, attempt)) {
        // No more retries - throw structured error
        throw createOpenAIError(errorType, error)
      }

      // Calculate backoff delay for retryable errors
      if (errorType === 'rate_limit') {
        const delay = calculateBackoffDelay(attempt)
        console.info(`[OpenAI] Retrying after ${delay}ms (exponential backoff)`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      } else if (errorType === 'network') {
        const delay = 1000 // 1 second for network errors
        console.info(`[OpenAI] Retrying after ${delay}ms (network error)`)
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  // All retries exhausted
  const errorType = classifyError(lastError)
  throw createOpenAIError(errorType, lastError)
}
