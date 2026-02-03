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
  suggestions: {
    summary?: any[];
    skills?: any[];
    experience?: any[];
    education?: any[];
  } | null;
  preferences: any;
  anonymousId: string | null;
  userId: string;
  // Raw columns for direct access
  atsScore: ATSScore | null;
  keywordAnalysis: KeywordAnalysisResult | null;
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
    // Build analysis from separate columns if analysis column is null
    const atsScore = data.ats_score as ATSScore | null;
    const keywordAnalysis = data.keyword_analysis as KeywordAnalysisResult | null;
    const analysis = data.analysis ?? (atsScore && keywordAnalysis ? {
      score: atsScore,
      keywordAnalysis: keywordAnalysis,
    } : null);

    // Build suggestions from separate columns if suggestions column is null
    const summarySuggestion = data.summary_suggestion;
    const skillsSuggestion = data.skills_suggestion;
    const experienceSuggestion = data.experience_suggestion;
    const educationSuggestion = data.education_suggestion;

    // Try to use the suggestions column first, otherwise build from individual columns
    let suggestions = data.suggestions;
    if (!suggestions && (summarySuggestion || skillsSuggestion || experienceSuggestion || educationSuggestion)) {
      suggestions = {
        summary: summarySuggestion ? [summarySuggestion] : [],
        skills: skillsSuggestion ? [skillsSuggestion] : [],
        experience: experienceSuggestion ? [experienceSuggestion] : [],
        education: educationSuggestion ? [educationSuggestion] : [],
      };
    } else if (suggestions && educationSuggestion && !suggestions.education) {
      // Ensure education is added even if suggestions exists from other columns
      suggestions = {
        ...suggestions,
        education: [educationSuggestion],
      };
    }

    return {
      data: {
        id: data.id,
        createdAt: data.created_at,
        resumeContent: data.resume_content,
        jdContent: data.jd_content,
        analysis,
        suggestions,
        preferences: data.preferences,
        anonymousId: data.anonymous_id,
        userId: data.user_id,
        atsScore,
        keywordAnalysis,
        comparedAtsScore: data.compared_ats_score,
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
