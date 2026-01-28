/**
 * Unit Tests for Judge Trace Logging
 * Story 12.2: Task 11 - Trace logging tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logJudgeTrace, logJudgeBatchTrace } from '@/lib/metrics/judgeTrace';
import type { JudgeResult } from '@/types/judge';

function createMockResult(overrides: Partial<JudgeResult> = {}): JudgeResult {
  return {
    suggestion_id: 'test-suggestion',
    quality_score: 82,
    passed: true,
    reasoning: 'Strong suggestion with clear improvements',
    criteria_breakdown: {
      authenticity: 20,
      clarity: 22,
      ats_relevance: 21,
      actionability: 19,
    },
    recommendation: 'accept',
    ...overrides,
  };
}

describe('logJudgeTrace', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    delete process.env.DEBUG;
  });

  it('should not log when DEBUG is not set', () => {
    delete process.env.DEBUG;
    logJudgeTrace(createMockResult(), 'summary');
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('should log when DEBUG=judge', () => {
    process.env.DEBUG = 'judge';
    logJudgeTrace(createMockResult(), 'summary');
    expect(logSpy).toHaveBeenCalledTimes(1);
    const output = logSpy.mock.calls[0][0];
    expect(output).toContain('[JUDGE]');
    expect(output).toContain('test-suggestion');
    expect(output).toContain('82/100');
  });

  it('should log when DEBUG=*', () => {
    process.env.DEBUG = '*';
    logJudgeTrace(createMockResult(), 'skills');
    expect(logSpy).toHaveBeenCalledTimes(1);
  });

  it('should include original and suggested text when provided', () => {
    process.env.DEBUG = 'judge';
    logJudgeTrace(createMockResult(), 'experience', {
      original_text: 'Led the team',
      suggested_text: 'Led a team of 5 engineers',
    });
    const output = logSpy.mock.calls[0][0];
    expect(output).toContain('Original:');
    expect(output).toContain('Suggested:');
  });

  it('should show FAIL for failed results', () => {
    process.env.DEBUG = 'judge';
    logJudgeTrace(
      createMockResult({ passed: false, quality_score: 40 }),
      'summary'
    );
    const output = logSpy.mock.calls[0][0];
    expect(output).toContain('FAIL');
    expect(output).toContain('40/100');
  });

  it('should show criteria breakdown', () => {
    process.env.DEBUG = 'judge';
    logJudgeTrace(createMockResult(), 'summary');
    const output = logSpy.mock.calls[0][0];
    expect(output).toContain('Authenticity:');
    expect(output).toContain('20/25');
    expect(output).toContain('Clarity:');
    expect(output).toContain('22/25');
  });
});

describe('logJudgeBatchTrace', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    logSpy.mockRestore();
    delete process.env.DEBUG;
  });

  it('should not log when DEBUG is not set', () => {
    delete process.env.DEBUG;
    logJudgeBatchTrace([createMockResult()], 'summary');
    expect(logSpy).not.toHaveBeenCalled();
  });

  it('should log batch summary when DEBUG=judge', () => {
    process.env.DEBUG = 'judge';
    const results = [
      createMockResult({ passed: true, quality_score: 80 }),
      createMockResult({ passed: false, quality_score: 45 }),
      createMockResult({ passed: true, quality_score: 75 }),
    ];
    logJudgeBatchTrace(results, 'experience');
    const output = logSpy.mock.calls[0][0];
    expect(output).toContain('Batch summary');
    expect(output).toContain('2/3 passed');
    expect(output).toContain('experience');
  });

  it('should not log for empty results', () => {
    process.env.DEBUG = 'judge';
    logJudgeBatchTrace([], 'summary');
    expect(logSpy).not.toHaveBeenCalled();
  });
});
