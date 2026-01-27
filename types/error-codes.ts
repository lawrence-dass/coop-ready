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

  /** Invalid login credentials (wrong email or password) */
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',

  /** User not found in database */
  USER_NOT_FOUND: 'USER_NOT_FOUND',

  /** Email not confirmed/verified */
  EMAIL_NOT_CONFIRMED: 'EMAIL_NOT_CONFIRMED',

  /** Sign out failed */
  SIGN_OUT_ERROR: 'SIGN_OUT_ERROR',

  /** Onboarding save failed (Story 8-5) */
  ONBOARDING_SAVE_ERROR: 'ONBOARDING_SAVE_ERROR',

  /** User not authenticated (Story 9-1) */
  UNAUTHORIZED: 'UNAUTHORIZED',

  /** Failed to save resume to library (Story 9-1) */
  SAVE_RESUME_ERROR: 'SAVE_RESUME_ERROR',

  /** User has reached maximum of 3 saved resumes (Story 9-1) */
  RESUME_LIMIT_EXCEEDED: 'RESUME_LIMIT_EXCEEDED',

  /** Failed to get user resumes list (Story 9-2) */
  GET_RESUMES_ERROR: 'GET_RESUMES_ERROR',

  /** Resume not found or user unauthorized (Story 9-2) */
  RESUME_NOT_FOUND: 'RESUME_NOT_FOUND',

  /** Failed to get resume content (Story 9-2) */
  GET_RESUME_CONTENT_ERROR: 'GET_RESUME_CONTENT_ERROR',

  /** Failed to delete resume (Story 9-3) */
  DELETE_RESUME_ERROR: 'DELETE_RESUME_ERROR',

  /** Failed to fetch optimization history (Story 10-1) */
  GET_HISTORY_ERROR: 'GET_HISTORY_ERROR',

  /** Session not found or deleted (Story 10-2) */
  SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',

  /** Failed to fetch session details (Story 10-2) */
  GET_SESSION_ERROR: 'GET_SESSION_ERROR',
} as const;

/**
 * Union type of all valid error codes
 */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
