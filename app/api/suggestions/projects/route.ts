/**
 * Projects Suggestions API Route
 * Story 18.5: Generate optimized projects section suggestions
 *
 * POST /api/suggestions/projects
 *
 * **Features:**
 * - Generates optimized project bullets with keyword alignment and quantification
 * - 60-second timeout with graceful handling
 * - ActionResponse pattern (never throws)
 * - Session persistence
 * - Candidate-type-aware framing
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ActionResponse, OptimizationPreferences } from '@/types';
import type { ProjectsSuggestion } from '@/types/suggestions';
import type { SuggestionContext } from '@/types/judge';
import { generateProjectsSuggestion } from '@/lib/ai/generateProjectsSuggestion';
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

interface ProjectsSuggestionRequest {
  session_id: string;
  anonymous_id: string;
  resume_content: string;
  jd_content: string;
  current_projects: string;
  preferences?: OptimizationPreferences | null; // Optional: user preferences
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
 * Build ATS context for projects section if available
 * Note: gapAddressability doesn't support 'projects' yet (Story 18.9), so this will return undefined
 */
async function buildATSContextForSection(
  sessionId: string,
  anonymousId: string,
  resumeText: string
): Promise<SectionATSContext | undefined> {
  try {
    const sessionResult = await getSessionForAPI(sessionId, anonymousId);
    if (!sessionResult || sessionResult.error || !sessionResult.data) {
      console.log('[SS:projects] Could not fetch session for ATS context');
      return undefined;
    }

    const session = sessionResult.data;
    const atsScore = session.atsScore;
    const keywordAnalysis = session.keywordAnalysis;

    if (!atsScore || !keywordAnalysis) {
      console.log('[SS:projects] No ATS score or keyword analysis in session');
      return undefined;
    }

    if (!isATSScoreV21(atsScore)) {
      console.log('[SS:projects] ATS score is not V21 format, skipping context');
      return undefined;
    }

    // Story 18.5: gapAddressability.SectionType doesn't include 'projects' yet
    // This will be wired in Story 18.9
    console.log('[SS:projects] ATS context for projects not yet implemented (Story 18.9)');
    return undefined;
  } catch (error) {
    console.error('[SS:projects] Error building ATS context:', error);
    return undefined;
  }
}

/**
 * Validate request body
 */
function validateRequest(
  body: unknown
): ActionResponse<ProjectsSuggestionRequest> {
  const req = body as Partial<ProjectsSuggestionRequest>;

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

  if (!req.current_projects || req.current_projects.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Current projects section is required',
      },
    };
  }

  return {
    data: req as ProjectsSuggestionRequest,
    error: null,
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * Generate projects suggestion
 *
 * @param request - Validated request data
 * @returns ActionResponse with suggestion or error
 */
async function runSuggestionGeneration(
  request: ProjectsSuggestionRequest
): Promise<ActionResponse<ProjectsSuggestion>> {
  try {
    // Build ATS context for consistency with analysis (graceful degradation if unavailable)
    const atsContext = await buildATSContextForSection(
      request.session_id,
      request.anonymous_id,
      request.resume_content
    );

    // Generate suggestion using LLM (pass preferences and ATS context)
    // Note: generateProjectsSuggestion never throws - it returns ActionResponse
    const suggestionResult = await generateProjectsSuggestion(
      request.current_projects,
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

    // Story 12.1: Judge each project bullet suggestion in parallel
    const bulletJudgePromises: {
      entryIndex: number;
      bulletIndex: number;
      promise: ReturnType<typeof judgeSuggestion>;
    }[] = [];

    suggestion.project_entries.forEach((entry, entryIndex) => {
      entry.suggested_bullets.forEach((bullet, bulletIndex) => {
        const judgeContext: SuggestionContext = {
          original_text: bullet.original,
          suggested_text: bullet.suggested,
          jd_excerpt: truncateAtSentence(request.jd_content, 500),
          section_type: 'projects',
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
          suggestion.project_entries[entryIndex].suggested_bullets[bulletIndex];
        bullet.judge_score = result.value.data.quality_score;
        bullet.judge_passed = result.value.data.passed;
        bullet.judge_reasoning = result.value.data.reasoning;
        bullet.judge_criteria = result.value.data.criteria_breakdown;

        console.log(
          `[SS:projects] Bullet scored ${result.value.data.quality_score}/100 (${result.value.data.passed ? 'PASS' : 'FAIL'})`
        );

        // Collect for metrics
        allJudgeResults.push(result.value.data);
      }
    });

    // Story 12.2: Batch trace logging + collect and log quality metrics
    logJudgeBatchTrace(allJudgeResults, 'projects');
    if (allJudgeResults.length > 0) {
      try {
        const metrics = collectQualityMetrics(
          allJudgeResults,
          'projects',
          request.session_id
        );
        await logQualityMetrics(metrics);
      } catch (metricsError) {
        console.error('[SS:projects] Metrics collection failed:', metricsError);
      }
    }

    // Story 18.5: Save to session (graceful fail if projects_suggestion column doesn't exist yet)
    // The column is added in Story 18.7 migration
    // TODO Story 18.7: Uncomment when projectsSuggestion is added to updateSession types
    // const sessionUpdateResult = await updateSession(request.session_id, {
    //   projectsSuggestion: suggestion,
    // });
    // if (sessionUpdateResult.error) {
    //   console.error('[projects-suggestion] Session update failed:', sessionUpdateResult.error);
    // }
    console.log('[SS:projects] Session update skipped - column added in Story 18.7');

    return {
      data: suggestion,
      error: null,
    };
  } catch (error) {
    // Re-throw timeout errors so the outer handler returns LLM_TIMEOUT
    if (error instanceof Error && error.message.includes('TIMEOUT')) {
      throw error;
    }

    // Unexpected error
    console.error('[SS:projects] Unexpected error:', error);
    return {
      data: null,
      error: {
        code: 'LLM_ERROR',
        message: 'Failed to generate projects suggestion',
      },
    };
  }
}

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * POST /api/suggestions/projects
 * Generate optimized projects suggestion
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate request
    const validation = validateRequest(body);
    if (validation.error) {
      return NextResponse.json(validation, { status: 400 });
    }

    // Run with timeout
    const result = await withTimeout(
      runSuggestionGeneration(validation.data),
      TIMEOUT_MS,
      'Projects suggestion generation timed out after 60 seconds'
    );

    if (result.error) {
      const statusCode = result.error.code === 'LLM_TIMEOUT' ? 504 : 500;
      return NextResponse.json(result, { status: statusCode });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('[projects-suggestion] Unexpected error:', error);
    const errorResponse: ActionResponse<never> = {
      data: null,
      error: {
        code: 'LLM_ERROR',
        message: 'Failed to generate projects suggestion',
      },
    };
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

/**
 * GET /api/suggestions/projects
 * Not supported - return 405
 */
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}

/**
 * PUT /api/suggestions/projects
 * Not supported - return 405
 */
export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}

/**
 * DELETE /api/suggestions/projects
 * Not supported - return 405
 */
export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}
