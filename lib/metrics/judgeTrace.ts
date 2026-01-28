/**
 * Detailed Judge Trace Logging
 * Story 12.2: Task 11 - Structured trace output for debugging
 *
 * Enable via: DEBUG=judge (or DEBUG=* for all)
 * Output: Detailed per-suggestion evaluation traces
 */

import type { JudgeResult } from '@/types/judge';

// ============================================================================
// CONFIGURATION
// ============================================================================

function isTraceEnabled(): boolean {
  const debug = process.env.DEBUG || '';
  return debug === '*' || debug.includes('judge');
}

// ============================================================================
// TRACE FUNCTIONS
// ============================================================================

/**
 * Log a detailed trace for a single judge evaluation
 *
 * Output format:
 * ```
 * [JUDGE] Suggestion "skills-abc123" (skills)
 *   Score: 82/100 PASS
 *   Criteria:
 *     Authenticity:   20/25
 *     Clarity:        22/25
 *     ATS Relevance:  21/25
 *     Actionability:  19/25
 *   Reasoning: Strong suggestion with clear improvements
 * ```
 */
export function logJudgeTrace(
  result: JudgeResult,
  sectionType: string,
  context?: { original_text?: string; suggested_text?: string }
): void {
  if (!isTraceEnabled()) return;

  const status = result.passed ? '\x1b[32mPASS\x1b[0m' : '\x1b[31mFAIL\x1b[0m';
  const { criteria_breakdown: cb } = result;

  const lines = [
    `[JUDGE] Suggestion "${result.suggestion_id}" (${sectionType})`,
  ];

  if (context?.original_text) {
    lines.push(`  Original: "${truncate(context.original_text, 60)}"`);
  }
  if (context?.suggested_text) {
    lines.push(`  Suggested: "${truncate(context.suggested_text, 60)}"`);
  }

  lines.push(
    `  Score: ${result.quality_score}/100 ${status}`,
    `  Criteria:`,
    `    Authenticity:   ${cb.authenticity}/25`,
    `    Clarity:        ${cb.clarity}/25`,
    `    ATS Relevance:  ${cb.ats_relevance}/25`,
    `    Actionability:  ${cb.actionability}/25`,
    `  Reasoning: ${truncate(result.reasoning, 100)}`
  );

  console.log(lines.join('\n'));
}

/**
 * Log a batch summary after judging multiple suggestions
 */
export function logJudgeBatchTrace(
  results: JudgeResult[],
  sectionType: string
): void {
  if (!isTraceEnabled()) return;
  if (results.length === 0) return;

  const passed = results.filter((r) => r.passed).length;
  const avgScore =
    results.reduce((s, r) => s + r.quality_score, 0) / results.length;

  console.log(
    `[JUDGE] Batch summary (${sectionType}): ${passed}/${results.length} passed (${Math.round(avgScore)}/100 avg)`
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function truncate(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen) + '...';
}
