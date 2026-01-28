/**
 * Metrics Query Service
 * Story 12.2: Task 8 - Query and aggregate quality metrics
 *
 * Reads from JSONL log files and returns aggregated statistics.
 * In console mode, returns empty results (no persistent storage).
 */

import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import type {
  QualityMetricLog,
  AggregatedMetrics,
  SectionMetrics,
  FailurePattern,
} from '@/types/metrics';

// ============================================================================
// CONFIGURATION
// ============================================================================

function getLogDir(): string {
  return path.join(process.cwd(), process.env.METRICS_LOG_DIR || 'logs');
}

function getLogFilePath(date: string): string {
  return path.join(getLogDir(), `quality-metrics-${date}.jsonl`);
}

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

// ============================================================================
// FILE READING
// ============================================================================

/**
 * Read metrics from a single JSONL file
 */
async function readMetricsFile(filePath: string): Promise<QualityMetricLog[]> {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);
    return lines.map((line) => JSON.parse(line) as QualityMetricLog);
  } catch {
    // File doesn't exist or is unreadable
    return [];
  }
}

/**
 * Read metrics across a date range
 */
async function readMetricsRange(
  startDate: Date,
  endDate: Date
): Promise<QualityMetricLog[]> {
  const metrics: QualityMetricLog[] = [];
  const current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = formatDate(current);
    const filePath = getLogFilePath(dateStr);
    const dayMetrics = await readMetricsFile(filePath);
    metrics.push(...dayMetrics);
    current.setDate(current.getDate() + 1);
  }

  return metrics;
}

// ============================================================================
// AGGREGATION HELPERS
// ============================================================================

function buildSectionMetrics(
  logs: QualityMetricLog[],
  section: 'summary' | 'skills' | 'experience'
): SectionMetrics {
  const sectionLogs = logs.filter((l) => l.section === section);

  if (sectionLogs.length === 0) {
    return { section, total_evaluated: 0, pass_rate: 0, avg_score: 0, top_failure: null };
  }

  const totalEvaluated = sectionLogs.reduce((s, l) => s + l.total_evaluated, 0);
  const totalPassed = sectionLogs.reduce((s, l) => s + l.passed, 0);
  const passRate =
    totalEvaluated > 0
      ? Math.round((totalPassed / totalEvaluated) * 100 * 100) / 100
      : 0;
  const avgScore =
    sectionLogs.reduce((s, l) => s + l.avg_score * l.total_evaluated, 0) /
    (totalEvaluated || 1);

  // Find top failure across all logs for this section
  const failureCounts = new Map<string, number>();
  for (const log of sectionLogs) {
    for (const f of log.common_failures) {
      failureCounts.set(f.reason, (failureCounts.get(f.reason) || 0) + f.count);
    }
  }
  let topFailure: string | null = null;
  let topCount = 0;
  for (const [reason, count] of failureCounts) {
    if (count > topCount) {
      topFailure = reason;
      topCount = count;
    }
  }

  return {
    section,
    total_evaluated: totalEvaluated,
    pass_rate: passRate,
    avg_score: Math.round(avgScore * 100) / 100,
    top_failure: topFailure,
  };
}

function aggregateMetrics(
  logs: QualityMetricLog[],
  period: 'daily' | 'weekly' | 'monthly',
  date: string
): AggregatedMetrics {
  const totalEvaluated = logs.reduce((s, l) => s + l.total_evaluated, 0);
  const totalPassed = logs.reduce((s, l) => s + l.passed, 0);
  const overallPassRate =
    totalEvaluated > 0
      ? Math.round((totalPassed / totalEvaluated) * 100 * 100) / 100
      : 0;
  const overallAvgScore =
    totalEvaluated > 0
      ? Math.round(
          (logs.reduce((s, l) => s + l.avg_score * l.total_evaluated, 0) /
            totalEvaluated) *
            100
        ) / 100
      : 0;

  return {
    period,
    date,
    total_optimizations: logs.length,
    overall_pass_rate: overallPassRate,
    overall_avg_score: overallAvgScore,
    by_section: {
      summary: buildSectionMetrics(logs, 'summary'),
      skills: buildSectionMetrics(logs, 'skills'),
      experience: buildSectionMetrics(logs, 'experience'),
    },
  };
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get today's aggregated metrics
 */
export async function getTodayMetrics(): Promise<AggregatedMetrics> {
  const today = new Date();
  const dateStr = formatDate(today);
  const logs = await readMetricsFile(getLogFilePath(dateStr));
  return aggregateMetrics(logs, 'daily', dateStr);
}

/**
 * Get weekly aggregated metrics (last 7 days)
 */
export async function getWeeklyMetrics(): Promise<AggregatedMetrics> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - 6);
  const logs = await readMetricsRange(start, end);
  return aggregateMetrics(logs, 'weekly', formatDate(end));
}

/**
 * Get metrics for a specific section
 */
export async function getMetricsBySection(
  section: 'summary' | 'skills' | 'experience',
  days: number = 7
): Promise<SectionMetrics> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const logs = await readMetricsRange(start, end);
  return buildSectionMetrics(logs, section);
}

/**
 * Get pass rate trend over N days
 */
export async function getPassRateTrend(
  days: number = 7
): Promise<Array<{ date: string; pass_rate: number }>> {
  const trend: Array<{ date: string; pass_rate: number }> = [];
  const current = new Date();
  current.setDate(current.getDate() - (days - 1));

  for (let i = 0; i < days; i++) {
    const dateStr = formatDate(current);
    const logs = await readMetricsFile(getLogFilePath(dateStr));
    const totalEvaluated = logs.reduce((s, l) => s + l.total_evaluated, 0);
    const totalPassed = logs.reduce((s, l) => s + l.passed, 0);
    const passRate =
      totalEvaluated > 0
        ? Math.round((totalPassed / totalEvaluated) * 100 * 100) / 100
        : 0;
    trend.push({ date: dateStr, pass_rate: passRate });
    current.setDate(current.getDate() + 1);
  }

  return trend;
}

/**
 * Get top failure patterns across recent metrics
 */
export async function getFailurePatterns(
  limit: number = 10,
  days: number = 7
): Promise<FailurePattern[]> {
  const end = new Date();
  const start = new Date();
  start.setDate(start.getDate() - (days - 1));
  const logs = await readMetricsRange(start, end);

  const failureCounts = new Map<string, FailurePattern>();
  for (const log of logs) {
    for (const f of log.common_failures) {
      const existing = failureCounts.get(f.reason);
      if (existing) {
        existing.count += f.count;
      } else {
        failureCounts.set(f.reason, { ...f });
      }
    }
  }

  return Array.from(failureCounts.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
