'use server';

/**
 * Create Scan Session Server Action
 *
 * Story 16.3 - Creates a new session in the database for a scan operation.
 *
 * This action:
 * 1. Gets the current authenticated user
 * 2. Creates a new session record with resume and JD content
 * 3. Returns the session ID and anonymous ID for the /api/optimize call
 *
 * **Security:**
 * - Requires authentication (dashboard is protected)
 * - User ID is set from auth.uid() for RLS compliance
 */

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

interface CreateSessionInput {
  resumeContent: string;
  jobDescription: string;
}

interface CreateSessionResult {
  sessionId: string;
  anonymousId: string;
}

// ============================================================================
// SERVER ACTION
// ============================================================================

/**
 * Creates a new scan session in the database
 *
 * @param input - Resume content and job description
 * @returns ActionResponse with session ID and anonymous ID
 */
export async function createScanSession(
  input: CreateSessionInput
): Promise<ActionResponse<CreateSessionResult>> {
  try {
    const supabase = await createClient();

    // Get current authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'You must be logged in to create a scan session',
        },
      };
    }

    // For authenticated users, user_id = auth.uid()
    // anonymous_id is also set to auth.uid() for RLS compatibility
    const userId = user.id;
    const anonymousId = user.id;

    // Create session in database
    const { data: session, error: insertError } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        anonymous_id: anonymousId,
        resume_content: JSON.stringify({ rawText: input.resumeContent }),
        jd_content: JSON.stringify(input.jobDescription),
      })
      .select('id')
      .single();

    if (insertError) {
      console.error('[createScanSession] Insert error:', insertError);
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: `Failed to create session: ${insertError.message}`,
        },
      };
    }

    return {
      data: {
        sessionId: session.id,
        anonymousId: anonymousId,
      },
      error: null,
    };
  } catch (error) {
    console.error('[createScanSession] Unexpected error:', error);
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to create session',
      },
    };
  }
}
