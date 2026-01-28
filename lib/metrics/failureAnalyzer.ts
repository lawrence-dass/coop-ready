/**
 * Failure Pattern Analyzer
 * Story 12.2: Task 7 - Extract and categorize failure patterns from judge results
 *
 * Analyzes judge reasoning to identify common failure patterns
 */

import type { JudgeResult } from '@/types/judge';
import type { FailurePattern } from '@/types/metrics';

// ============================================================================
// PATTERN DEFINITIONS
// ============================================================================

/**
 * Keyword patterns for identifying failure categories
 */
const FAILURE_PATTERNS = {
  authenticity: [
    'exaggeration',
    'fabrication',
    'vague accomplishment',
    'unverifiable',
    'too generic',
    'lacks specificity',
    'not authentic',
  ],
  clarity: [
    'awkward phrasing',
    'grammar error',
    'unclear meaning',
    'confusing',
    'poorly written',
    'not professional',
    'hard to understand',
  ],
  ats_relevance: [
    'missing keywords',
    'poor formatting',
    'not ats-friendly',
    'no job description keywords',
    'irrelevant',
    'lacks relevance',
  ],
  actionability: [
    'too vague',
    'not measurable',
    'not specific',
    'lacks detail',
    'not actionable',
    'no clear improvement',
  ],
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Categorize a failure reason based on keyword matching
 */
function categorizeFailure(
  reasoning: string
): 'authenticity' | 'clarity' | 'ats_relevance' | 'actionability' | 'unknown' {
  const lowerReasoning = reasoning.toLowerCase();

  // Check each category for keyword matches
  for (const keyword of FAILURE_PATTERNS.authenticity) {
    if (lowerReasoning.includes(keyword.toLowerCase())) {
      return 'authenticity';
    }
  }

  for (const keyword of FAILURE_PATTERNS.clarity) {
    if (lowerReasoning.includes(keyword.toLowerCase())) {
      return 'clarity';
    }
  }

  for (const keyword of FAILURE_PATTERNS.ats_relevance) {
    if (lowerReasoning.includes(keyword.toLowerCase())) {
      return 'ats_relevance';
    }
  }

  for (const keyword of FAILURE_PATTERNS.actionability) {
    if (lowerReasoning.includes(keyword.toLowerCase())) {
      return 'actionability';
    }
  }

  return 'unknown';
}

/**
 * Extract a short failure reason from judge reasoning
 */
function extractFailureReason(reasoning: string): string {
  // Take first sentence or first 100 chars
  const firstSentence = reasoning.split(/[.!?]/)[0];
  if (firstSentence && firstSentence.length <= 100) {
    return firstSentence.trim();
  }
  return reasoning.substring(0, 100).trim() + '...';
}

// ============================================================================
// MAIN FUNCTION
// ============================================================================

/**
 * Extract and categorize failure patterns from judge results
 *
 * Analyzes reasoning field from failed judge results to identify:
 * - Common failure reasons
 * - Categorization by criterion (authenticity, clarity, ATS, actionability)
 * - Frequency counts
 *
 * Returns top 5 most common failure patterns
 *
 * @param results - Array of judge results
 * @returns Array of failure patterns sorted by frequency (top 5)
 */
export function extractFailurePatterns(results: JudgeResult[]): FailurePattern[] {
  // Filter to failed results only
  const failures = results.filter((r) => !r.passed);

  if (failures.length === 0) {
    return [];
  }

  // Count failure reasons
  const reasonCounts = new Map<string, FailurePattern>();

  for (const failure of failures) {
    const reason = extractFailureReason(failure.reasoning);
    const criterion = categorizeFailure(failure.reasoning);

    if (reasonCounts.has(reason)) {
      const existing = reasonCounts.get(reason)!;
      existing.count++;
    } else {
      reasonCounts.set(reason, {
        reason,
        count: 1,
        criterion: criterion === 'unknown' ? undefined : criterion,
      });
    }
  }

  // Convert to array and sort by count (descending)
  const patterns = Array.from(reasonCounts.values()).sort(
    (a, b) => b.count - a.count
  );

  // Return top 5
  return patterns.slice(0, 5);
}
