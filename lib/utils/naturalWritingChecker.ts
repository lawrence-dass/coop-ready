/**
 * @file naturalWritingChecker.ts
 * @description Natural writing checker utility for detecting AI-tell patterns and enforcing natural writing standards
 * @see Story 9.3: Natural Writing Enforcement
 */

/**
 * Banned phrases that indicate AI-generated content
 * Primary list: always replace
 */
const BANNED_PHRASES = [
  'spearheaded',
  'leveraged',
  'synergized',
  'utilize',
  'utilized',
  'utilizing',
] as const

/**
 * Alternatives for each banned phrase
 */
const PHRASE_ALTERNATIVES: Record<string, string[]> = {
  spearheaded: ['Led', 'Directed', 'Initiated'],
  leveraged: ['Used', 'Applied', 'Employed'],
  synergized: ['Collaborated', 'Coordinated', 'Partnered'],
  utilize: ['Use', 'Apply', 'Employ'],
  utilized: ['Used', 'Applied', 'Employed'],
  utilizing: ['Using', 'Applying', 'Employing'],
}

/**
 * Verb categories for diversity checking
 */
export const VERB_CATEGORIES = {
  leadership: ['Led', 'Directed', 'Managed', 'Coordinated', 'Guided', 'Organized'],
  technical: ['Built', 'Designed', 'Implemented', 'Developed', 'Created', 'Engineered'],
  analytics: ['Analyzed', 'Evaluated', 'Assessed', 'Measured', 'Quantified', 'Determined'],
  communication: ['Communicated', 'Presented', 'Articulated', 'Explained', 'Conveyed'],
  problemSolving: ['Resolved', 'Solved', 'Addressed', 'Overcame', 'Improved'],
} as const

/**
 * Word count thresholds
 */
const WORD_COUNT = {
  MIN_OPTIMAL: 20,
  MAX_OPTIMAL: 35,
  MIN_WARNING: 15,
  MAX_WARNING: 40,
} as const

/**
 * Result type for banned phrase detection
 */
export interface BannedPhraseResult {
  hasBannedPhrases: boolean
  bannedPhrases: Array<{
    phrase: string
    alternatives: string[]
  }>
}

/**
 * Result type for word count validation
 */
export interface WordCountResult {
  isValid: boolean
  wordCount: number
  issue: 'too_short' | 'too_long' | null
  message: string | null
}

/**
 * Result type for verb diversity check
 */
export interface VerbDiversityResult {
  hasIssues: boolean
  repeatedVerbs: Array<{
    verb: string
    count: number
    alternatives: string[]
  }>
}

/**
 * Combined natural writing check results for a single bullet
 */
export interface NaturalWritingCheckResults {
  bullet: string
  bannedPhrases: BannedPhraseResult
  wordCount: WordCountResult
  verbDiversity: VerbDiversityResult
}

/**
 * Detect banned phrases in a bullet point
 *
 * @param bullet - The bullet point text to check
 * @returns Result with banned phrases found and their alternatives
 */
export function detectBannedPhrases(bullet: string): BannedPhraseResult {
  if (!bullet || bullet.trim().length === 0) {
    return { hasBannedPhrases: false, bannedPhrases: [] }
  }

  const lowerBullet = bullet.toLowerCase()
  const found: Array<{ phrase: string; alternatives: string[] }> = []

  for (const phrase of BANNED_PHRASES) {
    // Check if the phrase appears as a whole word (not part of another word)
    const regex = new RegExp(`\\b${phrase}\\b`, 'i')
    if (regex.test(lowerBullet)) {
      const alternatives = PHRASE_ALTERNATIVES[phrase] || []
      found.push({ phrase, alternatives })
    }
  }

  return {
    hasBannedPhrases: found.length > 0,
    bannedPhrases: found,
  }
}

/**
 * Get alternatives for a banned phrase
 *
 * @param phrase - The banned phrase to get alternatives for
 * @returns Array of alternative words/phrases
 */
export function getAlternatives(phrase: string): string[] {
  const normalized = phrase.toLowerCase().trim()
  return PHRASE_ALTERNATIVES[normalized] || []
}

/**
 * Validate word count in a bullet point
 *
 * Word counting rules:
 * - Hyphenated words count as 1 word (e.g., "well-organized" = 1)
 * - Contractions count as 1 word (e.g., "don't" = 1)
 * - Optimal range: 20-35 words
 * - Warning if < 15 or > 40 words
 *
 * @param bullet - The bullet point text to validate
 * @returns Result with word count and any issues
 */
export function validateWordCount(bullet: string): WordCountResult {
  if (!bullet || bullet.trim().length === 0) {
    return {
      isValid: false,
      wordCount: 0,
      issue: 'too_short',
      message: 'Consider adding more context (currently 0 words)',
    }
  }

  // Split by whitespace and filter out empty strings
  const words = bullet
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)

  const wordCount = words.length

  // Check if in optimal range
  if (wordCount >= WORD_COUNT.MIN_OPTIMAL && wordCount <= WORD_COUNT.MAX_OPTIMAL) {
    return {
      isValid: true,
      wordCount,
      issue: null,
      message: null,
    }
  }

  // Check if too short
  if (wordCount < WORD_COUNT.MIN_WARNING) {
    return {
      isValid: false,
      wordCount,
      issue: 'too_short',
      message: `Consider adding more context (currently ${wordCount} words)`,
    }
  }

  // Check if too long (> 40 words)
  if (wordCount > WORD_COUNT.MAX_WARNING) {
    return {
      isValid: false,
      wordCount,
      issue: 'too_long',
      message: `Consider splitting or condensing (currently ${wordCount} words)`,
    }
  }

  // In acceptable but not optimal range (15-20 or 35-40)
  // Still considered valid, just not optimal
  return {
    isValid: true,
    wordCount,
    issue: null,
    message: null,
  }
}

/**
 * Get verb category for a given verb
 *
 * @param verb - The verb to categorize
 * @returns Category name or null if not found
 */
function getVerbCategory(verb: string): string | null {
  const normalized = verb.toLowerCase()

  for (const [category, verbs] of Object.entries(VERB_CATEGORIES)) {
    if (verbs.some(v => v.toLowerCase() === normalized)) {
      return category
    }
  }

  return null
}

/**
 * Get alternatives from the same verb category
 *
 * @param verb - The verb to find alternatives for
 * @returns Array of alternative verbs from same category
 */
function getVerbCategoryAlternatives(verb: string): string[] {
  const category = getVerbCategory(verb)
  if (!category) {
    return []
  }

  const categoryVerbs = VERB_CATEGORIES[category as keyof typeof VERB_CATEGORIES]
  // Return all verbs in category except the input verb
  return categoryVerbs.filter(v => v.toLowerCase() !== verb.toLowerCase())
}

/**
 * Extract the first verb from a bullet point
 *
 * @param bullet - The bullet point text
 * @returns The first verb found, or null if none
 */
function extractFirstVerb(bullet: string): string | null {
  if (!bullet || bullet.trim().length === 0) {
    return null
  }

  // Get the first word (typically the action verb)
  const words = bullet.trim().split(/\s+/)
  if (words.length === 0) {
    return null
  }

  return words[0].replace(/[^\w-]/g, '') // Remove punctuation
}

/**
 * Check verb diversity across multiple bullet points
 *
 * Flags verbs that appear 3+ times and suggests alternatives
 * from the same category
 *
 * @param bullets - Array of bullet points to check
 * @returns Result with repeated verbs and alternatives
 */
export function checkVerbDiversity(bullets: string[]): VerbDiversityResult {
  if (!bullets || bullets.length === 0) {
    return { hasIssues: false, repeatedVerbs: [] }
  }

  // Count verb occurrences
  const verbCounts = new Map<string, number>()

  for (const bullet of bullets) {
    const verb = extractFirstVerb(bullet)
    if (verb) {
      const normalized = verb.toLowerCase()
      verbCounts.set(normalized, (verbCounts.get(normalized) || 0) + 1)
    }
  }

  // Find verbs that appear 3+ times
  const repeated: Array<{
    verb: string
    count: number
    alternatives: string[]
  }> = []

  for (const [verb, count] of verbCounts.entries()) {
    if (count >= 3) {
      const alternatives = getVerbCategoryAlternatives(verb)
      repeated.push({
        verb,
        count,
        alternatives: alternatives.length > 0 ? alternatives : ['Managed', 'Directed', 'Coordinated'],
      })
    }
  }

  return {
    hasIssues: repeated.length > 0,
    repeatedVerbs: repeated,
  }
}

/**
 * Run all natural writing checks on bullet points
 *
 * Orchestrates all validation checks and returns combined results
 *
 * @param bullets - Array of bullet points to check
 * @returns Array of check results for each bullet
 */
export function runNaturalWritingChecks(bullets: string[]): NaturalWritingCheckResults[] {
  if (!bullets || bullets.length === 0) {
    return []
  }

  // Run verb diversity check once across all bullets
  const verbDiversity = checkVerbDiversity(bullets)

  // Run other checks per bullet
  return bullets.map((bullet) => ({
    bullet,
    bannedPhrases: detectBannedPhrases(bullet),
    wordCount: validateWordCount(bullet),
    verbDiversity, // Same result for all bullets
  }))
}
