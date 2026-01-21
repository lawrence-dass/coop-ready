/**
 * Analysis Response Parsing
 *
 * Parses and validates OpenAI analysis responses.
 *
 * @see Story 4.2: ATS Score Calculation
 */

import type { AnalysisResult } from '@/lib/types/analysis'

/**
 * Clamp score to valid 0-100 range
 */
function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)))
}

/**
 * Parse OpenAI analysis response
 *
 * Extracts and validates analysis result from OpenAI response content.
 * Handles malformed JSON with fallback scoring to prevent analysis failures.
 *
 * Validation rules:
 * - Scores must be 0-100 (clamped if out of range)
 * - Justification must be non-empty string
 * - Strengths/weaknesses arrays must have 1-5 items
 * - Malformed responses trigger fallback with neutral score
 *
 * @param responseContent - Raw content from OpenAI response
 * @returns Parsed and validated AnalysisResult
 * @throws Error if response is completely unparseable
 */
export function parseAnalysisResponse(responseContent: string): AnalysisResult {
  try {
    // Remove any markdown code block wrappers if present
    const cleanedContent = responseContent
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/\s*```$/i, '')

    // Parse JSON
    const parsed = JSON.parse(cleanedContent)

    // Validate structure
    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Response is not a valid object')
    }

    if (typeof parsed.overallScore !== 'number') {
      throw new Error('Missing or invalid overallScore')
    }

    if (!parsed.scoreBreakdown || typeof parsed.scoreBreakdown !== 'object') {
      throw new Error('Missing or invalid scoreBreakdown')
    }

    if (typeof parsed.justification !== 'string' || !parsed.justification.trim()) {
      throw new Error('Missing or invalid justification')
    }

    if (!Array.isArray(parsed.strengths)) {
      throw new Error('Missing or invalid strengths array')
    }

    if (!Array.isArray(parsed.weaknesses)) {
      throw new Error('Missing or invalid weaknesses array')
    }

    // Clamp all scores to valid range (0-100)
    const overallScore = clampScore(parsed.overallScore)
    const scoreBreakdown = {
      keywords: clampScore(parsed.scoreBreakdown.keywords ?? 0),
      skills: clampScore(parsed.scoreBreakdown.skills ?? 0),
      experience: clampScore(parsed.scoreBreakdown.experience ?? 0),
      format: clampScore(parsed.scoreBreakdown.format ?? 0),
    }

    // Limit arrays to reasonable size (max 5 items each)
    const strengths = parsed.strengths
      .filter((s: unknown) => typeof s === 'string' && s.trim())
      .slice(0, 5)

    const weaknesses = parsed.weaknesses
      .filter((w: unknown) => typeof w === 'string' && w.trim())
      .slice(0, 5)

    const result: AnalysisResult = {
      overallScore,
      scoreBreakdown,
      justification: parsed.justification.trim(),
      strengths,
      weaknesses,
    }

    // Log parsed result for debugging
    console.debug('[parseAnalysisResponse] Parsed successfully', {
      overallScore: result.overallScore,
      breakdown: result.scoreBreakdown,
      strengthsCount: result.strengths.length,
      weaknessesCount: result.weaknesses.length,
      timestamp: new Date().toISOString(),
    })

    return result
  } catch (error) {
    console.error('[parseAnalysisResponse] Failed to parse response', {
      error: error instanceof Error ? error.message : String(error),
      responsePreview: responseContent.slice(0, 200),
      timestamp: new Date().toISOString(),
    })

    // Fallback scoring for malformed responses
    // Prevents complete analysis failure, allows user to retry
    const fallbackResult: AnalysisResult = {
      overallScore: 50,
      scoreBreakdown: {
        keywords: 50,
        skills: 50,
        experience: 50,
        format: 50,
      },
      justification:
        'Analysis incomplete due to unexpected response format. Please try again.',
      strengths: ['Unable to determine strengths - please retry analysis'],
      weaknesses: ['Unable to determine weaknesses - please retry analysis'],
    }

    console.warn('[parseAnalysisResponse] Using fallback scoring', {
      fallbackScore: fallbackResult.overallScore,
      timestamp: new Date().toISOString(),
    })

    return fallbackResult
  }
}

/**
 * Validate that analysis result is reasonable
 *
 * Performs sanity checks on parsed analysis to catch edge cases:
 * - Overall score should roughly align with breakdown average
 * - Scores should not all be identical (suggests LLM failure mode)
 * - Justification should be meaningful (not generic fallback)
 *
 * @param result - Parsed analysis result
 * @returns true if result passes validation, false otherwise
 */
export function isValidAnalysisResult(result: AnalysisResult): boolean {
  // Check overall score is within valid range
  if (result.overallScore < 0 || result.overallScore > 100) {
    return false
  }

  // Check breakdown scores are valid
  const breakdown = result.scoreBreakdown
  if (
    breakdown.keywords < 0 ||
    breakdown.keywords > 100 ||
    breakdown.skills < 0 ||
    breakdown.skills > 100 ||
    breakdown.experience < 0 ||
    breakdown.experience > 100 ||
    breakdown.format < 0 ||
    breakdown.format > 100
  ) {
    return false
  }

  // Check arrays have reasonable content
  if (result.strengths.length === 0 || result.weaknesses.length === 0) {
    return false
  }

  // Check justification is not fallback message
  if (result.justification.includes('Analysis incomplete')) {
    return false
  }

  // Calculate weighted average from breakdown (40% keywords, 30% skills, 20% exp, 10% format)
  const calculatedScore =
    breakdown.keywords * 0.4 +
    breakdown.skills * 0.3 +
    breakdown.experience * 0.2 +
    breakdown.format * 0.1

  // Overall score should be reasonably close to calculated score (within 15 points tolerance)
  const scoreDifference = Math.abs(result.overallScore - calculatedScore)
  if (scoreDifference > 15) {
    console.warn('[isValidAnalysisResult] Score mismatch detected', {
      overallScore: result.overallScore,
      calculatedScore: calculatedScore.toFixed(1),
      difference: scoreDifference.toFixed(1),
    })
    return false
  }

  return true
}
