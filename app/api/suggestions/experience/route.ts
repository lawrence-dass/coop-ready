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
import type { ActionResponse } from '@/types';
import type { ExperienceSuggestion } from '@/types/suggestions';
import { generateExperienceSuggestion } from '@/lib/ai/generateExperienceSuggestion';
import { updateSession } from '@/lib/supabase/sessions';
import { withTimeout } from '@/lib/utils/withTimeout';

// ============================================================================
// TYPES
// ============================================================================

interface ExperienceSuggestionRequest {
  session_id: string;
  anonymous_id: string;
  resume_content: string;
  jd_content: string;
  current_experience: string;
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
  // Generate suggestion using LLM
  // Note: generateExperienceSuggestion never throws - it returns ActionResponse
  const suggestionResult = await generateExperienceSuggestion(
    request.current_experience,
    request.jd_content,
    request.resume_content
  );

  if (suggestionResult.error) {
    return suggestionResult;
  }

  // Save to session (graceful degradation - don't fail if session update fails)
  const sessionUpdateResult = await updateSession(request.session_id, {
    experienceSuggestion: suggestionResult.data,
  });

  if (sessionUpdateResult.error) {
    console.error(
      '[experience-suggestion] Session update failed:',
      sessionUpdateResult.error
    );
    // Continue anyway - user still gets the suggestion
  }

  return suggestionResult;
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
