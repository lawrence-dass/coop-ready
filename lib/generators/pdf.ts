/**
 * PDF Generator
 * Generates professional ATS-friendly resume PDFs
 * Story 6.2: PDF Resume Generation
 */

import { renderToBuffer } from '@react-pdf/renderer'
import type { ParsedResume } from '@/lib/parsers/types'
import { PDFDocument, type PDFStyleOptions } from '@/components/pdf'

/**
 * PDF generation options
 */
export interface PDFGenerationOptions {
  fileName?: string
  fontSize?: {
    body: number
    header: number
    title: number
  }
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  lineSpacing?: 1.15 | 1.5
}

/**
 * Default PDF generation options
 */
export const DEFAULT_PDF_OPTIONS: Required<Omit<PDFGenerationOptions, 'fileName'>> = {
  fontSize: {
    body: 11,
    header: 12,
    title: 16,
  },
  margins: {
    top: 0.75,
    right: 0.75,
    bottom: 0.5,
    left: 0.75,
  },
  lineSpacing: 1.15,
}

/**
 * Custom error class for PDF generation failures
 */
export class PDFGenerationError extends Error {
  constructor(
    message: string,
    public readonly code: 'CONTENT_TOO_LONG' | 'INVALID_DATA' | 'RENDER_ERROR'
  ) {
    super(message)
    this.name = 'PDFGenerationError'
  }
}

/**
 * Generate PDF from merged resume data
 *
 * @param mergedResume - Parsed resume data with accepted suggestions applied
 * @param userName - User's name for filename generation
 * @param options - Optional PDF generation settings
 * @returns PDF as Buffer ready for download
 * @throws PDFGenerationError if generation fails
 */
export async function generatePDF(
  mergedResume: ParsedResume,
  userName?: string,
  options?: PDFGenerationOptions
): Promise<Buffer> {
  try {
    // Validate input data
    if (!mergedResume) {
      throw new PDFGenerationError(
        'Resume data is required',
        'INVALID_DATA'
      )
    }

    // Validate required sections exist
    if (!mergedResume.contact || typeof mergedResume.contact !== 'string') {
      throw new PDFGenerationError(
        'Resume must have contact information',
        'INVALID_DATA'
      )
    }

    // Merge options with defaults
    const styleOptions: PDFStyleOptions = {
      fontSize: { ...DEFAULT_PDF_OPTIONS.fontSize, ...options?.fontSize },
      margins: { ...DEFAULT_PDF_OPTIONS.margins, ...options?.margins },
      lineSpacing: options?.lineSpacing ?? DEFAULT_PDF_OPTIONS.lineSpacing,
    }

    // Render PDF document to buffer
    const pdfBuffer = await renderToBuffer(PDFDocument({ resume: mergedResume, styleOptions }) as any)

    // Validate file size (must be under 500KB)
    const fileSizeKB = pdfBuffer.length / 1024
    if (fileSizeKB > 500) {
      throw new PDFGenerationError(
        `PDF file size (${fileSizeKB.toFixed(1)}KB) exceeds 500KB limit. Try reducing content length.`,
        'CONTENT_TOO_LONG'
      )
    }

    return pdfBuffer
  } catch (error) {
    // Re-throw PDFGenerationError as-is
    if (error instanceof PDFGenerationError) {
      throw error
    }

    // Wrap other errors
    console.error('[generatePDF] Unexpected error:', error)
    throw new PDFGenerationError(
      'Failed to generate PDF document',
      'RENDER_ERROR'
    )
  }
}

/**
 * Generate filename for PDF export
 * Format: FirstName_LastName_Resume_Optimized.pdf
 *
 * @param contact - Contact info string (first line is name)
 * @returns Sanitized filename
 */
export function generateFileName(contact: string): string {
  // Extract name from contact (first line)
  const lines = contact.split('\n')
  const name = lines[0] || 'Resume'

  // Clean and format name
  const cleanName = name
    .trim()
    .replace(/[^a-zA-Z\s]/g, '') // Remove non-letter chars
    .replace(/\s+/g, '_') // Replace spaces with underscores

  return `${cleanName}_Resume_Optimized.pdf`
}
