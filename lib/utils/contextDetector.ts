/**
 * Context Detector
 *
 * Detects resume bullet context (financial, tech, leadership, competitive, scale)
 * to provide context-aware quantification prompts
 *
 * @see Story 9.4: Context-Aware Metric Prompts
 */

/**
 * Context types for metric suggestions
 */
export type BulletContext =
  | 'financial'
  | 'tech'
  | 'leadership'
  | 'competitive'
  | 'scale'
  | 'none'

/**
 * Context classification result
 */
export interface ContextClassification {
  primaryContext: BulletContext
  detectedContexts: BulletContext[]
  confidence: number // 0-1 score
}

/**
 * Check if text contains keyword as a whole word (not as substring)
 * Uses word boundary regex to avoid false positives like "settled" matching "led"
 *
 * @param text - Text to search in (should be lowercase)
 * @param keyword - Keyword to find (should be lowercase)
 * @returns True if keyword appears as a whole word
 */
function containsWholeWord(text: string, keyword: string): boolean {
  // Escape special regex characters in keyword
  const escapedKeyword = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const pattern = new RegExp(`\\b${escapedKeyword}\\b`, 'i')
  return pattern.test(text)
}

/**
 * Financial context keywords
 */
const FINANCIAL_KEYWORDS = {
  primary: [
    'revenue',
    'budget',
    'cost',
    'savings',
    'roi',
    'aum',
    'margin',
    'profit',
    'ebitda',
    'cash flow',
  ],
  secondary: [
    'investment',
    'portfolio',
    'depreciation',
    'amortization',
    'pricing',
    'p&l',
  ],
}

/**
 * Tech context keywords
 */
const TECH_KEYWORDS = {
  primary: [
    'users',
    'traffic',
    'performance',
    'deployment',
    'api',
    'latency',
    'scale',
    'uptime',
  ],
  secondary: [
    'throughput',
    'database',
    'servers',
    'infrastructure',
    'microservices',
    'load',
  ],
}

/**
 * Leadership context keywords
 */
const LEADERSHIP_KEYWORDS = {
  primary: [
    'team',
    'managed',
    'led',
    'mentored',
    'trained',
    'supervised',
    'coordinated',
    'delegated',
  ],
  secondary: [
    'oversight',
    'accountability',
    'direction',
    'strategy',
    'vision',
    'culture',
  ],
}

/**
 * Competitive context keywords
 */
const COMPETITIVE_KEYWORDS = {
  primary: [
    'award',
    'won',
    'recognized',
    'ranked',
    'top',
    'best',
    'finalist',
    'competition',
  ],
  secondary: [
    'selected',
    'chosen',
    'featured',
    'distinguished',
    'honor',
  ],
}

/**
 * Scale/Scope context keywords
 */
const SCALE_KEYWORDS = {
  primary: [
    'projects',
    'months',
    'weeks',
    'weekly',
    'monthly',
    'quarterly',
    'annual',
    'hours',
    'days',
  ],
  secondary: [
    'initiatives',
    'programs',
    'campaigns',
    'cycles',
    'phases',
  ],
}

/**
 * Detect if bullet contains financial context
 *
 * @param bulletText - Bullet point text to analyze
 * @returns True if financial context detected
 */
export function detectFinancialContext(bulletText: string): boolean {
  const lowerText = bulletText.toLowerCase()
  const allKeywords = [...FINANCIAL_KEYWORDS.primary, ...FINANCIAL_KEYWORDS.secondary]
  return allKeywords.some((keyword) => containsWholeWord(lowerText, keyword))
}

/**
 * Detect if bullet contains tech context
 *
 * @param bulletText - Bullet point text to analyze
 * @returns True if tech context detected
 */
export function detectTechContext(bulletText: string): boolean {
  const lowerText = bulletText.toLowerCase()
  const allKeywords = [...TECH_KEYWORDS.primary, ...TECH_KEYWORDS.secondary]
  return allKeywords.some((keyword) => containsWholeWord(lowerText, keyword))
}

/**
 * Detect if bullet contains leadership context
 *
 * @param bulletText - Bullet point text to analyze
 * @returns True if leadership context detected
 */
export function detectLeadershipContext(bulletText: string): boolean {
  const lowerText = bulletText.toLowerCase()
  const allKeywords = [...LEADERSHIP_KEYWORDS.primary, ...LEADERSHIP_KEYWORDS.secondary]
  return allKeywords.some((keyword) => containsWholeWord(lowerText, keyword))
}

/**
 * Detect if bullet contains competitive context
 *
 * @param bulletText - Bullet point text to analyze
 * @returns True if competitive context detected
 */
export function detectCompetitiveContext(bulletText: string): boolean {
  const lowerText = bulletText.toLowerCase()
  const allKeywords = [...COMPETITIVE_KEYWORDS.primary, ...COMPETITIVE_KEYWORDS.secondary]
  return allKeywords.some((keyword) => containsWholeWord(lowerText, keyword))
}

/**
 * Detect if bullet contains scale/scope context
 *
 * @param bulletText - Bullet point text to analyze
 * @returns True if scale context detected
 */
export function detectScaleContext(bulletText: string): boolean {
  const lowerText = bulletText.toLowerCase()
  const allKeywords = [...SCALE_KEYWORDS.primary, ...SCALE_KEYWORDS.secondary]
  return allKeywords.some((keyword) => containsWholeWord(lowerText, keyword))
}

/**
 * Classify bullet context and return primary context
 *
 * Priority order:
 * 1. Financial (highest specificity)
 * 2. Tech (industry-specific)
 * 3. Leadership (role-specific)
 * 4. Competitive (achievement-specific)
 * 5. Scale (generic fallback)
 * 6. None (no context detected)
 *
 * Confidence Logic:
 * - 1.0: Single context detected OR multiple keywords from same context
 * - 0.7: Multiple different contexts detected (ambiguous)
 *
 * @param bulletText - Bullet point text to analyze
 * @returns Context classification with primary context and confidence
 */
export function classifyContext(bulletText: string): ContextClassification {
  const detectedContexts: BulletContext[] = []

  if (detectFinancialContext(bulletText)) {
    detectedContexts.push('financial')
  }
  if (detectTechContext(bulletText)) {
    detectedContexts.push('tech')
  }
  if (detectLeadershipContext(bulletText)) {
    detectedContexts.push('leadership')
  }
  if (detectCompetitiveContext(bulletText)) {
    detectedContexts.push('competitive')
  }
  if (detectScaleContext(bulletText)) {
    detectedContexts.push('scale')
  }

  // If no context detected, return 'none'
  if (detectedContexts.length === 0) {
    return {
      primaryContext: 'none',
      detectedContexts: [],
      confidence: 0,
    }
  }

  // Priority order: financial > tech > leadership > competitive > scale
  const priorityOrder: BulletContext[] = [
    'financial',
    'tech',
    'leadership',
    'competitive',
    'scale',
  ]

  const primaryContext = priorityOrder.find((ctx) =>
    detectedContexts.includes(ctx)
  ) || 'scale'

  // Confidence: 1.0 if single context, 0.7 if multiple contexts (ambiguous)
  const confidence = detectedContexts.length === 1 ? 1.0 : 0.7

  return {
    primaryContext,
    detectedContexts,
    confidence,
  }
}
