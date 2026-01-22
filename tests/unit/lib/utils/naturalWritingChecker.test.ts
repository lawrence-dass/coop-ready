/**
 * @file naturalWritingChecker.test.ts
 * @description Tests for natural writing checker utility
 * @see Story 9.3: Natural Writing Enforcement
 */

import {
  detectBannedPhrases,
  getAlternatives,
  validateWordCount,
  checkVerbDiversity,
  runNaturalWritingChecks,
  type BannedPhraseResult,
  type WordCountResult,
  type VerbDiversityResult,
  type NaturalWritingCheckResults,
} from '@/lib/utils/naturalWritingChecker'

describe('detectBannedPhrases', () => {
  it('should detect "spearheaded" in bullet point', () => {
    const result = detectBannedPhrases('Spearheaded a team of 5 developers')
    expect(result.hasBannedPhrases).toBe(true)
    expect(result.bannedPhrases).toHaveLength(1)
    expect(result.bannedPhrases[0].phrase).toBe('spearheaded')
  })

  it('should detect "leveraged" in bullet point', () => {
    const result = detectBannedPhrases('Leveraged React to build dashboard')
    expect(result.hasBannedPhrases).toBe(true)
    expect(result.bannedPhrases).toHaveLength(1)
    expect(result.bannedPhrases[0].phrase).toBe('leveraged')
  })

  it('should detect "synergized" in bullet point', () => {
    const result = detectBannedPhrases('Synergized with cross-functional teams')
    expect(result.hasBannedPhrases).toBe(true)
    expect(result.bannedPhrases[0].phrase).toBe('synergized')
  })

  it('should detect "utilize" variants', () => {
    const result1 = detectBannedPhrases('Utilized Python for automation')
    const result2 = detectBannedPhrases('Utilizing modern frameworks')
    expect(result1.hasBannedPhrases).toBe(true)
    expect(result2.hasBannedPhrases).toBe(true)
  })

  it('should detect multiple banned phrases in one bullet', () => {
    const result = detectBannedPhrases('Spearheaded initiative and leveraged tools')
    expect(result.hasBannedPhrases).toBe(true)
    expect(result.bannedPhrases).toHaveLength(2)
  })

  it('should be case-insensitive', () => {
    const result = detectBannedPhrases('SPEARHEADED the project')
    expect(result.hasBannedPhrases).toBe(true)
  })

  it('should handle clean bullets with no banned phrases', () => {
    const result = detectBannedPhrases('Led a team of developers')
    expect(result.hasBannedPhrases).toBe(false)
    expect(result.bannedPhrases).toHaveLength(0)
  })

  it('should handle empty strings', () => {
    const result = detectBannedPhrases('')
    expect(result.hasBannedPhrases).toBe(false)
  })
})

describe('getAlternatives', () => {
  it('should provide alternatives for "spearheaded"', () => {
    const alternatives = getAlternatives('spearheaded')
    expect(alternatives).toHaveLength(3)
    expect(alternatives).toContain('Led')
    expect(alternatives).toContain('Directed')
    expect(alternatives).toContain('Initiated')
  })

  it('should provide alternatives for "leveraged"', () => {
    const alternatives = getAlternatives('leveraged')
    expect(alternatives).toHaveLength(3)
    expect(alternatives).toContain('Used')
    expect(alternatives).toContain('Applied')
    expect(alternatives).toContain('Employed')
  })

  it('should be case-insensitive', () => {
    const alternatives = getAlternatives('SPEARHEADED')
    expect(alternatives).toHaveLength(3)
  })

  it('should return empty array for unknown phrase', () => {
    const alternatives = getAlternatives('unknown')
    expect(alternatives).toHaveLength(0)
  })
})

describe('validateWordCount', () => {
  it('should flag bullets with < 15 words', () => {
    const result = validateWordCount('Led a team of five developers successfully')
    expect(result.isValid).toBe(false)
    expect(result.wordCount).toBeLessThan(15)
    expect(result.issue).toBe('too_short')
  })

  it('should flag bullets with > 40 words', () => {
    const longBullet =
      'Led a comprehensive cross-functional team of fifteen developers, designers, and product managers across multiple departments and various geographic locations to deliver a highly complex enterprise-level application that significantly improved customer satisfaction metrics and operational efficiency across the entire organization while maintaining high quality standards and adhering to strict security requirements'
    const result = validateWordCount(longBullet)
    expect(result.isValid).toBe(false)
    expect(result.wordCount).toBeGreaterThan(40)
    expect(result.issue).toBe('too_long')
  })

  it('should accept bullets in optimal range (20-35 words)', () => {
    const result = validateWordCount(
      'Led a cross-functional team of 12 developers to deliver a customer-facing dashboard, improving user engagement by 45% and reducing support tickets by 30%'
    )
    expect(result.isValid).toBe(true)
    expect(result.wordCount).toBeGreaterThanOrEqual(20)
    expect(result.wordCount).toBeLessThanOrEqual(35)
    expect(result.issue).toBeNull()
  })

  it('should count hyphenated words as 1 word', () => {
    const result = validateWordCount('well-organized cross-functional team')
    // "well-organized" = 1, "cross-functional" = 1, "team" = 1 = 3 words total
    expect(result.wordCount).toBe(3)
  })

  it('should count contractions as 1 word', () => {
    const result = validateWordCount("didn't can't won't")
    expect(result.wordCount).toBe(3)
  })

  it('should handle empty strings', () => {
    const result = validateWordCount('')
    expect(result.wordCount).toBe(0)
    expect(result.issue).toBe('too_short')
  })
})

describe('checkVerbDiversity', () => {
  it('should flag when same verb appears 3+ times', () => {
    const bullets = [
      'Led team A',
      'Led team B',
      'Led team C',
      'Led team D',
    ]
    const result = checkVerbDiversity(bullets)
    expect(result.hasIssues).toBe(true)
    expect(result.repeatedVerbs).toHaveLength(1)
    expect(result.repeatedVerbs[0].verb).toBe('led')
    expect(result.repeatedVerbs[0].count).toBe(4)
  })

  it('should provide alternatives from same category', () => {
    const bullets = ['Led team A', 'Led team B', 'Led team C']
    const result = checkVerbDiversity(bullets)
    expect(result.repeatedVerbs[0].alternatives).toContain('Managed')
    expect(result.repeatedVerbs[0].alternatives).toContain('Directed')
  })

  it('should not flag when verbs appear ≤ 2 times', () => {
    const bullets = ['Led team A', 'Led team B', 'Managed team C']
    const result = checkVerbDiversity(bullets)
    expect(result.hasIssues).toBe(false)
  })

  it('should handle multiple repeated verbs', () => {
    const bullets = [
      'Led team A',
      'Led team B',
      'Led team C',
      'Built app A',
      'Built app B',
      'Built app C',
    ]
    const result = checkVerbDiversity(bullets)
    expect(result.hasIssues).toBe(true)
    expect(result.repeatedVerbs).toHaveLength(2)
  })

  it('should be case-insensitive', () => {
    const bullets = ['Led team', 'LED team', 'led team']
    const result = checkVerbDiversity(bullets)
    expect(result.hasIssues).toBe(true)
  })
})

describe('runNaturalWritingChecks', () => {
  it('should return all check results for a single bullet', () => {
    const results = runNaturalWritingChecks(['Spearheaded team'])
    expect(results).toHaveLength(1)
    expect(results[0].bannedPhrases.hasBannedPhrases).toBe(true)
    expect(results[0].wordCount.isValid).toBe(false)
  })

  it('should check verb diversity across all bullets', () => {
    const bullets = ['Led team A', 'Led team B', 'Led team C']
    const results = runNaturalWritingChecks(bullets)
    expect(results[0].verbDiversity.hasIssues).toBe(true)
  })

  it('should handle clean resume with no issues', () => {
    const bullets = [
      'Led a cross-functional team of 10 developers to build a customer dashboard that improved user satisfaction by 25%',
      'Built scalable microservices architecture serving 50K daily active users',
    ]
    const results = runNaturalWritingChecks(bullets)
    expect(results[0].bannedPhrases.hasBannedPhrases).toBe(false)
    expect(results[0].wordCount.isValid).toBe(true)
    expect(results[0].verbDiversity.hasIssues).toBe(false)
  })

  it('should handle empty bullet list', () => {
    const results = runNaturalWritingChecks([])
    expect(results).toHaveLength(0)
  })
})
