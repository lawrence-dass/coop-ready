'use server';

/**
 * Create Scan Session Server Action
 *
 * Story 16.3 - Creates a new session in the database for a scan operation.
 *
 * This action:
 * 1. Gets the current authenticated user
 * 2. Extracts job title and company name from JD using LLM
 * 3. Creates a new session record with resume and JD content
 * 4. Returns the session ID and anonymous ID for the /api/optimize call
 *
 * **Security:**
 * - Requires authentication (dashboard is protected)
 * - User ID is set from auth.uid() for RLS compliance
 */

import { createClient } from '@/lib/supabase/server';
import { extractJobMetadata, computeTitleFromMetadata } from '@/lib/ai/extractJobMetadata';
import type { ActionResponse } from '@/types';

// ============================================================================
// TYPES
// ============================================================================

interface CreateSessionInput {
  resumeContent: string;
  jobDescription: string;
  /** Resume filename for title generation */
  filename?: string;
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

    // Extract job metadata using LLM (with regex fallback)
    const metadataResult = await extractJobMetadata(input.jobDescription);
    const metadata = metadataResult.data || { jobTitle: null, companyName: null };

    // Compute session title from extracted metadata
    const title = computeTitleFromMetadata(metadata);

    // Create session in database with separate job_title and company_name columns
    const { data: session, error: insertError } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        anonymous_id: anonymousId,
        resume_content: JSON.stringify({ rawText: input.resumeContent }),
        jd_content: JSON.stringify(input.jobDescription),
        title,
        job_title: metadata.jobTitle,
        company_name: metadata.companyName,
        resume_name: input.filename || null, // Store resume name/filename for history display
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
