/**
 * PDF Text Extraction Parser
 *
 * Extracts text content from PDF files using pdf-parse library.
 * Handles scanned PDFs, corrupted files, and password-protected documents.
 *
 * @see Story 3.2: Resume Text Extraction - Task 2
 * @see AC1: PDF Text Extraction
 * @see AC3: Scanned PDF Handling
 * @see AC4: Corrupted/Protected File Handling
 */

// pdf-parse is a CommonJS module, import using require
// eslint-disable-next-line @typescript-eslint/no-require-imports
const pdf = require('pdf-parse')

/**
 * Error codes for PDF extraction failures
 */
export const PDF_ERROR_CODES = {
  SCANNED_PDF: 'SCANNED_PDF',
  CORRUPTED_FILE: 'CORRUPTED_FILE',
  PASSWORD_PROTECTED: 'PASSWORD_PROTECTED',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const

/**
 * Minimum text length threshold to detect scanned PDFs
 * Resumes typically have >50 characters even for minimal content
 */
const MIN_TEXT_LENGTH = 50

/**
 * Extract text content from PDF buffer
 *
 * @param buffer - PDF file as Buffer
 * @returns Extracted text content with preserved paragraph structure
 * @throws Error with code property for specific failure types
 *
 * @example
 * ```typescript
 * try {
 *   const text = await extractPdfText(pdfBuffer)
 *   console.log('Extracted:', text)
 * } catch (error) {
 *   if (error.code === 'SCANNED_PDF') {
 *     console.error('This is a scanned PDF')
 *   }
 * }
 * ```
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  try {
    // Extract text using pdf-parse
    const data = await pdf(buffer, {
      // Preserve whitespace and line breaks
      max: 0, // Process all pages
    })

    const extractedText = data.text.trim()

    // Detect scanned PDFs (image-only PDFs with minimal/no text)
    if (extractedText.length < MIN_TEXT_LENGTH) {
      const scannedError = new Error('Unable to extract text. Please upload a text-based PDF') as Error & { code: string }
      scannedError.code = PDF_ERROR_CODES.SCANNED_PDF
      throw scannedError
    }

    // Return text with preserved paragraph structure
    return extractedText
  } catch (error) {
    const err = error as Error & { code?: string }

    // Re-throw our custom errors
    if (err.code === PDF_ERROR_CODES.SCANNED_PDF) {
      throw err
    }

    // Handle password-protected PDFs
    // pdf-parse throws "Cannot read property..." for encrypted PDFs
    if (
      err.message?.includes('Cannot read property') ||
      err.message?.includes('encrypted') ||
      err.message?.includes('password')
    ) {
      const protectedError = new Error('This PDF is password protected. Please remove protection') as Error & { code: string }
      protectedError.code = PDF_ERROR_CODES.PASSWORD_PROTECTED
      throw protectedError
    }

    // Handle corrupted PDF files
    // pdf-parse throws various errors for malformed PDFs
    if (
      err.message?.includes('Invalid PDF') ||
      err.message?.includes('PDF header') ||
      err.message?.includes('Failed to parse')
    ) {
      const corruptedError = new Error('File appears to be corrupted. Try another PDF') as Error & { code: string }
      corruptedError.code = PDF_ERROR_CODES.CORRUPTED_FILE
      throw corruptedError
    }

    // Unknown error - log for debugging
    console.error('[extractPdfText] Unknown error:', err)
    const unknownError = new Error('Unable to process file. Please try again') as Error & { code: string }
    unknownError.code = PDF_ERROR_CODES.UNKNOWN_ERROR
    throw unknownError
  }
}
