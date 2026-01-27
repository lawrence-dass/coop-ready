/**
 * Error Codes
 *
 * Extracted to its own module to avoid circular dependency
 * between types/index.ts and types/errors.ts.
 */

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
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
