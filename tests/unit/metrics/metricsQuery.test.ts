/**
 * Unit Tests for Metrics Query Service
 * Story 12.2: Task 8 - Query and aggregation tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import {
  getTodayMetrics,
  getWeeklyMetrics,
  getMetricsBySection,
  getPassRateTrend,
  getFailurePatterns,
} from '@/lib/metrics/metricsQuery';
import type { QualityMetricLog } from '@/types/metrics';

// Spy on fs.promises.readFile in-place (more reliable than vi.mock for built-in modules)
const mockReadFile = vi.spyOn(fs.promises, 'readFile');

function createMockLog(overrides: Partial<QualityMetricLog> = {}): QualityMetricLog {
  return {
    timestamp: new Date().toISOString(),
    optimization_id: 'test-opt-1',
    section: 'summary',
    total_evaluated: 10,
    passed: 8,
    failed: 2,
    pass_rate: 80,
    avg_score: 75,
    score_distribution: {
      range_0_20: 0,
      range_20_40: 1,
      range_40_60: 1,
      range_60_80: 4,
      range_80_100: 4,
    },
    criteria_avg: {
      authenticity: 19,
      clarity: 20,
      ats_relevance: 18,
      actionability: 18,
    },
    failure_breakdown: {
      authenticity_failures: 1,
      clarity_failures: 0,
      ats_failures: 1,
      actionability_failures: 0,
    },
    common_failures: [{ reason: 'Too vague', count: 2 }],
    ...overrides,
  };
}

describe('metricsQuery', () => {
  beforeEach(() => {
    mockReadFile.mockReset();
  });

  describe('getTodayMetrics', () => {
    it('should return empty aggregation when no file exists', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      const result = await getTodayMetrics();
      expect(result.period).toBe('daily');
      expect(result.total_optimizations).toBe(0);
      expect(result.overall_pass_rate).toBe(0);
    });

    it('should aggregate metrics from today file', async () => {
      const log1 = createMockLog({ section: 'summary', total_evaluated: 5, passed: 4, avg_score: 78 });
      const log2 = createMockLog({ section: 'skills', total_evaluated: 3, passed: 3, avg_score: 82 });
      const content = [JSON.stringify(log1), JSON.stringify(log2)].join('\n');
      mockReadFile.mockResolvedValue(content);

      const result = await getTodayMetrics();
      expect(result.total_optimizations).toBe(2);
      expect(result.overall_pass_rate).toBeGreaterThan(0);
      expect(result.by_section.summary.total_evaluated).toBe(5);
      expect(result.by_section.skills.total_evaluated).toBe(3);
    });
  });

  describe('getWeeklyMetrics', () => {
    it('should return weekly period', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      const result = await getWeeklyMetrics();
      expect(result.period).toBe('weekly');
    });
  });

  describe('getMetricsBySection', () => {
    it('should filter by section', async () => {
      const summaryLog = createMockLog({ section: 'summary', total_evaluated: 5, passed: 4 });
      const skillsLog = createMockLog({ section: 'skills', total_evaluated: 3, passed: 3 });
      const content = [JSON.stringify(summaryLog), JSON.stringify(skillsLog)].join('\n');
      mockReadFile.mockResolvedValue(content);

      const result = await getMetricsBySection('summary', 1);
      expect(result.section).toBe('summary');
      expect(result.total_evaluated).toBe(5);
    });

    it('should return zeros for section with no data', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      const result = await getMetricsBySection('experience', 1);
      expect(result.total_evaluated).toBe(0);
      expect(result.pass_rate).toBe(0);
    });
  });

  describe('getPassRateTrend', () => {
    it('should return trend array with correct length', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      const trend = await getPassRateTrend(7);
      expect(trend).toHaveLength(7);
      trend.forEach((entry) => {
        expect(entry).toHaveProperty('date');
        expect(entry).toHaveProperty('pass_rate');
      });
    });

    it('should return 0 pass rate for days with no data', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      const trend = await getPassRateTrend(3);
      expect(trend.every((t) => t.pass_rate === 0)).toBe(true);
    });
  });

  describe('getFailurePatterns', () => {
    it('should aggregate failure patterns across logs', async () => {
      const log1 = createMockLog({
        common_failures: [
          { reason: 'Too vague', count: 3 },
          { reason: 'Missing keywords', count: 1 },
        ],
      });
      const log2 = createMockLog({
        common_failures: [
          { reason: 'Too vague', count: 2 },
          { reason: 'Awkward phrasing', count: 1 },
        ],
      });
      const content = [JSON.stringify(log1), JSON.stringify(log2)].join('\n');
      mockReadFile.mockResolvedValue(content);

      const patterns = await getFailurePatterns(10, 1);
      expect(patterns[0].reason).toBe('Too vague');
      expect(patterns[0].count).toBe(5);
      expect(patterns).toHaveLength(3);
    });

    it('should limit results', async () => {
      const log = createMockLog({
        common_failures: [
          { reason: 'A', count: 5 },
          { reason: 'B', count: 4 },
          { reason: 'C', count: 3 },
        ],
      });
      mockReadFile.mockResolvedValue(JSON.stringify(log));

      const patterns = await getFailurePatterns(2, 1);
      expect(patterns).toHaveLength(2);
    });

    it('should return empty for no data', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT'));
      const patterns = await getFailurePatterns(10, 1);
      expect(patterns).toEqual([]);
    });
  });
});
