/**
 * Summary Suggestions API Route
 * Story 6.2: Generate optimized professional summary suggestions
 *
 * POST /api/suggestions/summary
 *
 * **Features:**
 * - Generates optimized summary with keyword integration
 * - 60-second timeout with graceful handling
 * - ActionResponse pattern (never throws)
 * - Session persistence
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ActionResponse, OptimizationPreferences } from '@/types';
import type { SummarySuggestion } from '@/types/suggestions';
import { generateSummarySuggestion } from '@/lib/ai/generateSummarySuggestion';
import { updateSession } from '@/lib/supabase/sessions';
import { withTimeout } from '@/lib/utils/withTimeout';

// ============================================================================
// TYPES
// ============================================================================

interface SummarySuggestionRequest {
  session_id: string;
  anonymous_id: string;
  resume_content: string;
  jd_content: string;
  current_summary: string;
  keywords?: string[]; // Optional: pre-extracted keywords for context
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
): ActionResponse<SummarySuggestionRequest> {
  const req = body as Partial<SummarySuggestionRequest>;

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

  if (!req.current_summary || req.current_summary.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Current summary is required',
      },
    };
  }

  return {
    data: req as SummarySuggestionRequest,
    error: null,
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

/**
 * Generate summary suggestion
 *
 * @param request - Validated request data
 * @returns ActionResponse with suggestion or error
 */
async function runSuggestionGeneration(
  request: SummarySuggestionRequest
): Promise<ActionResponse<SummarySuggestion>> {
  try {
    // Generate suggestion using LLM (Story 11.2: pass preferences)
    const suggestionResult = await generateSummarySuggestion(
      request.current_summary,
      request.jd_content,
      request.keywords,
      request.preferences
    );

    if (suggestionResult.error) {
      return suggestionResult;
    }

    // Save to session (graceful degradation - don't fail if session update fails)
    const sessionUpdateResult = await updateSession(request.session_id, {
      summarySuggestion: suggestionResult.data,
    });

    if (sessionUpdateResult.error) {
      console.error(
        '[summary-suggestion] Session update failed:',
        sessionUpdateResult.error
      );
      // Continue anyway - user still gets the suggestion
    }

    return suggestionResult;
  } catch (error) {
    console.error('[summary-suggestion] Generation error:', error);
    return {
      data: null,
      error: {
        code: 'LLM_ERROR',
        message:
          error instanceof Error
            ? error.message
            : 'Failed to generate summary suggestion',
      },
    };
  }
}

// ============================================================================
// API ROUTE HANDLERS
// ============================================================================

/**
 * POST /api/suggestions/summary
 *
 * Generates optimized summary suggestion with timeout enforcement.
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
        } satisfies ActionResponse<SummarySuggestion>,
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
      'Summary suggestion generation exceeded 60 second timeout'
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // Handle timeout
    if (error instanceof Error && error.message.includes('TIMEOUT')) {
      const timeoutResponse: ActionResponse<SummarySuggestion> = {
        data: null,
        error: {
          code: 'LLM_TIMEOUT',
          message:
            'Summary generation timed out after 60 seconds. Please try again.',
        },
      };
      return NextResponse.json(timeoutResponse, { status: 200 });
    }

    // Handle other errors
    const errorResponse: ActionResponse<SummarySuggestion> = {
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
    } satisfies ActionResponse<SummarySuggestion>,
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
