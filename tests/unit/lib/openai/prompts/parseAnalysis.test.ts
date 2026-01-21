/**
 * Unit Tests for parseAnalysisResponse
 *
 * @see Story 4.2: ATS Score Calculation
 */

import {
  parseAnalysisResponse,
  isValidAnalysisResult,
} from '@/lib/openai/prompts/parseAnalysis'

// Mock console methods
beforeAll(() => {
  global.console.error = jest.fn()
  global.console.warn = jest.fn()
  global.console.debug = jest.fn()
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('parseAnalysisResponse', () => {
  const validResponse = {
    overallScore: 75,
    scoreBreakdown: {
      keywords: 80,
      skills: 75,
      experience: 70,
      format: 70,
    },
    justification: 'Strong keyword alignment with job requirements.',
    strengths: [
      'Includes React and TypeScript',
      'Clear experience section',
      'Good format',
    ],
    weaknesses: [
      'Missing Node.js',
      'Could add metrics',
    ],
  }

  describe('Valid JSON Parsing', () => {
    it('should parse valid JSON response', () => {
      const jsonString = JSON.stringify(validResponse)
      const result = parseAnalysisResponse(jsonString)

      expect(result).toEqual(validResponse)
    })

    it('should handle JSON wrapped in markdown code blocks', () => {
      const jsonString = `\`\`\`json\n${JSON.stringify(validResponse)}\n\`\`\``
      const result = parseAnalysisResponse(jsonString)

      expect(result.overallScore).toBe(75)
      expect(result.scoreBreakdown.keywords).toBe(80)
    })

    it('should trim whitespace from justification', () => {
      const responseWithWhitespace = {
        ...validResponse,
        justification: '  Strong alignment  ',
      }
      const jsonString = JSON.stringify(responseWithWhitespace)
      const result = parseAnalysisResponse(jsonString)

      expect(result.justification).toBe('Strong alignment')
    })
  })

  describe('Score Clamping', () => {
    it('should clamp overall score above 100 to 100', () => {
      const responseWithHighScore = {
        ...validResponse,
        overallScore: 150,
      }
      const jsonString = JSON.stringify(responseWithHighScore)
      const result = parseAnalysisResponse(jsonString)

      expect(result.overallScore).toBe(100)
    })

    it('should clamp overall score below 0 to 0', () => {
      const responseWithNegativeScore = {
        ...validResponse,
        overallScore: -10,
      }
      const jsonString = JSON.stringify(responseWithNegativeScore)
      const result = parseAnalysisResponse(jsonString)

      expect(result.overallScore).toBe(0)
    })

    it('should clamp breakdown scores to 0-100 range', () => {
      const responseWithOutOfRangeScores = {
        ...validResponse,
        scoreBreakdown: {
          keywords: 150,
          skills: -20,
          experience: 75,
          format: 110,
        },
      }
      const jsonString = JSON.stringify(responseWithOutOfRangeScores)
      const result = parseAnalysisResponse(jsonString)

      expect(result.scoreBreakdown.keywords).toBe(100)
      expect(result.scoreBreakdown.skills).toBe(0)
      expect(result.scoreBreakdown.experience).toBe(75)
      expect(result.scoreBreakdown.format).toBe(100)
    })

    it('should round fractional scores', () => {
      const responseWithFractionalScores = {
        ...validResponse,
        overallScore: 75.7,
        scoreBreakdown: {
          keywords: 80.3,
          skills: 75.6,
          experience: 70.2,
          format: 70.8,
        },
      }
      const jsonString = JSON.stringify(responseWithFractionalScores)
      const result = parseAnalysisResponse(jsonString)

      expect(result.overallScore).toBe(76)
      expect(result.scoreBreakdown.keywords).toBe(80)
      expect(result.scoreBreakdown.skills).toBe(76)
    })
  })

  describe('Array Handling', () => {
    it('should limit strengths to 5 items', () => {
      const responseWithManyStrengths = {
        ...validResponse,
        strengths: [
          'Strength 1',
          'Strength 2',
          'Strength 3',
          'Strength 4',
          'Strength 5',
          'Strength 6',
          'Strength 7',
        ],
      }
      const jsonString = JSON.stringify(responseWithManyStrengths)
      const result = parseAnalysisResponse(jsonString)

      expect(result.strengths).toHaveLength(5)
    })

    it('should limit weaknesses to 5 items', () => {
      const responseWithManyWeaknesses = {
        ...validResponse,
        weaknesses: [
          'Weakness 1',
          'Weakness 2',
          'Weakness 3',
          'Weakness 4',
          'Weakness 5',
          'Weakness 6',
        ],
      }
      const jsonString = JSON.stringify(responseWithManyWeaknesses)
      const result = parseAnalysisResponse(jsonString)

      expect(result.weaknesses).toHaveLength(5)
    })

    it('should filter out empty strings from arrays', () => {
      const responseWithEmptyStrings = {
        ...validResponse,
        strengths: ['Valid strength', '', '  ', 'Another strength'],
        weaknesses: ['Valid weakness', null, undefined, 'Another weakness'],
      }
      const jsonString = JSON.stringify(responseWithEmptyStrings)
      const result = parseAnalysisResponse(jsonString)

      expect(result.strengths).toHaveLength(2)
      expect(result.strengths).toEqual(['Valid strength', 'Another strength'])
      expect(result.weaknesses).toHaveLength(2)
    })

    it('should handle non-string array elements', () => {
      const responseWithNonStringElements = {
        ...validResponse,
        strengths: ['Valid strength', 123, { invalid: 'object' }, 'Another'],
        weaknesses: ['Valid', true, false],
      }
      const jsonString = JSON.stringify(responseWithNonStringElements)
      const result = parseAnalysisResponse(jsonString)

      // Only string elements should remain
      expect(result.strengths.every((s) => typeof s === 'string')).toBe(true)
      expect(result.weaknesses.every((w) => typeof w === 'string')).toBe(true)
    })
  })

  describe('Malformed Response Handling', () => {
    it('should return fallback for invalid JSON', () => {
      const invalidJson = 'This is not JSON'
      const result = parseAnalysisResponse(invalidJson)

      expect(result.overallScore).toBe(50)
      expect(result.justification).toContain('Analysis incomplete')
    })

    it('should return fallback for missing overallScore', () => {
      const responseWithoutScore = {
        scoreBreakdown: validResponse.scoreBreakdown,
        justification: validResponse.justification,
        strengths: validResponse.strengths,
        weaknesses: validResponse.weaknesses,
      }
      const jsonString = JSON.stringify(responseWithoutScore)
      const result = parseAnalysisResponse(jsonString)

      expect(result.overallScore).toBe(50)
      expect(result.justification).toContain('Analysis incomplete')
    })

    it('should return fallback for missing scoreBreakdown', () => {
      const responseWithoutBreakdown = {
        overallScore: 75,
        justification: validResponse.justification,
        strengths: validResponse.strengths,
        weaknesses: validResponse.weaknesses,
      }
      const jsonString = JSON.stringify(responseWithoutBreakdown)
      const result = parseAnalysisResponse(jsonString)

      expect(result.overallScore).toBe(50)
    })

    it('should return fallback for missing justification', () => {
      const responseWithoutJustification = {
        overallScore: 75,
        scoreBreakdown: validResponse.scoreBreakdown,
        strengths: validResponse.strengths,
        weaknesses: validResponse.weaknesses,
      }
      const jsonString = JSON.stringify(responseWithoutJustification)
      const result = parseAnalysisResponse(jsonString)

      expect(result.justification).toContain('Analysis incomplete')
    })

    it('should return fallback for non-array strengths', () => {
      const responseWithInvalidStrengths = {
        ...validResponse,
        strengths: 'Not an array',
      }
      const jsonString = JSON.stringify(responseWithInvalidStrengths)
      const result = parseAnalysisResponse(jsonString)

      expect(result.justification).toContain('Analysis incomplete')
    })

    it('should return fallback for non-array weaknesses', () => {
      const responseWithInvalidWeaknesses = {
        ...validResponse,
        weaknesses: { invalid: 'object' },
      }
      const jsonString = JSON.stringify(responseWithInvalidWeaknesses)
      const result = parseAnalysisResponse(jsonString)

      expect(result.justification).toContain('Analysis incomplete')
    })

    it('should log error details for malformed responses', () => {
      const invalidJson = 'Not JSON'
      parseAnalysisResponse(invalidJson)

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('[parseAnalysisResponse] Failed to parse response'),
        expect.any(Object)
      )
    })
  })
})

describe('isValidAnalysisResult', () => {
  const validResult = {
    overallScore: 75,
    scoreBreakdown: {
      keywords: 80,
      skills: 75,
      experience: 70,
      format: 70,
    },
    justification: 'Strong keyword alignment.',
    strengths: ['Strength 1', 'Strength 2'],
    weaknesses: ['Weakness 1', 'Weakness 2'],
  }

  it('should validate correct result', () => {
    expect(isValidAnalysisResult(validResult)).toBe(true)
  })

  it('should reject overall score below 0', () => {
    const invalid = { ...validResult, overallScore: -5 }
    expect(isValidAnalysisResult(invalid)).toBe(false)
  })

  it('should reject overall score above 100', () => {
    const invalid = { ...validResult, overallScore: 105 }
    expect(isValidAnalysisResult(invalid)).toBe(false)
  })

  it('should reject invalid breakdown scores', () => {
    const invalid = {
      ...validResult,
      scoreBreakdown: {
        keywords: 110,
        skills: 75,
        experience: 70,
        format: 70,
      },
    }
    expect(isValidAnalysisResult(invalid)).toBe(false)
  })

  it('should reject empty strengths array', () => {
    const invalid = { ...validResult, strengths: [] }
    expect(isValidAnalysisResult(invalid)).toBe(false)
  })

  it('should reject empty weaknesses array', () => {
    const invalid = { ...validResult, weaknesses: [] }
    expect(isValidAnalysisResult(invalid)).toBe(false)
  })

  it('should reject fallback justification', () => {
    const invalid = {
      ...validResult,
      justification: 'Analysis incomplete due to unexpected response format.',
    }
    expect(isValidAnalysisResult(invalid)).toBe(false)
  })

  it('should reject score mismatch (overall vs breakdown)', () => {
    const invalid = {
      ...validResult,
      overallScore: 20, // Way off from breakdown average
      scoreBreakdown: {
        keywords: 80,
        skills: 75,
        experience: 70,
        format: 70,
      },
    }
    expect(isValidAnalysisResult(invalid)).toBe(false)
  })

  it('should accept score within 15 point tolerance', () => {
    const result = {
      ...validResult,
      overallScore: 85, // Calculated would be ~75, within 15 point tolerance
      scoreBreakdown: {
        keywords: 80,
        skills: 75,
        experience: 70,
        format: 70,
      },
    }
    expect(isValidAnalysisResult(result)).toBe(true)
  })

  it('should log warning for score mismatch', () => {
    const invalid = {
      ...validResult,
      overallScore: 20,
    }
    isValidAnalysisResult(invalid)

    expect(console.warn).toHaveBeenCalledWith(
      expect.stringContaining('[isValidAnalysisResult] Score mismatch detected'),
      expect.any(Object)
    )
  })
})
