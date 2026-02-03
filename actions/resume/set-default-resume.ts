'use server';

/**
 * set-default-resume.ts - Change Default Resume
 *
 * Server action to set a specific resume as the user's default resume.
 * Unsets all other defaults to maintain the "one default per user" constraint.
 *
 * Epic 9: Save Resume After Extraction + Settings Page + Default Resume
 * Phase 1.3: Server Actions
 */

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse } from '@/types';

/**
 * Set a resume as the user's default resume
 *
 * @param resumeId - ID of the resume to set as default
 * @returns Success status
 *
 * @example
 * ```typescript
 * const { data, error } = await setDefaultResume('resume-123');
 * if (error) {
 *   toast.error(error.message);
 *   return;
 * }
 * toast.success('Default resume updated');
 * ```
 */
export async function setDefaultResume(
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
        message: 'You must be logged in to set a default resume',
        code: 'UNAUTHORIZED',
      },
    };
  }

  // Verify the resume exists and belongs to the user (RLS will enforce this)
  const { data: resume, error: verifyError } = await supabase
    .from('user_resumes')
    .select('id')
    .eq('id', resumeId)
    .eq('user_id', user.id)
    .single();

  if (verifyError || !resume) {
    return {
      data: null,
      error: {
        message: 'Resume not found or you do not have permission to modify it',
        code: 'RESUME_NOT_FOUND',
      },
    };
  }

  // Step 1: Unset all defaults for this user
  const { error: unsetError } = await supabase
    .from('user_resumes')
    .update({ is_default: false })
    .eq('user_id', user.id);

  if (unsetError) {
    return {
      data: null,
      error: {
        message: 'Failed to update default resume',
        code: 'SAVE_RESUME_ERROR',
      },
    };
  }

  // Step 2: Set the new default
  const { error: setError } = await supabase
    .from('user_resumes')
    .update({ is_default: true })
    .eq('id', resumeId)
    .eq('user_id', user.id);

  if (setError) {
    return {
      data: null,
      error: {
        message: 'Failed to set default resume',
        code: 'SAVE_RESUME_ERROR',
      },
    };
  }

  return {
    data: { success: true },
    error: null,
  };
}
