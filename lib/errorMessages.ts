/**
 * Error Message Mapping Service
 *
 * Maps error codes to user-friendly display information including:
 * - Title (error type/category)
 * - Message (plain-language explanation)
 * - Recovery action (suggested next step)
 *
 * **Usage:**
 * ```typescript
 * const display = getErrorDisplay('LLM_TIMEOUT');
 * // => { title: 'Optimization Took Too Long', message: '...', recoveryAction: '...' }
 * ```
 *
 * **Error Codes:**
 * All codes from project-context.md:
 * - INVALID_FILE_TYPE: Wrong file format
 * - FILE_TOO_LARGE: Exceeds 5MB
 * - PARSE_ERROR: Can't extract text
 * - LLM_TIMEOUT: 60s exceeded
 * - LLM_ERROR: API failure
 * - RATE_LIMITED: Too many requests
 * - VALIDATION_ERROR: Bad input
 */

// ============================================================================
// TYPES
// ============================================================================

/**
 * Error display information
 */
export interface ErrorDisplayInfo {
  /** Error type/category (e.g., "Optimization Failed") */
  title: string;
  /** Plain-language explanation of what went wrong */
  message: string;
  /** Suggested recovery action for the user */
  recoveryAction: string;
}

/**
 * All standardized error codes from project-context.md
 */
export type ErrorCode =
  | 'INVALID_FILE_TYPE'
  | 'FILE_TOO_LARGE'
  | 'PARSE_ERROR'
  | 'LLM_TIMEOUT'
  | 'LLM_ERROR'
  | 'RATE_LIMITED'
  | 'VALIDATION_ERROR';

// ============================================================================
// ERROR MESSAGE MAPPING
// ============================================================================

/**
 * Map of error codes to display information
 */
const ERROR_MESSAGES: Record<ErrorCode, ErrorDisplayInfo> = {
  // File Upload Errors
  INVALID_FILE_TYPE: {
    title: 'Invalid File Type',
    message: 'We only support PDF and Word documents (.pdf, .docx)',
    recoveryAction: 'Try uploading a different file',
  },

  FILE_TOO_LARGE: {
    title: 'File Too Large',
    message: 'Your file is larger than 5MB. Try a more concise resume',
    recoveryAction: 'Reduce your resume size and try again',
  },

  PARSE_ERROR: {
    title: 'Could Not Read File',
    message: 'We had trouble reading your file. It may be corrupted or in an unsupported format',
    recoveryAction: 'Try uploading a different file or converting to PDF',
  },

  // LLM Processing Errors
  LLM_TIMEOUT: {
    title: 'Optimization Took Too Long',
    message: 'The optimization process exceeded the 60-second time limit',
    recoveryAction: 'Please try again. Your inputs are preserved',
  },

  LLM_ERROR: {
    title: 'Optimization Failed',
    message: 'We encountered an issue while optimizing your resume',
    recoveryAction: 'Please try again in a few moments',
  },

  // Network & Rate Limiting Errors
  RATE_LIMITED: {
    title: 'Too Many Requests',
    message: "You've submitted too many optimization requests. Please wait a moment",
    recoveryAction: 'Wait a few seconds and try again',
  },

  // Validation Errors
  VALIDATION_ERROR: {
    title: 'Invalid Input',
    message: 'Please check your inputs and try again',
    recoveryAction: 'Review your resume and job description content',
  },
};

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get error display information for a given error code
 *
 * @param errorCode - Standardized error code
 * @returns Error display information (title, message, recovery action)
 *
 * @example
 * ```typescript
 * const display = getErrorDisplay('LLM_TIMEOUT');
 * console.log(display.title); // "Optimization Took Too Long"
 * console.log(display.message); // "The optimization process..."
 * console.log(display.recoveryAction); // "Please try again..."
 * ```
 */
export function getErrorDisplay(errorCode: string): ErrorDisplayInfo {
  // Check if error code is known
  if (errorCode in ERROR_MESSAGES) {
    return ERROR_MESSAGES[errorCode as ErrorCode];
  }

  // Default fallback for unknown error codes
  return {
    title: 'Something Went Wrong',
    message: 'An unexpected error occurred. Please try again',
    recoveryAction: 'If this problem persists, contact support',
  };
}

/**
 * Check if an error code is valid/known
 *
 * @param errorCode - Error code to check
 * @returns True if error code is recognized
 */
export function isKnownErrorCode(errorCode: string): errorCode is ErrorCode {
  return errorCode in ERROR_MESSAGES;
}

/**
 * Get all supported error codes
 *
 * @returns Array of all valid error codes
 */
export function getAllErrorCodes(): ErrorCode[] {
  return Object.keys(ERROR_MESSAGES) as ErrorCode[];
}
