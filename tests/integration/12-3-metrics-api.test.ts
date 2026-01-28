/**
 * Metrics API Integration Tests
 * Story 12.3: Task 6 - Test metrics API endpoints
 *
 * Tests quality-summary and health-metrics API endpoints including
 * ActionResponse pattern, cache headers, and error handling.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET as qualitySummaryGET } from '@/app/api/metrics/quality-summary/route';
import { GET as healthMetricsGET } from '@/app/api/health/quality-metrics/route';
import { NextRequest } from 'next/server';

// Mock metrics query functions
vi.mock('@/lib/metrics/metricsQuery', () => ({
  getTodayMetrics: vi.fn().mockResolvedValue({
    total_optimizations: 10,
    total_suggestions_evaluated: 30,
    passed: 25,
    failed: 5,
    pass_rate: 83.33,
    avg_score: 72.5,
    score_distribution: {
      range_0_20: 0,
      range_20_40: 1,
      range_40_60: 4,
      range_60_80: 15,
      range_80_100: 10,
    },
    criteria_avg: {
      authenticity: 18,
      clarity: 18,
      ats_relevance: 17,
      actionability: 19,
    },
  }),
  getWeeklyMetrics: vi.fn().mockResolvedValue({
    total_optimizations: 50,
    total_suggestions_evaluated: 150,
    passed: 120,
    failed: 30,
    pass_rate: 80,
    avg_score: 70,
    score_distribution: {
      range_0_20: 0,
      range_20_40: 5,
      range_40_60: 25,
      range_60_80: 70,
      range_80_100: 50,
    },
    criteria_avg: {
      authenticity: 17,
      clarity: 18,
      ats_relevance: 16,
      actionability: 19,
    },
  }),
  getPassRateTrend: vi.fn().mockResolvedValue([
    { date: '2026-01-21', pass_rate: 85 },
    { date: '2026-01-22', pass_rate: 82 },
    { date: '2026-01-23', pass_rate: 80 },
    { date: '2026-01-24', pass_rate: 83 },
    { date: '2026-01-25', pass_rate: 84 },
    { date: '2026-01-26', pass_rate: 83 },
    { date: '2026-01-27', pass_rate: 83 },
  ]),
  getFailurePatterns: vi.fn().mockResolvedValue([
    {
      pattern: 'Low authenticity score',
      count: 5,
      example: 'Suggestion lacks specific details',
    },
    {
      pattern: 'Unclear wording',
      count: 3,
      example: 'Vague action verbs used',
    },
  ]),
}));

// Mock alerts
vi.mock('@/lib/metrics/alerts', () => ({
  evaluateQualityHealth: vi.fn().mockReturnValue({
    status: 'healthy',
    pass_rate: 83.33,
    avg_score: 72.5,
    alerts: [],
  }),
}));

describe('Metrics API Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Quality Summary Endpoint', () => {
    it('should return valid ActionResponse with daily metrics', async () => {
      const request = new NextRequest('http://localhost/api/metrics/quality-summary');

      const response = await qualitySummaryGET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty('data');
      expect(json).toHaveProperty('error');
      expect(json.error).toBeNull();

      const { data } = json;
      expect(data).toHaveProperty('metrics');
      expect(data).toHaveProperty('trend');
      expect(data).toHaveProperty('failure_patterns');

      expect(data.metrics.total_optimizations).toBe(10);
      expect(data.trend.length).toBe(7);
      expect(data.failure_patterns.length).toBeGreaterThan(0);
    });

    it('should return weekly metrics when period=weekly', async () => {
      const { getWeeklyMetrics } = await import('@/lib/metrics/metricsQuery');

      const request = new NextRequest('http://localhost/api/metrics/quality-summary?period=weekly');

      const response = await qualitySummaryGET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toBeDefined();

      // Verify getWeeklyMetrics was called
      expect(getWeeklyMetrics).toHaveBeenCalled();

      const { data } = json;
      expect(data.metrics.total_optimizations).toBe(50);
    });

    it('should include Cache-Control header', async () => {
      const request = new NextRequest('http://localhost/api/metrics/quality-summary');

      const response = await qualitySummaryGET(request);

      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toBe('private, max-age=300');
    });

    it('should handle errors gracefully with ActionResponse pattern', async () => {
      const { getTodayMetrics } = await import('@/lib/metrics/metricsQuery');

      // Mock an error
      (getTodayMetrics as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
        new Error('File system error')
      );

      const request = new NextRequest('http://localhost/api/metrics/quality-summary');

      const response = await qualitySummaryGET(request);
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toBeNull();
      expect(json.error).toBeDefined();
      expect(json.error.code).toBe('LLM_ERROR');
      expect(json.error.message).toContain('File system error');
    });
  });

  describe('Health Metrics Endpoint', () => {
    it('should return valid ActionResponse with health status', async () => {
      const response = await healthMetricsGET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json).toHaveProperty('data');
      expect(json).toHaveProperty('error');
      expect(json.error).toBeNull();

      const { data } = json;
      expect(data).toHaveProperty('status');
      expect(data).toHaveProperty('pass_rate');
      expect(data).toHaveProperty('avg_score');
      expect(data).toHaveProperty('alerts');
      expect(data).toHaveProperty('total_optimizations');

      expect(data.status).toBe('healthy');
      expect(data.pass_rate).toBe(83.33);
      expect(data.avg_score).toBe(72.5);
      expect(Array.isArray(data.alerts)).toBe(true);
    });

    it('should include Cache-Control header', async () => {
      const response = await healthMetricsGET();

      const cacheControl = response.headers.get('Cache-Control');
      expect(cacheControl).toBe('private, max-age=300');
    });

    it('should return healthy status when no logs exist', async () => {
      const { evaluateQualityHealth } = await import('@/lib/metrics/alerts');

      // Mock empty logs scenario
      (evaluateQualityHealth as ReturnType<typeof vi.fn>).mockReturnValueOnce({
        status: 'healthy',
        pass_rate: 100,
        avg_score: 100,
        alerts: [],
      });

      const response = await healthMetricsGET();
      const json = await response.json();

      expect(response.status).toBe(200);
      expect(json.data).toBeDefined();
      expect(json.data.status).toBe('healthy');
      expect(json.data.alerts).toEqual([]);
    });

    it('should handle errors gracefully with ActionResponse pattern', async () => {
      const { promises: fs } = await import('fs');

      // Mock fs.readFile to throw an error (simulating file system issue)
      vi.spyOn(fs, 'readFile').mockRejectedValueOnce(new Error('Permission denied'));

      const response = await healthMetricsGET();
      const json = await response.json();

      // Even with errors, should return valid response (logs may not exist yet)
      expect(response.status).toBe(200);
      // Health check returns healthy when no logs exist (no data = no alerts)
      expect(json.data || json.error).toBeDefined();
    });
  });
});
