/**
 * Resume Text Extraction Orchestrator
 *
 * Routes extraction to appropriate parser (PDF or DOCX) based on file type.
 * Provides unified interface for all extraction operations.
 *
 * @see Story 3.2: Resume Text Extraction - Task 4
 * @see AC1: PDF Text Extraction
 * @see AC2: DOCX Text Extraction
 */

import { extractPdfText } from './pdf'
import { extractDocxText } from './docx'

/**
 * Supported file types for extraction
 */
export const SUPPORTED_FILE_TYPES = ['pdf', 'docx', 'doc'] as const

export type SupportedFileType = typeof SUPPORTED_FILE_TYPES[number]

/**
 * Error codes for extraction failures
 */
export const EXTRACTION_ERROR_CODES = {
  UNSUPPORTED_FILE_TYPE: 'UNSUPPORTED_FILE_TYPE',
  SCANNED_PDF: 'SCANNED_PDF',
  CORRUPTED_FILE: 'CORRUPTED_FILE',
  PASSWORD_PROTECTED: 'PASSWORD_PROTECTED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

/**
 * Extract text content from resume file
 *
 * Routes to appropriate parser based on fileType.
 * Handles errors gracefully with descriptive messages.
 *
 * @param buffer - File content as Buffer
 * @param fileType - File extension (pdf, docx, doc)
 * @returns Extracted text content
 * @throws Error with code property for specific failure types
 *
 * @example
 * ```typescript
 * try {
 *   const text = await extractResumeText(fileBuffer, 'pdf')
 *   console.log('Extracted:', text)
 * } catch (error) {
 *   console.error('Extraction failed:', error.code, error.message)
 * }
 * ```
 */
export async function extractResumeText(
  buffer: Buffer,
  fileType: string
): Promise<string> {
  // Normalize file type (remove dot, lowercase)
  const normalizedType = fileType.toLowerCase().replace('.', '') as SupportedFileType

  // Validate file type before extraction attempt
  if (!SUPPORTED_FILE_TYPES.includes(normalizedType)) {
    const unsupportedError = new Error(`Unsupported file type: ${fileType}`) as Error & { code: string }
    unsupportedError.code = EXTRACTION_ERROR_CODES.UNSUPPORTED_FILE_TYPE
    throw unsupportedError
  }

  try {
    // Route to appropriate parser
    switch (normalizedType) {
      case 'pdf':
        return await extractPdfText(buffer)

      case 'docx':
      case 'doc':
        // Both .doc and .docx use same parser (mammoth handles both)
        return await extractDocxText(buffer)

      default:
        // TypeScript exhaustiveness check - this line should never execute
        throw new Error(`Unhandled file type: ${normalizedType as string}`)
    }
  } catch (error) {
    // Re-throw with original error code and message
    // This preserves specific error types from parsers
    throw error
  }
}

/**
 * Check if a file type is supported for extraction
 *
 * @param fileType - File extension to check
 * @returns True if file type is supported
 */
export function isSupportedFileType(fileType: string): boolean {
  const normalizedType = fileType.toLowerCase().replace('.', '')
  return SUPPORTED_FILE_TYPES.includes(normalizedType as SupportedFileType)
}
