/**
 * Job Type Detection
 *
 * Determines whether a job description is for a co-op/internship or full-time position
 * using keyword-based pattern matching.
 */

import type { JobType } from './types';

/**
 * Detects the job type from a job description using keyword patterns
 *
 * @param jdText - The job description text to analyze
 * @returns 'coop' if co-op/internship indicators found, 'fulltime' otherwise
 *
 * @example
 * ```typescript
 * detectJobType("Software Engineering Co-op - Winter 2024") // 'coop'
 * detectJobType("Senior Software Engineer - Full Time") // 'fulltime'
 * ```
 */
export function detectJobType(jdText: string): JobType {
  // Co-op/internship indicators
  const coopPatterns = [
    /\b(?:co-?op|intern(?:ship)?)\b/i,
    /\bwork\s+term\b/i,
    /\b(?:4|8|12|16)\s*(?:month|mo)\b/i, // Common co-op durations
    /\bstudent\s+position\b/i,
  ];

  // Check if any co-op pattern matches
  for (const pattern of coopPatterns) {
    if (pattern.test(jdText)) {
      return 'coop';
    }
  }

  // Default to full-time
  return 'fulltime';
}
