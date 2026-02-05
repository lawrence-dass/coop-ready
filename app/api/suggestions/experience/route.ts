/**
 * Experience Suggestions API Route
 * Story 6.4: Generate optimized experience section suggestions
 *
 * POST /api/suggestions/experience
 *
 * **Features:**
 * - Generates optimized experience bullets with keyword alignment and quantification
 * - 60-second timeout with graceful handling
 * - ActionResponse pattern (never throws)
 * - Session persistence
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ActionResponse, OptimizationPreferences } from '@/types';
import type { ExperienceSuggestion } from '@/types/suggestions';
import type { SuggestionContext } from '@/types/judge';
import { generateExperienceSuggestion } from '@/lib/ai/generateExperienceSuggestion';
import { judgeSuggestion } from '@/lib/ai/judgeSuggestion';
import { updateSession, getSessionForAPI } from '@/lib/supabase/sessions';
import { withTimeout } from '@/lib/utils/withTimeout';
import { collectQualityMetrics } from '@/lib/metrics/qualityMetrics';
import { logQualityMetrics } from '@/lib/metrics/metricsLogger';
import { truncateAtSentence } from '@/lib/utils/truncateAtSentence';
import { logJudgeBatchTrace } from '@/lib/metrics/judgeTrace';
import type { JudgeResult } from '@/types/judge';
import { buildSectionATSContext, type SectionATSContext } from '@/lib/ai/buildSectionATSContext';
import type { ATSScoreV21 } from '@/lib/scoring/types';

// ============================================================================
// TYPES
// ============================================================================

interface ExperienceSuggestionRequest {
  session_id: string;
  anonymous_id: string;
  resume_content: string;
  jd_content: string;
  current_experience: string;
  preferences?: OptimizationPreferences | null; // Optional: user preferences (Story 11.2)
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TIMEOUT_MS = 60000; // 60 seconds

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if ATS score is V21 format
 */
function isATSScoreV21(score: unknown): score is ATSScoreV21 {
  return (
    score !== null &&
    typeof score === 'object' &&
    'metadata' in score &&
    (score as { metadata?: { version?: string } }).metadata?.version === 'v2.1'
  );
}

/**
 * Build ATS context for experience section if available
 */
async function buildATSContextForSection(
  sessionId: string,
  anonymousId: string,
  resumeText: string
): Promise<SectionATSContext | undefined> {
  try {
    const sessionResult = await getSessionForAPI(sessionId, anonymousId);
    if (!sessionResult || sessionResult.error || !sessionResult.data) {
      console.log('[SS:exp] Could not fetch session for ATS context');
      return undefined;
    }

    const session = sessionResult.data;
    const atsScore = session.atsScore;
    const keywordAnalysis = session.keywordAnalysis;

    if (!atsScore || !keywordAnalysis) {
      console.log('[SS:exp] No ATS score or keyword analysis in session');
      return undefined;
    }

    if (!isATSScoreV21(atsScore)) {
      console.log('[SS:exp] ATS score is not V21 format, skipping context');
      return undefined;
    }

    console.log('[SS:exp] Building ATS context for experience section');
    return buildSectionATSContext('experience', {
      atsScore,
      keywordAnalysis,
      resumeText,
    });
  } catch (error) {
    console.error('[SS:exp] Error building ATS context:', error);
    return undefined;
  }
}

/**
 * Validate request body
 */
function validateRequest(
  body: unknown
): ActionResponse<ExperienceSuggestionRequest> {
  const req = body as Partial<ExperienceSuggestionRequest>;

  if (!req.session_id || req.session_id.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Session ID is required',
      },
    };
  }

  if (!req.anonymous_id || req.anonymous_id.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Anonymous ID is required',
      },
    };
  }

  if (!req.resume_content || req.resume_content.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Resume content is required',
      },
    };
  }

  if (!req.jd_content || req.jd_content.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Job description is required',
      },
    };
  }

  if (!req.current_experience || req.current_experience.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Current experience section is required',
      },
    };
  }

  return {
    data: req as ExperienceSuggestionRequest,
    error: null,
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * Generate experience suggestion
 *
 * @param request - Validated request data
 * @returns ActionResponse with suggestion or error
 */
async function runSuggestionGeneration(
  request: ExperienceSuggestionRequest
): Promise<ActionResponse<ExperienceSuggestion>> {
  try {
  // Build ATS context for consistency with analysis (graceful degradation if unavailable)
  const atsContext = await buildATSContextForSection(
    request.session_id,
    request.anonymous_id,
    request.resume_content
  );

  // Generate suggestion using LLM (Story 11.2: pass preferences)
  // Note: generateExperienceSuggestion never throws - it returns ActionResponse
  // Pass ATS context for gap-aware suggestions
  const suggestionResult = await generateExperienceSuggestion(
    request.current_experience,
    request.jd_content,
    request.resume_content,
    request.preferences,
    undefined, // userContext
    undefined, // resumeEducation
    atsContext
  );

  if (suggestionResult.error) {
    return suggestionResult;
  }

  const suggestion = suggestionResult.data;

  // Story 12.1: Judge each experience bullet suggestion in parallel
  const bulletJudgePromises: {
    entryIndex: number;
    bulletIndex: number;
    promise: ReturnType<typeof judgeSuggestion>;
  }[] = [];

  suggestion.experience_entries.forEach((entry, entryIndex) => {
    entry.suggested_bullets.forEach((bullet, bulletIndex) => {
      const judgeContext: SuggestionContext = {
        original_text: bullet.original,
        suggested_text: bullet.suggested,
        jd_excerpt: truncateAtSentence(request.jd_content, 500),
        section_type: 'experience',
      };

      bulletJudgePromises.push({
        entryIndex,
        bulletIndex,
        promise: judgeSuggestion(
          bullet.suggested,
          judgeContext,
          `bullet-${bullet.original.substring(0, 15)}`
        ),
      });
    });
  });

  const bulletJudgeResults = await Promise.allSettled(
    bulletJudgePromises.map((p) => p.promise)
  );

  const allJudgeResults: JudgeResult[] = [];

  bulletJudgeResults.forEach((result, i) => {
    if (result.status === 'fulfilled' && result.value.data) {
      const { entryIndex, bulletIndex } = bulletJudgePromises[i];
      const bullet =
        suggestion.experience_entries[entryIndex].suggested_bullets[bulletIndex];
      bullet.judge_score = result.value.data.quality_score;
      bullet.judge_passed = result.value.data.passed;
      bullet.judge_reasoning = result.value.data.reasoning;
      bullet.judge_criteria = result.value.data.criteria_breakdown;

      console.log(
        `[SS:exp] Bullet scored ${result.value.data.quality_score}/100 (${result.value.data.passed ? 'PASS' : 'FAIL'})`
      );

      // Collect for metrics
      allJudgeResults.push(result.value.data);
    }
  });

  // Story 12.2: Batch trace logging + collect and log quality metrics
  logJudgeBatchTrace(allJudgeResults, 'experience');
  if (allJudgeResults.length > 0) {
    try {
      const metrics = collectQualityMetrics(
        allJudgeResults,
        'experience',
        request.session_id
      );
      await logQualityMetrics(metrics);
    } catch (metricsError) {
      console.error('[SS:exp] Metrics collection failed:', metricsError);
    }
  }

  // Save to session (graceful degradation - don't fail if session update fails)
  const sessionUpdateResult = await updateSession(request.session_id, {
    experienceSuggestion: suggestion,
  });

  if (sessionUpdateResult.error) {
    console.error(
      '[experience-suggestion] Session update failed:',
      sessionUpdateResult.error
    );
    // Continue anyway - user still gets the suggestion
  }

  return {
    data: suggestion,
    error: null,
  };
  } catch (error) {
    // Re-throw timeout errors so the outer handler returns LLM_TIMEOUT
    if (error instanceof Error && error.message.includes('TIMEOUT')) {
      throw error;
    }
    console.error('[experience-suggestion] Generation error:', error);
    return {
      data: null,
      error: {
        code: 'LLM_ERROR',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to generate experience suggestion',
      },
    };
  }
}

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * POST /api/suggestions/experience
 *
 * Generates optimized experience suggestion with timeout enforcement.
 * Always returns JSON with ActionResponse pattern.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid JSON in request body',
          },
        } satisfies ActionResponse<ExperienceSuggestion>,
        { status: 200 }
      );
    }

    // Validate input
    const validation = validateRequest(body);
    if (validation.error) {
      return NextResponse.json(validation, { status: 200 });
    }

    // Run generation with 60-second timeout
    const result = await withTimeout(
      runSuggestionGeneration(validation.data),
      TIMEOUT_MS,
      'Experience suggestion generation exceeded 60 second timeout'
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // Handle timeout
    if (error instanceof Error && error.message.includes('TIMEOUT')) {
      const timeoutResponse: ActionResponse<ExperienceSuggestion> = {
        data: null,
        error: {
          code: 'LLM_TIMEOUT',
          message:
            'Experience generation timed out after 60 seconds. Please try again.',
        },
      };
      return NextResponse.json(timeoutResponse, { status: 200 });
    }

    // Handle other errors
    const errorResponse: ActionResponse<ExperienceSuggestion> = {
      data: null,
      error: {
        code: 'LLM_ERROR',
        message:
          error instanceof Error
            ? error.message
            : 'An unexpected error occurred',
      },
    };
    return NextResponse.json(errorResponse, { status: 200 });
  }
}

/**
 * Return 405 for non-POST requests (ActionResponse pattern)
 */
function methodNotAllowed() {
  return NextResponse.json(
    {
      data: null,
      error: { code: 'VALIDATION_ERROR', message: 'Method not allowed' },
    } satisfies ActionResponse<ExperienceSuggestion>,
    { status: 405 }
  );
}

export async function GET() {
  return methodNotAllowed();
}
export async function PUT() {
  return methodNotAllowed();
}
export async function DELETE() {
  return methodNotAllowed();
}
