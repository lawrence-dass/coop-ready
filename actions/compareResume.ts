'use server';

import { extractPdfText } from './extractPdfText';
import { extractDocxText } from './extractDocxText';
import { parseResumeText } from './parseResumeText';
import { extractKeywords } from '@/lib/ai/extractKeywords';
import { matchKeywords } from '@/lib/ai/matchKeywords';
import { extractQualificationsBoth } from '@/lib/ai/extractQualifications';
import { calculateATSScoreV21Full } from '@/lib/ai/calculateATSScore';
import { detectJobType } from '@/lib/scoring/jobTypeDetection';
import { updateSession } from '@/lib/supabase/sessions';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import type { ActionResponse } from '@/types';
import type { ATSScore } from '@/types/analysis';
import type { ATSScoreV21 } from '@/lib/scoring/types';

export interface ComparisonResult {
  originalScore: ATSScore | ATSScoreV21; // Session could have V1, V2, or V2.1 score
  comparedScore: ATSScoreV21; // Comparison always uses V2.1
  improvementPoints: number;
  improvementPercentage: number;
  tierChange?: {
    from: string;
    to: string;
  };
}

/**
 * Compare a re-uploaded resume against the original job description
 *
 * Extracts text from the uploaded file, parses resume sections,
 * runs ATS analysis against the original JD, calculates improvement,
 * and saves the comparison score to the database.
 *
 * @param sessionId - The session ID containing the original analysis
 * @param file - The re-uploaded resume file (PDF or DOCX)
 * @returns Comparison results with original/new scores and improvement
 *
 * @example
 * const { data, error } = await compareResume(sessionId, file);
 * if (error) {
 *   console.error('Comparison failed:', error.message);
 *   return;
 * }
 * console.log(`Improved by ${data.improvementPoints} points!`);
 */
export async function compareResume(
  sessionId: string,
  file: File
): Promise<ActionResponse<ComparisonResult>> {
  try {
    console.log('[compareResume] Starting comparison:', { sessionId, fileName: file.name, fileSize: file.size });

    // Step 1: Validate inputs
    if (!sessionId) {
      console.error('[compareResume] No session ID provided');
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session ID is required'
        }
      };
    }

    if (!file) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Resume file is required'
        }
      };
    }

    // Validate file size (5MB max - matches client-side ResumeUploader)
    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      return {
        data: null,
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'File size exceeds 5MB limit'
        }
      };
    }

    // Get current user for session access
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log('[compareResume] Auth check:', {
      userId: user?.id,
      authError: authError?.message
    });

    if (authError || !user) {
      console.error('[compareResume] Authentication failed:', authError?.message);
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'You must be signed in to compare resumes'
        }
      };
    }

    // Step 2: Extract text from file
    const fileType = file.type;
    let extractResult;

    if (fileType === 'application/pdf') {
      extractResult = await extractPdfText(file);
    } else if (fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      extractResult = await extractDocxText(file);
    } else {
      return {
        data: null,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: 'File must be PDF or DOCX'
        }
      };
    }

    if (extractResult.error) {
      return extractResult as ActionResponse<ComparisonResult>; // Propagate extraction error
    }

    // Step 3: Parse resume sections
    const parseResult = await parseResumeText(
      extractResult.data.text,
      {
        filename: file.name,
        fileSize: file.size
      }
    );

    if (parseResult.error) {
      return parseResult as ActionResponse<ComparisonResult>; // Propagate parsing error
    }

    const comparisonResume = parseResult.data;

    // Step 4: Fetch original session data
    // Use service role to bypass RLS (workaround for client/server bundling issue)
    console.log('[compareResume] Fetching session:', { sessionId, userId: user.id });

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const serviceClient = createServiceClient(supabaseUrl, supabaseServiceKey);

    const { data: sessionData, error: sessionError } = await serviceClient
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .eq('user_id', user.id) // Still validate ownership
      .single();

    console.log('[compareResume] Session result:', {
      hasData: !!sessionData,
      hasError: !!sessionError,
      errorMessage: sessionError?.message
    });

    if (sessionError || !sessionData) {
      console.error('[compareResume] Session fetch failed:', {
        sessionId,
        userId: user.id,
        error: sessionError
      });
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session not found'
        }
      };
    }

    // Transform to OptimizationSession format
    const session = {
      id: sessionData.id,
      anonymousId: sessionData.anonymous_id,
      userId: sessionData.user_id,
      resumeContent: sessionData.resume_content ? JSON.parse(sessionData.resume_content) : null,
      jobDescription: sessionData.jd_content ? JSON.parse(sessionData.jd_content) : null,
      analysisResult: sessionData.analysis,
      suggestions: sessionData.suggestions,
      feedback: sessionData.feedback || [],
      keywordAnalysis: sessionData.keyword_analysis,
      atsScore: sessionData.ats_score,
      comparedAtsScore: sessionData.compared_ats_score,
      createdAt: sessionData.created_at,
      updatedAt: sessionData.updated_at
    };

    // Validate session has required data
    // jobDescription is stored as JSON.stringify(string) and retrieved via JSON.parse
    // So it should always be a string when present
    if (!session.jobDescription || typeof session.jobDescription !== 'string') {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session does not have a job description'
        }
      };
    }

    const jdContent = session.jobDescription;

    if (!session.atsScore) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session does not have an original ATS score'
        }
      };
    }

    if (!session.keywordAnalysis) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Session does not have keyword analysis'
        }
      };
    }

    // Step 5: Extract keywords and qualifications for comparison resume
    // Note: We reuse original keyword extraction but match against new resume
    const [keywordResult, qualResult] = await Promise.all([
      extractKeywords(jdContent),
      extractQualificationsBoth(jdContent, comparisonResume.rawText)
    ]);

    if (keywordResult.error) {
      return {
        data: null,
        error: {
          code: 'LLM_ERROR',
          message: 'Failed to extract keywords'
        }
      };
    }

    // Match keywords against comparison resume
    const matchResult = await matchKeywords(
      comparisonResume.rawText,
      keywordResult.data.keywords
    );

    if (matchResult.error) {
      return {
        data: null,
        error: {
          code: 'LLM_ERROR',
          message: 'Failed to match keywords'
        }
      };
    }

    if (qualResult.error) {
      return {
        data: null,
        error: {
          code: 'LLM_ERROR',
          message: 'Failed to extract qualifications from comparison resume'
        }
      };
    }

    // Step 6: Detect job type
    const jobType = detectJobType(jdContent);

    // Step 7: Run ATS analysis on comparison resume
    const scoreResult = await calculateATSScoreV21Full({
      keywordMatches: matchResult.data.matched,
      extractedKeywords: keywordResult.data.keywords,
      jdQualifications: qualResult.data.jdQualifications,
      resumeQualifications: qualResult.data.resumeQualifications,
      parsedResume: comparisonResume,
      jdContent,
      jobType,
    });

    if (scoreResult.error) {
      return {
        data: null,
        error: {
          code: 'LLM_ERROR',
          message: 'Failed to calculate ATS score for comparison resume'
        }
      };
    }

    const comparedScore = scoreResult.data;

    // Step 8: Calculate improvement metrics
    const originalScore = session.atsScore;
    const improvementPoints = comparedScore.overall - originalScore.overall;
    const improvementPercentage = originalScore.overall > 0
      ? (improvementPoints / originalScore.overall) * 100
      : 0;

    // Check if both scores have tier property (V2/V2.1 scores)
    const originalTier = (originalScore as any).tier;
    const tierChange = originalTier && originalTier !== comparedScore.tier
      ? {
          from: originalTier,
          to: comparedScore.tier
        }
      : undefined;

    // Step 9: Save comparison score to database using service role
    console.log('[compareResume] Saving compared score:', {
      sessionId,
      hasComparedScore: !!comparedScore,
      scoreValue: comparedScore.totalScore
    });

    const { error: updateError } = await serviceClient
      .from('sessions')
      .update({ compared_ats_score: comparedScore })
      .eq('id', sessionId)
      .eq('user_id', user.id); // Validate ownership

    console.log('[compareResume] Save result:', {
      success: !updateError,
      hasError: !!updateError,
      errorMessage: updateError?.message
    });

    if (updateError) {
      console.error('[compareResume] Failed to save score:', updateError);
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Failed to save comparison score'
        }
      };
    }

    // Step 10: Return comparison results
    return {
      data: {
        originalScore,
        comparedScore,
        improvementPoints,
        improvementPercentage,
        tierChange
      },
      error: null
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[compareResume] Unexpected error:', error);

    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Comparison failed: ${message}`
      }
    };
  }
}
