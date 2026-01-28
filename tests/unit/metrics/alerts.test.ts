/**
 * Unit Tests for Quality Metrics Alert System
 * Story 12.2: Task 13 - Alert evaluation tests
 */

import { describe, it, expect, vi } from 'vitest';
import { evaluateQualityHealth, checkAndEmitAlerts } from '@/lib/metrics/alerts';
import type { QualityMetricLog } from '@/types/metrics';

// Helper to create a mock metrics log
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
    common_failures: [],
    ...overrides,
  };
}

describe('evaluateQualityHealth', () => {
  it('should return healthy for empty logs', () => {
    const health = evaluateQualityHealth([]);
    expect(health.status).toBe('healthy');
    expect(health.alerts).toContain('No metrics data available');
  });

  it('should return healthy when metrics are good', () => {
    const logs = [createMockLog({ pass_rate: 85, avg_score: 78 })];
    const health = evaluateQualityHealth(logs);
    expect(health.status).toBe('healthy');
    expect(health.alerts).toHaveLength(0);
  });

  it('should return warning when pass rate below 70%', () => {
    const logs = [
      createMockLog({
        total_evaluated: 10,
        passed: 6,
        failed: 4,
        pass_rate: 60,
        avg_score: 68,
      }),
    ];
    const health = evaluateQualityHealth(logs);
    expect(health.status).toBe('warning');
    expect(health.alerts.some((a) => a.includes('Pass rate'))).toBe(true);
  });

  it('should return critical when pass rate below 50%', () => {
    const logs = [
      createMockLog({
        total_evaluated: 10,
        passed: 4,
        failed: 6,
        pass_rate: 40,
        avg_score: 50,
      }),
    ];
    const health = evaluateQualityHealth(logs);
    expect(health.status).toBe('critical');
    expect(health.alerts.some((a) => a.includes('CRITICAL'))).toBe(true);
  });

  it('should warn when avg score below 65', () => {
    const logs = [
      createMockLog({
        total_evaluated: 10,
        passed: 8,
        failed: 2,
        pass_rate: 80,
        avg_score: 60,
      }),
    ];
    const health = evaluateQualityHealth(logs);
    expect(health.status).toBe('warning');
    expect(health.alerts.some((a) => a.includes('Average score'))).toBe(true);
  });

  it('should aggregate across multiple logs', () => {
    const logs = [
      createMockLog({ total_evaluated: 5, passed: 5, avg_score: 85 }),
      createMockLog({ total_evaluated: 5, passed: 5, avg_score: 75 }),
    ];
    const health = evaluateQualityHealth(logs);
    expect(health.status).toBe('healthy');
    expect(health.pass_rate).toBe(100);
    expect(health.avg_score).toBe(80);
  });

  it('should handle critical + avg score warning together', () => {
    const logs = [
      createMockLog({
        total_evaluated: 10,
        passed: 3,
        failed: 7,
        pass_rate: 30,
        avg_score: 45,
      }),
    ];
    const health = evaluateQualityHealth(logs);
    expect(health.status).toBe('critical');
    expect(health.alerts).toHaveLength(2); // pass rate critical + avg score warning
  });
});

describe('checkAndEmitAlerts', () => {
  it('should emit critical alert for low pass rate', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const metrics = createMockLog({ pass_rate: 40, avg_score: 50, section: 'skills' });
    checkAndEmitAlerts(metrics);
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[SS:alert] CRITICAL')
    );
    errorSpy.mockRestore();
  });

  it('should emit warning alert for moderate pass rate', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const metrics = createMockLog({ pass_rate: 65, avg_score: 70, section: 'summary' });
    checkAndEmitAlerts(metrics);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[SS:alert] WARNING')
    );
    warnSpy.mockRestore();
  });

  it('should not emit alerts for healthy metrics', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const metrics = createMockLog({ pass_rate: 85, avg_score: 78 });
    checkAndEmitAlerts(metrics);
    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });
});
