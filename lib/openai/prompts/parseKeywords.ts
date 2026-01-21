/**
 * Keyword Extraction Response Parsing
 *
 * Parses OpenAI response for keyword extraction data.
 *
 * @see Story 4.3: Missing Keywords Detection
 */

import type {
  Keyword,
  MissingKeyword,
  KeywordExtractionResult,
  KeywordAnalysis,
} from '@/lib/types/analysis'

/**
 * Parse keyword extraction data from OpenAI response
 *
 * Handles:
 * - Sorting by frequency (highest first)
 * - Limiting missing keywords to top 15
 * - Malformed responses (returns empty arrays)
 * - Validation of keyword structure
 *
 * @param responseContent - Raw JSON string from OpenAI
 * @returns Parsed and validated keyword extraction result
 */
export function parseKeywordsResponse(responseContent: string): KeywordExtractionResult {
  try {
    // Clean markdown code blocks if present
    const cleanedContent = responseContent
      .trim()
      .replace(/^```json\s*/i, '')
      .replace(/\s*```$/i, '')

    const parsed = JSON.parse(cleanedContent)

    // Extract keywords section from full response
    const keywordsData = parsed.keywords || {}

    // Parse keywords found
    const keywordsFound: Keyword[] = (keywordsData.keywordsFound || [])
      .filter((k: unknown) => isValidKeyword(k))
      .sort((a: Keyword, b: Keyword) => b.frequency - a.frequency) // Sort by frequency desc

    // Parse keywords missing
    const rawMissing: MissingKeyword[] = (keywordsData.keywordsMissing || [])
      .filter((k: unknown) => isValidMissingKeyword(k))
      .sort((a: MissingKeyword, b: MissingKeyword) => {
        // Sort by priority first (high > medium > low)
        const priorityOrder = { high: 3, medium: 2, low: 1 }
        const priorityDiff = priorityOrder[b.priority] - priorityOrder[a.priority]
        if (priorityDiff !== 0) return priorityDiff

        // Then by frequency (highest first)
        return b.frequency - a.frequency
      })

    // Limit to top 15 missing keywords (balance detail vs overwhelm)
    const keywordsMissing = rawMissing.slice(0, 15)

    // Calculate coverage
    const majorKeywordsCoverage = Math.max(
      0,
      Math.min(100, Math.round(keywordsData.majorKeywordsCoverage || 0))
    )

    console.log('[parseKeywordsResponse] Parsed keyword data', {
      foundCount: keywordsFound.length,
      missingCount: keywordsMissing.length,
      coverage: majorKeywordsCoverage,
    })

    return {
      keywordsFound,
      keywordsMissing,
      majorKeywordsCoverage,
    }
  } catch (error) {
    // Fallback for malformed responses
    console.error('[parseKeywordsResponse] Failed to parse keyword data', error)
    return {
      keywordsFound: [],
      keywordsMissing: [],
      majorKeywordsCoverage: 0,
    }
  }
}

/**
 * Validate keyword object structure
 */
function isValidKeyword(k: unknown): k is Keyword {
  if (typeof k !== 'object' || k === null) return false
  const keyword = k as Record<string, unknown>

  return (
    typeof keyword.keyword === 'string' &&
    keyword.keyword.trim() !== '' &&
    typeof keyword.frequency === 'number' &&
    keyword.frequency >= 0 &&
    (keyword.variant === null ||
      keyword.variant === undefined ||
      typeof keyword.variant === 'string')
  )
}

/**
 * Validate missing keyword object structure
 */
function isValidMissingKeyword(k: unknown): k is MissingKeyword {
  if (typeof k !== 'object' || k === null) return false
  const keyword = k as Record<string, unknown>

  return (
    typeof keyword.keyword === 'string' &&
    keyword.keyword.trim() !== '' &&
    typeof keyword.frequency === 'number' &&
    keyword.frequency >= 0 &&
    typeof keyword.priority === 'string' &&
    ['high', 'medium', 'low'].includes(keyword.priority)
  )
}

/**
 * Convert KeywordExtractionResult to KeywordAnalysis
 *
 * Adds derived fields like allMajorKeywordsPresent
 *
 * @param extraction - Raw keyword extraction result
 * @returns Enhanced keyword analysis with derived fields
 */
export function toKeywordAnalysis(extraction: KeywordExtractionResult): KeywordAnalysis {
  return {
    ...extraction,
    allMajorKeywordsPresent: extraction.majorKeywordsCoverage >= 90,
  }
}

/**
 * Validate keyword extraction result
 *
 * Checks:
 * - Arrays are valid
 * - Coverage is in valid range (0-100)
 * - Keywords are properly structured
 *
 * @param result - Keyword extraction result to validate
 * @returns True if valid, false otherwise
 */
export function isValidKeywordResult(result: KeywordExtractionResult): boolean {
  // Check arrays exist and are valid
  if (!Array.isArray(result.keywordsFound) || !Array.isArray(result.keywordsMissing)) {
    console.warn('[isValidKeywordResult] Invalid arrays')
    return false
  }

  // Check coverage is in valid range
  if (
    typeof result.majorKeywordsCoverage !== 'number' ||
    result.majorKeywordsCoverage < 0 ||
    result.majorKeywordsCoverage > 100
  ) {
    console.warn('[isValidKeywordResult] Invalid coverage', {
      coverage: result.majorKeywordsCoverage,
    })
    return false
  }

  // Check all keywords are valid
  const allFoundValid = result.keywordsFound.every(isValidKeyword)
  const allMissingValid = result.keywordsMissing.every(isValidMissingKeyword)

  if (!allFoundValid || !allMissingValid) {
    console.warn('[isValidKeywordResult] Invalid keyword structure')
    return false
  }

  return true
}
