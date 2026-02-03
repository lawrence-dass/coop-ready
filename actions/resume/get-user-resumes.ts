/**
 * Get User Resumes Server Action
 *
 * Fetches all resumes saved by the authenticated user.
 * Follows the ActionResponse pattern - NEVER throws errors.
 *
 * @example
 * ```typescript
 * const { data, error } = await getUserResumes();
 * if (error) {
 *   toast.error(error.message);
 *   return;
 * }
 * console.log(`Found ${data.length} saved resumes`);
 * ```
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse, UserResumeOption } from '@/types';
import { ERROR_CODES } from '@/types';

/**
 * Fetches all resumes for the authenticated user
 *
 * **Process:**
 * 1. Validate user authentication
 * 2. Query user_resumes table for all resumes by user_id
 * 3. Return list ordered by created_at DESC (newest first)
 *
 * **Returns:**
 * - Success: Array of resumes (can be empty)
 * - Error: UNAUTHORIZED if not signed in
 * - Error: GET_RESUMES_ERROR if database query fails
 *
 * **RLS Security:**
 * - RLS policies automatically filter by authenticated user
 * - No need for additional client-side filtering
 *
 * @returns ActionResponse with array of UserResumeOption (id, name, created_at)
 */
export async function getUserResumes(): Promise<
  ActionResponse<UserResumeOption[]>
> {
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
        message: 'You must be signed in to view your resumes.',
        code: ERROR_CODES.UNAUTHORIZED,
      },
    };
  }

  try {
    // Query user_resumes table for all resumes by this user
    // Order by is_default DESC first (default at top), then by created_at DESC
    const { data, error: queryError } = await supabase
      .from('user_resumes')
      .select('id, name, created_at, is_default')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (queryError) {
      return {
        data: null,
        error: {
          message: `Failed to load resumes: ${queryError.message}`,
          code: ERROR_CODES.GET_RESUMES_ERROR,
        },
      };
    }

    // Return empty array if no resumes found (not an error)
    return {
      data: data || [],
      error: null,
    };
  } catch (err) {
    // Catch any unexpected errors
    return {
      data: null,
      error: {
        message: `Failed to load resumes: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: ERROR_CODES.GET_RESUMES_ERROR,
      },
    };
  }
}
