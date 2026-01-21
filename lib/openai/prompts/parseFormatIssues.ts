/**
 * Format Issues Response Parser
 * Story: 4.6 - Resume Format Issues Detection
 *
 * Parses format issues from OpenAI response and merges with rule-based issues
 */

import type { FormatIssue, FormatIssueSeverity } from '@/lib/types/analysis'

/**
 * Parse format issues from OpenAI response
 *
 * Extracts formatIssues array from JSON response. Returns empty array if:
 * - JSON parsing fails
 * - formatIssues field missing
 * - formatIssues is empty
 *
 * @param response - Raw OpenAI response text
 * @returns Array of validated format issues
 */
export function parseFormatIssuesResponse(response: string): FormatIssue[] {
  try {
    const parsed = JSON.parse(response)

    if (!parsed.formatIssues || !Array.isArray(parsed.formatIssues)) {
      return []
    }

    // Filter out invalid issues
    return parsed.formatIssues.filter(isValidFormatIssue)
  } catch (error) {
    console.warn('[parseFormatIssuesResponse] Failed to parse response', { error })
    return []
  }
}

/**
 * Merge rule-based and AI-detected format issues
 *
 * Strategy:
 * 1. Deduplicate similar issues (keep AI version for more detail)
 * 2. Sort by severity: critical > warning > suggestion
 * 3. Within severity, preserve insertion order
 *
 * @param ruleBasedIssues - Issues from rule-based analyzer
 * @param aiDetectedIssues - Issues from OpenAI analysis
 * @returns Merged and sorted array
 */
export function mergeFormatIssues(
  ruleBasedIssues: FormatIssue[],
  aiDetectedIssues: FormatIssue[]
): FormatIssue[] {
  // Combine all issues
  const allIssues = [...ruleBasedIssues, ...aiDetectedIssues]

  // Deduplicate similar issues
  const deduplicated = deduplicateIssues(allIssues)

  // Sort by severity
  return sortBySeverity(deduplicated)
}

/**
 * Validate format issue structure
 *
 * Checks that issue has:
 * - Valid type (critical | warning | suggestion)
 * - Non-empty message string
 * - Non-empty detail string
 * - Valid source (rule-based | ai-detected)
 *
 * @param issue - Issue to validate
 * @returns True if valid format issue
 */
export function isValidFormatIssue(issue: any): issue is FormatIssue {
  if (!issue || typeof issue !== 'object') {
    return false
  }

  // Check type field
  const validTypes: FormatIssueSeverity[] = ['critical', 'warning', 'suggestion']
  if (!validTypes.includes(issue.type)) {
    return false
  }

  // Check required string fields
  if (typeof issue.message !== 'string' || issue.message.length === 0) {
    return false
  }

  if (typeof issue.detail !== 'string' || issue.detail.length === 0) {
    return false
  }

  // Check source field
  if (issue.source !== 'rule-based' && issue.source !== 'ai-detected') {
    return false
  }

  return true
}

/**
 * Deduplicate similar format issues
 *
 * Uses similarity heuristics to detect duplicates:
 * - Same message (exact match)
 * - Similar keywords in message (e.g., "page" issues)
 *
 * When duplicates found, prefers AI-detected version for better detail
 */
function deduplicateIssues(issues: FormatIssue[]): FormatIssue[] {
  const seen = new Map<string, FormatIssue>()

  for (const issue of issues) {
    // Create a normalized key for deduplication
    const key = getDeduplicationKey(issue)

    const existing = seen.get(key)

    if (!existing) {
      // First occurrence
      seen.set(key, issue)
    } else {
      // Duplicate found - prefer AI-detected version
      if (issue.source === 'ai-detected' && existing.source === 'rule-based') {
        seen.set(key, issue)
      }
      // If both same source or existing is already AI, keep existing
    }
  }

  return Array.from(seen.values())
}

/**
 * Generate deduplication key for format issue
 *
 * Uses normalized message keywords to detect similar issues
 */
function getDeduplicationKey(issue: FormatIssue): string {
  const message = issue.message.toLowerCase()

  // Detect page length issues
  if (message.includes('page')) {
    return 'page-length'
  }

  // Detect contact info issues
  if (message.includes('contact')) {
    return 'contact-info'
  }

  // Detect section header issues
  if (message.includes('section') && message.includes('header')) {
    return 'section-headers'
  }

  // Detect date format issues
  if (message.includes('date') && message.includes('format')) {
    return 'date-format'
  }

  // Detect international format issues
  if (message.includes('photo') || message.includes('dob') || message.includes('international')) {
    return 'international-format'
  }

  // Default: use normalized message as key
  return message.replace(/\s+/g, '-').substring(0, 50)
}

/**
 * Sort format issues by severity
 *
 * Order: critical > warning > suggestion
 * Within same severity, preserve insertion order
 */
function sortBySeverity(issues: FormatIssue[]): FormatIssue[] {
  const severityOrder: Record<FormatIssueSeverity, number> = {
    critical: 3,
    warning: 2,
    suggestion: 1,
  }

  return issues.sort((a, b) => severityOrder[b.type] - severityOrder[a.type])
}
