/**
 * Privacy Statistics Aggregation
 *
 * Aggregates PII redaction statistics from multiple LLM operations
 * to create a comprehensive privacy report for user transparency.
 */

import type {
  PIIRedactionStats,
  OptimizationPrivacyReport,
} from '@/types/privacy';

/**
 * Aggregate PII redaction statistics from multiple operations
 *
 * @param statsList - Array of stats from different LLM operations
 * @returns Aggregated privacy report with total counts
 *
 * @example
 * const stats = [
 *   { emails: 1, phones: 1, urls: 1, addresses: 0 },
 *   { emails: 0, phones: 0, urls: 0, addresses: 1 },
 * ];
 * const report = aggregatePIIStats(stats);
 * // report.totalItemsRedacted === 4
 * // report.breakdown === { emails: 1, phones: 1, urls: 1, addresses: 1 }
 */
export function aggregatePIIStats(
  statsList: PIIRedactionStats[]
): OptimizationPrivacyReport {
  // Aggregate all stats
  const aggregated = statsList.reduce(
    (acc, curr) => ({
      emails: acc.emails + curr.emails,
      phones: acc.phones + curr.phones,
      urls: acc.urls + curr.urls,
      addresses: acc.addresses + curr.addresses,
    }),
    { emails: 0, phones: 0, urls: 0, addresses: 0 } as PIIRedactionStats
  );

  // Calculate total
  const totalItemsRedacted =
    aggregated.emails +
    aggregated.phones +
    aggregated.urls +
    aggregated.addresses;

  return {
    totalItemsRedacted,
    breakdown: aggregated,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Create an empty privacy report (for when no redaction occurred)
 */
export function createEmptyPrivacyReport(): OptimizationPrivacyReport {
  return {
    totalItemsRedacted: 0,
    breakdown: {
      emails: 0,
      phones: 0,
      urls: 0,
      addresses: 0,
    },
    timestamp: new Date().toISOString(),
  };
}
