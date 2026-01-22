/**
 * Role to Context Mapping
 *
 * Maps user target roles to relevant bullet contexts for prioritizing
 * context-aware metric prompts based on career goals.
 *
 * @see Story 9.4: Context-Aware Metric Prompts
 */

import type { BulletContext } from './contextDetector'

/**
 * Role context mapping
 */
export interface RoleContextMapping {
  primaryContext: BulletContext
  secondaryContexts: BulletContext[]
}

/**
 * Finance-related role keywords
 */
const FINANCE_ROLES = [
  'finance',
  'accounting',
  'accountant',
  'investment',
  'financial',
  'analyst',
  'banking',
  'treasury',
  'audit',
  'controller',
  'cfo',
  'economist',
  'portfolio',
]

/**
 * Tech-related role keywords
 */
const TECH_ROLES = [
  'software',
  'engineer',
  'developer',
  'programmer',
  'devops',
  'sre',
  'architect',
  'data',
  'machine learning',
  'ai',
  'frontend',
  'backend',
  'full stack',
  'fullstack',
  'web',
  'mobile',
  'ios',
  'android',
  'cloud',
  'security',
  'qa',
  'test',
]

/**
 * Leadership-related role keywords
 */
const LEADERSHIP_ROLES = [
  'manager',
  'director',
  'head',
  'lead',
  'vp',
  'vice president',
  'chief',
  'ceo',
  'cto',
  'cio',
  'executive',
  'principal',
  'senior',
  'supervisor',
  'coordinator',
]

/**
 * Map target role to primary and secondary contexts
 *
 * Priority Logic:
 * - Finance roles → Financial metrics prioritized
 * - Tech roles → Tech metrics prioritized
 * - Leadership roles → Leadership metrics prioritized
 * - Unknown roles → No prioritization (bullet context wins)
 *
 * @param targetRole - User's target role title
 * @returns Role context mapping with primary and secondary contexts
 */
export function roleToContextMapping(targetRole: string): RoleContextMapping {
  const lowerRole = targetRole.toLowerCase()

  // Count matches for each context type
  const financeMatches = FINANCE_ROLES.filter(keyword => lowerRole.includes(keyword)).length
  const techMatches = TECH_ROLES.filter(keyword => lowerRole.includes(keyword)).length
  const leadershipMatches = LEADERSHIP_ROLES.filter(keyword => lowerRole.includes(keyword)).length

  // Return context with most keyword matches
  const maxMatches = Math.max(financeMatches, techMatches, leadershipMatches)

  if (maxMatches === 0) {
    // Unknown role - no prioritization
    return {
      primaryContext: 'none',
      secondaryContexts: [],
    }
  }

  // Priority when tied: leadership > finance > tech
  if (leadershipMatches === maxMatches) {
    return {
      primaryContext: 'leadership',
      secondaryContexts: ['financial', 'tech', 'scale'],
    }
  }

  if (financeMatches === maxMatches) {
    return {
      primaryContext: 'financial',
      secondaryContexts: ['leadership', 'scale'],
    }
  }

  return {
    primaryContext: 'tech',
    secondaryContexts: ['leadership', 'scale'],
  }
}

/**
 * Prioritize context based on target role
 *
 * If bullet context matches role's primary context, boost it.
 * Otherwise, use bullet's detected context.
 *
 * @param bulletContext - Detected context from bullet
 * @param targetRole - User's target role
 * @returns Prioritized context considering role preference
 */
export function prioritizeContextByRole(
  bulletContext: BulletContext,
  targetRole: string
): BulletContext {
  // If no bullet context detected, use role's primary context
  if (bulletContext === 'none') {
    const roleMapping = roleToContextMapping(targetRole)
    return roleMapping.primaryContext
  }

  // Otherwise, use bullet's detected context (it's more specific)
  return bulletContext
}

/**
 * Get scale examples appropriate for role level
 *
 * Finance roles use larger dollar scales, tech roles use larger user scales.
 *
 * @param context - The bullet context
 * @param targetRole - User's target role
 * @returns Scale adjustment factor (1 = default, 10 = 10x scale, 100 = 100x scale)
 */
export function getScaleAdjustmentForRole(
  context: BulletContext,
  targetRole: string
): number {
  const lowerRole = targetRole.toLowerCase()

  // Executive roles get highest scale (c-suite + "executive vice president")
  const isExecutive =
    /\bceo\b/.test(lowerRole) ||
    /\bcfo\b/.test(lowerRole) ||
    /\bcto\b/.test(lowerRole) ||
    /\bcio\b/.test(lowerRole) ||
    /\bchief\s+\w+\s+officer\b/.test(lowerRole) || // "Chief X Officer"
    (lowerRole.includes('executive') && lowerRole.includes('vice president'))

  // Senior roles get elevated scale (senior, director, vp - but not if already executive)
  const isSenior =
    !isExecutive && (
      lowerRole.includes('senior') ||
      lowerRole.includes('director') ||
      lowerRole.includes('vp') ||
      lowerRole.includes('vice president')
    )

  if (context === 'financial') {
    if (isExecutive) return 100 // $10M+ range
    if (isSenior) return 10 // $1M+ range
    return 1 // $100K-$500K range
  }

  if (context === 'tech') {
    if (isExecutive) return 100 // 10M+ users
    if (isSenior) return 10 // 1M+ users
    return 1 // 10K-100K users
  }

  if (context === 'leadership') {
    if (isExecutive) return 10 // 50+ reports
    if (isSenior) return 5 // 15+ reports
    return 1 // 3-8 reports
  }

  return 1 // Default scale for other contexts
}
