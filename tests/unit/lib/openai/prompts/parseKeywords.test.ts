/**
 * Unit Tests for Keyword Extraction Parsing
 *
 * Tests parseKeywordsResponse function with various response formats
 *
 * @see Story 4.3: Missing Keywords Detection
 */

import {
  parseKeywordsResponse,
  toKeywordAnalysis,
  isValidKeywordResult,
} from '@/lib/openai/prompts/parseKeywords'
import type { KeywordExtractionResult } from '@/lib/types/analysis'

// Mock console methods to avoid cluttering test output
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('parseKeywordsResponse', () => {
  const validKeywordData = {
    keywordsFound: [
      { keyword: 'React', frequency: 5, variant: null },
      { keyword: 'TypeScript', frequency: 3, variant: 'TS' },
      { keyword: 'Node.js', frequency: 4, variant: null },
    ],
    keywordsMissing: [
      { keyword: 'Docker', frequency: 3, priority: 'high' as const },
      { keyword: 'Kubernetes', frequency: 2, priority: 'high' as const },
      { keyword: 'GraphQL', frequency: 1, priority: 'medium' as const },
    ],
    majorKeywordsCoverage: 75,
  }

  const validResponse = {
    overallScore: 75,
    scoreBreakdown: { keywords: 80, skills: 75, experience: 70, format: 70 },
    justification: 'Test justification',
    strengths: ['Strength 1', 'Strength 2'],
    weaknesses: ['Weakness 1', 'Weakness 2'],
    keywords: validKeywordData,
  }

  describe('Valid JSON Parsing', () => {
    it('should parse valid keyword data from JSON response', () => {
      const jsonString = JSON.stringify(validResponse)
      const result = parseKeywordsResponse(jsonString)

      expect(result.keywordsFound).toHaveLength(3)
      expect(result.keywordsMissing).toHaveLength(3)
      expect(result.majorKeywordsCoverage).toBe(75)
    })

    it('should parse JSON wrapped in markdown code blocks', () => {
      const jsonString = '```json\n' + JSON.stringify(validResponse) + '\n```'
      const result = parseKeywordsResponse(jsonString)

      expect(result.keywordsFound).toHaveLength(3)
      expect(result.keywordsMissing).toHaveLength(3)
    })

    it('should handle JSON with extra whitespace', () => {
      const jsonString = '   \n' + JSON.stringify(validResponse) + '   \n'
      const result = parseKeywordsResponse(jsonString)

      expect(result.keywordsFound).toHaveLength(3)
    })
  })

  describe('Sorting and Limiting', () => {
    it('should sort found keywords by frequency (highest first)', () => {
      const jsonString = JSON.stringify(validResponse)
      const result = parseKeywordsResponse(jsonString)

      // Check sorting: React (5) > Node.js (4) > TypeScript (3)
      expect(result.keywordsFound[0].keyword).toBe('React')
      expect(result.keywordsFound[0].frequency).toBe(5)
      expect(result.keywordsFound[1].keyword).toBe('Node.js')
      expect(result.keywordsFound[2].keyword).toBe('TypeScript')
    })

    it('should sort missing keywords by priority then frequency', () => {
      const responseWithMixedPriorities = {
        ...validResponse,
        keywords: {
          ...validKeywordData,
          keywordsMissing: [
            { keyword: 'Low1', frequency: 5, priority: 'low' as const },
            { keyword: 'High1', frequency: 2, priority: 'high' as const },
            { keyword: 'Med1', frequency: 3, priority: 'medium' as const },
            { keyword: 'High2', frequency: 4, priority: 'high' as const },
          ],
        },
      }

      const jsonString = JSON.stringify(responseWithMixedPriorities)
      const result = parseKeywordsResponse(jsonString)

      // High priority first, then sorted by frequency
      expect(result.keywordsMissing[0].priority).toBe('high')
      expect(result.keywordsMissing[0].keyword).toBe('High2') // freq 4
      expect(result.keywordsMissing[1].priority).toBe('high')
      expect(result.keywordsMissing[1].keyword).toBe('High1') // freq 2
      expect(result.keywordsMissing[2].priority).toBe('medium')
      expect(result.keywordsMissing[3].priority).toBe('low')
    })

    it('should limit missing keywords to top 15', () => {
      const responseWithMany = {
        ...validResponse,
        keywords: {
          ...validKeywordData,
          keywordsMissing: Array.from({ length: 25 }, (_, i) => ({
            keyword: `Keyword${i}`,
            frequency: 25 - i,
            priority: 'medium' as const,
          })),
        },
      }

      const jsonString = JSON.stringify(responseWithMany)
      const result = parseKeywordsResponse(jsonString)

      expect(result.keywordsMissing).toHaveLength(15)
      // Should keep the top 15 by frequency
      expect(result.keywordsMissing[0].keyword).toBe('Keyword0')
      expect(result.keywordsMissing[14].keyword).toBe('Keyword14')
    })
  })

  describe('Keyword Variant Handling', () => {
    it('should preserve variant information when present', () => {
      const jsonString = JSON.stringify(validResponse)
      const result = parseKeywordsResponse(jsonString)

      const tsKeyword = result.keywordsFound.find((k) => k.keyword === 'TypeScript')
      expect(tsKeyword?.variant).toBe('TS')
    })

    it('should handle null variants', () => {
      const jsonString = JSON.stringify(validResponse)
      const result = parseKeywordsResponse(jsonString)

      const reactKeyword = result.keywordsFound.find((k) => k.keyword === 'React')
      expect(reactKeyword?.variant).toBeNull()
    })

    it('should handle undefined variants', () => {
      const responseWithUndefinedVariant = {
        ...validResponse,
        keywords: {
          ...validKeywordData,
          keywordsFound: [{ keyword: 'React', frequency: 5 }],
        },
      }

      const jsonString = JSON.stringify(responseWithUndefinedVariant)
      const result = parseKeywordsResponse(jsonString)

      expect(result.keywordsFound[0].variant).toBeUndefined()
    })
  })

  describe('Malformed Response Handling', () => {
    it('should return empty arrays for invalid JSON', () => {
      const invalidJson = 'This is not JSON'
      const result = parseKeywordsResponse(invalidJson)

      expect(result.keywordsFound).toEqual([])
      expect(result.keywordsMissing).toEqual([])
      expect(result.majorKeywordsCoverage).toBe(0)
    })

    it('should return empty arrays when keywords section is missing', () => {
      const responseWithoutKeywords = {
        overallScore: 75,
        scoreBreakdown: { keywords: 80, skills: 75, experience: 70, format: 70 },
      }

      const jsonString = JSON.stringify(responseWithoutKeywords)
      const result = parseKeywordsResponse(jsonString)

      expect(result.keywordsFound).toEqual([])
      expect(result.keywordsMissing).toEqual([])
    })

    it('should filter out invalid keyword objects', () => {
      const responseWithInvalidKeywords = {
        ...validResponse,
        keywords: {
          keywordsFound: [
            { keyword: 'Valid', frequency: 5, variant: null },
            { keyword: '', frequency: 3 }, // Empty keyword - invalid
            { keyword: 'NoFrequency' }, // Missing frequency - invalid
            { frequency: 2 }, // Missing keyword - invalid
          ],
          keywordsMissing: [],
          majorKeywordsCoverage: 50,
        },
      }

      const jsonString = JSON.stringify(responseWithInvalidKeywords)
      const result = parseKeywordsResponse(jsonString)

      expect(result.keywordsFound).toHaveLength(1)
      expect(result.keywordsFound[0].keyword).toBe('Valid')
    })

    it('should filter out invalid priority values', () => {
      const responseWithInvalidPriorities = {
        ...validResponse,
        keywords: {
          keywordsFound: [],
          keywordsMissing: [
            { keyword: 'Valid', frequency: 3, priority: 'high' },
            { keyword: 'Invalid', frequency: 2, priority: 'critical' }, // Invalid priority
            { keyword: 'NoP', frequency: 1 }, // Missing priority
          ],
          majorKeywordsCoverage: 50,
        },
      }

      const jsonString = JSON.stringify(responseWithInvalidPriorities)
      const result = parseKeywordsResponse(jsonString)

      expect(result.keywordsMissing).toHaveLength(1)
      expect(result.keywordsMissing[0].keyword).toBe('Valid')
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero keywords found and missing', () => {
      const responseWithNoKeywords = {
        ...validResponse,
        keywords: {
          keywordsFound: [],
          keywordsMissing: [],
          majorKeywordsCoverage: 0,
        },
      }

      const jsonString = JSON.stringify(responseWithNoKeywords)
      const result = parseKeywordsResponse(jsonString)

      expect(result.keywordsFound).toEqual([])
      expect(result.keywordsMissing).toEqual([])
      expect(result.majorKeywordsCoverage).toBe(0)
    })

    it('should handle all keywords present (100% coverage)', () => {
      const responseWithAllPresent = {
        ...validResponse,
        keywords: {
          keywordsFound: validKeywordData.keywordsFound,
          keywordsMissing: [],
          majorKeywordsCoverage: 100,
        },
      }

      const jsonString = JSON.stringify(responseWithAllPresent)
      const result = parseKeywordsResponse(jsonString)

      expect(result.keywordsMissing).toEqual([])
      expect(result.majorKeywordsCoverage).toBe(100)
    })

    it('should clamp coverage to 0-100 range', () => {
      const responseWithHighCoverage = {
        ...validResponse,
        keywords: {
          ...validKeywordData,
          majorKeywordsCoverage: 150, // Out of range
        },
      }

      const jsonString = JSON.stringify(responseWithHighCoverage)
      const result = parseKeywordsResponse(jsonString)

      expect(result.majorKeywordsCoverage).toBe(100)
    })

    it('should handle negative coverage values', () => {
      const responseWithNegativeCoverage = {
        ...validResponse,
        keywords: {
          ...validKeywordData,
          majorKeywordsCoverage: -10,
        },
      }

      const jsonString = JSON.stringify(responseWithNegativeCoverage)
      const result = parseKeywordsResponse(jsonString)

      expect(result.majorKeywordsCoverage).toBe(0)
    })
  })
})

describe('toKeywordAnalysis', () => {
  it('should add allMajorKeywordsPresent flag when coverage >= 90', () => {
    const extraction: KeywordExtractionResult = {
      keywordsFound: [],
      keywordsMissing: [],
      majorKeywordsCoverage: 95,
    }

    const analysis = toKeywordAnalysis(extraction)

    expect(analysis.allMajorKeywordsPresent).toBe(true)
  })

  it('should set allMajorKeywordsPresent to false when coverage < 90', () => {
    const extraction: KeywordExtractionResult = {
      keywordsFound: [],
      keywordsMissing: [],
      majorKeywordsCoverage: 85,
    }

    const analysis = toKeywordAnalysis(extraction)

    expect(analysis.allMajorKeywordsPresent).toBe(false)
  })

  it('should set allMajorKeywordsPresent to true exactly at 90%', () => {
    const extraction: KeywordExtractionResult = {
      keywordsFound: [],
      keywordsMissing: [],
      majorKeywordsCoverage: 90,
    }

    const analysis = toKeywordAnalysis(extraction)

    expect(analysis.allMajorKeywordsPresent).toBe(true)
  })
})

describe('isValidKeywordResult', () => {
  it('should return true for valid keyword result', () => {
    const validResult: KeywordExtractionResult = {
      keywordsFound: [{ keyword: 'React', frequency: 5, variant: null }],
      keywordsMissing: [{ keyword: 'Docker', frequency: 3, priority: 'high' }],
      majorKeywordsCoverage: 75,
    }

    expect(isValidKeywordResult(validResult)).toBe(true)
  })

  it('should return false for invalid arrays', () => {
    const invalidResult = {
      keywordsFound: 'not an array',
      keywordsMissing: [],
      majorKeywordsCoverage: 75,
    } as unknown as KeywordExtractionResult

    expect(isValidKeywordResult(invalidResult)).toBe(false)
  })

  it('should return false for invalid coverage values', () => {
    const invalidResult: KeywordExtractionResult = {
      keywordsFound: [],
      keywordsMissing: [],
      majorKeywordsCoverage: 150, // Out of range
    }

    expect(isValidKeywordResult(invalidResult)).toBe(false)
  })

  it('should return false for negative coverage', () => {
    const invalidResult: KeywordExtractionResult = {
      keywordsFound: [],
      keywordsMissing: [],
      majorKeywordsCoverage: -10,
    }

    expect(isValidKeywordResult(invalidResult)).toBe(false)
  })

  it('should return false for invalid keyword structure', () => {
    const invalidResult: KeywordExtractionResult = {
      keywordsFound: [
        { keyword: '', frequency: 5, variant: null }, // Empty keyword
      ],
      keywordsMissing: [],
      majorKeywordsCoverage: 75,
    }

    expect(isValidKeywordResult(invalidResult)).toBe(false)
  })

  it('should return false for invalid missing keyword structure', () => {
    const invalidResult: KeywordExtractionResult = {
      keywordsFound: [],
      keywordsMissing: [
        { keyword: 'Docker', frequency: 3, priority: 'invalid' as any },
      ],
      majorKeywordsCoverage: 75,
    }

    expect(isValidKeywordResult(invalidResult)).toBe(false)
  })
})
