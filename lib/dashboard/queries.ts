/**
 * Dashboard Queries
 * Story 16.2: Implement Dashboard Home Page
 * Story 17.5: Dashboard Stats Calculation
 *
 * Server-side functions for fetching dashboard data
 */

import { createClient } from '@/lib/supabase/server';
import type { HistorySession } from '@/types/history';
import type { ActionResponse, DashboardStats } from '@/types';
import { ERROR_CODES } from '@/types';

/**
 * Safely extract the 'overall' score from a JSONB score object
 * Handles null, undefined, and malformed data gracefully
 */
function getScoreOverall(score: unknown): number {
  if (score && typeof score === 'object' && 'overall' in score) {
    const overall = (score as { overall: unknown }).overall;
    return typeof overall === 'number' ? overall : 0;
  }
  return 0;
}

/**
 * Fetch recent optimization sessions for the current authenticated user
 *
 * Returns up to 5 most recent sessions ordered by creation date descending.
 * Transforms database snake_case fields to TypeScript camelCase.
 *
 * @returns Promise<ActionResponse<HistorySession[]>>
 */
export async function getRecentSessions(): Promise<
  ActionResponse<HistorySession[]>
> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        data: null,
        error: {
          message: 'Unauthenticated',
          code: ERROR_CODES.UNAUTHORIZED,
        },
      };
    }

    // Fetch recent sessions for this user
    // Now using job_title, company_name, and resume_name columns directly
    const { data: sessions, error: dbError } = await supabase
      .from('sessions')
      .select('id, created_at, title, job_title, company_name, resume_name, jd_content, ats_score, suggestions')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5);

    if (dbError) {
      return {
        data: null,
        error: {
          message: dbError.message,
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // Transform to HistorySession format
    // Now using stored job_title, company_name, resume_name columns directly
    const historySessions: HistorySession[] = (sessions || []).map(
      (session) => ({
        id: session.id,
        createdAt: new Date(session.created_at),
        // Use stored resume_name, fallback to "Uploaded Resume" for display
        resumeName: (session as any).resume_name || null,
        // Use stored job_title, fallback to title for legacy sessions, then extraction
        jobTitle: (session as any).job_title || (session as any).title || extractJobTitle(session.jd_content),
        // Use stored company_name, fallback to extraction for legacy sessions
        companyName: (session as any).company_name || extractCompanyName(session.jd_content),
        jdPreview: session.jd_content
          ? session.jd_content.slice(0, 100)
          : null,
        // ATS score is stored in ats_score column with overall property
        atsScore:
          (session as any).ats_score && typeof (session as any).ats_score === 'object'
            ? (session as any).ats_score.overall ?? null
            : null,
        suggestionCount: countSuggestions(session.suggestions),
      })
    );

    return {
      data: historySessions,
      error: null,
    };
  } catch (error) {
    return {
      data: null,
      error: {
        message: error instanceof Error ? error.message : 'Unknown error',
        code: 'VALIDATION_ERROR',
      },
    };
  }
}


/**
 * Extract job title from job description content
 * Looks for common patterns like "Software Engineer", "Product Manager", etc.
 */
function extractJobTitle(jdContent: string | null): string | null {
  if (!jdContent) return null;

  // Try to extract job title from first few lines
  const firstLine = jdContent.split('\n')[0];
  if (firstLine && firstLine.length < 100) {
    return firstLine.trim();
  }

  return null;
}

/**
 * Extract company name from job description content
 * Looks for patterns like "at CompanyName" or "CompanyName is hiring"
 */
function extractCompanyName(jdContent: string | null): string | null {
  if (!jdContent) return null;

  // Simple pattern matching for "at [Company]"
  const atMatch = jdContent.match(/\bat\s+([A-Z][a-zA-Z\s&]+?)(?:\s|,|\.|\n)/);
  if (atMatch) {
    return atMatch[1].trim();
  }

  return null;
}

/**
 * Count total suggestions from suggestions object
 */
function countSuggestions(suggestions: any): number {
  if (!suggestions || typeof suggestions !== 'object') return 0;

  let count = 0;
  if (Array.isArray(suggestions.summary)) count += suggestions.summary.length;
  if (Array.isArray(suggestions.skills)) count += suggestions.skills.length;
  if (Array.isArray(suggestions.experience))
    count += suggestions.experience.length;

  return count;
}

/**
 * Fetch dashboard statistics for the authenticated user
 * Story 17.5: Dashboard Stats Calculation
 *
 * Calculates:
 * - Total scans: Count of all sessions
 * - Average ATS Score: Mean of all ats_score.overall values
 * - Improvement Rate: Mean improvement from comparison sessions
 *
 * @returns Promise<ActionResponse<DashboardStats>>
 */
export async function getDashboardStats(): Promise<
  ActionResponse<DashboardStats>
> {
  try {
    const supabase = await createClient();

    // Authenticate user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: {
          message: 'You must be signed in to view dashboard stats.',
          code: ERROR_CODES.UNAUTHORIZED,
        },
      };
    }

    // Query ALL user sessions (not limited to recent 5)
    // RLS policies automatically filter by user_id, but we add explicit filter for clarity
    const { data: sessions, error: queryError } = await supabase
      .from('sessions')
      .select('id, ats_score, compared_ats_score')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (queryError) {
      return {
        data: null,
        error: {
          message: `Failed to load dashboard stats: ${queryError.message}`,
          code: ERROR_CODES.VALIDATION_ERROR,
        },
      };
    }

    // Calculate total scans (null-safe)
    const totalScans = (sessions ?? []).length;

    // Calculate average ATS score
    // Filter sessions with non-null ats_score, extract overall value
    const safeSessions = sessions ?? [];
    const sessionsWithScores = safeSessions.filter(
      (s) => s.ats_score !== null && s.ats_score !== undefined
    );

    const averageAtsScore =
      sessionsWithScores.length > 0
        ? sessionsWithScores.reduce((sum, s) => {
            // Safe access using type guard helper
            return sum + getScoreOverall(s.ats_score);
          }, 0) / sessionsWithScores.length
        : null;

    // Calculate improvement rate
    // Filter sessions with BOTH ats_score AND compared_ats_score
    const sessionsWithComparisons = safeSessions.filter(
      (s) =>
        s.ats_score !== null &&
        s.ats_score !== undefined &&
        s.compared_ats_score !== null &&
        s.compared_ats_score !== undefined
    );

    const improvementRate =
      sessionsWithComparisons.length > 0
        ? sessionsWithComparisons.reduce((sum, s) => {
            // Calculate improvement: new score - original score
            const originalScore = getScoreOverall(s.ats_score);
            const comparedScore = getScoreOverall(s.compared_ats_score);
            const improvement = comparedScore - originalScore;
            return sum + improvement;
          }, 0) / sessionsWithComparisons.length
        : null;

    return {
      data: {
        totalScans,
        averageAtsScore,
        improvementRate,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: {
        message: `Failed to calculate dashboard stats: ${err instanceof Error ? err.message : 'Unknown error'}`,
        code: ERROR_CODES.VALIDATION_ERROR,
      },
    };
  }
}
