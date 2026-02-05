'use server';

/**
 * get-default-resume.ts - Fetch Default Resume
 *
 * Server action to fetch the user's default resume content for auto-loading.
 *
 * Epic 9: Save Resume After Extraction + Settings Page + Default Resume
 * Phase 1.4: Server Actions
 */

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse } from '@/types';

/**
 * Get the user's default resume
 *
 * @returns Default resume data or null if no default exists
 *
 * @example
 * ```typescript
 * const { data, error } = await getDefaultResume();
 * if (error) {
 *   console.error('Failed to fetch default resume');
 *   return;
 * }
 * if (data) {
 *   // Load resume into state
 *   setResumeContent(data.content);
 * }
 * ```
 */
export async function getDefaultResume(): Promise<
  ActionResponse<{
    id: string;
    name: string;
    content: string;
    fileName: string | null;
  } | null>
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
        message: 'You must be logged in to fetch default resume',
        code: 'UNAUTHORIZED',
      },
    };
  }

  // Query for the default resume
  const { data, error } = await supabase
    .from('user_resumes')
    .select('id, name, resume_content, file_name')
    .eq('user_id', user.id)
    .eq('is_default', true)
    .maybeSingle(); // Use maybeSingle() instead of single() to return null if not found

  if (error) {
    return {
      data: null,
      error: {
        message: 'Failed to fetch default resume',
        code: 'GET_RESUME_CONTENT_ERROR',
      },
    };
  }

  // No default resume found (not an error - user might not have any resumes)
  if (!data) {
    return {
      data: null,
      error: null,
    };
  }

  return {
    data: {
      id: data.id,
      name: data.name,
      content: data.resume_content,
      fileName: data.file_name,
    },
    error: null,
  };
}
