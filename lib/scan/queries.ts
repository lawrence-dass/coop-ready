import { createClient } from '@/lib/supabase/server';
import type { ActionResponse } from '@/types';
import type { ATSScore, KeywordAnalysisResult } from '@/types/analysis';

interface SessionData {
  id: string;
  createdAt: string;
  resumeContent: string;
  jdContent: string;
  analysis: {
    score: ATSScore;
    keywordAnalysis: KeywordAnalysisResult;
  } | null;
  suggestions: any;
  preferences: any;
  anonymousId: string | null;
  userId: string;
}

/**
 * Fetch a session by ID for the given user.
 * Uses RLS policies to ensure user can only access their own sessions.
 */
export async function getSessionById(
  sessionId: string,
  userId: string
): Promise<ActionResponse<SessionData>> {
  // Validation
  if (!sessionId || !sessionId.trim()) {
    return {
      data: null,
      error: {
        message: 'Session ID is required',
        code: 'VALIDATION_ERROR',
      },
    };
  }

  if (!userId || !userId.trim()) {
    return {
      data: null,
      error: {
        message: 'User ID is required',
        code: 'VALIDATION_ERROR',
      },
    };
  }

  try {
    const supabase = await createClient();

    // Query session by ID with explicit user filter (defense in depth, RLS is backup)
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', userId)
      .single();

    if (error) {
      return {
        data: null,
        error: {
          message: error.message,
          code: 'GET_SESSION_ERROR',
        },
      };
    }

    if (!data) {
      return {
        data: null,
        error: {
          message: 'Session not found',
          code: 'SESSION_NOT_FOUND',
        },
      };
    }

    // Transform snake_case to camelCase
    return {
      data: {
        id: data.id,
        createdAt: data.created_at,
        resumeContent: data.resume_content,
        jdContent: data.jd_content,
        analysis: data.analysis,
        suggestions: data.suggestions,
        preferences: data.preferences,
        anonymousId: data.anonymous_id,
        userId: data.user_id,
      },
      error: null,
    };
  } catch (err) {
    return {
      data: null,
      error: {
        message: err instanceof Error ? err.message : 'Unknown error',
        code: 'GET_SESSION_ERROR',
      },
    };
  }
}
