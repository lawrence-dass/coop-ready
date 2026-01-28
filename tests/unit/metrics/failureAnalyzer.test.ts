/**
 * Unit Tests for Failure Pattern Analyzer
 * Story 12.2: Task 18 - Test failure pattern extraction and categorization
 */

import { describe, it, expect } from 'vitest';
import { extractFailurePatterns } from '@/lib/metrics/failureAnalyzer';
import type { JudgeResult } from '@/types/judge';

describe('extractFailurePatterns', () => {
  it('should return empty array for no failures', () => {
    const results: JudgeResult[] = [
      {
        suggestion_id: 'pass-1',
        quality_score: 85,
        passed: true,
        reasoning: 'Excellent suggestion',
        criteria_breakdown: {
          authenticity: 21,
          clarity: 22,
          ats_relevance: 21,
          actionability: 21,
        },
        recommendation: 'accept',
      },
    ];

    const patterns = extractFailurePatterns(results);
    expect(patterns).toEqual([]);
  });

  it('should identify authenticity failures', () => {
    const results: JudgeResult[] = [
      {
        suggestion_id: 'fail-1',
        quality_score: 40,
        passed: false,
        reasoning: 'Possible exaggeration in metrics',
        criteria_breakdown: {
          authenticity: 8,
          clarity: 12,
          ats_relevance: 10,
          actionability: 10,
        },
        recommendation: 'regenerate',
      },
    ];

    const patterns = extractFailurePatterns(results);

    expect(patterns).toHaveLength(1);
    expect(patterns[0].criterion).toBe('authenticity');
    expect(patterns[0].reason).toContain('exaggeration');
    expect(patterns[0].count).toBe(1);
  });

  it('should identify clarity failures', () => {
    const results: JudgeResult[] = [
      {
        suggestion_id: 'fail-1',
        quality_score: 35,
        passed: false,
        reasoning: 'Awkward phrasing makes it hard to read',
        criteria_breakdown: {
          authenticity: 10,
          clarity: 7,
          ats_relevance: 10,
          actionability: 8,
        },
        recommendation: 'regenerate',
      },
    ];

    const patterns = extractFailurePatterns(results);

    expect(patterns).toHaveLength(1);
    expect(patterns[0].criterion).toBe('clarity');
    expect(patterns[0].reason).toContain('Awkward phrasing');
  });

  it('should identify ATS relevance failures', () => {
    const results: JudgeResult[] = [
      {
        suggestion_id: 'fail-1',
        quality_score: 45,
        passed: false,
        reasoning: 'Missing keywords from job description',
        criteria_breakdown: {
          authenticity: 12,
          clarity: 13,
          ats_relevance: 10,
          actionability: 10,
        },
        recommendation: 'regenerate',
      },
    ];

    const patterns = extractFailurePatterns(results);

    expect(patterns).toHaveLength(1);
    expect(patterns[0].criterion).toBe('ats_relevance');
    expect(patterns[0].reason).toContain('Missing keywords');
  });

  it('should identify actionability failures', () => {
    const results: JudgeResult[] = [
      {
        suggestion_id: 'fail-1',
        quality_score: 50,
        passed: false,
        reasoning: 'Too vague, not specific enough',
        criteria_breakdown: {
          authenticity: 13,
          clarity: 14,
          ats_relevance: 13,
          actionability: 10,
        },
        recommendation: 'regenerate',
      },
    ];

    const patterns = extractFailurePatterns(results);

    expect(patterns).toHaveLength(1);
    expect(patterns[0].criterion).toBe('actionability');
    expect(patterns[0].reason).toContain('Too vague');
  });

  it('should count duplicate failure reasons', () => {
    const results: JudgeResult[] = [
      {
        suggestion_id: 'fail-1',
        quality_score: 40,
        passed: false,
        reasoning: 'Too vague',
        criteria_breakdown: {
          authenticity: 10,
          clarity: 10,
          ats_relevance: 10,
          actionability: 10,
        },
        recommendation: 'regenerate',
      },
      {
        suggestion_id: 'fail-2',
        quality_score: 45,
        passed: false,
        reasoning: 'Too vague',
        criteria_breakdown: {
          authenticity: 11,
          clarity: 11,
          ats_relevance: 12,
          actionability: 11,
        },
        recommendation: 'regenerate',
      },
      {
        suggestion_id: 'fail-3',
        quality_score: 42,
        passed: false,
        reasoning: 'Too vague',
        criteria_breakdown: {
          authenticity: 10,
          clarity: 11,
          ats_relevance: 11,
          actionability: 10,
        },
        recommendation: 'regenerate',
      },
    ];

    const patterns = extractFailurePatterns(results);

    expect(patterns).toHaveLength(1);
    expect(patterns[0].reason).toBe('Too vague');
    expect(patterns[0].count).toBe(3);
  });

  it('should return top 5 failure patterns sorted by frequency', () => {
    const results: JudgeResult[] = [
      // 3x "Too vague"
      {
        suggestion_id: 'fail-1',
        quality_score: 40,
        passed: false,
        reasoning: 'Too vague',
        criteria_breakdown: {
          authenticity: 10,
          clarity: 10,
          ats_relevance: 10,
          actionability: 10,
        },
        recommendation: 'regenerate',
      },
      {
        suggestion_id: 'fail-2',
        quality_score: 42,
        passed: false,
        reasoning: 'Too vague',
        criteria_breakdown: {
          authenticity: 10,
          clarity: 11,
          ats_relevance: 11,
          actionability: 10,
        },
        recommendation: 'regenerate',
      },
      {
        suggestion_id: 'fail-3',
        quality_score: 43,
        passed: false,
        reasoning: 'Too vague',
        criteria_breakdown: {
          authenticity: 11,
          clarity: 11,
          ats_relevance: 11,
          actionability: 10,
        },
        recommendation: 'regenerate',
      },
      // 2x "Missing keywords"
      {
        suggestion_id: 'fail-4',
        quality_score: 45,
        passed: false,
        reasoning: 'Missing keywords',
        criteria_breakdown: {
          authenticity: 12,
          clarity: 12,
          ats_relevance: 11,
          actionability: 10,
        },
        recommendation: 'regenerate',
      },
      {
        suggestion_id: 'fail-5',
        quality_score: 46,
        passed: false,
        reasoning: 'Missing keywords',
        criteria_breakdown: {
          authenticity: 12,
          clarity: 12,
          ats_relevance: 12,
          actionability: 10,
        },
        recommendation: 'regenerate',
      },
      // 1x "Awkward phrasing"
      {
        suggestion_id: 'fail-6',
        quality_score: 38,
        passed: false,
        reasoning: 'Awkward phrasing',
        criteria_breakdown: {
          authenticity: 10,
          clarity: 8,
          ats_relevance: 10,
          actionability: 10,
        },
        recommendation: 'regenerate',
      },
    ];

    const patterns = extractFailurePatterns(results);

    expect(patterns).toHaveLength(3);
    expect(patterns[0].reason).toBe('Too vague');
    expect(patterns[0].count).toBe(3);
    expect(patterns[1].reason).toBe('Missing keywords');
    expect(patterns[1].count).toBe(2);
    expect(patterns[2].reason).toBe('Awkward phrasing');
    expect(patterns[2].count).toBe(1);
  });

  it('should truncate long failure reasons', () => {
    const longReasoning =
      'This is a very long reasoning text that exceeds 100 characters and needs to be truncated to a reasonable length for display purposes.';

    const results: JudgeResult[] = [
      {
        suggestion_id: 'fail-1',
        quality_score: 40,
        passed: false,
        reasoning: longReasoning,
        criteria_breakdown: {
          authenticity: 10,
          clarity: 10,
          ats_relevance: 10,
          actionability: 10,
        },
        recommendation: 'regenerate',
      },
    ];

    const patterns = extractFailurePatterns(results);

    expect(patterns).toHaveLength(1);
    expect(patterns[0].reason.length).toBeLessThanOrEqual(104); // 100 + "..."
    expect(patterns[0].reason).toContain('...');
  });

  it('should extract first sentence as failure reason', () => {
    const results: JudgeResult[] = [
      {
        suggestion_id: 'fail-1',
        quality_score: 40,
        passed: false,
        reasoning: 'Too vague. The suggestion lacks specific metrics and outcomes.',
        criteria_breakdown: {
          authenticity: 10,
          clarity: 10,
          ats_relevance: 10,
          actionability: 10,
        },
        recommendation: 'regenerate',
      },
    ];

    const patterns = extractFailurePatterns(results);

    expect(patterns).toHaveLength(1);
    expect(patterns[0].reason).toBe('Too vague');
  });

  it('should handle unknown failure patterns', () => {
    const results: JudgeResult[] = [
      {
        suggestion_id: 'fail-1',
        quality_score: 40,
        passed: false,
        reasoning: 'Some completely unique failure reason',
        criteria_breakdown: {
          authenticity: 10,
          clarity: 10,
          ats_relevance: 10,
          actionability: 10,
        },
        recommendation: 'regenerate',
      },
    ];

    const patterns = extractFailurePatterns(results);

    expect(patterns).toHaveLength(1);
    expect(patterns[0].criterion).toBeUndefined(); // Unknown category
    expect(patterns[0].reason).toBe('Some completely unique failure reason');
  });

  it('should limit results to top 5 patterns', () => {
    const results: JudgeResult[] = [];

    // Create 10 different failure reasons
    for (let i = 1; i <= 10; i++) {
      results.push({
        suggestion_id: `fail-${i}`,
        quality_score: 40,
        passed: false,
        reasoning: `Failure reason ${i}`,
        criteria_breakdown: {
          authenticity: 10,
          clarity: 10,
          ats_relevance: 10,
          actionability: 10,
        },
        recommendation: 'regenerate',
      });
    }

    const patterns = extractFailurePatterns(results);

    expect(patterns).toHaveLength(5);
  });
});
