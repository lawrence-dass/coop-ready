/**
 * Core Types and ActionResponse Pattern
 *
 * This file exports all shared types used throughout the application.
 * The ActionResponse pattern is MANDATORY for all server actions and API routes.
 */

// ============================================================================
// ACTION RESPONSE PATTERN (MANDATORY)
// ============================================================================

/**
 * ActionResponse<T> - The standard response type for all server actions
 *
 * This discriminated union ensures type-safe error handling:
 * - On success: `{ data: T, error: null }`
 * - On error: `{ data: null, error: { message: string, code: ErrorCode } }`
 *
 * **CRITICAL RULE**: Server actions NEVER throw errors. They ALWAYS return ActionResponse.
 *
 * @example
 * ```typescript
 * // Server action
 * async function uploadResume(file: File): Promise<ActionResponse<string>> {
 *   try {
 *     const text = await parseFile(file);
 *     return { data: text, error: null };
 *   } catch (err) {
 *     return {
 *       data: null,
 *       error: { message: 'Failed to parse resume', code: 'PARSE_ERROR' }
 *     };
 *   }
 * }
 *
 * // Client usage
 * const { data, error } = await uploadResume(file);
 * if (error) {
 *   toast.error(error.message);
 *   return;
 * }
 * // TypeScript knows data is string here
 * console.log(data.length);
 * ```
 */
export type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code: ErrorCode } };

// ============================================================================
// ERROR CODES (Use These Exactly)
// ============================================================================

/**
 * Standard error codes used throughout the application
 *
 * These are the ONLY error codes allowed. Do not create ad-hoc codes.
 */
export const ERROR_CODES = {
  /** User uploaded wrong file format (e.g., .txt instead of .pdf) */
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',

  /** File exceeds 5MB limit */
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',

  /** Cannot extract text from file (corrupt PDF, unsupported DOCX) */
  PARSE_ERROR: 'PARSE_ERROR',

  /** Claude API call exceeded 60 second timeout */
  LLM_TIMEOUT: 'LLM_TIMEOUT',

  /** Claude API returned an error (invalid key, quota exceeded, API down) */
  LLM_ERROR: 'LLM_ERROR',

  /** Hit API rate limit */
  RATE_LIMITED: 'RATE_LIMITED',

  /** Invalid input data (empty resume, missing required field) */
  VALIDATION_ERROR: 'VALIDATION_ERROR',

  /** ATS score calculation failed (Story 5.2) */
  SCORE_CALCULATION_ERROR: 'SCORE_CALCULATION_ERROR',

  /** Authentication error (generic) */
  AUTH_ERROR: 'AUTH_ERROR',

  /** Invalid email address */
  INVALID_EMAIL: 'INVALID_EMAIL',

  /** Weak password (doesn't meet requirements) */
  WEAK_PASSWORD: 'WEAK_PASSWORD',

  /** User already exists with this email */
  USER_EXISTS: 'USER_EXISTS',
} as const;

/**
 * Union type of all valid error codes
 */
export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

// ============================================================================
// RE-EXPORTS
// ============================================================================

export * from './errors';
export * from './optimization';
export * from './store';
