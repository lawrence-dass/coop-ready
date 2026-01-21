'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/queries'
import { getOpenAIClient } from '@/lib/openai'
import { withRetry } from '@/lib/openai/retry'
import { parseOpenAIResponse } from '@/lib/openai'
import { createATSScoringPrompt } from '@/lib/openai/prompts/scoring'
import { buildExperienceContext } from '@/lib/openai/prompts/experienceContext'
import {
  parseAnalysisResponse,
  isValidAnalysisResult,
} from '@/lib/openai/prompts/parseAnalysis'
import {
  parseKeywordsResponse,
  toKeywordAnalysis,
  isValidKeywordResult,
} from '@/lib/openai/prompts/parseKeywords'
import {
  parseSectionScoresResponse,
  isValidSectionScoresResult,
} from '@/lib/openai/prompts/parseSectionScores'
import { detectSections } from '@/lib/utils/resumeSectionDetector'
import { analysisInputSchema } from '@/lib/validations/analysis'
import type {
  AnalysisInput,
  AnalysisResult,
  AnalysisContext,
  UserProfile,
  ExperienceLevel,
} from '@/lib/types/analysis'
import type { ParsedResume } from '@/lib/parsers/types'

// Valid experience levels for type-safe validation
const VALID_EXPERIENCE_LEVELS: ExperienceLevel[] = ['student', 'career_changer', 'experienced']

/**
 * Validate and normalize experience level to ensure type safety
 */
function normalizeExperienceLevel(level: string): ExperienceLevel {
  if (VALID_EXPERIENCE_LEVELS.includes(level as ExperienceLevel)) {
    return level as ExperienceLevel
  }
  console.warn(`[normalizeExperienceLevel] Invalid level "${level}", defaulting to student`)
  return 'student'
}

/**
 * Server Actions for Resume Analysis
 *
 * @see Story 4.2: ATS Score Calculation
 * @see Story 4.3: Missing Keywords Detection
 * @see Story 4.4: Section-Level Score Breakdown
 * @see Story 4.5: Experience-Level-Aware Analysis
 */

type ActionResponse<T> =
  | { data: T; error: null }
  | { data: null; error: { message: string; code?: string } }

/**
 * Run ATS analysis on a scan
 *
 * Loads scan record, resume text, job description, and user profile,
 * then calls OpenAI to generate ATS compatibility score and feedback.
 *
 * Process:
 * 1. Validate input (scan ID)
 * 2. Load scan record and verify user ownership
 * 3. Load resume text from resumes table
 * 4. Load user profile for context-aware scoring
 * 5. Create analysis prompt with resume, JD, and context
 * 6. Call OpenAI API with retry logic (from Story 4.1)
 * 7. Parse and validate response
 * 8. Update scan record with score and justification
 * 9. Return analysis result to client
 *
 * Error handling:
 * - Invalid input: Return validation error
 * - Scan not found: Return NOT_FOUND error
 * - Unauthorized access: Return UNAUTHORIZED error
 * - Resume text missing: Return specific error
 * - OpenAI failure: Set scan status to "failed", return user-friendly error
 *
 * @param input - Scan ID to analyze
 * @returns ActionResponse with analysis result or error
 */
export async function runAnalysis(
  input: AnalysisInput
): Promise<ActionResponse<AnalysisResult>> {
  // Validate input with Zod
  const parsed = analysisInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      data: null,
      error: {
        message: parsed.error.issues[0].message,
        code: 'VALIDATION_ERROR',
      },
    }
  }

  try {
    const supabase = await createClient()

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return {
        data: null,
        error: {
          message: 'Authentication required',
          code: 'UNAUTHORIZED',
        },
      }
    }

    // Load scan record
    const { data: scan, error: scanError } = await supabase
      .from('scans')
      .select('*')
      .eq('id', parsed.data.scanId)
      .single()

    if (scanError || !scan) {
      console.error('[runAnalysis] Scan not found', {
        scanId: parsed.data.scanId,
        error: scanError,
      })
      return {
        data: null,
        error: {
          message: 'Scan not found',
          code: 'NOT_FOUND',
        },
      }
    }

    // Verify user owns this scan (security check)
    if (scan.user_id !== user.id) {
      console.warn('[runAnalysis] Unauthorized access attempt', {
        scanId: parsed.data.scanId,
        userId: user.id,
        scanUserId: scan.user_id,
      })
      return {
        data: null,
        error: {
          message: 'Access denied',
          code: 'UNAUTHORIZED',
        },
      }
    }

    // Update scan status to "processing"
    await supabase
      .from('scans')
      .update({ status: 'processing' })
      .eq('id', parsed.data.scanId)

    // Load resume text and parsed sections from resumes table
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('extracted_text, parsed_resume')
      .eq('id', scan.resume_id)
      .single()

    if (resumeError || !resume) {
      console.error('[runAnalysis] Resume not found', {
        resumeId: scan.resume_id,
        error: resumeError,
      })

      // Mark scan as failed
      await supabase
        .from('scans')
        .update({ status: 'failed' })
        .eq('id', parsed.data.scanId)

      return {
        data: null,
        error: {
          message: 'Resume not found',
          code: 'RESUME_NOT_FOUND',
        },
      }
    }

    if (!resume.extracted_text) {
      console.error('[runAnalysis] Resume text not extracted', {
        resumeId: scan.resume_id,
      })

      // Mark scan as failed
      await supabase
        .from('scans')
        .update({ status: 'failed' })
        .eq('id', parsed.data.scanId)

      return {
        data: null,
        error: {
          message:
            'Resume text not available. Please re-upload your resume.',
          code: 'RESUME_TEXT_MISSING',
        },
      }
    }

    // Load user profile for experience-level-aware analysis (Story 4.5)
    const profile = await getUserProfile(user.id)

    console.log('[runAnalysis] User profile loaded', {
      userId: user.id,
      experienceLevel: profile.experienceLevel,
      targetRole: profile.targetRole,
    })

    // Build experience context narrative (Story 4.5)
    const experienceContext = buildExperienceContext(
      profile.experienceLevel,
      profile.targetRole
    )

    console.log('[runAnalysis] Experience context built', {
      experienceLevel: profile.experienceLevel,
      contextLength: experienceContext.length,
    })

    // Build analysis context with validated experience level
    const validatedLevel = normalizeExperienceLevel(profile.experienceLevel)
    const context: AnalysisContext = {
      resumeText: resume.extracted_text,
      jobDescription: scan.job_description,
      userProfile: {
        experienceLevel: validatedLevel,
        targetRole: profile.targetRole,
      },
    }

    // Detect resume sections for section-level scoring (Story 4.4)
    let detectedSections: ReturnType<typeof detectSections> = []
    if (resume.parsed_resume) {
      try {
        const parsedResume = resume.parsed_resume as unknown as ParsedResume
        detectedSections = detectSections(parsedResume)
        console.log('[runAnalysis] Detected resume sections', {
          scanId: parsed.data.scanId,
          sections: detectedSections,
        })
      } catch (error) {
        console.warn('[runAnalysis] Failed to detect resume sections', {
          scanId: parsed.data.scanId,
          error,
        })
        // Continue with empty sections array
      }
    }

    // Create analysis prompt with detected sections
    const messages = createATSScoringPrompt(context, detectedSections)

    // Call OpenAI API with retry logic
    const openaiClient = getOpenAIClient()

    const completion = await withRetry(async () => {
      return await openaiClient.chat.completions.create({
        model: 'gpt-4o-mini',
        messages,
        temperature: 0.3, // Lower temperature for more consistent scoring
        max_tokens: 2500, // Increased for keyword extraction (Story 4.3)
      })
    }, 'ATS analysis')

    // Parse OpenAI response to extract content and token usage
    const parsedResponse = parseOpenAIResponse(completion)

    // Parse analysis result from response content
    const analysisResult = parseAnalysisResponse(parsedResponse.content)

    // Parse keyword extraction from response content (Story 4.3)
    const keywordExtraction = parseKeywordsResponse(parsedResponse.content)
    const keywordAnalysis = toKeywordAnalysis(keywordExtraction)

    // Parse section scores from response content (Story 4.4)
    const sectionScoresResult = parseSectionScoresResponse(parsedResponse.content)

    // Validate analysis result
    if (!isValidAnalysisResult(analysisResult)) {
      console.warn('[runAnalysis] Analysis result failed validation', {
        scanId: parsed.data.scanId,
        result: analysisResult,
      })

      // Mark scan as failed - don't save invalid/garbage data
      await supabase
        .from('scans')
        .update({ status: 'failed' })
        .eq('id', parsed.data.scanId)

      return {
        data: null,
        error: {
          message: 'Analysis produced invalid results. Please try again.',
          code: 'VALIDATION_FAILED',
        },
      }
    }

    // Validate keyword result (warn if invalid but don't fail analysis)
    if (!isValidKeywordResult(keywordExtraction)) {
      console.warn('[runAnalysis] Keyword result failed validation', {
        scanId: parsed.data.scanId,
        keywords: keywordExtraction,
      })
      // Continue with empty keyword data rather than failing the entire analysis
    }

    // Validate section scores result (warn if invalid but don't fail analysis)
    if (!isValidSectionScoresResult(sectionScoresResult)) {
      console.warn('[runAnalysis] Section scores result failed validation', {
        scanId: parsed.data.scanId,
        sectionScores: sectionScoresResult,
      })
      // Continue with empty section scores rather than failing the entire analysis
    }

    // Update scan record with analysis results (includes experience_level_context from Story 4.5)
    const { error: updateError } = await supabase
      .from('scans')
      .update({
        ats_score: analysisResult.overallScore,
        score_justification: analysisResult.justification,
        keywords_found: keywordAnalysis.keywordsFound as unknown as Record<string, unknown>,
        keywords_missing: keywordAnalysis.keywordsMissing as unknown as Record<string, unknown>,
        section_scores: sectionScoresResult.sectionScores as unknown as Record<string, unknown>,
        experience_level_context: experienceContext, // Store context used for analysis (Story 4.5 AC 10)
        status: 'completed',
      })
      .eq('id', parsed.data.scanId)

    if (updateError) {
      console.error('[runAnalysis] Failed to update scan record', {
        scanId: parsed.data.scanId,
        error: updateError,
      })

      return {
        data: null,
        error: {
          message: 'Failed to save analysis results',
          code: 'DATABASE_ERROR',
        },
      }
    }

    console.info('[runAnalysis] Analysis completed successfully', {
      scanId: parsed.data.scanId,
      overallScore: analysisResult.overallScore,
      experienceLevel: profile.experienceLevel,
      keywordsFoundCount: keywordAnalysis.keywordsFound.length,
      keywordsMissingCount: keywordAnalysis.keywordsMissing.length,
      majorKeywordsCoverage: keywordAnalysis.majorKeywordsCoverage,
      sectionsScored: Object.keys(sectionScoresResult.sectionScores).length,
      tokensUsed: parsedResponse.usage.totalTokens,
      costEstimate: parsedResponse.costEstimate,
    })

    // Include keyword analysis, section scores, and experience context in returned result (Story 4.5)
    const fullAnalysisResult: AnalysisResult = {
      ...analysisResult,
      keywords: keywordAnalysis,
      sectionScores: sectionScoresResult.sectionScores,
      experienceLevelContext: experienceContext, // Include context in result (Story 4.5 AC 10)
    }

    return {
      data: fullAnalysisResult,
      error: null,
    }
  } catch (error) {
    console.error('[runAnalysis] Unexpected error', {
      scanId: input.scanId,
      error: error instanceof Error ? error.message : String(error),
    })

    // Try to mark scan as failed
    try {
      const supabase = await createClient()
      await supabase
        .from('scans')
        .update({ status: 'failed' })
        .eq('id', input.scanId)
    } catch (updateError) {
      console.error('[runAnalysis] Failed to update scan status to failed', {
        scanId: input.scanId,
        error: updateError,
      })
    }

    return {
      data: null,
      error: {
        message: 'Analysis failed. Please try again later.',
        code: 'ANALYSIS_ERROR',
      },
    }
  }
}
