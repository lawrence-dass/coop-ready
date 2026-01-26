/**
 * Optimization API Route
 * Story 6.1: Implement LLM Pipeline API Route
 *
 * Orchestrates the LLM optimization pipeline:
 * 1. Extract keywords from job description
 * 2. Match keywords against resume
 * 3. Calculate ATS score
 * 4. Save results to session
 *
 * **Features:**
 * - 60-second timeout with graceful handling
 * - ActionResponse pattern (never throws)
 * - Prompt injection defense (delegated to AI functions)
 * - Session persistence
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ActionResponse } from '@/types';
import type { KeywordAnalysisResult, ATSScore } from '@/types/analysis';
import type { Resume } from '@/types/optimization';
import { extractKeywords } from '@/lib/ai/extractKeywords';
import { matchKeywords } from '@/lib/ai/matchKeywords';
import { calculateATSScore } from '@/lib/ai/calculateATSScore';
import { updateSession } from '@/lib/supabase/sessions';
import { withTimeout } from '@/lib/utils/withTimeout';

// ============================================================================
// TYPES
// ============================================================================

interface OptimizeRequest {
  resume_content: string;
  jd_content: string;
  session_id: string;
  anonymous_id: string;
}

interface OptimizationResult {
  keywordAnalysis: KeywordAnalysisResult;
  atsScore: ATSScore;
  sessionId: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TIMEOUT_MS = 60000; // 60 seconds

/**
 * Extract basic resume sections using simple heuristics.
 * Full section parsing is handled by Epic 3.5.
 * Returns undefined for sections not found to avoid inflating section coverage score.
 */
function extractBasicSections(rawText: string): Partial<Pick<Resume, 'summary' | 'skills' | 'experience'>> {
  const lower = rawText.toLowerCase();
  const sections: Partial<Pick<Resume, 'summary' | 'skills' | 'experience'>> = {};

  if (lower.includes('summary') || lower.includes('objective') || lower.includes('profile')) {
    sections.summary = rawText;
  }
  if (lower.includes('skill') || lower.includes('technologies') || lower.includes('technical')) {
    sections.skills = rawText;
  }
  if (lower.includes('experience') || lower.includes('employment') || lower.includes('work history')) {
    sections.experience = rawText;
  }

  return sections;
}

/**
 * Validate request body
 */
function validateRequest(body: unknown): ActionResponse<OptimizeRequest> {
  const req = body as Partial<OptimizeRequest>;

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

  return {
    data: req as OptimizeRequest,
    error: null,
  };
}

// ============================================================================
// MAIN PIPELINE
// ============================================================================

/**
 * Orchestrate the LLM optimization pipeline
 *
 * Pipeline steps:
 * 1. Extract keywords from JD
 * 2. Match keywords in resume
 * 3. Calculate ATS score
 * 4. Save to session
 *
 * @param request - Validated request data
 * @returns ActionResponse with optimization results
 */
async function runOptimizationPipeline(
  request: OptimizeRequest
): Promise<ActionResponse<OptimizationResult>> {
  try {
    // Step 1: Extract keywords from job description
    // Note: prompt injection defense (XML wrapping) is handled by extractKeywords/matchKeywords
    const keywordResult = await extractKeywords(request.jd_content);

    if (keywordResult.error) {
      return {
        data: null,
        error: keywordResult.error,
      };
    }

    // Step 2: Match keywords in resume
    const matchResult = await matchKeywords(
      request.resume_content,
      keywordResult.data.keywords
    );

    if (matchResult.error) {
      return {
        data: null,
        error: matchResult.error,
      };
    }

    // Step 3: Calculate ATS score
    // Basic section extraction - full parsing handled by Epic 3.5
    const parsedResume: Resume = {
      rawText: request.resume_content,
      ...extractBasicSections(request.resume_content),
    };

    const scoreResult = await calculateATSScore(
      matchResult.data,
      parsedResume,
      request.jd_content
    );

    if (scoreResult.error) {
      return {
        data: null,
        error: scoreResult.error,
      };
    }

    // Step 4: Save results to session
    const sessionUpdateResult = await updateSession(request.session_id, {
      keywordAnalysis: matchResult.data,
      atsScore: scoreResult.data,
    });

    // Log session update errors but don't fail the request
    if (sessionUpdateResult.error) {
      console.error('[optimize] Session update failed:', sessionUpdateResult.error);
    }

    // Return results
    return {
      data: {
        keywordAnalysis: matchResult.data,
        atsScore: scoreResult.data,
        sessionId: request.session_id,
      },
      error: null,
    };
  } catch (error) {
    console.error('[optimize] Pipeline error:', error);
    return {
      data: null,
      error: {
        code: 'LLM_ERROR',
        message: error instanceof Error ? error.message : 'Optimization pipeline failed',
      },
    };
  }
}

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

/**
 * POST /api/optimize
 *
 * Runs the optimization pipeline with timeout enforcement.
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
        } satisfies ActionResponse<OptimizationResult>,
        { status: 200 }
      );
    }

    // Validate input
    const validation = validateRequest(body);
    if (validation.error) {
      return NextResponse.json(validation, { status: 200 });
    }

    // Run pipeline with 60-second timeout
    const result = await withTimeout(
      runOptimizationPipeline(validation.data),
      TIMEOUT_MS,
      'Optimization pipeline exceeded 60 second timeout'
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // Handle timeout
    if (error instanceof Error && error.message.includes('TIMEOUT')) {
      const timeoutResponse: ActionResponse<OptimizationResult> = {
        data: null,
        error: {
          code: 'LLM_TIMEOUT',
          message: 'Optimization timed out after 60 seconds. Please try again.',
        },
      };
      return NextResponse.json(timeoutResponse, { status: 200 });
    }

    // Handle other errors
    const errorResponse: ActionResponse<OptimizationResult> = {
      data: null,
      error: {
        code: 'LLM_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
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
    } satisfies ActionResponse<OptimizationResult>,
    { status: 405 }
  );
}

export async function GET() { return methodNotAllowed(); }
export async function PUT() { return methodNotAllowed(); }
export async function DELETE() { return methodNotAllowed(); }
