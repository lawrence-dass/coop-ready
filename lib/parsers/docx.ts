/**
 * DOCX Text Extraction Parser
 *
 * Extracts text content from DOCX files using mammoth library.
 * Converts formatting (bold, bullets, headers) to plain text structure.
 *
 * @see Story 3.2: Resume Text Extraction - Task 3
 * @see AC2: DOCX Text Extraction
 * @see AC4: Corrupted/Protected File Handling
 */

import mammoth from 'mammoth'

/**
 * Error codes for DOCX extraction failures
 */
export const DOCX_ERROR_CODES = {
  CORRUPTED_FILE: 'CORRUPTED_FILE',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

/**
 * Extract text content from DOCX buffer
 *
 * @param buffer - DOCX file as Buffer
 * @returns Extracted text content with preserved paragraph structure
 * @throws Error with code property for specific failure types
 *
 * @example
 * ```typescript
 * try {
 *   const text = await extractDocxText(docxBuffer)
 *   console.log('Extracted:', text)
 * } catch (error) {
 *   if (error.code === 'CORRUPTED_FILE') {
 *     console.error('This DOCX file is corrupted')
 *   }
 * }
 * ```
 */
export async function extractDocxText(buffer: Buffer): Promise<string> {
  try {
    // Extract raw text using mammoth
    // mammoth.extractRawText converts formatting to plain text
    const result = await mammoth.extractRawText({
      buffer: buffer,
    })

    // Mammoth returns { value: string, messages: [] }
    const extractedText = result.value.trim()

    // Check if extraction was successful
    if (!extractedText || extractedText.length === 0) {
      const emptyError = new Error('File appears to be empty or corrupted. Try another DOCX') as Error & { code: string }
      emptyError.code = DOCX_ERROR_CODES.CORRUPTED_FILE
      throw emptyError
    }

    // Return text with preserved paragraph structure
    // Mammoth already preserves line breaks and paragraph structure
    return extractedText
  } catch (error) {
    const err = error as Error & { code?: string }

    // Re-throw our custom errors
    if (err.code === DOCX_ERROR_CODES.CORRUPTED_FILE) {
      throw err
    }

    // Handle corrupted DOCX files
    // Mammoth throws errors for malformed DOCX files
    if (
      err.message?.includes('not a valid') ||
      err.message?.includes('zip') ||
      err.message?.includes('format')
    ) {
      const corruptedError = new Error('File appears to be corrupted. Try another DOCX') as Error & { code: string }
      corruptedError.code = DOCX_ERROR_CODES.CORRUPTED_FILE
      throw corruptedError
    }

    // Unknown error - log for debugging
    console.error('[extractDocxText] Unknown error:', err)
    const unknownError = new Error('Unable to process file. Please try again') as Error & { code: string }
    unknownError.code = DOCX_ERROR_CODES.UNKNOWN_ERROR
    throw unknownError
  }
}
