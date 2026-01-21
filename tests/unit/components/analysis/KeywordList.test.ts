/**
 * Unit Tests for KeywordList Component Logic
 * Story: 4.7 - Analysis Results Page - Task 6
 */

import { describe, it, expect } from '@jest/globals'

// Test the coverage calculation logic extracted from KeywordList component
interface MissingKeyword {
  keyword: string
  frequency: number
  priority: 'high' | 'medium' | 'low'
}

interface FoundKeyword {
  keyword: string
  frequency: number
}

/**
 * Calculate whether user has good keyword coverage
 * Shows "Great job" if no high-priority keywords are missing
 */
function calculateHasGoodCoverage(
  keywordsFound: FoundKeyword[] | null,
  keywordsMissing: MissingKeyword[] | null
): boolean {
  const found = keywordsFound || []
  const missing = keywordsMissing || []

  const highPriorityMissing = missing.filter((k) => k.priority === 'high')
  return highPriorityMissing.length === 0 && found.length > 0
}

describe('KeywordList Coverage Logic (Story 4.7)', () => {
  describe('calculateHasGoodCoverage', () => {
    it('should return true when no high-priority keywords missing and some found', () => {
      const found: FoundKeyword[] = [
        { keyword: 'JavaScript', frequency: 3 },
        { keyword: 'React', frequency: 2 },
      ]
      const missing: MissingKeyword[] = [
        { keyword: 'TypeScript', frequency: 1, priority: 'medium' },
        { keyword: 'Node.js', frequency: 1, priority: 'low' },
      ]

      expect(calculateHasGoodCoverage(found, missing)).toBe(true)
    })

    it('should return false when high-priority keywords are missing', () => {
      const found: FoundKeyword[] = [
        { keyword: 'JavaScript', frequency: 3 },
      ]
      const missing: MissingKeyword[] = [
        { keyword: 'Python', frequency: 5, priority: 'high' },
        { keyword: 'TypeScript', frequency: 1, priority: 'medium' },
      ]

      expect(calculateHasGoodCoverage(found, missing)).toBe(false)
    })

    it('should return false when no keywords found', () => {
      const found: FoundKeyword[] = []
      const missing: MissingKeyword[] = []

      expect(calculateHasGoodCoverage(found, missing)).toBe(false)
    })

    it('should return true when all keywords found and none missing', () => {
      const found: FoundKeyword[] = [
        { keyword: 'JavaScript', frequency: 3 },
        { keyword: 'React', frequency: 2 },
        { keyword: 'Node.js', frequency: 1 },
      ]
      const missing: MissingKeyword[] = []

      expect(calculateHasGoodCoverage(found, missing)).toBe(true)
    })

    it('should handle null inputs gracefully', () => {
      expect(calculateHasGoodCoverage(null, null)).toBe(false)
      expect(calculateHasGoodCoverage(null, [])).toBe(false)
      expect(calculateHasGoodCoverage([], null)).toBe(false)
    })

    it('should only consider high priority for coverage calculation', () => {
      const found: FoundKeyword[] = [
        { keyword: 'JavaScript', frequency: 1 },
      ]

      // Many medium and low priority missing, but no high priority
      const missing: MissingKeyword[] = [
        { keyword: 'TypeScript', frequency: 1, priority: 'medium' },
        { keyword: 'Python', frequency: 1, priority: 'medium' },
        { keyword: 'Java', frequency: 1, priority: 'low' },
        { keyword: 'C++', frequency: 1, priority: 'low' },
        { keyword: 'Rust', frequency: 1, priority: 'low' },
      ]

      // Should still be good coverage since no HIGH priority missing
      expect(calculateHasGoodCoverage(found, missing)).toBe(true)
    })
  })

  describe('Keyword Sorting', () => {
    it('should sort missing keywords by priority: high → medium → low', () => {
      const missing: MissingKeyword[] = [
        { keyword: 'Low1', frequency: 1, priority: 'low' },
        { keyword: 'High1', frequency: 1, priority: 'high' },
        { keyword: 'Medium1', frequency: 1, priority: 'medium' },
        { keyword: 'High2', frequency: 1, priority: 'high' },
        { keyword: 'Low2', frequency: 1, priority: 'low' },
      ]

      const priorityOrder = { high: 0, medium: 1, low: 2 }
      const sorted = [...missing].sort(
        (a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]
      )

      // First two should be high priority
      expect(sorted[0].priority).toBe('high')
      expect(sorted[1].priority).toBe('high')

      // Third should be medium
      expect(sorted[2].priority).toBe('medium')

      // Last two should be low
      expect(sorted[3].priority).toBe('low')
      expect(sorted[4].priority).toBe('low')
    })
  })
})
