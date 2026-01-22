/**
 * DOCX Generator
 * Generates professional editable resume DOCX files
 * Story 6.3: DOCX Resume Generation
 */

import { Document, Packer, convertInchesToTwip } from 'docx'
import type { ParsedResume } from '@/lib/parsers/types'
import {
  buildContactSection,
  buildSummarySection,
  buildExperienceSection,
  buildEducationSection,
  buildSkillsSection,
  buildProjectsSection,
  buildOtherSection,
  type DOCXStyleConfig,
} from './docx-structure'

/**
 * DOCX generation options
 */
export interface DOCXGenerationOptions {
  fileName?: string
  margins?: {
    top: number
    right: number
    bottom: number
    left: number
  }
  styles?: {
    fontName?: string
    fontSize?: number
    bodyLineSpacing?: number
  }
}

/**
 * Default DOCX generation options with required style values
 */
export const DEFAULT_DOCX_OPTIONS = {
  margins: {
    top: 1,
    right: 1,
    bottom: 1,
    left: 1,
  },
  styles: {
    fontName: 'Calibri',
    fontSize: 11,
    bodyLineSpacing: 1.15,
  } satisfies DOCXStyleConfig,
} as const

/**
 * Custom error class for DOCX generation failures
 */
export class DOCXGenerationError extends Error {
  constructor(
    message: string,
    public readonly code: 'INVALID_DATA' | 'RENDER_ERROR'
  ) {
    super(message)
    this.name = 'DOCXGenerationError'
  }
}

/**
 * Generate DOCX from merged resume data
 *
 * @param mergedResume - Parsed resume data with accepted suggestions applied
 * @param userName - User's name for filename generation
 * @param options - Optional DOCX generation settings
 * @returns DOCX as Buffer ready for download
 * @throws DOCXGenerationError if generation fails
 */
export async function generateDOCX(
  mergedResume: ParsedResume,
  userName?: string,
  options?: DOCXGenerationOptions
): Promise<Buffer> {
  try {
    // Validate input data
    if (!mergedResume) {
      throw new DOCXGenerationError(
        'Resume data is required',
        'INVALID_DATA'
      )
    }

    // Validate required sections exist
    if (!mergedResume.contact || typeof mergedResume.contact !== 'string') {
      throw new DOCXGenerationError(
        'Resume must have contact information',
        'INVALID_DATA'
      )
    }

    // Merge options with defaults
    const margins = { ...DEFAULT_DOCX_OPTIONS.margins, ...options?.margins }
    const styles: DOCXStyleConfig = {
      fontName: options?.styles?.fontName ?? DEFAULT_DOCX_OPTIONS.styles.fontName,
      fontSize: options?.styles?.fontSize ?? DEFAULT_DOCX_OPTIONS.styles.fontSize,
      bodyLineSpacing: options?.styles?.bodyLineSpacing ?? DEFAULT_DOCX_OPTIONS.styles.bodyLineSpacing,
    }

    // Build document sections
    const sections = [
      ...buildContactSection(mergedResume.contact, styles),
      ...buildSummarySection(mergedResume.summary, styles),
      ...buildExperienceSection(mergedResume.experience, styles),
      ...buildEducationSection(mergedResume.education, styles),
      ...buildSkillsSection(mergedResume.skills, styles),
      ...buildProjectsSection(mergedResume.projects, styles),
      ...buildOtherSection(mergedResume.other, styles),
    ]

    // Create document
    const doc = new Document({
      creator: 'CoopReady',
      description: 'Optimized Resume',
      title: 'Resume',
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: convertInchesToTwip(margins.top),
                right: convertInchesToTwip(margins.right),
                bottom: convertInchesToTwip(margins.bottom),
                left: convertInchesToTwip(margins.left),
              },
            },
          },
          children: sections,
        },
      ],
    })

    // Generate DOCX buffer
    const docxBuffer = await Packer.toBuffer(doc)

    // Validate file size (must be under 100KB)
    const fileSizeKB = docxBuffer.length / 1024
    if (fileSizeKB > 100) {
      console.warn(
        `[generateDOCX] File size (${fileSizeKB.toFixed(1)}KB) exceeds 100KB target. Consider reducing content length.`
      )
    }

    return docxBuffer
  } catch (error) {
    // Re-throw DOCXGenerationError as-is
    if (error instanceof DOCXGenerationError) {
      throw error
    }

    // Wrap other errors
    console.error('[generateDOCX] Unexpected error:', error)
    throw new DOCXGenerationError(
      'Failed to generate DOCX document',
      'RENDER_ERROR'
    )
  }
}

/**
 * Generate filename for DOCX export
 * Format: FirstName_LastName_Resume_Optimized.docx
 *
 * @param contact - Contact info string (first line is name)
 * @returns Sanitized filename
 */
export function generateFileName(contact: string): string {
  // Extract name from contact (first line)
  const lines = contact.split('\n')
  const name = lines[0]?.trim() || ''

  // Clean and format name
  const cleanName = name
    .replace(/[^a-zA-Z\s]/g, '') // Remove non-letter chars
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .trim()

  // If no valid name, return just "Resume_Optimized.docx"
  if (!cleanName) {
    return 'Resume_Optimized.docx'
  }

  return `${cleanName}_Resume_Optimized.docx`
}
