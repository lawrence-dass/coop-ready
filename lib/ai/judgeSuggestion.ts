/**
 * Judge Suggestion LLM Function
 * Story 12.1: Implement LLM-as-Judge Pipeline Step
 *
 * Evaluates a single suggestion for quality before showing to user
 */

import { ChatAnthropic } from '@langchain/anthropic';
import type { ActionResponse } from '@/types';
import type {
  JudgeResult,
  SuggestionContext,
  JudgeCriteriaScores,
  JudgeRecommendation,
} from '@/types/judge';
import { DEFAULT_QUALITY_THRESHOLD, BORDERLINE_THRESHOLD_LOW } from '@/types/judge';
import { buildJudgePrompt } from './judgePrompt';
import { withTimeout } from '@/lib/utils/withTimeout';
import { logJudgeTrace } from '@/lib/metrics/judgeTrace';

// ============================================================================
// CONSTANTS
// ============================================================================

const JUDGE_TIMEOUT_MS = 5000; // 5 seconds per suggestion
const JUDGE_MODEL = 'claude-3-5-haiku-20241022'; // Cost-efficient model

// ============================================================================
// TYPES
// ============================================================================

/**
 * Raw JSON response from LLM judge
 */
interface JudgeLLMResponse {
  authenticity: number;
  clarity: number;
  ats_relevance: number;
  actionability: number;
  overall_score: number;
  reasoning: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Cheap gate: Detect near-duplicate suggestions (no meaningful change)
 * Returns true if suggestion is essentially the same as original
 *
 * Uses character-level Jaccard similarity for simplicity and speed.
 * Threshold is 95% to be conservative and avoid false positives.
 */
function isNearDuplicate(original: string, suggested: string): boolean {
  // Normalize for comparison
  const normalizedOriginal = original.toLowerCase().trim().replace(/\s+/g, ' ');
  const normalizedSuggested = suggested.toLowerCase().trim().replace(/\s+/g, ' ');

  // Exact match
  if (normalizedOriginal === normalizedSuggested) {
    return true;
  }

  // Character-level Jaccard similarity
  const originalChars = new Set(normalizedOriginal.split(''));
  const suggestedChars = new Set(normalizedSuggested.split(''));
  const intersection = [...originalChars].filter(c => suggestedChars.has(c)).length;
  const union = new Set([...originalChars, ...suggestedChars]).size;
  const similarity = union > 0 ? intersection / union : 0;

  return similarity > 0.95; // 95% similar = near duplicate
}

/**
 * Validate criteria scores from LLM response
 */
function validateCriteriaScores(scores: Partial<JudgeCriteriaScores>): {
  valid: boolean;
  error?: string;
} {
  const requiredFields: (keyof JudgeCriteriaScores)[] = [
    'authenticity',
    'clarity',
    'ats_relevance',
    'actionability',
  ];

  for (const field of requiredFields) {
    const value = scores[field];
    if (
      typeof value !== 'number' ||
      value < 0 ||
      value > 25 ||
      !Number.isInteger(value)
    ) {
      return {
        valid: false,
        error: `Invalid ${field} score: ${value} (expected integer 0-25)`,
      };
    }
  }

  return { valid: true };
}

/**
 * Determine recommendation based on score and threshold
 */
function determineRecommendation(
  score: number,
  threshold: number
): JudgeRecommendation {
  if (score >= threshold) {
    return 'accept';
  } else if (score >= BORDERLINE_THRESHOLD_LOW) {
    return 'flag'; // Borderline case
  } else {
    return 'regenerate'; // Low quality
  }
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Judge a single suggestion for quality
 *
 * Uses Claude Haiku for cost efficiency (~$0.001 per suggestion)
 *
 * **Quality Criteria:**
 * - Authenticity: No fabrication (0-25)
 * - Clarity: Professional language (0-25)
 * - ATS Relevance: Keyword optimization (0-25)
 * - Actionability: Specific improvements (0-25)
 * - Total: 0-100 (pass threshold: 60)
 *
 * **Error Handling:**
 * - Invalid JSON: Return score 0 (fails)
 * - Timeout: Return pass to avoid blocking user
 * - API error: Graceful fallback
 *
 * @param suggestion - The suggested text to evaluate
 * @param context - Context for evaluation (original, JD, section type)
 * @param suggestionId - Unique identifier for this suggestion
 * @param threshold - Quality threshold (default: 60)
 * @returns ActionResponse with JudgeResult or error
 */
export async function judgeSuggestion(
  suggestion: string,
  context: SuggestionContext,
  suggestionId: string,
  threshold: number = DEFAULT_QUALITY_THRESHOLD
): Promise<ActionResponse<JudgeResult>> {
  try {
    console.log(`[SS:judge] Judging suggestion ${suggestionId} (${context.section_type})...`);

    // Validation
    if (!suggestion || suggestion.trim().length === 0) {
      return {
        data: null,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Suggestion text is required',
        },
      };
    }

    // Cheap gate: near-duplicate detection
    if (isNearDuplicate(context.original_text, suggestion)) {
      console.log(`[SS:judge] ${suggestionId} flagged as near-duplicate (cheap gate)`);
      return {
        data: {
          suggestion_id: suggestionId,
          quality_score: 25,
          passed: false,
          reasoning: 'Near-duplicate: suggestion is essentially unchanged from original',
          criteria_breakdown: {
            authenticity: 25, // Not fabricated
            clarity: 0,       // No improvement
            ats_relevance: 0, // No keyword work
            actionability: 0, // Not actionable
          },
          recommendation: 'regenerate',
        },
        error: null,
      };
    }

    // Initialize LLM (Haiku for speed and cost)
    const model = new ChatAnthropic({
      modelName: JUDGE_MODEL,
      temperature: 0, // Deterministic evaluation
      maxTokens: 300,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Build prompt
    const prompt = buildJudgePrompt(suggestion, context);

    // Invoke LLM with timeout
    const response = await withTimeout(
      model.invoke(prompt),
      JUDGE_TIMEOUT_MS,
      'Judge evaluation timed out'
    );

    const responseText = response.content.toString().trim();

    // Parse JSON response
    let parsed: JudgeLLMResponse;
    try {
      // Remove markdown code blocks if present
      const jsonText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      parsed = JSON.parse(jsonText);
    } catch (parseError) {
      console.error(`[SS:judge] JSON parse error for ${suggestionId}:`, parseError);
      // Return failed result on parse error
      return {
        data: {
          suggestion_id: suggestionId,
          quality_score: 0,
          passed: false,
          reasoning: 'Failed to parse judge response',
          criteria_breakdown: {
            authenticity: 0,
            clarity: 0,
            ats_relevance: 0,
            actionability: 0,
          },
          recommendation: 'regenerate',
        },
        error: null,
      };
    }

    // Validate criteria scores
    const criteriaValidation = validateCriteriaScores({
      authenticity: parsed.authenticity,
      clarity: parsed.clarity,
      ats_relevance: parsed.ats_relevance,
      actionability: parsed.actionability,
    });

    if (!criteriaValidation.valid) {
      console.error(
        `[SS:judge] Invalid criteria for ${suggestionId}:`,
        criteriaValidation.error
      );
      return {
        data: {
          suggestion_id: suggestionId,
          quality_score: 0,
          passed: false,
          reasoning: criteriaValidation.error || 'Invalid scores',
          criteria_breakdown: {
            authenticity: 0,
            clarity: 0,
            ats_relevance: 0,
            actionability: 0,
          },
          recommendation: 'regenerate',
        },
        error: null,
      };
    }

    // Validate overall_score
    if (
      typeof parsed.overall_score !== 'number' ||
      parsed.overall_score < 0 ||
      parsed.overall_score > 100
    ) {
      console.error(
        `[SS:judge] Invalid overall_score for ${suggestionId}:`,
        parsed.overall_score
      );
      return {
        data: {
          suggestion_id: suggestionId,
          quality_score: 0,
          passed: false,
          reasoning: 'Invalid overall score',
          criteria_breakdown: {
            authenticity: parsed.authenticity,
            clarity: parsed.clarity,
            ats_relevance: parsed.ats_relevance,
            actionability: parsed.actionability,
          },
          recommendation: 'regenerate',
        },
        error: null,
      };
    }

    // Validate reasoning
    if (!parsed.reasoning || typeof parsed.reasoning !== 'string') {
      parsed.reasoning = 'No reasoning provided';
    }

    // Determine pass/fail
    const passed = parsed.overall_score >= threshold;
    const recommendation = determineRecommendation(
      parsed.overall_score,
      threshold
    );

    console.log(
      `[SS:judge] ${suggestionId} scored ${parsed.overall_score}/100 (${passed ? 'PASS' : 'FAIL'})`
    );

    // Build judge result
    const judgeResult: JudgeResult = {
      suggestion_id: suggestionId,
      quality_score: parsed.overall_score,
      passed,
      reasoning: parsed.reasoning,
      criteria_breakdown: {
        authenticity: parsed.authenticity,
        clarity: parsed.clarity,
        ats_relevance: parsed.ats_relevance,
        actionability: parsed.actionability,
      },
      recommendation,
    };

    // Story 12.2: Detailed trace logging (enabled via DEBUG=judge)
    logJudgeTrace(judgeResult, context.section_type, {
      original_text: context.original_text,
      suggested_text: suggestion,
    });

    return { data: judgeResult, error: null };
  } catch (error) {
    console.error(`[SS:judge] Error judging ${suggestionId}:`, error);

    // Check if timeout error - return pass to avoid blocking user
    if (error instanceof Error && error.message.includes('TIMEOUT')) {
      console.warn(
        `[SS:judge] Timeout for ${suggestionId}, returning pass (graceful degradation)`
      );
      return {
        data: {
          suggestion_id: suggestionId,
          quality_score: threshold, // Pass by default
          passed: true,
          reasoning: 'Judge timed out - passed by default',
          criteria_breakdown: {
            authenticity: Math.floor(threshold / 4),
            clarity: Math.floor(threshold / 4),
            ats_relevance: Math.floor(threshold / 4),
            actionability: Math.floor(threshold / 4),
          },
          recommendation: 'accept',
        },
        error: null,
      };
    }

    // Generic LLM error - return error so callers can distinguish from legitimate low scores
    return {
      data: null,
      error: {
        code: 'LLM_ERROR',
        message: error instanceof Error ? error.message : 'Judge evaluation failed',
      },
    };
  }
}
