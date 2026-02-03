/**
 * Save Resume Server Action
 *
 * Saves a resume to the user's library with a 3-resume limit.
 * Follows the ActionResponse pattern - NEVER throws errors.
 *
 * @example
 * ```typescript
 * const { data, error } = await saveResume(resumeContent, 'Software Engineer Resume');
 * if (error) {
 *   toast.error(error.message);
 *   return;
 * }
 * toast.success(`Resume "${data.name}" saved successfully!`);
 * ```
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse, SaveResumeResult } from '@/types';
import { ERROR_CODES } from '@/types';

/**
 * Saves a resume to the authenticated user's library
 *
 * **Process:**
 * 1. Validate user authentication
 * 2. Validate inputs (content and name)
 * 3. Check user hasn't exceeded 3-resume limit
 * 4. Unset other defaults if isDefault=true
 * 5. Insert resume into user_resumes table
 * 6. Return saved resume info
 *
 * **Constraints:**
 * - User must be authenticated (UNAUTHORIZED if not)
 * - Resume content cannot be empty (VALIDATION_ERROR)
 * - Resume name: 1-100 characters (VALIDATION_ERROR)
 * - Maximum 3 resumes per user (RESUME_LIMIT_EXCEEDED)
 * - Resume names must be unique per user (SAVE_RESUME_ERROR)
 *
 * @param resumeContent - The extracted text content of the resume
 * @param resumeName - User-chosen name for the resume (max 100 chars)
 * @param fileName - Optional original file name
 * @param isDefault - Optional flag to set as default resume (unsets other defaults)
 * @returns ActionResponse with resume id, name, and is_default status
 */
export async function saveResume(
  resumeContent: string,
  resumeName: string,
  fileName?: string,
  isDefault?: boolean
): Promise<ActionResponse<SaveResumeResult & { is_default: boolean }>> {
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
        message: 'You must be signed in to save resumes.',
        code: ERROR_CODES.UNAUTHORIZED,
      },
    };
  }

  // Validate resume content
  if (!resumeContent?.trim()) {
    return {
      data: null,
      error: {
        message: 'Resume content is empty. Please upload a resume first.',
        code: ERROR_CODES.VALIDATION_ERROR,
      },
    };
  }

  // Validate resume name
  const trimmedName = resumeName?.trim();
  if (!trimmedName) {
    return {
      data: null,
      error: {
        message: 'Please enter a name for your resume.',
        code: ERROR_CODES.VALIDATION_ERROR,
      },
    };
  }

  if (trimmedName.length > 100) {
    return {
      data: null,
      error: {
        message: 'Resume name cannot exceed 100 characters.',
        code: ERROR_CODES.VALIDATION_ERROR,
      },
    };
  }

  try {
    // Check resume count for limit enforcement
    const { count, error: countError } = await supabase
      .from('user_resumes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    if (countError) {
      return {
        data: null,
        error: {
          message: `Failed to check resume count: ${countError.message}`,
          code: ERROR_CODES.SAVE_RESUME_ERROR,
        },
      };
    }

    // Enforce 3-resume limit
    if (count !== null && count >= 3) {
      return {
        data: null,
        error: {
          message:
            'You have reached the maximum of 3 saved resumes. Please delete one before saving a new resume.',
          code: ERROR_CODES.RESUME_LIMIT_EXCEEDED,
        },
      };
    }

    // If setting as default, unset all other defaults first
    if (isDefault) {
      const { error: unsetError } = await supabase
        .from('user_resumes')
        .update({ is_default: false })
        .eq('user_id', user.id);

      if (unsetError) {
        return {
          data: null,
          error: {
            message: `Failed to update default settings: ${unsetError.message}`,
            code: ERROR_CODES.SAVE_RESUME_ERROR,
          },
        };
      }
    }

    // Insert resume into database
    const { data, error: insertError } = await supabase
      .from('user_resumes')
      .insert({
        user_id: user.id,
        name: trimmedName,
        resume_content: resumeContent.trim(),
        file_name: fileName || null,
        is_default: isDefault || false,
      })
      .select('id, name, is_default')
      .single();

    if (insertError) {
      // Handle duplicate name constraint violation
      if (insertError.code === '23505') {
        return {
          data: null,
          error: {
            message: `A resume named "${trimmedName}" already exists. Please choose a different name.`,
            code: ERROR_CODES.SAVE_RESUME_ERROR,
          },
        };
      }

      return {
        data: null,
        error: {
          message: `Failed to save resume: ${insertError.message}`,
          code: ERROR_CODES.SAVE_RESUME_ERROR,
        },
      };
    }

    if (!data) {
      return {
        data: null,
        error: {
          message: 'Failed to save resume. Please try again.',
          code: ERROR_CODES.SAVE_RESUME_ERROR,
        },
      };
    }

    // Success
    return {
      data: {
        id: data.id,
        name: data.name,
        is_default: data.is_default,
      },
      error: null,
    };
  } catch (err) {
    // Catch any unexpected errors
    return {
      data: null,
      error: {
        message: `Failed to save resume: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: ERROR_CODES.SAVE_RESUME_ERROR,
      },
    };
  }
}
