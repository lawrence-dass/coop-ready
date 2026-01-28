/**
 * Quality Metrics Summary Endpoint
 * Story 12.2: Task 9 - Dashboard API for aggregated quality metrics
 *
 * GET /api/metrics/quality-summary
 * GET /api/metrics/quality-summary?period=weekly&days=7
 *
 * Returns aggregated quality metrics with ActionResponse pattern.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { ActionResponse } from '@/types';
import type { AggregatedMetrics, FailurePattern } from '@/types/metrics';
import {
  getTodayMetrics,
  getWeeklyMetrics,
  getPassRateTrend,
  getFailurePatterns,
} from '@/lib/metrics/metricsQuery';

// ============================================================================
// TYPES
// ============================================================================

interface QualitySummaryResponse {
  metrics: AggregatedMetrics;
  trend: Array<{ date: string; pass_rate: number }>;
  failure_patterns: FailurePattern[];
}

// ============================================================================
// HANDLER
// ============================================================================

/**
 * GET /api/metrics/quality-summary
 *
 * Query params:
 * - period: 'daily' | 'weekly' (default: daily)
 * - days: number of days for trend (default: 7)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'daily';
    const days = Math.min(parseInt(searchParams.get('days') || '7', 10), 90);

    const metrics =
      period === 'weekly' ? await getWeeklyMetrics() : await getTodayMetrics();
    const trend = await getPassRateTrend(days);
    const failurePatterns = await getFailurePatterns(10, days);

    const response: ActionResponse<QualitySummaryResponse> = {
      data: {
        metrics,
        trend,
        failure_patterns: failurePatterns,
      },
      error: null,
    };

    return NextResponse.json(response, {
      status: 200,
      headers: { 'Cache-Control': 'private, max-age=300' }, // 5-min cache
    });
  } catch (error) {
    console.error('[SS:metrics-api] Query error:', error);
    return NextResponse.json(
      {
        data: null,
        error: {
          code: 'LLM_ERROR',
          message:
            error instanceof Error
              ? error.message
              : 'Failed to retrieve quality metrics',
        },
      } satisfies ActionResponse<QualitySummaryResponse>,
      { status: 200 }
    );
  }
}

export async function POST() {
  return NextResponse.json(
    {
      data: null,
      error: { code: 'VALIDATION_ERROR', message: 'Method not allowed' },
    },
    { status: 405 }
  );
}
