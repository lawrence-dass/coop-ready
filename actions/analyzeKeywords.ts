'use server';

// Story 5.1: Server Action for Keyword Analysis
import { ActionResponse } from '@/types';
import { KeywordAnalysisResult } from '@/types/analysis';
import { extractKeywords } from '@/lib/ai/extractKeywords';
import { matchKeywords } from '@/lib/ai/matchKeywords';
import { createClient } from '@/lib/supabase/server';

/**
 * Analyze keywords from job description and match against resume.
 * This is the main entry point for keyword analysis.
 *
 * @param sessionId - Session ID containing resume and JD
 * @returns ActionResponse with keyword analysis results or error
 */
export async function analyzeKeywords(
  sessionId: string
): Promise<ActionResponse<KeywordAnalysisResult>> {
  try {
    // Validation
    if (!sessionId || sessionId.trim().length === 0) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session ID is required'
        }
      };
    }

    // Get Supabase client
    const supabase = await createClient();

    // Fetch session data
    const { data: session, error: fetchError } = await supabase
      .from('sessions')
      .select('resume_content, job_description')
      .eq('id', sessionId)
      .single();

    if (fetchError || !session) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session not found'
        }
      };
    }

    // Validate resume and JD exist
    if (!session.resume_content || session.resume_content.trim().length === 0) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please upload a resume first'
        }
      };
    }

    if (!session.job_description || session.job_description.trim().length === 0) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please enter a job description first'
        }
      };
    }

    // Step 1: Extract keywords from JD
    const extractResult = await extractKeywords(session.job_description);

    if (extractResult.error) {
      return {
        data: null,
        error: extractResult.error
      };
    }

    if (!extractResult.data || extractResult.data.keywords.length === 0) {
      return {
        data: null,
        error: {
          code: 'LLM_ERROR',
          message: 'No keywords could be extracted from job description'
        }
      };
    }

    // Step 2: Match keywords against resume
    const matchResult = await matchKeywords(
      session.resume_content,
      extractResult.data.keywords
    );

    if (matchResult.error) {
      return {
        data: null,
        error: matchResult.error
      };
    }

    // Step 3: Store results in session
    // Note: Supabase JSONB columns accept any JSON-serializable object
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        keyword_analysis: JSON.parse(JSON.stringify(matchResult.data)),
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      // Log error but don't fail - we have the results
      console.error('Failed to save keyword analysis:', updateError);
    }

    // Return successful results
    return matchResult;

  } catch (error: unknown) {
    // Handle unexpected errors
    return {
      data: null,
      error: {
        code: 'LLM_ERROR',
        message: error instanceof Error ? error.message : 'Failed to analyze keywords'
      }
    };
  }
}
