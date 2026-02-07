/**
 * Get Optimization History Server Action
 *
 * Fetches the last 10 optimization sessions for an authenticated user.
 * Follows the ActionResponse pattern - NEVER throws errors.
 *
 * @example
 * ```typescript
 * const { data, error } = await getOptimizationHistory();
 * if (error) {
 *   toast.error(error.message);
 *   return;
 * }
 * console.log(`Found ${data.sessions.length} optimization sessions`);
 * ```
 */

'use server';

import { createClient } from '@/lib/supabase/server';
import type { ActionResponse, HistorySession } from '@/types';
import { ERROR_CODES } from '@/types';

/**
 * Database row from sessions table (snake_case)
 *
 * Only selects fields needed for history display to minimize bandwidth.
 */
interface SessionRow {
  id: string;
  created_at: string;
  title: string | null;
  job_title: string | null;
  company_name: string | null;
  resume_name: string | null;
  resume_content: string | null;
  jd_content: string | null;
  ats_score: {
    overall?: number;
  } | null;
  compared_ats_score: {
    overall?: number;
  } | null;
  summary_suggestion: unknown | null;
  skills_suggestion: unknown | null;
  experience_suggestion: unknown | null;
  education_suggestion: unknown | null;
  projects_suggestion: unknown | null;
}

/**
 * Extracts resume name from resume_content text
 *
 * Attempts to extract a reasonable display name from the resume text.
 * Looks for a name pattern in the first few lines.
 *
 * @param resumeContent - Full resume text
 * @returns First name found or null
 */
function extractResumeName(resumeContent: string | null): string | null {
  if (!resumeContent) return null;

  // Take first 300 characters (likely contains header/contact info)
  const header = resumeContent.substring(0, 300);

  const lines = header.split('\n').filter((l) => l.trim().length > 0);

  if (lines.length === 0) return null;

  // Check first line for a name-like pattern
  const firstLine = lines[0].trim();

  // Heuristic: if first line is 2-5 words, each starting with uppercase letter,
  // and total length is reasonable for a name (< 60 chars), treat as name.
  // Handles: "John Smith", "JOHN SMITH", "Jean-Pierre Dupont", "O'Brien McDonald"
  if (firstLine.length >= 3 && firstLine.length < 60) {
    const words = firstLine.split(/\s+/);
    if (words.length >= 2 && words.length <= 5) {
      const looksLikeName = words.every((w) =>
        /^[A-Z][A-Za-z'-]+$/.test(w) || /^[A-Z]+$/.test(w)
      );
      if (looksLikeName) {
        // Title-case for display (handles ALL CAPS names)
        return words
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(' ');
      }
    }
  }

  return null;
}

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
 * Counts total suggestions across all sections
 *
 * @param row - Database row with suggestion columns
 * @returns Number of suggestions (0 if none)
 */
function countSuggestions(row: SessionRow): number {
  let count = 0;

  // Check each suggestion type (they're stored as JSONB in separate columns)
  if (row.summary_suggestion) count++;
  if (row.skills_suggestion) count++;
  if (row.experience_suggestion) count++;
  if (row.education_suggestion) count++;
  if (row.projects_suggestion) count++;

  return count;
}

/**
 * Transforms database row to HistorySession type
 *
 * Converts snake_case DB fields to camelCase TypeScript types
 * and extracts display metadata.
 *
 * For new sessions: Uses stored job_title, company_name, resume_name directly
 * For legacy sessions: Falls back to extraction from content
 *
 * @param row - Database row from sessions query
 * @returns HistorySession object
 */
function transformToHistorySession(row: SessionRow): HistorySession {
  // Use stored job_title if available, fallback to title, then extraction for legacy sessions
  const jobTitle = row.job_title || row.title || extractJobTitle(row.jd_content);

  // Use stored company_name if available, otherwise fall back to extraction for legacy sessions
  const companyName = row.company_name || extractCompanyName(row.jd_content);

  // Use stored resume_name if available, otherwise fall back to extraction for legacy sessions
  const resumeName = row.resume_name || extractResumeName(row.resume_content);

  return {
    id: row.id,
    createdAt: new Date(row.created_at),
    resumeName,
    jobTitle,
    companyName,
    jdPreview: row.jd_content?.substring(0, 100) || null,
    atsScore: row.ats_score?.overall ?? null,
    comparedAtsScore: row.compared_ats_score?.overall ?? null,
    suggestionCount: countSuggestions(row),
  };
}

/**
 * Fetches optimization history for the authenticated user
 *
 * **Process:**
 * 1. Validate user authentication
 * 2. Query sessions table for last 10 sessions by user_id
 * 3. Extract display metadata (resume name, job title, etc.)
 * 4. Return transformed history sessions
 *
 * **Returns:**
 * - Success: Array of HistorySession objects (can be empty)
 * - Error: UNAUTHORIZED if not signed in
 * - Error: GET_HISTORY_ERROR if database query fails
 *
 * **RLS Security:**
 * - RLS policies automatically filter by authenticated user
 * - No access to other users' sessions
 *
 * @returns ActionResponse with array of HistorySession objects
 */
export async function getOptimizationHistory(): Promise<
  ActionResponse<HistorySession[]>
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
        message: 'You must be signed in to view your optimization history.',
        code: ERROR_CODES.UNAUTHORIZED,
      },
    };
  }

  try {
    // Query sessions table for last 10 sessions by this user
    // Now using job_title, company_name columns directly (minimize bandwidth)
    const { data, error: queryError } = await supabase
      .from('sessions')
      .select(
        'id, created_at, title, job_title, company_name, resume_name, resume_content, jd_content, ats_score, compared_ats_score, summary_suggestion, skills_suggestion, experience_suggestion, education_suggestion, projects_suggestion'
      )
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (queryError) {
      return {
        data: null,
        error: {
          message: `Failed to load optimization history: ${queryError.message}`,
          code: ERROR_CODES.GET_HISTORY_ERROR,
        },
      };
    }

    // Transform DB rows to HistorySession objects
    const sessions = (data || []).map(transformToHistorySession);

    return {
      data: sessions,
      error: null,
    };
  } catch (err) {
    // Catch any unexpected errors
    return {
      data: null,
      error: {
        message: `Failed to load optimization history: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: ERROR_CODES.GET_HISTORY_ERROR,
      },
    };
  }
}
