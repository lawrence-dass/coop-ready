/**
 * Quality Metrics Collection
 * Story 12.2: Task 4 - Collect quality metrics from judge results
 *
 * Gathers comprehensive metrics from LLM judge evaluations
 */

import type { JudgeResult } from '@/types/judge';
import type {
  QualityMetricLog,
  ScoreDistribution,
  CriteriaAverages,
  FailureBreakdown,
  FailurePattern,
} from '@/types/metrics';
import { CRITERION_FAILURE_THRESHOLD } from '@/types/metrics';
import { extractFailurePatterns } from './failureAnalyzer';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate pass rate as percentage
 */
export function calculatePassRate(results: JudgeResult[]): number {
  if (results.length === 0) return 0;
  const passed = results.filter((r) => r.passed).length;
  return Math.round((passed / results.length) * 100 * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate average quality score
 */
function calculateAverageScore(results: JudgeResult[]): number {
  if (results.length === 0) return 0;
  const sum = results.reduce((acc, r) => acc + r.quality_score, 0);
  return Math.round((sum / results.length) * 100) / 100; // Round to 2 decimals
}

/**
 * Calculate score distribution across quintiles
 */
export function calculateScoreDistribution(
  results: JudgeResult[]
): ScoreDistribution {
  const distribution: ScoreDistribution = {
    range_0_20: 0,
    range_20_40: 0,
    range_40_60: 0,
    range_60_80: 0,
    range_80_100: 0,
  };

  for (const result of results) {
    const score = result.quality_score;
    if (score < 20) {
      distribution.range_0_20++;
    } else if (score < 40) {
      distribution.range_20_40++;
    } else if (score < 60) {
      distribution.range_40_60++;
    } else if (score < 80) {
      distribution.range_60_80++;
    } else {
      distribution.range_80_100++;
    }
  }

  return distribution;
}

/**
 * Calculate average scores for each criterion
 */
export function calculateCriteriaAverages(
  results: JudgeResult[]
): CriteriaAverages {
  if (results.length === 0) {
    return {
      authenticity: 0,
      clarity: 0,
      ats_relevance: 0,
      actionability: 0,
    };
  }

  const totals = results.reduce(
    (acc, r) => ({
      authenticity: acc.authenticity + r.criteria_breakdown.authenticity,
      clarity: acc.clarity + r.criteria_breakdown.clarity,
      ats_relevance: acc.ats_relevance + r.criteria_breakdown.ats_relevance,
      actionability: acc.actionability + r.criteria_breakdown.actionability,
    }),
    { authenticity: 0, clarity: 0, ats_relevance: 0, actionability: 0 }
  );

  return {
    authenticity: Math.round((totals.authenticity / results.length) * 100) / 100,
    clarity: Math.round((totals.clarity / results.length) * 100) / 100,
    ats_relevance: Math.round((totals.ats_relevance / results.length) * 100) / 100,
    actionability: Math.round((totals.actionability / results.length) * 100) / 100,
  };
}

/**
 * Calculate failure breakdown by criterion
 */
function calculateFailureBreakdown(results: JudgeResult[]): FailureBreakdown {
  const breakdown: FailureBreakdown = {
    authenticity_failures: 0,
    clarity_failures: 0,
    ats_failures: 0,
    actionability_failures: 0,
  };

  for (const result of results) {
    if (!result.passed) {
      // A criterion "failed" if its score is below threshold (< 15)
      if (result.criteria_breakdown.authenticity < CRITERION_FAILURE_THRESHOLD) {
        breakdown.authenticity_failures++;
      }
      if (result.criteria_breakdown.clarity < CRITERION_FAILURE_THRESHOLD) {
        breakdown.clarity_failures++;
      }
      if (result.criteria_breakdown.ats_relevance < CRITERION_FAILURE_THRESHOLD) {
        breakdown.ats_failures++;
      }
      if (result.criteria_breakdown.actionability < CRITERION_FAILURE_THRESHOLD) {
        breakdown.actionability_failures++;
      }
    }
  }

  return breakdown;
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Collect comprehensive quality metrics from judge results
 *
 * Gathers metrics including:
 * - Pass/fail counts and rates
 * - Average scores
 * - Score distribution
 * - Criteria breakdowns
 * - Failure patterns
 *
 * @param results - Array of judge results from evaluation
 * @param section - Section type (summary, skills, experience)
 * @param optimizationId - Unique identifier for this optimization
 * @returns Comprehensive quality metrics log
 */
export function collectQualityMetrics(
  results: JudgeResult[],
  section: 'summary' | 'skills' | 'experience' | 'education' | 'projects' | 'all',
  optimizationId: string
): QualityMetricLog {
  const passed = results.filter((r) => r.passed).length;
  const failed = results.length - passed;

  return {
    timestamp: new Date().toISOString(),
    optimization_id: optimizationId,
    section,
    total_evaluated: results.length,
    passed,
    failed,
    pass_rate: calculatePassRate(results),
    avg_score: calculateAverageScore(results),
    score_distribution: calculateScoreDistribution(results),
    criteria_avg: calculateCriteriaAverages(results),
    failure_breakdown: calculateFailureBreakdown(results),
    common_failures: extractFailurePatterns(results),
  };
}
