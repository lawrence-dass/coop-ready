'use server'

import { createClient } from '@/lib/supabase/server'
import { scanInputSchema } from '@/lib/validations/scan'

/**
 * Server Actions for Scan Management
 *
 * @see Story 3.5: Job Description Input
 * @see Story 4.7: Analysis Results Page - Extended ScanData interface with analysis fields
 */

export interface ScanData {
  id: string
  userId: string
  resumeId: string
  jobDescription: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  atsScore: number | null
  scoreJustification: string | null
  keywordsFound: Array<{ keyword: string; frequency: number }> | null
  keywordsMissing: Array<{ keyword: string; frequency: number; priority: 'high' | 'medium' | 'low' }> | null
  sectionScores: Record<string, { score: number; explanation: string; strengths: string[]; weaknesses: string[] }> | null
  experienceLevelContext: string | null
  formatIssues: Array<{ type: 'critical' | 'warning' | 'suggestion'; message: string; detail: string; source: 'rule-based' | 'ai-detected' }> | null
  createdAt: string
  updatedAt: string
}

type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } }

/**
 * Create a new scan
 *
 * Validates input and creates scan record in database.
 * Scan starts in 'pending' status, ready for analysis processing.
 *
 * @param input - Resume ID and job description
 * @returns ActionResponse with scan data or error
 */
export async function createScan(input: {
  resumeId: string
  jobDescription: string
}): Promise<ActionResponse<ScanData>> {
  // Validate input
  const parsed = scanInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      data: null,
      error: {
        message: parsed.error.issues[0].message,
        code: 'VALIDATION_ERROR'
      }
    }
  }

  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        data: null,
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED'
        }
      }
    }

    // Verify resume belongs to user
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('id')
      .eq('id', parsed.data.resumeId)
      .eq('user_id', user.id)
      .single()

    if (resumeError || !resume) {
      return {
        data: null,
        error: {
          message: 'Resume not found or access denied',
          code: 'NOT_FOUND'
        }
      }
    }

    // Create scan record
    const { data: scan, error: insertError } = await supabase
      .from('scans')
      .insert({
        user_id: user.id,
        resume_id: parsed.data.resumeId,
        job_description: parsed.data.jobDescription,
        status: 'pending',
      })
      .select()
      .single()

    if (insertError) {
      console.error('[createScan] Insert error:', insertError)
      return {
        data: null,
        error: {
          message: 'Failed to create scan',
          code: 'INTERNAL_ERROR'
        }
      }
    }

    // Transform to camelCase for API response
    const scanData: ScanData = {
      id: scan.id,
      userId: scan.user_id,
      resumeId: scan.resume_id,
      jobDescription: scan.job_description,
      status: scan.status,
      atsScore: scan.ats_score,
      scoreJustification: scan.score_justification,
      keywordsFound: scan.keywords_found,
      keywordsMissing: scan.keywords_missing,
      sectionScores: scan.section_scores,
      experienceLevelContext: scan.experience_level_context,
      formatIssues: scan.format_issues,
      createdAt: scan.created_at,
      updatedAt: scan.updated_at,
    }

    return { data: scanData, error: null }
  } catch (e) {
    console.error('[createScan] Unexpected error:', e)
    return {
      data: null,
      error: {
        message: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR'
      }
    }
  }
}

/**
 * Get scan by ID
 *
 * @param scanId - Scan UUID
 * @returns ActionResponse with scan data or error
 */
export async function getScan(scanId: string): Promise<ActionResponse<ScanData>> {
  try {
    const supabase = await createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return {
        data: null,
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED'
        }
      }
    }

    // Get scan (RLS will enforce user ownership)
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('*')
      .eq('id', scanId)
      .eq('user_id', user.id)
      .single()

    if (scanError || !scan) {
      return {
        data: null,
        error: {
          message: 'Scan not found',
          code: 'NOT_FOUND'
        }
      }
    }

    // Transform to camelCase
    const scanData: ScanData = {
      id: scan.id,
      userId: scan.user_id,
      resumeId: scan.resume_id,
      jobDescription: scan.job_description,
      status: scan.status,
      atsScore: scan.ats_score,
      scoreJustification: scan.score_justification,
      keywordsFound: scan.keywords_found,
      keywordsMissing: scan.keywords_missing,
      sectionScores: scan.section_scores,
      experienceLevelContext: scan.experience_level_context,
      formatIssues: scan.format_issues,
      createdAt: scan.created_at,
      updatedAt: scan.updated_at,
    }

    return { data: scanData, error: null }
  } catch (e) {
    console.error('[getScan] Unexpected error:', e)
    return {
      data: null,
      error: {
        message: 'Failed to get scan',
        code: 'INTERNAL_ERROR'
      }
    }
  }
}
