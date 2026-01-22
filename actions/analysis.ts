'use server'

import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/queries'
import { getOpenAIClient } from '@/lib/openai'
import { withRetry } from '@/lib/openai/retry'
import { parseOpenAIResponse } from '@/lib/openai'
import { createATSScoringPrompt } from '@/lib/openai/prompts/scoring'
import { createATSScoringPromptV2 } from '@/lib/openai/prompts/scoringV2'
import { buildExperienceContext } from '@/lib/openai/prompts/experienceContext'
import {
  parseAnalysisResponse,
  isValidAnalysisResult,
} from '@/lib/openai/prompts/parseAnalysis'
import { parseAnalysisResponseV2 } from '@/lib/openai/prompts/parseAnalysisV2'
import { calculateDensity } from '@/lib/utils/quantificationAnalyzer'
import { extractBullets, extractBulletsFromText } from '@/lib/utils/extractBullets'
import {
  parseKeywordsResponse,
  toKeywordAnalysis,
  isValidKeywordResult,
} from '@/lib/openai/prompts/parseKeywords'
import {
  parseSectionScoresResponse,
  isValidSectionScoresResult,
} from '@/lib/openai/prompts/parseSectionScores'
import {
  parseFormatIssuesResponse,
  mergeFormatIssues,
} from '@/lib/openai/prompts/parseFormatIssues'
import { detectSections } from '@/lib/utils/resumeSectionDetector'
import { analyzeResumeFormat } from '@/lib/utils/formatAnalyzer'
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
 * @see Story 4.6: Resume Format Issues Detection
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
  console.log('[runAnalysis] ====== ENTRY ======', {
    scanId: input.scanId,
    timestamp: new Date().toISOString()
  })

  // Validate input with Zod
  const parsed = analysisInputSchema.safeParse(input)
  if (!parsed.success) {
    console.log('[runAnalysis] Validation failed', { error: parsed.error.issues[0].message })
    return {
      data: null,
      error: {
        message: parsed.error.issues[0].message,
        code: 'VALIDATION_ERROR',
      },
    }
  }

  console.log('[runAnalysis] Input validated, creating Supabase client...')

  try {
    const supabase = await createClient()
    console.log('[runAnalysis] Supabase client created, getting user...')

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    console.log('[runAnalysis] Auth check complete', {
      hasUser: !!user,
      hasError: !!authError,
      userId: user?.id?.slice(0, 8) + '...'
    })

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

    console.log('[runAnalysis] Ownership verified, updating status to processing...')

    // Update scan status to "processing"
    const { error: statusUpdateError } = await supabase
      .from('scans')
      .update({ status: 'processing' })
      .eq('id', parsed.data.scanId)

    console.log('[runAnalysis] Status update complete', {
      success: !statusUpdateError,
      error: statusUpdateError?.message
    })

    console.log('[runAnalysis] Loading resume from database...', { resumeId: scan.resume_id })

    // Load resume text and parsed sections from resumes table
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('extracted_text, parsed_sections')
      .eq('id', scan.resume_id)
      .single()

    console.log('[runAnalysis] Resume fetch complete', {
      hasResume: !!resume,
      hasError: !!resumeError,
      hasExtractedText: !!resume?.extracted_text,
      textLength: resume?.extracted_text?.length || 0,
      hasParsedSections: !!resume?.parsed_sections
    })

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
    let ruleBasedFormatIssues: ReturnType<typeof analyzeResumeFormat> = []

    if (resume.parsed_sections) {
      try {
        const parsedResume = resume.parsed_sections as unknown as ParsedResume

        // Detect sections
        detectedSections = detectSections(parsedResume)
        console.log('[runAnalysis] Detected resume sections', {
          scanId: parsed.data.scanId,
          sections: detectedSections,
        })

        // Run rule-based format analysis (Story 4.6)
        ruleBasedFormatIssues = analyzeResumeFormat(parsedResume, validatedLevel)
        console.log('[runAnalysis] Rule-based format analysis completed', {
          scanId: parsed.data.scanId,
          issuesFound: ruleBasedFormatIssues.length,
        })
      } catch (error) {
        console.warn('[runAnalysis] Failed to detect resume sections or analyze format', {
          scanId: parsed.data.scanId,
          error,
        })
        // Continue with empty arrays
      }
    }

    // Extract bullets and calculate quantification density (Story 9.1)
    let bullets: string[] = []
    if (resume.parsed_sections) {
      try {
        const parsedResume = resume.parsed_sections as unknown as ParsedResume
        bullets = extractBullets(parsedResume)
      } catch (error) {
        console.warn('[runAnalysis] Failed to extract bullets from parsed resume, using text fallback', {
          scanId: parsed.data.scanId,
          error,
        })
      }
    }

    // Fallback to text extraction if no bullets found
    if (bullets.length === 0) {
      bullets = extractBulletsFromText(resume.extracted_text)
    }

    const quantificationDensity = calculateDensity(bullets)
    console.log('[runAnalysis] Quantification density calculated (Story 9.1)', {
      scanId: parsed.data.scanId,
      totalBullets: quantificationDensity.totalBullets,
      bulletsWithMetrics: quantificationDensity.bulletsWithMetrics,
      density: quantificationDensity.density,
    })

    // Create analysis prompt with V2 scoring (Story 9.1)
    const messages = createATSScoringPromptV2(context, quantificationDensity, detectedSections)

    console.log('[runAnalysis] ====== CALLING OPENAI ======', {
      scanId: parsed.data.scanId,
      messageCount: messages.length,
      resumeTextLength: context.resumeText.length,
      jobDescriptionLength: context.jobDescription.length,
      timestamp: new Date().toISOString()
    })

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

    console.log('[runAnalysis] ====== OPENAI RESPONSE RECEIVED ======', {
      scanId: parsed.data.scanId,
      timestamp: new Date().toISOString()
    })

    // Parse OpenAI response to extract content and token usage
    const parsedResponse = parseOpenAIResponse(completion)

    // Parse analysis result from response content using V2 parser (Story 9.1)
    const analysisResult = parseAnalysisResponseV2(parsedResponse.content)

    // Add quantification analysis to result (Story 9.1)
    analysisResult.quantificationAnalysis = quantificationDensity

    // Parse keyword extraction from response content (Story 4.3)
    const keywordExtraction = parseKeywordsResponse(parsedResponse.content)
    const keywordAnalysis = toKeywordAnalysis(keywordExtraction)

    // Parse section scores from response content (Story 4.4)
    const sectionScoresResult = parseSectionScoresResponse(parsedResponse.content)

    // Parse AI-detected format issues from response content (Story 4.6)
    const aiDetectedFormatIssues = parseFormatIssuesResponse(parsedResponse.content)

    // Merge rule-based and AI-detected format issues (Story 4.6)
    const allFormatIssues = mergeFormatIssues(ruleBasedFormatIssues, aiDetectedFormatIssues)

    console.log('[runAnalysis] Format issues detected', {
      scanId: parsed.data.scanId,
      ruleBasedCount: ruleBasedFormatIssues.length,
      aiDetectedCount: aiDetectedFormatIssues.length,
      totalAfterMerge: allFormatIssues.length,
    })

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

    // Update scan record with analysis results (includes format_issues from Story 4.6, score_breakdown from Story 9.1)
    const { error: updateError } = await supabase
      .from('scans')
      .update({
        ats_score: analysisResult.overallScore,
        score_justification: analysisResult.justification,
        score_breakdown: analysisResult.scoreBreakdown as unknown as Record<string, unknown>, // Story 9.1
        keywords_found: keywordAnalysis.keywordsFound as unknown as Record<string, unknown>,
        keywords_missing: keywordAnalysis.keywordsMissing as unknown as Record<string, unknown>,
        section_scores: sectionScoresResult.sectionScores as unknown as Record<string, unknown>,
        experience_level_context: experienceContext, // Store context used for analysis (Story 4.5 AC 10)
        format_issues: allFormatIssues as unknown as Record<string, unknown>, // Store format issues (Story 4.6 AC 9)
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
      formatIssuesCount: allFormatIssues.length,
      tokensUsed: parsedResponse.usage.totalTokens,
      costEstimate: parsedResponse.costEstimate,
    })

    // Include keyword analysis, section scores, format issues, and experience context in returned result
    const fullAnalysisResult: AnalysisResult = {
      ...analysisResult,
      keywords: keywordAnalysis,
      sectionScores: sectionScoresResult.sectionScores,
      experienceLevelContext: experienceContext, // Include context in result (Story 4.5 AC 10)
      formatIssues: allFormatIssues, // Include format issues in result (Story 4.6 AC 9)
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
