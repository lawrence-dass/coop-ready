/**
 * Session Database Operations
 *
 * This module provides CRUD operations for the sessions table.
 * All functions follow the ActionResponse pattern and transform
 * between snake_case (database) and camelCase (TypeScript).
 *
 * @example
 * ```typescript
 * // Create a new session
 * const { data, error } = await createSession(anonymousId);
 * if (error) {
 *   console.error(error.message);
 *   return;
 * }
 * console.log('Session created:', data.id);
 *
 * // Update session with resume content
 * const resume: Resume = { rawText: '...' };
 * await updateSession(sessionId, { resumeContent: resume });
 * ```
 */

import { createClient } from './client';
import type { ActionResponse } from '@/types';
import type {
  OptimizationSession,
  Resume,
  AnalysisResult,
  SuggestionSet,
  SuggestionFeedback,
} from '@/types/optimization';
import type { KeywordAnalysisResult, ATSScore } from '@/types/analysis';
import type {
  SummarySuggestion,
  SkillsSuggestion,
  ExperienceSuggestion,
  EducationSuggestion,
} from '@/types/suggestions';

// ============================================================================
// DATABASE ROW TYPE (snake_case)
// ============================================================================

/**
 * Raw database row structure from Supabase
 * Uses snake_case to match PostgreSQL naming conventions
 */
interface SessionRow {
  id: string;
  anonymous_id: string;
  user_id: string | null;
  resume_content: string | null;
  jd_content: string | null;
  analysis: AnalysisResult | null;
  suggestions: SuggestionSet | null;
  feedback: SuggestionFeedback[] | null; // Story 7.4: Changed to array
  keyword_analysis: KeywordAnalysisResult | null; // Story 5.1
  ats_score: ATSScore | null; // Story 5.2
  summary_suggestion: SummarySuggestion | null; // Story 6.2
  skills_suggestion: SkillsSuggestion | null; // Story 6.3
  experience_suggestion: ExperienceSuggestion | null; // Story 6.4
  education_suggestion: EducationSuggestion | null; // Story 17.6: Education suggestions
  created_at: string;
  updated_at: string;
}

// ============================================================================
// TYPE TRANSFORMERS
// ============================================================================

/**
 * Transform database row (snake_case) to TypeScript type (camelCase)
 */
function toOptimizationSession(row: SessionRow): OptimizationSession {
  return {
    id: row.id,
    anonymousId: row.anonymous_id,
    userId: row.user_id,
    resumeContent: row.resume_content ? JSON.parse(row.resume_content) : null,
    jobDescription: row.jd_content ? JSON.parse(row.jd_content) : null,
    analysisResult: row.analysis,
    suggestions: row.suggestions,
    feedback: row.feedback ?? [], // Story 7.4: Include feedback array
    keywordAnalysis: row.keyword_analysis,
    atsScore: row.ats_score,
    summarySuggestion: row.summary_suggestion,
    skillsSuggestion: row.skills_suggestion,
    experienceSuggestion: row.experience_suggestion,
    educationSuggestion: row.education_suggestion, // Story 17.6: Education suggestions
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

// ============================================================================
// SESSION CRUD OPERATIONS
// ============================================================================

/**
 * Creates a new session for the given anonymous user
 *
 * **When to use:** When a new anonymous user signs in and has no existing session.
 *
 * @param anonymousId - The user's anonymous ID from auth.uid()
 * @returns ActionResponse with the created session
 */
export async function createSession(
  anonymousId: string
): Promise<ActionResponse<OptimizationSession>> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('sessions')
      .insert({
        anonymous_id: anonymousId,
        user_id: null,
      })
      .select()
      .single();

    if (error) {
      return {
        data: null,
        error: {
          message: `Failed to create session: ${error.message}`,
          code: 'VALIDATION_ERROR',
        },
      };
    }

    return {
      data: toOptimizationSession(data as SessionRow),
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: {
        message:
          err instanceof Error
            ? err.message
            : 'Unknown error creating session',
        code: 'VALIDATION_ERROR',
      },
    };
  }
}

/**
 * Retrieves the most recent session for an anonymous user
 *
 * **When to use:** When restoring session on page load.
 *
 * @param anonymousId - The user's anonymous ID from auth.uid()
 * @returns ActionResponse with the session or null if not found
 */
export async function getSessionByAnonymousId(
  anonymousId: string
): Promise<ActionResponse<OptimizationSession | null>> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('anonymous_id', anonymousId)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      return {
        data: null,
        error: {
          message: `Failed to get session: ${error.message}`,
          code: 'VALIDATION_ERROR',
        },
      };
    }

    if (!data) {
      return {
        data: null,
        error: null,
      };
    }

    return {
      data: toOptimizationSession(data as SessionRow),
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: {
        message:
          err instanceof Error ? err.message : 'Unknown error getting session',
        code: 'VALIDATION_ERROR',
      },
    };
  }
}

/**
 * Updates specific fields in a session
 *
 * **When to use:** When auto-saving or when user updates resume/JD/etc.
 *
 * **Note:** Only provide fields that have changed to minimize database writes.
 *
 * @param sessionId - The session's UUID
 * @param updates - Partial session data to update
 * @returns ActionResponse with success status
 */
export async function updateSession(
  sessionId: string,
  updates: {
    resumeContent?: Resume | null;
    jobDescription?: string | null; // Epic 4 uses string, not JobDescription object
    analysisResult?: AnalysisResult | null;
    suggestions?: SuggestionSet | null;
    feedback?: SuggestionFeedback[]; // Story 7.4: Changed to array
    keywordAnalysis?: KeywordAnalysisResult | null; // Story 5.1
    atsScore?: ATSScore | null; // Story 5.2
    summarySuggestion?: SummarySuggestion | null; // Story 6.2
    skillsSuggestion?: SkillsSuggestion | null; // Story 6.3
    experienceSuggestion?: ExperienceSuggestion | null; // Story 6.4
    educationSuggestion?: EducationSuggestion | null; // Story 17.6: Education suggestions
  }
): Promise<ActionResponse<{ success: boolean }>> {
  const supabase = createClient();

  try {
    // Transform camelCase TypeScript to snake_case database
    const dbUpdates: Partial<SessionRow> = {};

    if ('resumeContent' in updates) {
      dbUpdates.resume_content = updates.resumeContent
        ? JSON.stringify(updates.resumeContent)
        : null;
    }

    if ('jobDescription' in updates) {
      dbUpdates.jd_content = updates.jobDescription
        ? JSON.stringify(updates.jobDescription)
        : null;
    }

    if ('analysisResult' in updates) {
      dbUpdates.analysis = updates.analysisResult;
    }

    if ('suggestions' in updates) {
      dbUpdates.suggestions = updates.suggestions;
    }

    if ('feedback' in updates) {
      dbUpdates.feedback = updates.feedback;
    }

    if ('keywordAnalysis' in updates) {
      dbUpdates.keyword_analysis = updates.keywordAnalysis;
    }

    if ('atsScore' in updates) {
      dbUpdates.ats_score = updates.atsScore;
    }

    if ('summarySuggestion' in updates) {
      dbUpdates.summary_suggestion = updates.summarySuggestion;
    }

    if ('skillsSuggestion' in updates) {
      dbUpdates.skills_suggestion = updates.skillsSuggestion;
    }

    if ('experienceSuggestion' in updates) {
      dbUpdates.experience_suggestion = updates.experienceSuggestion;
    }

    if ('educationSuggestion' in updates) {
      dbUpdates.education_suggestion = updates.educationSuggestion;
    }

    const { error } = await supabase
      .from('sessions')
      .update(dbUpdates)
      .eq('id', sessionId);

    if (error) {
      return {
        data: null,
        error: {
          message: `Failed to update session: ${error.message}`,
          code: 'VALIDATION_ERROR',
        },
      };
    }

    return {
      data: { success: true },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: {
        message:
          err instanceof Error
            ? err.message
            : 'Unknown error updating session',
        code: 'VALIDATION_ERROR',
      },
    };
  }
}

/**
 * Retrieves a single session by ID with user authorization check
 *
 * **When to use:** When loading session details for a specific session (Story 10-2).
 *
 * **Security:** Verifies that the requesting user owns the session via user_id check.
 *
 * @param sessionId - The session's UUID
 * @param userId - The authenticated user's ID (for authorization)
 * @returns ActionResponse with the session or null if not found/unauthorized
 */
export async function getSessionById(
  sessionId: string,
  userId: string
): Promise<ActionResponse<OptimizationSession | null>> {
  const supabase = createClient();

  try {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      return {
        data: null,
        error: {
          message: `Failed to get session: ${error.message}`,
          code: 'GET_SESSION_ERROR',
        },
      };
    }

    if (!data) {
      return {
        data: null,
        error: null,
      };
    }

    return {
      data: toOptimizationSession(data as SessionRow),
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: {
        message:
          err instanceof Error ? err.message : 'Unknown error getting session',
        code: 'GET_SESSION_ERROR',
      },
    };
  }
}
