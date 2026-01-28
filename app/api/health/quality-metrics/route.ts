/**
 * Quality Metrics Health Check Endpoint
 * Story 12.2: Task 14 - Health status for monitoring
 *
 * GET /api/health/quality-metrics
 *
 * Returns quality health status (healthy/warning/critical).
 */

import { NextResponse } from 'next/server';
import type { ActionResponse } from '@/types';
import type { QualityHealthCheck } from '@/types/metrics';
import { getTodayMetrics } from '@/lib/metrics/metricsQuery';
import { evaluateQualityHealth } from '@/lib/metrics/alerts';

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Convert AggregatedMetrics back to a pseudo-log array for health evaluation.
 * Since health check only needs pass_rate and avg_score from today's data,
 * we read today's raw logs directly.
 */
async function getTodayLogs() {
  // Re-use the query service infrastructure
  const { promises: fs } = await import('fs');
  const path = await import('path');
  const logDir = path.join(
    process.cwd(),
    process.env.METRICS_LOG_DIR || 'logs'
  );
  const date = new Date().toISOString().split('T')[0];
  const filePath = path.join(logDir, `quality-metrics-${date}.jsonl`);

  try {
    const content = await fs.readFile(filePath, 'utf8');
    const lines = content.trim().split('\n').filter(Boolean);
    return lines.map((line) => JSON.parse(line));
  } catch {
    return [];
  }
}

// ============================================================================
// HANDLER
// ============================================================================

/**
 * GET /api/health/quality-metrics
 */
export async function GET() {
  try {
    const logs = await getTodayLogs();
    const health = evaluateQualityHealth(logs);

    // Also get today's summary for context
    const todayMetrics = await getTodayMetrics();

    const response: ActionResponse<
      QualityHealthCheck & { total_optimizations: number }
    > = {
      data: {
        ...health,
        total_optimizations: todayMetrics.total_optimizations,
      },
      error: null,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { 'Cache-Control': 'private, max-age=300' }, // 5-min cache
    });
  } catch (error) {
    console.error('[SS:health] Quality metrics health check error:', error);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'LLM_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Health check failed',
        },
      } satisfies ActionResponse<QualityHealthCheck>,
      { status: 200 }
    );
  }
}
