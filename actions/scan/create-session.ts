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
  /** Resume filename for title generation */
  filename?: string;
}

interface CreateSessionResult {
  sessionId: string;
  anonymousId: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extracts job title from job description content
 *
 * Attempts to find the job title in the JD text.
 * Looks for common patterns like "Position:", "Job Title:", or first line.
 *
 * @param jdContent - Full job description text
 * @returns Job title or null
 */
function extractJobTitle(jdContent: string | null): string | null {
  if (!jdContent) return null;

  // Take first 500 characters (likely contains header with title)
  const header = jdContent.substring(0, 500);
  const lines = header.split('\n').filter((l) => l.trim().length > 0);

  if (lines.length === 0) return null;

  // Look for explicit title patterns
  for (const line of lines) {
    const lower = line.toLowerCase();

    // Check for explicit title indicators
    if (
      lower.includes('position:') ||
      lower.includes('job title:') ||
      lower.includes('role:') ||
      lower.includes('title:')
    ) {
      // Extract text after the colon
      const match = line.match(/(?:position|job title|role|title):\s*(.+)/i);
      if (match && match[1]) {
        return match[1].trim().substring(0, 100); // Max 100 chars
      }
    }
  }

  // Fallback: use first line if it's reasonably short
  const firstLine = lines[0].trim();
  if (firstLine.length > 3 && firstLine.length < 100) {
    return firstLine;
  }

  return null;
}

/**
 * Extracts company name from job description content
 *
 * Looks for common patterns like "Company:", "at Company", etc.
 *
 * @param jdContent - Full job description text
 * @returns Company name or null
 */
function extractCompanyName(jdContent: string | null): string | null {
  if (!jdContent) return null;

  // Take first 500 characters
  const header = jdContent.substring(0, 500);

  // Look for explicit company patterns
  const companyPatterns = [
    /company:\s*(.+?)(?:\n|$)/i,
    /at\s+([A-Z][a-zA-Z0-9\s&.]+?)(?:\s*\n|,|$)/,
    /for\s+([A-Z][a-zA-Z0-9\s&.]+?)(?:\s*\n|,|$)/,
  ];

  for (const pattern of companyPatterns) {
    const match = header.match(pattern);
    if (match && match[1]) {
      const company = match[1].trim();
      // Validate it's not too long and looks reasonable
      if (company.length > 2 && company.length < 60) {
        return company;
      }
    }
  }

  return null;
}

/**
 * Computes the session title from JD content
 *
 * Format: "{Job Title} - {Company}" with fallbacks:
 * - "Software Engineer - Google" (both found)
 * - "Software Engineer" (no company)
 * - "Untitled Scan" (nothing extracted)
 *
 * @param jdContent - Full job description text
 * @returns Computed session title
 */
function computeSessionTitle(jdContent: string): string {
  const jobTitle = extractJobTitle(jdContent);
  const company = extractCompanyName(jdContent);

  if (jobTitle && company) {
    return `${jobTitle} - ${company}`;
  }

  if (jobTitle) {
    return jobTitle;
  }

  return 'Untitled Scan';
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

    // Compute session title from JD content
    const title = computeSessionTitle(input.jobDescription);

    // Create session in database
    const { data: session, error: insertError } = await supabase
      .from('sessions')
      .insert({
        user_id: userId,
        anonymous_id: anonymousId,
        resume_content: JSON.stringify({ rawText: input.resumeContent }),
        jd_content: JSON.stringify(input.jobDescription),
        title,
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
