/**
 * Optimization API Route
 * Story 6.1: Implement LLM Pipeline API Route
 *
 * Orchestrates the LLM optimization pipeline:
 * 1. Extract keywords from job description
 * 2. Extract qualifications from JD and resume
 * 3. Match keywords against resume
 * 4. Detect job type (co-op vs full-time)
 * 5. Calculate V2.1 ATS score
 * 6. Save results to session
 *
 * **Features:**
 * - 60-second timeout with graceful handling
 * - ActionResponse pattern (never throws)
 * - Prompt injection defense (delegated to AI functions)
 * - Session persistence
 * - V2.1 scoring with 5 components
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ActionResponse } from '@/types';
import type { KeywordAnalysisResult, ATSScore } from '@/types/analysis';
import type { Resume } from '@/types/optimization';
import { extractKeywords } from '@/lib/ai/extractKeywords';
import { matchKeywords } from '@/lib/ai/matchKeywords';
import { calculateATSScore, calculateATSScoreV21Full } from '@/lib/ai/calculateATSScore';
import { extractQualificationsBoth } from '@/lib/ai/extractQualifications';
import { detectJobType } from '@/lib/scoring';
import { createClient } from '@/lib/supabase/server';
import { withTimeout } from '@/lib/utils/withTimeout';

// ============================================================================
// TYPES
// ============================================================================

interface OptimizeRequest {
  resume_content: string;
  jd_content: string;
  session_id: string;
  anonymous_id: string;
}

interface OptimizationResult {
  keywordAnalysis: KeywordAnalysisResult;
  atsScore: ATSScore;
  sessionId: string;
  analysisTimeMs?: number; // Time taken to analyze resume in milliseconds
}

// ============================================================================
// CONSTANTS
// ============================================================================

const TIMEOUT_MS = 60000; // 60 seconds

/**
 * Extract basic resume sections using simple heuristics.
 * Full section parsing is handled by Epic 3.5.
 * Returns undefined for sections not found to avoid inflating section coverage score.
 */
function extractBasicSections(rawText: string): Partial<Pick<Resume, 'summary' | 'skills' | 'experience'>> {
  const lower = rawText.toLowerCase();
  const sections: Partial<Pick<Resume, 'summary' | 'skills' | 'experience'>> = {};

  if (lower.includes('summary') || lower.includes('objective') || lower.includes('profile')) {
    sections.summary = rawText;
  }
  if (lower.includes('skill') || lower.includes('technologies') || lower.includes('technical')) {
    sections.skills = rawText;
  }
  if (lower.includes('experience') || lower.includes('employment') || lower.includes('work history')) {
    sections.experience = rawText;
  }

  return sections;
}

/**
 * Validate request body
 */
function validateRequest(body: unknown): ActionResponse<OptimizeRequest> {
  const req = body as Partial<OptimizeRequest>;

  if (!req.resume_content || req.resume_content.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Resume content is required',
      },
    };
  }

  if (!req.jd_content || req.jd_content.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Job description is required',
      },
    };
  }

  if (!req.session_id || req.session_id.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Session ID is required',
      },
    };
  }

  if (!req.anonymous_id || req.anonymous_id.trim().length === 0) {
    return {
      data: null,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Anonymous ID is required',
      },
    };
  }

  return {
    data: req as OptimizeRequest,
    error: null,
  };
}

// ============================================================================
// MAIN PIPELINE
// ============================================================================

/**
 * Orchestrate the LLM optimization pipeline
 *
 * Pipeline steps:
 * 1. Extract keywords from JD (parallel)
 * 2. Extract qualifications from JD and resume (parallel)
 * 3. Match keywords in resume
 * 4. Detect job type (co-op vs full-time)
 * 5. Calculate V2.1 ATS score
 * 6. Save to session
 *
 * @param request - Validated request data
 * @returns ActionResponse with optimization results
 */
async function runOptimizationPipeline(
  request: OptimizeRequest
): Promise<ActionResponse<OptimizationResult>> {
  const startTime = performance.now(); // Start timing
  try {
    console.log('[SS:optimize] Pipeline started for session:', request.session_id.slice(0, 8) + '...');

    // Step 1 & 2: Extract keywords and qualifications in parallel
    // Note: prompt injection defense (XML wrapping) is handled by extractKeywords/extractQualifications
    const [keywordResult, qualResult] = await Promise.all([
      extractKeywords(request.jd_content),
      extractQualificationsBoth(request.jd_content, request.resume_content),
    ]);

    // Check for extraction errors
    if (keywordResult.error) {
      return {
        data: null,
        error: keywordResult.error,
      };
    }

    if (qualResult.error) {
      return {
        data: null,
        error: qualResult.error,
      };
    }

    // Step 3: Match keywords in resume
    const matchResult = await matchKeywords(
      request.resume_content,
      keywordResult.data.keywords
    );

    if (matchResult.error) {
      return {
        data: null,
        error: matchResult.error,
      };
    }

    // Step 4: Detect job type (co-op vs full-time)
    const jobType = detectJobType(request.jd_content);
    console.log('[SS:optimize] Detected job type:', jobType);

    // Step 5: Calculate V2.1 ATS score
    // Basic section extraction - full parsing handled by Epic 3.5
    const parsedResume: Resume = {
      rawText: request.resume_content,
      ...extractBasicSections(request.resume_content),
    };

    const scoreResult = await calculateATSScoreV21Full({
      keywordMatches: matchResult.data.matched,
      extractedKeywords: keywordResult.data.keywords,
      jdQualifications: qualResult.data.jdQualifications,
      resumeQualifications: qualResult.data.resumeQualifications,
      parsedResume,
      jdContent: request.jd_content,
      jobType,
    });

    if (scoreResult.error) {
      return {
        data: null,
        error: scoreResult.error,
      };
    }

    // Step 6: Enhance keyword analysis with ATS keyword score
    // This helps users understand the difference between match rate (92%) and keyword score (100)
    const enhancedKeywordAnalysis: KeywordAnalysisResult = {
      ...matchResult.data,
      keywordScore: Math.round(scoreResult.data.breakdown.keywordScore), // Add weighted keyword score from ATS
    };

    // Step 6b: Calculate pipeline metrics (before final timing)
    const preMetricsTime = performance.now();
    const pipelineMetrics = {
      totalAnalysisTimeMs: Math.round(preMetricsTime - startTime),
      contentMetrics: {
        resumeWordCount: request.resume_content.split(/\s+/).length,
        resumeCharCount: request.resume_content.length,
        jdWordCount: request.jd_content.split(/\s+/).length,
        jdCharCount: request.jd_content.length,
      },
      llmMetrics: {
        totalCalls: 3, // extractKeywords + extractQualificationsBoth + matchKeywords
        model: 'claude-3-5-haiku-20241022',
        // Note: Actual token counts would require tracking from LangChain
        estimatedCostUsd: 0.003, // Approximate: 3 Haiku calls @ ~$0.001 each
      },
      qualityMetrics: {
        keywordMatchRate: matchResult.data.matchRate,
        atsScoreOverall: scoreResult.data.overall,
        atsTier: scoreResult.data.tier,
        detectedJobType: jobType,
      },
    };

    // Step 6c: Enhance ATS score with pipeline metrics in metadata
    const enhancedATSScore = {
      ...scoreResult.data,
      metadata: {
        ...scoreResult.data.metadata,
        pipelineMetrics,
      },
    };

    // Step 7: Save results to session using server client (with pipeline metrics)
    try {
      const supabase = await createClient();
      const { error: updateError } = await supabase
        .from('sessions')
        .update({
          keyword_analysis: enhancedKeywordAnalysis,
          ats_score: enhancedATSScore, // Now includes pipelineMetrics in metadata
        })
        .eq('id', request.session_id);

      if (updateError) {
        console.error('[optimize] Session update failed:', updateError.message);
      } else {
        console.log('[optimize] Session updated successfully');
      }
    } catch (updateErr) {
      console.error('[optimize] Session update error:', updateErr);
    }

    // Calculate analysis time
    const endTime = performance.now();
    const analysisTimeMs = Math.round(endTime - startTime);

    // Return results
    console.log('[SS:optimize] Pipeline complete. ATS score:', enhancedATSScore.overall);
    console.log(`[SS:optimize] ⏱️  Analysis completed in ${analysisTimeMs}ms (${(analysisTimeMs / 1000).toFixed(2)}s)`);

    return {
      data: {
        keywordAnalysis: enhancedKeywordAnalysis,
        atsScore: enhancedATSScore, // Includes pipelineMetrics in metadata
        sessionId: request.session_id,
        analysisTimeMs, // Include timing in response for browser console
      },
      error: null,
    };
  } catch (error) {
    console.error('[optimize] Pipeline error:', error);
    return {
      data: null,
      error: {
        code: 'LLM_ERROR',
        message: error instanceof Error ? error.message : 'Optimization pipeline failed',
      },
    };
  }
}

// ============================================================================
// API ROUTE HANDLER
// ============================================================================

/**
 * POST /api/optimize
 *
 * Runs the optimization pipeline with timeout enforcement.
 * Always returns JSON with ActionResponse pattern.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        {
          data: null,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid JSON in request body',
          },
        } satisfies ActionResponse<OptimizationResult>,
        { status: 200 }
      );
    }

    // Validate input
    const validation = validateRequest(body);
    if (validation.error) {
      return NextResponse.json(validation, { status: 200 });
    }

    // Run pipeline with 60-second timeout
    const result = await withTimeout(
      runOptimizationPipeline(validation.data),
      TIMEOUT_MS,
      'Optimization pipeline exceeded 60 second timeout'
    );

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    // Handle timeout
    if (error instanceof Error && error.message.includes('TIMEOUT')) {
      const timeoutResponse: ActionResponse<OptimizationResult> = {
        data: null,
        error: {
          code: 'LLM_TIMEOUT',
          message: 'Optimization timed out after 60 seconds. Please try again.',
        },
      };
      return NextResponse.json(timeoutResponse, { status: 200 });
    }

    // Handle other errors
    const errorResponse: ActionResponse<OptimizationResult> = {
      data: null,
      error: {
        code: 'LLM_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
      },
    };
    return NextResponse.json(errorResponse, { status: 200 });
  }
}

/**
 * Return 405 for non-POST requests (ActionResponse pattern)
 */
function methodNotAllowed() {
  return NextResponse.json(
    {
      data: null,
      error: { code: 'VALIDATION_ERROR', message: 'Method not allowed' },
    } satisfies ActionResponse<OptimizationResult>,
    { status: 405 }
  );
}

export async function GET() { return methodNotAllowed(); }
export async function PUT() { return methodNotAllowed(); }
export async function DELETE() { return methodNotAllowed(); }
