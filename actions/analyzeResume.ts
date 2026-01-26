'use server';

// Story 5.2: Server Action for Resume Analysis (Keyword + ATS Score)
import { ActionResponse } from '@/types';
import { KeywordAnalysisResult, ATSScore } from '@/types/analysis';
import { Resume } from '@/types/optimization';
import { extractKeywords } from '@/lib/ai/extractKeywords';
import { matchKeywords } from '@/lib/ai/matchKeywords';
import { calculateATSScore } from '@/lib/ai/calculateATSScore';
import { createClient } from '@/lib/supabase/server';

/**
 * Combined result for keyword analysis and ATS score
 */
export interface AnalysisResult {
  keywordAnalysis: KeywordAnalysisResult;
  atsScore: ATSScore;
}

/**
 * Analyze resume: Extract keywords, match against resume, and calculate ATS score.
 * This is the main entry point for comprehensive resume analysis.
 *
 * **Flow:**
 * 1. Extract keywords from job description (Story 5.1)
 * 2. Match keywords against resume (Story 5.1)
 * 3. Calculate ATS score with keyword + section + quality (Story 5.2)
 * 4. Store results in session
 *
 * @param sessionId - Session ID containing resume and JD
 * @returns ActionResponse with analysis results (keyword + score) or error
 */
export async function analyzeResume(
  sessionId: string
): Promise<ActionResponse<AnalysisResult>> {
  try {
    console.log('[SS:analyze] Starting analysis for session:', sessionId?.slice(0, 8) + '...');
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
      .select('resume_content, jd_content')
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

    // Parse resume content from JSON string
    let parsedResume: Resume;
    try {
      parsedResume = session.resume_content
        ? JSON.parse(session.resume_content)
        : null;
    } catch (parseError) {
      console.error('[analyzeResume] Resume parse error:', parseError);
      return {
        data: null,
        error: {
          code: 'PARSE_ERROR',
          message: 'Failed to parse resume content'
        }
      };
    }

    // Validate resume exists
    if (!parsedResume || !parsedResume.rawText || parsedResume.rawText.trim().length === 0) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please upload a resume first'
        }
      };
    }

    // Parse JD content from JSON string (or handle as plain string if not JSON)
    let jdContent: string;
    try {
      jdContent = session.jd_content
        ? (typeof session.jd_content === 'string' ? JSON.parse(session.jd_content) : session.jd_content)
        : '';
    } catch {
      // If not JSON, treat as plain string
      jdContent = session.jd_content || '';
    }

    // Validate JD exists
    if (!jdContent || jdContent.trim().length === 0) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Please enter a job description first'
        }
      };
    }

    // Step 1: Extract keywords from JD
    console.log('[SS:analyze] Step 1: Extracting keywords from JD (' + jdContent.length + ' chars)');
    const extractResult = await extractKeywords(jdContent);

    if (extractResult.error) {
      console.error('[SS:analyze] Step 1 FAILED:', extractResult.error.code, '-', extractResult.error.message);
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
    console.log('[SS:analyze] Step 2: Matching', extractResult.data.keywords.length, 'keywords against resume');
    const matchResult = await matchKeywords(
      parsedResume.rawText,
      extractResult.data.keywords
    );

    if (matchResult.error) {
      console.error('[SS:analyze] Step 2 FAILED:', matchResult.error.code, '-', matchResult.error.message);
      return {
        data: null,
        error: matchResult.error
      };
    }

    // Step 3: Calculate ATS score
    console.log('[SS:analyze] Step 3: Calculating ATS score (matchRate:', matchResult.data.matchRate + '%)');
    const scoreResult = await calculateATSScore(
      matchResult.data,
      parsedResume,
      jdContent
    );

    if (scoreResult.error) {
      console.error('[SS:analyze] Step 3 FAILED:', scoreResult.error.code, '-', scoreResult.error.message);
      return {
        data: null,
        error: scoreResult.error
      };
    }

    // Step 4: Store results in session
    const { error: updateError } = await supabase
      .from('sessions')
      .update({
        keyword_analysis: matchResult.data,
        ats_score: scoreResult.data,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (updateError) {
      // Log error but don't fail - we have the results
      console.error('[analyzeResume] Failed to save analysis:', updateError);
    }

    // Return successful results
    console.log('[SS:analyze] Analysis complete. ATS score:', scoreResult.data.overall, '| Breakdown:', JSON.stringify(scoreResult.data.breakdown));
    return {
      data: {
        keywordAnalysis: matchResult.data,
        atsScore: scoreResult.data
      },
      error: null
    };

  } catch (error: unknown) {
    // Handle unexpected errors
    console.error('[analyzeResume] Unexpected error:', error);
    return {
      data: null,
      error: {
        code: 'SCORE_CALCULATION_ERROR',
        message: error instanceof Error ? error.message : 'Failed to analyze resume'
      }
    };
  }
}
