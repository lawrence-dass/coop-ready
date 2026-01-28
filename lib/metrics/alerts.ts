/**
 * Quality Metrics Alert System
 * Story 12.2: Task 13 - Alert when quality degrades
 *
 * Checks metrics against thresholds and generates alerts.
 */

import 'server-only';
import type { QualityMetricLog, QualityHealthCheck, QualityStatus } from '@/types/metrics';
import {
  ALERT_PASS_RATE_WARNING,
  ALERT_PASS_RATE_CRITICAL,
  ALERT_AVG_SCORE_WARNING,
} from '@/types/metrics';

// ============================================================================
// ALERT EVALUATION
// ============================================================================

/**
 * Evaluate quality status from a set of metrics logs
 *
 * Thresholds:
 * - Pass rate < 50%: CRITICAL
 * - Pass rate < 70%: WARNING
 * - Avg score < 65: WARNING
 * - Otherwise: HEALTHY
 */
export function evaluateQualityHealth(
  logs: QualityMetricLog[]
): QualityHealthCheck {
  if (logs.length === 0) {
    return {
      status: 'healthy',
      pass_rate: 0,
      avg_score: 0,
      alerts: ['No metrics data available'],
    };
  }

  const totalEvaluated = logs.reduce((s, l) => s + l.total_evaluated, 0);
  const totalPassed = logs.reduce((s, l) => s + l.passed, 0);
  const passRate =
    totalEvaluated > 0
      ? Math.round((totalPassed / totalEvaluated) * 100 * 100) / 100
      : 0;
  const avgScore =
    totalEvaluated > 0
      ? Math.round(
          (logs.reduce((s, l) => s + l.avg_score * l.total_evaluated, 0) /
            totalEvaluated) *
            100
        ) / 100
      : 0;

  const alerts: string[] = [];
  let status: QualityStatus = 'healthy';

  // Check pass rate
  if (passRate < ALERT_PASS_RATE_CRITICAL) {
    status = 'critical';
    alerts.push(
      `CRITICAL: Pass rate ${passRate}% is below ${ALERT_PASS_RATE_CRITICAL}% threshold`
    );
  } else if (passRate < ALERT_PASS_RATE_WARNING) {
    status = 'warning';
    alerts.push(
      `WARNING: Pass rate ${passRate}% is below ${ALERT_PASS_RATE_WARNING}% threshold`
    );
  }

  // Check average score
  if (avgScore < ALERT_AVG_SCORE_WARNING) {
    if (status !== 'critical') status = 'warning';
    alerts.push(
      `WARNING: Average score ${avgScore} is below ${ALERT_AVG_SCORE_WARNING} threshold`
    );
  }

  return { status, pass_rate: passRate, avg_score: avgScore, alerts };
}

/**
 * Check a single metrics log and emit console alerts
 *
 * Called after each metrics collection to provide immediate feedback.
 * Non-blocking - never throws.
 */
export function checkAndEmitAlerts(metrics: QualityMetricLog): void {
  try {
    if (metrics.pass_rate < ALERT_PASS_RATE_CRITICAL) {
      console.error(
        `[SS:alert] CRITICAL: ${metrics.section} pass rate ${metrics.pass_rate}% (threshold: ${ALERT_PASS_RATE_CRITICAL}%)`
      );
    } else if (metrics.pass_rate < ALERT_PASS_RATE_WARNING) {
      console.warn(
        `[SS:alert] WARNING: ${metrics.section} pass rate ${metrics.pass_rate}% (threshold: ${ALERT_PASS_RATE_WARNING}%)`
      );
    }

    if (metrics.avg_score < ALERT_AVG_SCORE_WARNING) {
      console.warn(
        `[SS:alert] WARNING: ${metrics.section} avg score ${metrics.avg_score} (threshold: ${ALERT_AVG_SCORE_WARNING})`
      );
    }
  } catch {
    // Alert emission should never break anything
  }
}
