/**
 * Delete Resume Server Action
 *
 * Permanently deletes a resume from the user's library.
 * Follows the ActionResponse pattern - NEVER throws errors.
 *
 * **Security:**
 * - RLS policies ensure users can only delete their own resumes
 * - Validates authentication before attempting deletion
 * - Gracefully handles unauthorized access attempts
 *
 * @example
 * ```typescript
 * const { data, error } = await deleteResume(resumeId);
 * if (error) {
 *   toast.error(error.message);
 *   return;
 * }
 * toast.success('Resume deleted successfully');
 * ```
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse } from '@/types';
import { ERROR_CODES } from '@/types';

/**
 * Deletes a resume from the authenticated user's library
 *
 * **Process:**
 * 1. Validate user authentication
 * 2. Validate resume ID is provided
 * 3. Delete from user_resumes table (RLS ensures user owns it)
 * 4. Handle errors gracefully
 *
 * **Returns:**
 * - Success: { success: true }
 * - Error: UNAUTHORIZED if not signed in
 * - Error: VALIDATION_ERROR if resume ID is empty
 * - Error: RESUME_NOT_FOUND if resume doesn't exist or belongs to another user
 * - Error: DELETE_RESUME_ERROR if database query fails
 *
 * **RLS Security:**
 * - RLS policies automatically prevent deletion of resumes owned by other users
 * - Attempting to delete another user's resume returns RESUME_NOT_FOUND (not unauthorized)
 * - This prevents information leakage about resume existence
 *
 * @param resumeId - UUID of the resume to delete
 * @returns ActionResponse with success indicator
 */
export async function deleteResume(
  resumeId: string
): Promise<ActionResponse<{ success: boolean }>> {
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
        message: 'You must be signed in to delete resumes.',
        code: ERROR_CODES.UNAUTHORIZED,
      },
    };
  }

  // Validate resume ID
  if (!resumeId || resumeId.trim() === '') {
    return {
      data: null,
      error: {
        message: 'Resume ID is required.',
        code: ERROR_CODES.VALIDATION_ERROR,
      },
    };
  }

  try {
    // Delete resume from user_resumes table
    // RLS policy ensures we can only delete our own resumes
    // Use .select().single() so Supabase returns PGRST116 when no row matches
    const { error: deleteError } = await supabase
      .from('user_resumes')
      .delete()
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (deleteError) {
      // Handle "not found" error (PGRST116)
      // This occurs when:
      // 1. Resume doesn't exist
      // 2. Resume belongs to another user (RLS blocks it)
      if (deleteError.code === 'PGRST116') {
        return {
          data: null,
          error: {
            message: 'Resume not found or you do not have permission to delete it.',
            code: ERROR_CODES.RESUME_NOT_FOUND,
          },
        };
      }

      // Handle other database errors
      return {
        data: null,
        error: {
          message: 'Failed to delete resume. Please try again.',
          code: ERROR_CODES.DELETE_RESUME_ERROR,
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
        message: 'Failed to delete resume. Please try again.',
        code: ERROR_CODES.DELETE_RESUME_ERROR,
      },
    };
  }
}
