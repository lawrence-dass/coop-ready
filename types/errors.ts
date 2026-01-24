/**
 * Error Types and Type Guards
 *
 * This file provides error-related types, constants, and utility functions
 * for working with ActionResponse errors.
 */

import type { ErrorCode, ActionResponse } from './index';
import { ERROR_CODES } from './index';

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Standard API error structure
 *
 * Used in ActionResponse error case: `{ data: null, error: ApiError }`
 */
export interface ApiError {
  /** User-friendly error message */
  message: string;

  /** Standardized error code from ERROR_CODES */
  code: ErrorCode;
}

// ============================================================================
// ERROR MESSAGES
// ============================================================================

/**
 * Standard error messages for each error code
 *
 * These provide consistent, user-friendly messages across the app.
 * Customize these messages to match your app's tone and style.
 */
export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  [ERROR_CODES.INVALID_FILE_TYPE]:
    'Please upload a PDF or DOCX file. Other file types are not supported.',

  [ERROR_CODES.FILE_TOO_LARGE]:
    'File size exceeds 5MB limit. Please upload a smaller file.',

  [ERROR_CODES.PARSE_ERROR]:
    'Unable to extract text from the file. The file may be corrupted or password-protected.',

  [ERROR_CODES.LLM_TIMEOUT]:
    'Request timed out after 60 seconds. Please try again.',

  [ERROR_CODES.LLM_ERROR]:
    'AI service is temporarily unavailable. Please try again later.',

  [ERROR_CODES.RATE_LIMITED]:
    'Too many requests. Please wait a moment and try again.',

  [ERROR_CODES.VALIDATION_ERROR]:
    'Invalid input. Please check your data and try again.',
};

// ============================================================================
// TYPE GUARDS
// ============================================================================

/**
 * Check if a string is a valid ErrorCode
 *
 * @example
 * ```typescript
 * const code = 'FILE_TOO_LARGE';
 * if (isErrorCode(code)) {
 *   // TypeScript knows code is ErrorCode here
 *   const message = ERROR_MESSAGES[code];
 * }
 * ```
 */
export function isErrorCode(code: string): code is ErrorCode {
  return Object.values(ERROR_CODES).includes(code as ErrorCode);
}

/**
 * Check if an ActionResponse is an error response
 *
 * This is a type guard that narrows the ActionResponse type.
 *
 * @example
 * ```typescript
 * const response = await uploadResume(file);
 * if (isActionResponseError(response)) {
 *   // TypeScript knows response.error is not null here
 *   console.error(response.error.message);
 *   return;
 * }
 * // TypeScript knows response.data is not null here
 * console.log(response.data);
 * ```
 */
export function isActionResponseError<T>(
  response: ActionResponse<T>
): response is { data: null; error: ApiError } {
  return response.error !== null;
}

/**
 * Check if an ActionResponse is a success response
 *
 * This is the inverse of isActionResponseError.
 *
 * @example
 * ```typescript
 * const response = await uploadResume(file);
 * if (isActionResponseSuccess(response)) {
 *   // TypeScript knows response.data is not null here
 *   console.log(response.data);
 * }
 * ```
 */
export function isActionResponseSuccess<T>(
  response: ActionResponse<T>
): response is { data: T; error: null } {
  return response.error === null;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Create a standardized error response
 *
 * @example
 * ```typescript
 * return createErrorResponse('FILE_TOO_LARGE');
 * // Returns: { data: null, error: { message: '...', code: 'FILE_TOO_LARGE' } }
 * ```
 */
export function createErrorResponse<T = never>(
  code: ErrorCode,
  customMessage?: string
): ActionResponse<T> {
  return {
    data: null,
    error: {
      code,
      message: customMessage || ERROR_MESSAGES[code],
    },
  };
}

/**
 * Create a standardized success response
 *
 * @example
 * ```typescript
 * const text = await parseFile(file);
 * return createSuccessResponse(text);
 * // Returns: { data: text, error: null }
 * ```
 */
export function createSuccessResponse<T>(data: T): ActionResponse<T> {
  return {
    data,
    error: null,
  };
}

/**
 * Get user-friendly error message for an error code
 *
 * @example
 * ```typescript
 * const message = getErrorMessage('PARSE_ERROR');
 * toast.error(message);
 * ```
 */
export function getErrorMessage(code: ErrorCode): string {
  return ERROR_MESSAGES[code];
}
