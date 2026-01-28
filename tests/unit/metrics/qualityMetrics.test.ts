/**
 * Unit Tests for Quality Metrics Collection
 * Story 12.2: Task 17 - Test metrics collection from judge results
 */

import { describe, it, expect } from 'vitest';
import {
  collectQualityMetrics,
  calculatePassRate,
  calculateScoreDistribution,
  calculateCriteriaAverages,
} from '@/lib/metrics/qualityMetrics';
import type { JudgeResult } from '@/types/judge';

describe('collectQualityMetrics', () => {
  const mockJudgeResults: JudgeResult[] = [
    {
      suggestion_id: 'test-1',
      quality_score: 82,
      passed: true,
      reasoning: 'Strong suggestion',
      criteria_breakdown: {
        authenticity: 20,
        clarity: 22,
        ats_relevance: 21,
        actionability: 19,
      },
      recommendation: 'accept',
    },
    {
      suggestion_id: 'test-2',
      quality_score: 45,
      passed: false,
      reasoning: 'Too vague',
      criteria_breakdown: {
        authenticity: 12,
        clarity: 10,
        ats_relevance: 13,
        actionability: 10,
      },
      recommendation: 'regenerate',
    },
    {
      suggestion_id: 'test-3',
      quality_score: 75,
      passed: true,
      reasoning: 'Good suggestion',
      criteria_breakdown: {
        authenticity: 19,
        clarity: 19,
        ats_relevance: 18,
        actionability: 19,
      },
      recommendation: 'accept',
    },
  ];

  it('should calculate pass rate correctly', () => {
    const metrics = collectQualityMetrics(
      mockJudgeResults,
      'summary',
      'opt-123'
    );

    expect(metrics.total_evaluated).toBe(3);
    expect(metrics.passed).toBe(2);
    expect(metrics.failed).toBe(1);
    expect(metrics.pass_rate).toBeCloseTo(66.67, 1);
  });

  it('should calculate average score correctly', () => {
    const metrics = collectQualityMetrics(
      mockJudgeResults,
      'summary',
      'opt-123'
    );

    // Average: (82 + 45 + 75) / 3 = 67.33
    expect(metrics.avg_score).toBeCloseTo(67.33, 1);
  });

  it('should calculate score distribution correctly', () => {
    const metrics = collectQualityMetrics(
      mockJudgeResults,
      'summary',
      'opt-123'
    );

    expect(metrics.score_distribution.range_0_20).toBe(0);
    expect(metrics.score_distribution.range_20_40).toBe(0);
    expect(metrics.score_distribution.range_40_60).toBe(1); // 45
    expect(metrics.score_distribution.range_60_80).toBe(1); // 75
    expect(metrics.score_distribution.range_80_100).toBe(1); // 82
  });

  it('should calculate criteria averages correctly', () => {
    const metrics = collectQualityMetrics(
      mockJudgeResults,
      'summary',
      'opt-123'
    );

    // Authenticity: (20 + 12 + 19) / 3 = 17
    expect(metrics.criteria_avg.authenticity).toBeCloseTo(17, 0);
    // Clarity: (22 + 10 + 19) / 3 = 17
    expect(metrics.criteria_avg.clarity).toBeCloseTo(17, 0);
    // ATS: (21 + 13 + 18) / 3 = 17.33
    expect(metrics.criteria_avg.ats_relevance).toBeCloseTo(17.33, 1);
    // Actionability: (19 + 10 + 19) / 3 = 16
    expect(metrics.criteria_avg.actionability).toBeCloseTo(16, 0);
  });

  it('should identify failure patterns', () => {
    const metrics = collectQualityMetrics(
      mockJudgeResults,
      'summary',
      'opt-123'
    );

    // One failed result (test-2) - failed all criteria (score < 15 per criterion)
    expect(metrics.failure_breakdown.clarity_failures).toBe(1);
    expect(metrics.failure_breakdown.actionability_failures).toBe(1);
  });

  it('should handle all passing results', () => {
    const allPassing: JudgeResult[] = [
      {
        suggestion_id: 'pass-1',
        quality_score: 85,
        passed: true,
        reasoning: 'Excellent',
        criteria_breakdown: {
          authenticity: 21,
          clarity: 22,
          ats_relevance: 21,
          actionability: 21,
        },
        recommendation: 'accept',
      },
      {
        suggestion_id: 'pass-2',
        quality_score: 90,
        passed: true,
        reasoning: 'Outstanding',
        criteria_breakdown: {
          authenticity: 23,
          clarity: 22,
          ats_relevance: 23,
          actionability: 22,
        },
        recommendation: 'accept',
      },
    ];

    const metrics = collectQualityMetrics(allPassing, 'skills', 'opt-456');

    expect(metrics.pass_rate).toBe(100);
    expect(metrics.failed).toBe(0);
    expect(metrics.failure_breakdown.authenticity_failures).toBe(0);
    expect(metrics.failure_breakdown.clarity_failures).toBe(0);
    expect(metrics.failure_breakdown.ats_failures).toBe(0);
    expect(metrics.failure_breakdown.actionability_failures).toBe(0);
  });

  it('should handle all failing results', () => {
    const allFailing: JudgeResult[] = [
      {
        suggestion_id: 'fail-1',
        quality_score: 30,
        passed: false,
        reasoning: 'Poor quality',
        criteria_breakdown: {
          authenticity: 8,
          clarity: 7,
          ats_relevance: 8,
          actionability: 7,
        },
        recommendation: 'regenerate',
      },
      {
        suggestion_id: 'fail-2',
        quality_score: 25,
        passed: false,
        reasoning: 'Very weak',
        criteria_breakdown: {
          authenticity: 6,
          clarity: 6,
          ats_relevance: 7,
          actionability: 6,
        },
        recommendation: 'regenerate',
      },
    ];

    const metrics = collectQualityMetrics(allFailing, 'experience', 'opt-789');

    expect(metrics.pass_rate).toBe(0);
    expect(metrics.passed).toBe(0);
    expect(metrics.failed).toBe(2);
  });

  it('should handle empty results array', () => {
    const metrics = collectQualityMetrics([], 'summary', 'opt-empty');

    expect(metrics.total_evaluated).toBe(0);
    expect(metrics.passed).toBe(0);
    expect(metrics.failed).toBe(0);
    expect(metrics.pass_rate).toBe(0);
    expect(metrics.avg_score).toBe(0);
  });

  it('should include timestamp and optimization_id', () => {
    const metrics = collectQualityMetrics(
      mockJudgeResults,
      'summary',
      'opt-timestamp-test'
    );

    expect(metrics.optimization_id).toBe('opt-timestamp-test');
    expect(metrics.timestamp).toBeDefined();
    expect(new Date(metrics.timestamp).getTime()).toBeGreaterThan(0);
  });

  it('should include section type', () => {
    const metrics = collectQualityMetrics(mockJudgeResults, 'skills', 'opt-123');

    expect(metrics.section).toBe('skills');
  });
});

describe('calculatePassRate', () => {
  it('should return 0 for empty array', () => {
    expect(calculatePassRate([])).toBe(0);
  });

  it('should calculate percentage correctly', () => {
    const results: JudgeResult[] = [
      { passed: true } as JudgeResult,
      { passed: false } as JudgeResult,
      { passed: true } as JudgeResult,
      { passed: true } as JudgeResult,
    ];

    expect(calculatePassRate(results)).toBe(75);
  });
});

describe('calculateScoreDistribution', () => {
  it('should categorize scores into quintiles', () => {
    const results: JudgeResult[] = [
      { quality_score: 10 } as JudgeResult,
      { quality_score: 35 } as JudgeResult,
      { quality_score: 55 } as JudgeResult,
      { quality_score: 70 } as JudgeResult,
      { quality_score: 95 } as JudgeResult,
    ];

    const distribution = calculateScoreDistribution(results);

    expect(distribution.range_0_20).toBe(1);
    expect(distribution.range_20_40).toBe(1);
    expect(distribution.range_40_60).toBe(1);
    expect(distribution.range_60_80).toBe(1);
    expect(distribution.range_80_100).toBe(1);
  });

  it('should handle edge case scores', () => {
    // Ranges: [0,20), [20,40), [40,60), [60,80), [80,100]
    const results: JudgeResult[] = [
      { quality_score: 0 } as JudgeResult,
      { quality_score: 20 } as JudgeResult,
      { quality_score: 40 } as JudgeResult,
      { quality_score: 60 } as JudgeResult,
      { quality_score: 80 } as JudgeResult,
      { quality_score: 100 } as JudgeResult,
    ];

    const distribution = calculateScoreDistribution(results);

    expect(distribution.range_0_20).toBe(1); // 0
    expect(distribution.range_20_40).toBe(1); // 20
    expect(distribution.range_40_60).toBe(1); // 40
    expect(distribution.range_60_80).toBe(1); // 60
    expect(distribution.range_80_100).toBe(2); // 80, 100
  });
});

describe('calculateCriteriaAverages', () => {
  it('should calculate averages for all criteria', () => {
    const results: JudgeResult[] = [
      {
        criteria_breakdown: {
          authenticity: 20,
          clarity: 22,
          ats_relevance: 18,
          actionability: 20,
        },
      } as JudgeResult,
      {
        criteria_breakdown: {
          authenticity: 18,
          clarity: 20,
          ats_relevance: 22,
          actionability: 18,
        },
      } as JudgeResult,
    ];

    const averages = calculateCriteriaAverages(results);

    expect(averages.authenticity).toBe(19);
    expect(averages.clarity).toBe(21);
    expect(averages.ats_relevance).toBe(20);
    expect(averages.actionability).toBe(19);
  });

  it('should return zeros for empty array', () => {
    const averages = calculateCriteriaAverages([]);

    expect(averages.authenticity).toBe(0);
    expect(averages.clarity).toBe(0);
    expect(averages.ats_relevance).toBe(0);
    expect(averages.actionability).toBe(0);
  });
});
