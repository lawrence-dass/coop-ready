/**
 * Delete Optimization Session Server Action
 *
 * Permanently deletes an optimization session from the user's history.
 * Follows the ActionResponse pattern - NEVER throws errors.
 *
 * Story 10.3: Implement History Deletion
 *
 * **Security:**
 * - RLS policies ensure users can only delete their own sessions
 * - Validates authentication before attempting deletion
 * - Gracefully handles unauthorized access attempts
 *
 * @example
 * ```typescript
 * const { data, error } = await deleteOptimizationSession(sessionId);
 * if (error) {
 *   toast.error(error.message);
 *   return;
 * }
 * toast.success('Session deleted successfully');
 * ```
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse } from '@/types';
import { ERROR_CODES } from '@/types';

/**
 * Deletes an optimization session from the authenticated user's history
 *
 * **Process:**
 * 1. Validate user authentication
 * 2. Validate session ID is provided
 * 3. Delete from sessions table (RLS ensures user owns it)
 * 4. Handle errors gracefully
 *
 * **Returns:**
 * - Success: { success: true }
 * - Error: UNAUTHORIZED if not signed in
 * - Error: VALIDATION_ERROR if session ID is empty
 * - Error: SESSION_NOT_FOUND if session doesn't exist or belongs to another user
 * - Error: DELETE_SESSION_ERROR if database query fails
 *
 * **RLS Security:**
 * - RLS policies automatically prevent deletion of sessions owned by other users
 * - Attempting to delete another user's session returns SESSION_NOT_FOUND (not unauthorized)
 * - This prevents information leakage about session existence
 *
 * @param sessionId - UUID of the session to delete
 * @returns ActionResponse with success indicator
 */
export async function deleteOptimizationSession(
  sessionId: string
): Promise<ActionResponse<{ success: boolean }>> {
  try {
    const supabase = await createClient();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: {
          message: 'You must be signed in to delete sessions.',
          code: ERROR_CODES.UNAUTHORIZED,
        },
      };
    }

    // Validate session ID
    if (!sessionId || sessionId.trim() === '') {
      return {
        data: null,
        error: {
          message: 'Session ID is required.',
          code: ERROR_CODES.VALIDATION_ERROR,
        },
      };
    }
    // Delete session from sessions table
    // RLS policy ensures we can only delete our own sessions
    // Use .select().single() so Supabase returns PGRST116 when no row matches
    const { error: deleteError } = await supabase
      .from('sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (deleteError) {
      // Handle "not found" error (PGRST116)
      // This occurs when:
      // 1. Session doesn't exist
      // 2. Session belongs to another user (RLS blocks it)
      if (deleteError.code === 'PGRST116') {
        return {
          data: null,
          error: {
            message: 'Session not found or you do not have permission to delete it.',
            code: ERROR_CODES.SESSION_NOT_FOUND,
          },
        };
      }

      // Handle other database errors
      return {
        data: null,
        error: {
          message: 'Failed to delete session. Please try again.',
          code: ERROR_CODES.DELETE_SESSION_ERROR,
        },
      };
    }

    // Success
    return {
      data: { success: true },
      error: null,
    };
  } catch (err) {
    // Catch any unexpected errors
    return {
      data: null,
      error: {
        message: 'Failed to delete session. Please try again.',
        code: ERROR_CODES.DELETE_SESSION_ERROR,
      },
    };
  }
}
