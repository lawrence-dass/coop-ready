/**
 * Skills Suggestions API Route
 * Story 6.3: Generate optimized skills section suggestions
 *
 * POST /api/suggestions/skills
 *
 * **Features:**
 * - Generates optimized skills with keyword alignment
 * - 60-second timeout with graceful handling
 * - ActionResponse pattern (never throws)
 * - Session persistence
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ActionResponse, OptimizationPreferences } from '@/types';
import type { SkillsSuggestion } from '@/types/suggestions';
import type { SuggestionContext, JudgeResult } from '@/types/judge';
import { generateSkillsSuggestion } from '@/lib/ai/generateSkillsSuggestion';
import { judgeSuggestion } from '@/lib/ai/judgeSuggestion';
import { updateSession } from '@/lib/supabase/sessions';
import { withTimeout } from '@/lib/utils/withTimeout';
import { collectQualityMetrics } from '@/lib/metrics/qualityMetrics';
import { logQualityMetrics } from '@/lib/metrics/metricsLogger';
import { truncateAtSentence } from '@/lib/utils/truncateAtSentence';
import { logJudgeBatchTrace } from '@/lib/metrics/judgeTrace';

// ============================================================================
// TYPES
// ============================================================================

interface SkillsSuggestionRequest {
  session_id: string;
  anonymous_id: string;
  resume_content: string;
  jd_content: string;
  current_skills: string;
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
 * Validate request body
 */
function validateRequest(
  body: unknown
): ActionResponse<SkillsSuggestionRequest> {
  const req = body as Partial<SkillsSuggestionRequest>;

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

  if (!req.current_skills || req.current_skills.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Current skills section is required',
      },
    };
  }

  return {
    data: req as SkillsSuggestionRequest,
    error: null,
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * Generate skills suggestion
 *
 * @param request - Validated request data
 * @returns ActionResponse with suggestion or error
 */
async function runSuggestionGeneration(
  request: SkillsSuggestionRequest
): Promise<ActionResponse<SkillsSuggestion>> {
  try {
    // Generate suggestion using LLM (Story 11.2: pass preferences)
    const suggestionResult = await generateSkillsSuggestion(
      request.current_skills,
      request.jd_content,
      request.resume_content,
      request.preferences
    );

    if (suggestionResult.error) {
      return suggestionResult;
    }

    // Story 12.1: Judge the skills suggestion quality
    // For skills, we judge the overall recommendation (additions/removals)
    const suggestion = suggestionResult.data;
    const suggestedText = `Add: ${suggestion.skill_additions.join(', ')}. Remove: ${suggestion.skill_removals.map(s => s.skill).join(', ')}.`;

    const judgeContext: SuggestionContext = {
      original_text: request.current_skills,
      suggested_text: suggestedText,
      jd_excerpt: truncateAtSentence(request.jd_content, 500),
      section_type: 'skills',
    };

    const judgeResult = await judgeSuggestion(
      suggestedText,
      judgeContext,
      `skills-${request.session_id.substring(0, 8)}`
    );

    const allJudgeResults: JudgeResult[] = [];
    if (judgeResult.data) {
      allJudgeResults.push(judgeResult.data);
    }

    // Judge each added skill item in parallel (avoid sequential N+1 calls)
    if (judgeResult.data && suggestion.missing_but_relevant) {
      const skillJudgePromises = suggestion.missing_but_relevant.map(
        (skillItem) => {
          const skillJudgeContext: SuggestionContext = {
            original_text: request.current_skills,
            suggested_text: `Add skill: ${skillItem.skill}. Reason: ${skillItem.reason || 'Relevant to JD'}`,
            jd_excerpt: truncateAtSentence(request.jd_content, 500),
            section_type: 'skills',
          };

          return judgeSuggestion(
            `${skillItem.skill}: ${skillItem.reason || ''}`,
            skillJudgeContext,
            `skill-${skillItem.skill.substring(0, 10)}`
          );
        }
      );

      const skillJudgeResults = await Promise.allSettled(skillJudgePromises);

      skillJudgeResults.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.data) {
          const skillItem = suggestion.missing_but_relevant[index];
          skillItem.judge_score = result.value.data.quality_score;
          skillItem.judge_passed = result.value.data.passed;
          skillItem.judge_reasoning = result.value.data.reasoning;
          skillItem.judge_criteria = result.value.data.criteria_breakdown;

          // Collect for metrics
          allJudgeResults.push(result.value.data);
        }
      });
    }

    // Story 12.2: Batch trace logging + collect and log quality metrics
    logJudgeBatchTrace(allJudgeResults, 'skills');
    if (allJudgeResults.length > 0) {
      console.log(
        `[SS:skills] Judge scored ${judgeResult.data?.quality_score}/100 (${judgeResult.data?.passed ? 'PASS' : 'FAIL'}) + ${allJudgeResults.length - (judgeResult.data ? 1 : 0)} skill items`
      );
      try {
        const metrics = collectQualityMetrics(
          allJudgeResults,
          'skills',
          request.session_id
        );
        await logQualityMetrics(metrics);
      } catch (metricsError) {
        console.error('[SS:skills] Metrics collection failed:', metricsError);
      }
    }

    // Save to session (graceful degradation - don't fail if session update fails)
    const sessionUpdateResult = await updateSession(request.session_id, {
      skillsSuggestion: suggestion,
    });

    if (sessionUpdateResult.error) {
      console.error(
        '[skills-suggestion] Session update failed:',
        sessionUpdateResult.error
      );
      // Continue anyway - user still gets the suggestion
    }

    return {
      data: suggestion,
      error: null,
    };
  } catch (error) {
    console.error('[skills-suggestion] Generation error:', error);
    return {
      data: null,
      error: {
        code: 'LLM_ERROR',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to generate skills suggestion',
      },
    };
  }
}

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * POST /api/suggestions/skills
 *
 * Generates optimized skills suggestion with timeout enforcement.
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
        } satisfies ActionResponse<SkillsSuggestion>,
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
      'Skills suggestion generation exceeded 60 second timeout'
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // Handle timeout
    if (error instanceof Error && error.message.includes('TIMEOUT')) {
      const timeoutResponse: ActionResponse<SkillsSuggestion> = {
        data: null,
        error: {
          code: 'LLM_TIMEOUT',
          message:
            'Skills generation timed out after 60 seconds. Please try again.',
        },
      };
      return NextResponse.json(timeoutResponse, { status: 200 });
    }

    // Handle other errors
    const errorResponse: ActionResponse<SkillsSuggestion> = {
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
    } satisfies ActionResponse<SkillsSuggestion>,
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
