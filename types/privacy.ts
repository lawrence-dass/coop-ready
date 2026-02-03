/**
 * Privacy & PII Redaction Types
 *
 * Types for tracking and displaying PII redaction statistics
 * to build user trust through transparency.
 */

/**
 * Statistics for a single PII redaction operation
 */
export interface PIIRedactionStats {
  emails: number;
  phones: number;
  urls: number;
  addresses: number;
}

/**
 * Aggregated privacy report for an entire optimization
 */
export interface OptimizationPrivacyReport {
  /** Total number of PII items redacted across all operations */
  totalItemsRedacted: number;
  /** Breakdown by PII type */
  breakdown: PIIRedactionStats;
  /** When this report was generated */
  timestamp: string;
}

/**
 * Privacy statistics for a single LLM operation
 * Used to track which operations redacted what PII
 */
export interface LLMOperationPrivacyStats {
  operation: string; // e.g., "parseResume", "extractKeywords"
  stats: PIIRedactionStats;
}
