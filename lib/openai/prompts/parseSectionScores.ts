/**
 * Section Scores Response Parser
 * Story: 4.4 - Section-Level Score Breakdown
 *
 * Parses section-level scores from OpenAI analysis response.
 */

import type {
  SectionScores,
  SectionScoresResult,
  SectionScore,
} from '@/lib/types/analysis'

/**
 * Validates a single section score object
 */
function isValidSectionScore(value: unknown): value is SectionScore {
  if (typeof value !== 'object' || value === null) {
    return false
  }

  const score = value as Record<string, unknown>
  return (
    typeof score.score === 'number' &&
    score.score >= 0 &&
    score.score <= 100 &&
    typeof score.explanation === 'string' &&
    score.explanation.length > 0 &&
    Array.isArray(score.strengths) &&
    Array.isArray(score.weaknesses)
  )
}

/**
 * Clamps score to valid range 0-100
 */
function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Parses section scores from OpenAI response
 *
 * Handles:
 * - Score validation and clamping
 * - Malformed response fallback
 * - Missing sections
 * - Invalid section data
 *
 * @param responseContent - Raw OpenAI response string
 * @returns Parsed section scores result
 *
 * @example
 * const result = parseSectionScoresResponse(aiResponse)
 * // Returns: { sectionScores: { experience: {...}, education: {...} } }
 */
export function parseSectionScoresResponse(
  responseContent: string
): SectionScoresResult {
  try {
    // Clean JSON from markdown code fences
    const cleanedContent = responseContent
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/\s*```$/i, '')

    const parsed = JSON.parse(cleanedContent)
    const rawSectionScores = parsed.sectionScores || {}

    // Parse and validate each section
    const sectionScores: SectionScores = {}

    // Supported sections: experience, education, skills, projects, summary
    const sections = ['experience', 'education', 'skills', 'projects', 'summary'] as const

    for (const section of sections) {
      const sectionData = rawSectionScores[section]

      // Skip if section doesn't exist in response
      if (!sectionData || typeof sectionData !== 'object' || sectionData === null) {
        continue
      }

      // Check basic structure BEFORE clamping
      const data = sectionData as Record<string, unknown>
      if (
        typeof data.score !== 'number' ||
        typeof data.explanation !== 'string' ||
        data.explanation.length === 0 ||
        !Array.isArray(data.strengths) ||
        !Array.isArray(data.weaknesses)
      ) {
        console.warn(`[parseSectionScoresResponse] Invalid section data for ${section}`)
        continue
      }

      // Parse and clamp score
      const clampedScore = clampScore(data.score as number)

      // Ensure arrays are valid
      const strengths = (data.strengths as unknown[]).filter(
        (s): s is string => typeof s === 'string'
      )

      const weaknesses = (data.weaknesses as unknown[]).filter(
        (w): w is string => typeof w === 'string'
      )

      sectionScores[section] = {
        score: clampedScore,
        explanation: (data.explanation as string).trim(),
        strengths,
        weaknesses,
      }
    }

    return { sectionScores }
  } catch (error) {
    // Fallback for malformed responses
    console.error('[parseSectionScoresResponse] Failed to parse section scores', error)
    return {
      sectionScores: {},
    }
  }
}

/**
 * Validates section scores result
 *
 * Checks:
 * - At least one section present
 * - All scores are 0-100
 * - All sections have explanations
 *
 * @param result - Section scores result to validate
 * @returns True if valid, false otherwise
 */
export function isValidSectionScoresResult(result: SectionScoresResult): boolean {
  const { sectionScores } = result

  // Empty section scores is valid (resume may have no sections)
  if (Object.keys(sectionScores).length === 0) {
    return true
  }

  // Validate each section
  for (const sectionData of Object.values(sectionScores)) {
    if (!isValidSectionScore(sectionData)) {
      return false
    }
  }

  return true
}
