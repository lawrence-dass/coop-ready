/**
 * Dashboard Queries
 * Story 16.2: Implement Dashboard Home Page
 *
 * Server-side functions for fetching dashboard data
 */

import { createClient } from '@/lib/supabase/server';
import type { HistorySession } from '@/types/history';
import type { ActionResponse } from '@/types';

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
          code: 'VALIDATION_ERROR',
        },
      };
    }

    // Fetch recent sessions for this user
    const { data: sessions, error: dbError } = await supabase
      .from('sessions')
      .select('id, created_at, resume_content, jd_content, analysis, suggestions')
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
    const historySessions: HistorySession[] = (sessions || []).map(
      (session) => ({
        id: session.id,
        createdAt: new Date(session.created_at),
        resumeName: extractResumeName(session.resume_content),
        jobTitle: extractJobTitle(session.jd_content),
        companyName: extractCompanyName(session.jd_content),
        jdPreview: session.jd_content
          ? session.jd_content.slice(0, 100)
          : null,
        atsScore:
          session.analysis && typeof session.analysis === 'object'
            ? (session.analysis as any).atsScore || null
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
 * Extract resume name from resume content (placeholder)
 * For now returns null - can be enhanced later
 */
function extractResumeName(resumeContent: string | null): string | null {
  if (!resumeContent) return null;
  // Simple extraction: return first 50 chars as name placeholder
  return 'Resume';
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
