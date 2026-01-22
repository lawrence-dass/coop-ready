/**
 * @file verbAlternatives.test.ts
 * @description Tests for verb alternatives mapping
 * @see Story 9.3: Natural Writing Enforcement - Task 2.5-2.6
 */

import {
  VERB_ALTERNATIVES,
  getVerbInfo,
  getVerbsByCategory,
  isVerbInCategory,
} from '@/lib/data/verbAlternatives'

describe('VERB_ALTERNATIVES structure', () => {
  it('should have 5 verb categories', () => {
    const categories = Object.keys(VERB_ALTERNATIVES)
    expect(categories).toHaveLength(5)
    expect(categories).toContain('leadership')
    expect(categories).toContain('technical')
    expect(categories).toContain('analytics')
    expect(categories).toContain('communication')
    expect(categories).toContain('problemSolving')
  })

  it('should have 3-5 alternatives per verb', () => {
    for (const categoryData of Object.values(VERB_ALTERNATIVES)) {
      for (const verbInfo of Object.values(categoryData.verbs)) {
        expect(verbInfo.alternatives.length).toBeGreaterThanOrEqual(3)
        expect(verbInfo.alternatives.length).toBeLessThanOrEqual(5)
      }
    }
  })

  it('should have reasoning for each verb', () => {
    for (const categoryData of Object.values(VERB_ALTERNATIVES)) {
      for (const verbInfo of Object.values(categoryData.verbs)) {
        expect(verbInfo.reasoning).toBeTruthy()
        expect(verbInfo.reasoning.length).toBeGreaterThan(10)
      }
    }
  })
})

describe('getVerbInfo', () => {
  it('should return verb info for "led"', () => {
    const info = getVerbInfo('led')
    expect(info).not.toBeNull()
    expect(info?.category).toBe('Leadership')
    expect(info?.alternatives).toHaveLength(4)
    expect(info?.alternatives).toContain('Directed')
    expect(info?.reasoning).toBeTruthy()
  })

  it('should return verb info for "built"', () => {
    const info = getVerbInfo('built')
    expect(info).not.toBeNull()
    expect(info?.category).toBe('Technical')
    expect(info?.alternatives.length).toBeGreaterThanOrEqual(3)
  })

  it('should be case-insensitive', () => {
    const info1 = getVerbInfo('LED')
    const info2 = getVerbInfo('Led')
    const info3 = getVerbInfo('led')
    expect(info1).toEqual(info2)
    expect(info2).toEqual(info3)
  })

  it('should return null for unknown verb', () => {
    const info = getVerbInfo('unknownverb')
    expect(info).toBeNull()
  })
})

describe('getVerbsByCategory', () => {
  it('should return all leadership verbs', () => {
    const verbs = getVerbsByCategory('leadership')
    expect(verbs.length).toBeGreaterThan(0)
    expect(verbs).toContain('led')
    expect(verbs).toContain('managed')
  })

  it('should return all technical verbs', () => {
    const verbs = getVerbsByCategory('technical')
    expect(verbs.length).toBeGreaterThan(0)
    expect(verbs).toContain('built')
    expect(verbs).toContain('developed')
  })

  it('should return all analytics verbs', () => {
    const verbs = getVerbsByCategory('analytics')
    expect(verbs.length).toBeGreaterThan(0)
    expect(verbs).toContain('analyzed')
  })
})

describe('isVerbInCategory', () => {
  it('should return true for verbs in correct category', () => {
    expect(isVerbInCategory('led', 'leadership')).toBe(true)
    expect(isVerbInCategory('built', 'technical')).toBe(true)
    expect(isVerbInCategory('analyzed', 'analytics')).toBe(true)
  })

  it('should return false for verbs in wrong category', () => {
    expect(isVerbInCategory('led', 'technical')).toBe(false)
    expect(isVerbInCategory('built', 'analytics')).toBe(false)
  })

  it('should be case-insensitive', () => {
    expect(isVerbInCategory('LED', 'leadership')).toBe(true)
    expect(isVerbInCategory('Led', 'leadership')).toBe(true)
  })

  it('should return false for unknown verbs', () => {
    expect(isVerbInCategory('unknownverb', 'leadership')).toBe(false)
  })
})

describe('Category mapping consistency', () => {
  it('should have consistent verb alternatives (no verb suggesting itself)', () => {
    for (const categoryData of Object.values(VERB_ALTERNATIVES)) {
      for (const [verb, verbInfo] of Object.entries(categoryData.verbs)) {
        // Check that the verb doesn't suggest itself as an alternative
        const selfSuggestion = verbInfo.alternatives.some(
          alt => alt.toLowerCase() === verb.toLowerCase()
        )
        expect(selfSuggestion).toBe(false)
      }
    }
  })

  it('should have unique alternatives per verb', () => {
    for (const categoryData of Object.values(VERB_ALTERNATIVES)) {
      for (const verbInfo of Object.values(categoryData.verbs)) {
        const uniqueAlts = new Set(verbInfo.alternatives.map(a => a.toLowerCase()))
        expect(uniqueAlts.size).toBe(verbInfo.alternatives.length)
      }
    }
  })
})
