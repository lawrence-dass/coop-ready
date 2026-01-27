/**
 * Get Resume Content Server Action
 *
 * Fetches the full content of a specific resume by ID.
 * Follows the ActionResponse pattern - NEVER throws errors.
 * RLS policies ensure user can only access their own resumes.
 *
 * @example
 * ```typescript
 * const { data, error } = await getResumeContent(resumeId);
 * if (error) {
 *   toast.error(error.message);
 *   return;
 * }
 * setResumeContent(data.resumeContent);
 * ```
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse, ResumeContentResult } from '@/types';
import { ERROR_CODES } from '@/types';

/**
 * Fetches full resume content for a specific resume
 *
 * **Process:**
 * 1. Validate user authentication
 * 2. Query user_resumes table for specific resume by ID
 * 3. Verify resume belongs to authenticated user (RLS enforced)
 * 4. Return resume with full content
 *
 * **Returns:**
 * - Success: ResumeContentResult with id, name, resumeContent
 * - Error: UNAUTHORIZED if not signed in
 * - Error: RESUME_NOT_FOUND if resume doesn't exist or doesn't belong to user
 * - Error: GET_RESUME_CONTENT_ERROR if database query fails
 *
 * **RLS Security:**
 * - RLS policies automatically enforce user ownership
 * - Query returns null if resume doesn't belong to authenticated user
 *
 * @param resumeId - UUID of the resume to fetch
 * @returns ActionResponse with ResumeContentResult containing full content
 */
export async function getResumeContent(
  resumeId: string
): Promise<ActionResponse<ResumeContentResult>> {
  // Validate resumeId format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!resumeId || !uuidRegex.test(resumeId)) {
    return {
      data: null,
      error: {
        message: 'Invalid resume ID.',
        code: ERROR_CODES.VALIDATION_ERROR,
      },
    };
  }

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
        message: 'You must be signed in to view resume content.',
        code: ERROR_CODES.UNAUTHORIZED,
      },
    };
  }

  try {
    // Query specific resume by ID (RLS enforces user ownership)
    const { data, error: queryError } = await supabase
      .from('user_resumes')
      .select('id, name, resume_content')
      .eq('id', resumeId)
      .eq('user_id', user.id)
      .single();

    if (queryError) {
      // Check for not-found error (PGRST116 is Supabase "not found" code)
      if (queryError.code === 'PGRST116') {
        return {
          data: null,
          error: {
            message:
              'Resume not found. It may have been deleted or you may not have access.',
            code: ERROR_CODES.RESUME_NOT_FOUND,
          },
        };
      }

      return {
        data: null,
        error: {
          message: `Failed to load resume: ${queryError.message}`,
          code: ERROR_CODES.GET_RESUME_CONTENT_ERROR,
        },
      };
    }

    if (!data) {
      return {
        data: null,
        error: {
          message:
            'Resume not found. It may have been deleted or you may not have access.',
          code: ERROR_CODES.RESUME_NOT_FOUND,
        },
      };
    }

    // Success
    return {
      data: {
        id: data.id,
        name: data.name,
        resumeContent: data.resume_content,
      },
      error: null,
    };
  } catch (err) {
    // Catch any unexpected errors
    return {
      data: null,
      error: {
        message: `Failed to load resume: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: ERROR_CODES.GET_RESUME_CONTENT_ERROR,
      },
    };
  }
}
