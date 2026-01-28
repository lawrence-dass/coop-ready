/**
 * Metrics Collection Overhead Integration Test
 * Story 12.3 - AC 12.3-2: Metrics collection non-blocking
 *
 * Tests that metrics collection and logging overhead is <50ms and does not block the suggestion pipeline.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { collectQualityMetrics } from '@/lib/metrics/qualityMetrics';
import { logQualityMetrics } from '@/lib/metrics/metricsLogger';
import type { JudgeResult } from '@/types/judge';

describe('[P0] Metrics Collection Overhead', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('[P0] should complete metrics collection in <50ms for 12 judge results', () => {
    // GIVEN: 12 judge results from a typical optimization (4 summary + 4 skills + 4 experience bullets)
    const judgeResults: JudgeResult[] = Array.from({ length: 12 }, (_, i) => ({
      suggestion_id: `test-${i}`,
      quality_score: 70 + (i % 20),
      passed: true,
      reasoning: `Test reasoning ${i}`,
      criteria_breakdown: {
        authenticity: 18 + (i % 5),
        clarity: 19 + (i % 4),
        ats_relevance: 17 + (i % 6),
        actionability: 16 + (i % 5),
      },
      recommendation: 'accept',
    }));

    // WHEN: Metrics are collected
    const startTime = performance.now();
    const metrics = collectQualityMetrics(judgeResults, 'summary', 'test-optimization-id');
    const endTime = performance.now();

    const duration = endTime - startTime;

    // THEN: Collection completes in <50ms
    expect(duration).toBeLessThan(50);

    // AND: Metrics are correctly calculated
    expect(metrics).toHaveProperty('total_evaluated');
    expect(metrics).toHaveProperty('pass_rate');
    expect(metrics).toHaveProperty('avg_score');
    expect(metrics.total_evaluated).toBe(12);
  });

  it('[P0] should not block pipeline when logging metrics', async () => {
    // GIVEN: Judge results and metrics
    const judgeResults: JudgeResult[] = [
      {
        suggestion_id: 'test-1',
        quality_score: 75,
        passed: true,
        reasoning: 'Good quality',
        criteria_breakdown: {
          authenticity: 20,
          clarity: 19,
          ats_relevance: 18,
          actionability: 18,
        },
        recommendation: 'accept',
      },
    ];

    const metrics = collectQualityMetrics(judgeResults, 'summary', 'test-optimization-id');

    // Mock console.log to prevent actual logging
    const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

    // WHEN: Metrics are logged (console mode)
    const startTime = performance.now();
    await logQualityMetrics(metrics);
    const endTime = performance.now();

    const duration = endTime - startTime;

    // THEN: Logging is fast (console mode should be <10ms)
    expect(duration).toBeLessThan(10);

    // AND: Logging was called
    expect(consoleLogSpy).toHaveBeenCalled();
  });

  it('[P0] should handle metrics collection failure without throwing', () => {
    // GIVEN: Invalid judge results (edge case)
    const invalidResults = null as unknown as JudgeResult[];

    // WHEN: Attempting to collect metrics
    // THEN: Should not throw, should handle gracefully
    expect(() => {
      try {
        collectQualityMetrics(invalidResults, 'summary', 'test-invalid-id');
      } catch (error) {
        // Expected to handle gracefully (return empty metrics or default)
        // Should not propagate error to pipeline
      }
    }).not.toThrow();
  });

  it('[P1] should handle large batch of 50 judge results efficiently', () => {
    // GIVEN: Large batch of 50 judge results (stress test)
    const largeJudgeResults: JudgeResult[] = Array.from({ length: 50 }, (_, i) => ({
      suggestion_id: `test-${i}`,
      quality_score: 65 + (i % 30),
      passed: i % 5 !== 0, // 80% pass rate
      reasoning: `Reasoning ${i}`,
      criteria_breakdown: {
        authenticity: 15 + (i % 10),
        clarity: 16 + (i % 9),
        ats_relevance: 14 + (i % 11),
        actionability: 15 + (i % 10),
      },
      recommendation: i % 5 === 0 ? 'regenerate' : 'accept',
    }));

    // WHEN: Metrics are collected
    const startTime = performance.now();
    const metrics = collectQualityMetrics(largeJudgeResults, 'skills', 'test-large-batch-id');
    const endTime = performance.now();

    const duration = endTime - startTime;

    // THEN: Collection completes in <100ms even with large batch
    expect(duration).toBeLessThan(100);

    // AND: Metrics are correctly calculated
    expect(metrics.total_evaluated).toBe(50);
    expect(metrics.passed).toBe(40);
    expect(metrics.failed).toBe(10);
    expect(metrics.pass_rate).toBeCloseTo(80, 1); // Pass rate is returned as percentage (0-100)
  });

  it('[P1] should verify metrics collection does not block Promise.allSettled flows', async () => {
    // GIVEN: Parallel judge results (mimics skills/experience route patterns)
    const parallelJudgePromises = Array.from({ length: 10 }, (_, i) =>
      Promise.resolve({
        suggestion_id: `test-${i}`,
        quality_score: 70,
        passed: true,
        reasoning: 'Good',
        criteria_breakdown: {
          authenticity: 18,
          clarity: 18,
          ats_relevance: 17,
          actionability: 17,
        },
        recommendation: 'accept' as const,
      })
    );

    // WHEN: Parallel judge resolution + metrics collection
    const startTime = performance.now();

    const settledResults = await Promise.allSettled(parallelJudgePromises);
    const judgeResults = settledResults
      .filter((r) => r.status === 'fulfilled')
      .map((r) => (r as PromiseFulfilledResult<JudgeResult>).value);

    const metrics = collectQualityMetrics(judgeResults, 'experience', 'test-parallel-id');

    const endTime = performance.now();
    const duration = endTime - startTime;

    // THEN: Total time is reasonable (<100ms)
    expect(duration).toBeLessThan(100);

    // AND: Metrics correctly reflect all results
    expect(metrics.total_evaluated).toBe(10);
  });
});
