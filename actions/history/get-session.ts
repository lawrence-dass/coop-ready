/**
 * Get Optimization Session by ID
 *
 * Server action to fetch a single optimization session for viewing details.
 * Includes user authorization check to ensure users can only access their own sessions.
 *
 * Story 10-2: Implement Session Reload
 * AC #1, #2, #6, #7
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import { getSessionById } from '@/lib/supabase/sessions';
import { ERROR_CODES } from '@/types';
import type { ActionResponse, OptimizationSession } from '@/types';

/**
 * Fetches a single optimization session by ID
 *
 * **Authorization:** Verifies the requesting user owns the session.
 *
 * **Performance:** Should complete within 2 seconds (AC #6).
 *
 * @param sessionId - UUID of the session to fetch
 * @returns ActionResponse with session data or error
 *
 * @example
 * ```typescript
 * const { data, error } = await getOptimizationSession(sessionId);
 * if (error) {
 *   toast.error(error.message);
 *   return;
 * }
 * // Display session data
 * ```
 */
export async function getOptimizationSession(
  sessionId: string
): Promise<ActionResponse<OptimizationSession>> {
  try {
    // Validate session ID format (UUID)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(sessionId)) {
      return {
        data: null,
        error: {
          message: 'Invalid session ID format',
          code: ERROR_CODES.VALIDATION_ERROR,
        },
      };
    }

    // Get authenticated user
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: {
          message: 'You must be logged in to view session history',
          code: ERROR_CODES.UNAUTHORIZED,
        },
      };
    }

    // Fetch session with user authorization check
    const { data: session, error: dbError } = await getSessionById(
      sessionId,
      user.id
    );

    if (dbError) {
      return {
        data: null,
        error: dbError,
      };
    }

    // Session not found or user doesn't own it
    if (!session) {
      return {
        data: null,
        error: {
          message: 'Session not found or you do not have access to it',
          code: ERROR_CODES.SESSION_NOT_FOUND,
        },
      };
    }

    return {
      data: session,
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: {
        message:
          err instanceof Error
            ? err.message
            : 'Failed to fetch session details',
        code: ERROR_CODES.GET_SESSION_ERROR,
      },
    };
  }
}
