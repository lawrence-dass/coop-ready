/**
 * Metrics Logging Service
 * Story 12.2: Task 5 - Log quality metrics to console/file/database
 *
 * Environment-based logging with graceful degradation
 */

import 'server-only';
import { promises as fs } from 'fs';
import path from 'path';
import type { QualityMetricLog, MetricsMode } from '@/types/metrics';
import { checkAndEmitAlerts } from './alerts';

// ============================================================================
// CONFIGURATION
// ============================================================================

/**
 * Get metrics mode from environment (defaults to console)
 */
function getMetricsMode(): MetricsMode {
  const mode = process.env.METRICS_MODE?.toLowerCase();
  if (mode === 'file' || mode === 'database') {
    return mode;
  }
  return 'console';
}

/**
 * Get log file path
 */
function getLogFilePath(): string {
  const logDir = process.env.METRICS_LOG_DIR || 'logs';
  const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  return path.join(process.cwd(), logDir, `quality-metrics-${date}.jsonl`);
}

// ============================================================================
// LOGGING FUNCTIONS
// ============================================================================

/**
 * Log metrics to console (structured JSON)
 */
function logToConsole(metrics: QualityMetricLog): void {
  console.log('[SS:metrics]', JSON.stringify(metrics, null, 2));
}

/**
 * Log metrics to file (JSONL format)
 */
async function logToFile(metrics: QualityMetricLog): Promise<void> {
  try {
    const logPath = getLogFilePath();
    const logDir = path.dirname(logPath);

    // Ensure log directory exists
    await fs.mkdir(logDir, { recursive: true });

    // Append metrics as single JSON line
    const jsonLine = JSON.stringify(metrics) + '\n';
    await fs.appendFile(logPath, jsonLine, 'utf8');

    console.log(`[SS:metrics] Logged to ${logPath}`);
  } catch (error) {
    console.error('[SS:metrics] File logging failed:', error);
    // Fallback to console
    logToConsole(metrics);
  }
}

/**
 * Log metrics to database (placeholder for future implementation)
 */
async function logToDatabase(metrics: QualityMetricLog): Promise<void> {
  // TODO: Story 12.2 Task 16 - Implement database logging
  console.warn('[SS:metrics] Database logging not yet implemented, falling back to console');
  logToConsole(metrics);
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Log quality metrics based on environment configuration
 *
 * **Modes:**
 * - `console`: Log to console (development)
 * - `file`: Append to daily JSONL file (production)
 * - `database`: Store in Supabase (future)
 *
 * **Error Handling:**
 * - Failed logging does NOT throw - graceful degradation
 * - Falls back to console if file/database fails
 * - Non-blocking - does not impact pipeline
 *
 * @param metrics - Quality metrics to log
 */
export async function logQualityMetrics(
  metrics: QualityMetricLog
): Promise<void> {
  try {
    const mode = getMetricsMode();

    switch (mode) {
      case 'console':
        logToConsole(metrics);
        break;
      case 'file':
        await logToFile(metrics);
        break;
      case 'database':
        await logToDatabase(metrics);
        break;
      default:
        logToConsole(metrics);
    }

    // Check alert thresholds after every log
    checkAndEmitAlerts(metrics);
  } catch (error) {
    // Logging failure should NEVER break the pipeline
    console.error('[SS:metrics] Metric logging error:', error);
    console.error('[SS:metrics] Failed metrics:', metrics);
  }
}

/**
 * Helper: Format metrics for human-readable display
 */
export function formatMetricsForDisplay(metrics: QualityMetricLog): string {
  const { pass_rate, avg_score, total_evaluated, passed, failed, section } = metrics;

  return `
┌─────────────────────────────────────┐
│  Quality Metrics (${section})
├─────────────────────────────────────┤
│  Total Evaluated:  ${total_evaluated}
│  Passed:           ${passed} (${pass_rate.toFixed(1)}%)
│  Failed:           ${failed}
│  Average Score:    ${avg_score.toFixed(1)}/100
├─────────────────────────────────────┤
│  Criteria Averages:
│    Authenticity:   ${metrics.criteria_avg.authenticity}/25
│    Clarity:        ${metrics.criteria_avg.clarity}/25
│    ATS Relevance:  ${metrics.criteria_avg.ats_relevance}/25
│    Actionability:  ${metrics.criteria_avg.actionability}/25
└─────────────────────────────────────┘
`.trim();
}
