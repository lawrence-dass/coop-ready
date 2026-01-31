/**
 * Quality Metrics Types
 * Story 12.2: Implement Quality Metrics Logging
 *
 * Types for collecting, logging, and analyzing LLM judge quality metrics
 */

// ============================================================================
// METRIC LOG TYPES
// ============================================================================

/**
 * Score distribution across quintiles (0-100 scale)
 */
export interface ScoreDistribution {
  range_0_20: number;
  range_20_40: number;
  range_40_60: number;
  range_60_80: number;
  range_80_100: number;
}

/**
 * Average scores for each judgment criterion
 */
export interface CriteriaAverages {
  authenticity: number;
  clarity: number;
  ats_relevance: number;
  actionability: number;
}

/**
 * Breakdown of failures by criterion
 */
export interface FailureBreakdown {
  authenticity_failures: number;
  clarity_failures: number;
  ats_failures: number;
  actionability_failures: number;
}

/**
 * Common failure pattern with frequency count
 */
export interface FailurePattern {
  reason: string;
  count: number;
  criterion?: 'authenticity' | 'clarity' | 'ats_relevance' | 'actionability';
}

/**
 * Comprehensive quality metrics for a single optimization run
 */
export interface QualityMetricLog {
  /** ISO 8601 timestamp */
  timestamp: string;

  /** Unique identifier for this optimization */
  optimization_id: string;

  /** Section type (summary, skills, experience, education, or 'all' for combined) */
  section: 'summary' | 'skills' | 'experience' | 'education' | 'all';

  /** Total suggestions evaluated */
  total_evaluated: number;

  /** Number passed (score >= 60) */
  passed: number;

  /** Number failed */
  failed: number;

  /** Pass rate percentage (0-100) */
  pass_rate: number;

  /** Average score across all suggestions */
  avg_score: number;

  /** Score distribution by quintile */
  score_distribution: ScoreDistribution;

  /** Average scores per criterion */
  criteria_avg: CriteriaAverages;

  /** Failure counts per criterion */
  failure_breakdown: FailureBreakdown;

  /** Common failure patterns (top 5) */
  common_failures: FailurePattern[];
}

// ============================================================================
// AGGREGATED METRICS TYPES
// ============================================================================

/**
 * Metrics for a specific section
 */
export interface SectionMetrics {
  section: 'summary' | 'skills' | 'experience';
  total_evaluated: number;
  pass_rate: number;
  avg_score: number;
  top_failure: string | null;
}

/**
 * Aggregated metrics over a time period
 */
export interface AggregatedMetrics {
  /** Time period */
  period: 'daily' | 'weekly' | 'monthly';

  /** Date for this aggregate (YYYY-MM-DD) */
  date: string;

  /** Total optimization runs */
  total_optimizations: number;

  /** Overall metrics */
  overall_pass_rate: number;
  overall_avg_score: number;

  /** Breakdown by section */
  by_section: {
    summary: SectionMetrics;
    skills: SectionMetrics;
    experience: SectionMetrics;
  };
}

// ============================================================================
// ALERT TYPES
// ============================================================================

/**
 * Quality status for health checks
 */
export type QualityStatus = 'healthy' | 'warning' | 'critical';

/**
 * Health check response
 */
export interface QualityHealthCheck {
  status: QualityStatus;
  pass_rate: number;
  avg_score: number;
  alerts: string[];
}

// ============================================================================
// LOGGING CONFIGURATION
// ============================================================================

/**
 * Metrics logging mode
 */
export type MetricsMode = 'console' | 'file' | 'database';

/**
 * Configuration for metrics logging
 */
export interface MetricsConfig {
  mode: MetricsMode;
  file_path?: string;
  enable_alerts: boolean;
  alert_threshold: number;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Pass rate threshold for alerts (70%)
 */
export const ALERT_PASS_RATE_WARNING = 70;

/**
 * Critical pass rate threshold (50%)
 */
export const ALERT_PASS_RATE_CRITICAL = 50;

/**
 * Average score warning threshold (65)
 */
export const ALERT_AVG_SCORE_WARNING = 65;

/**
 * Criterion failure threshold (score < 15 indicates failure for that criterion)
 */
export const CRITERION_FAILURE_THRESHOLD = 15;
