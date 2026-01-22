'use server'

/**
 * Export Server Actions
 * Handles resume content merging and export operations
 * Story 6.1: Resume Content Merging
 */

import { createClient } from '@/lib/supabase/server'
import { mergeResumeContent, type MergeResult, type DatabaseSuggestion } from '@/lib/generators/merge'
import type { ParsedResume } from '@/lib/parsers/types'
import { z } from 'zod'

type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } }

/**
 * Input validation for generateMergedResume
 */
const generateMergedResumeSchema = z.object({
  scanId: z.string().uuid('Invalid scan ID'),
})

/**
 * Generate merged resume content by applying accepted suggestions
 * This is the entry point for PDF and DOCX generation workflows
 *
 * @param input - Contains scanId to generate merged resume for
 * @returns Merged resume data ready for export, or error
 */
export async function generateMergedResume(input: {
  scanId: string
}): Promise<ActionResponse<MergeResult>> {
  // Validate input
  const parsed = generateMergedResumeSchema.safeParse(input)
  if (!parsed.success) {
    return {
      data: null,
      error: {
        message: 'Invalid input',
        code: 'VALIDATION_ERROR',
      },
    }
  }

  const { scanId } = parsed.data

  try {
    const supabase = await createClient()

    // Get current user for authorization
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return {
        data: null,
        error: {
          message: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
      }
    }

    // 1. Fetch scan with resume data
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('id, user_id, resume_id')
      .eq('id', scanId)
      .single()

    if (scanError || !scan) {
      console.error('[generateMergedResume] Scan fetch error:', scanError)
      return {
        data: null,
        error: {
          message: 'Scan not found',
          code: 'NOT_FOUND',
        },
      }
    }

    // Verify user owns this scan
    if (scan.user_id !== user.id) {
      return {
        data: null,
        error: {
          message: 'Scan not found',
          code: 'NOT_FOUND',
        },
      }
    }

    // 2. Fetch resume with parsed sections
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('id, parsed_sections')
      .eq('id', scan.resume_id)
      .single()

    if (resumeError || !resume) {
      console.error('[generateMergedResume] Resume fetch error:', resumeError)
      return {
        data: null,
        error: {
          message: 'Resume not found',
          code: 'NOT_FOUND',
        },
      }
    }

    if (!resume.parsed_sections) {
      return {
        data: null,
        error: {
          message: 'Resume has not been parsed yet',
          code: 'INVALID_STATE',
        },
      }
    }

    // 3. Fetch all suggestions for this scan
    const { data: suggestions, error: suggestionsError } = await supabase
      .from('suggestions')
      .select('*')
      .eq('scan_id', scanId)

    if (suggestionsError) {
      console.error('[generateMergedResume] Suggestions fetch error:', suggestionsError)
      return {
        data: null,
        error: {
          message: 'Failed to fetch suggestions',
          code: 'DATABASE_ERROR',
        },
      }
    }

    // Cast parsed_sections to ParsedResume
    const resumeData = resume.parsed_sections as unknown as ParsedResume

    // 4. Call merge function
    const mergeResult = await mergeResumeContent(
      resumeData,
      suggestions as DatabaseSuggestion[]
    )

    return {
      data: mergeResult,
      error: null,
    }
  } catch (error) {
    console.error('[generateMergedResume] Unexpected error:', error)
    return {
      data: null,
      error: {
        message: 'Failed to generate merged resume',
        code: 'INTERNAL_ERROR',
      },
    }
  }
}
