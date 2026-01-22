/**
 * Metric Example Templates
 *
 * Context-specific metric examples and prompts for quantification suggestions.
 * Used by context detector to provide relevant examples based on bullet context.
 *
 * @see Story 9.4: Context-Aware Metric Prompts
 */

import type { BulletContext } from '@/lib/utils/contextDetector'

/**
 * Metric template with examples and prompts
 */
export interface MetricTemplate {
  context: BulletContext
  prompts: string[]
  examples: string[]
  reasoning: string
}

/**
 * Financial metric templates
 *
 * Industry norms:
 * - Small team: $100K-$500K
 * - Mid-level: $1M-$10M
 * - Senior/Director: $10M+
 */
export const FINANCIAL_METRICS: MetricTemplate = {
  context: 'financial',
  prompts: [
    'dollar amount',
    'percentage savings',
    'ROI figure',
    'revenue impact',
    'cost reduction',
    'profit margin',
  ],
  examples: [
    '$500K in revenue',
    '25% cost reduction',
    '$2M AUM',
    '150% ROI',
    '$1.5M annual savings',
    '15% profit margin improvement',
  ],
  reasoning: 'Financial metrics strengthen this role-specific achievement',
}

/**
 * Tech metric templates
 *
 * Industry norms:
 * - Early stage: 1K-100K users
 * - Growth stage: 100K-1M users
 * - Enterprise: 1M+ users
 */
export const TECH_METRICS: MetricTemplate = {
  context: 'tech',
  prompts: [
    'user count',
    'traffic increase',
    'latency improvement',
    'performance gain',
    'uptime percentage',
    'scale metrics',
  ],
  examples: [
    '1M users',
    '50% faster',
    '200ms response time',
    '99.9% uptime',
    '10K requests/second',
    '500% traffic growth',
  ],
  reasoning: 'Quantify technical impact with performance metrics',
}

/**
 * Leadership metric templates
 *
 * Industry norms:
 * - Team lead: 3-8 direct reports
 * - Manager: 8-15 direct reports
 * - Director+: 15+ direct reports
 */
export const LEADERSHIP_METRICS: MetricTemplate = {
  context: 'leadership',
  prompts: [
    'team size',
    'direct reports',
    'scope of responsibility',
    'departments managed',
    'budget oversight',
    'people impacted',
  ],
  examples: [
    'team of 8',
    '12 direct reports',
    'across 3 departments',
    '50+ team members',
    'organization of 200+',
    'cross-functional team of 15',
  ],
  reasoning: 'Leadership impact measured by team scope',
}

/**
 * Competitive metric templates
 *
 * Rankings and percentiles add credibility to achievements
 */
export const COMPETITIVE_METRICS: MetricTemplate = {
  context: 'competitive',
  prompts: [
    'ranking position',
    'pool size',
    'percentile',
    'selection rate',
    'competition scope',
  ],
  examples: [
    'Top 5%',
    '3rd out of 500',
    '#1 place',
    '1 of 10 selected',
    'Top 10 nationwide',
    '95th percentile',
  ],
  reasoning: 'Competitive achievements more credible with ranking context',
}

/**
 * Scale/Scope metric templates
 *
 * Generic metrics for volume, frequency, and duration
 */
export const SCALE_METRICS: MetricTemplate = {
  context: 'scale',
  prompts: [
    'volume',
    'frequency',
    'duration',
    'project count',
    'timeline',
    'iteration cadence',
  ],
  examples: [
    '15 projects',
    'over 18 months',
    'weekly sprints',
    '50 deliverables',
    '6 quarters',
    '10 per month',
  ],
  reasoning: 'Scale provides context for impact',
}

/**
 * Get metric template for a given context
 *
 * @param context - The bullet context type
 * @returns Metric template with prompts and examples, or null if none
 */
export function getMetricTemplate(context: BulletContext): MetricTemplate | null {
  switch (context) {
    case 'financial':
      return FINANCIAL_METRICS
    case 'tech':
      return TECH_METRICS
    case 'leadership':
      return LEADERSHIP_METRICS
    case 'competitive':
      return COMPETITIVE_METRICS
    case 'scale':
      return SCALE_METRICS
    case 'none':
      return null
    default:
      return null
  }
}

/**
 * Get formatted prompt string for context
 *
 * @param context - The bullet context type
 * @returns Formatted prompt string with examples and reasoning
 */
export function getContextPrompt(context: BulletContext): string {
  const template = getMetricTemplate(context)

  if (!template) {
    return 'Pick ONE metric: specific number relevant to this achievement'
  }

  // Show example options but emphasize picking ONE
  const exampleList = template.examples.slice(0, 3).map(ex => `"${ex}"`).join(' OR ')

  return `Pick ONE metric (not multiple): ${exampleList}. ${template.reasoning}.`
}
