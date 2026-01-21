/**
 * Unit Tests: Section Scores Parser
 * Story: 4.4 - Section-Level Score Breakdown
 */

import {
  parseSectionScoresResponse,
  isValidSectionScoresResult,
} from '@/lib/openai/prompts/parseSectionScores'

// Mock console methods to avoid cluttering test output
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
})

afterAll(() => {
  jest.restoreAllMocks()
})

describe('parseSectionScoresResponse', () => {
  describe('Valid Responses', () => {
    it('should parse complete section scores', () => {
      const response = {
        sectionScores: {
          experience: {
            score: 75,
            explanation: 'Good experience with quantified achievements.',
            strengths: ['Relevant roles', 'Quantified metrics'],
            weaknesses: ['Missing some keywords'],
          },
          education: {
            score: 80,
            explanation: 'CS degree aligns well with role.',
            strengths: ['Relevant degree'],
            weaknesses: ['No GPA listed'],
          },
          skills: {
            score: 85,
            explanation: 'Strong technical skills coverage.',
            strengths: ['Comprehensive', 'Well-categorized'],
            weaknesses: ['Missing Docker'],
          },
        },
      }

      const jsonString = JSON.stringify(response)
      const result = parseSectionScoresResponse(jsonString)

      expect(result.sectionScores.experience).toBeDefined()
      expect(result.sectionScores.experience?.score).toBe(75)
      expect(result.sectionScores.education?.score).toBe(80)
      expect(result.sectionScores.skills?.score).toBe(85)
    })

    it('should parse partial section scores (only some sections)', () => {
      const response = {
        sectionScores: {
          experience: {
            score: 70,
            explanation: 'Relevant experience.',
            strengths: ['Good'],
            weaknesses: ['Could improve'],
          },
        },
      }

      const result = parseSectionScoresResponse(JSON.stringify(response))

      expect(result.sectionScores.experience).toBeDefined()
      expect(result.sectionScores.education).toBeUndefined()
      expect(result.sectionScores.skills).toBeUndefined()
    })

    it('should handle markdown code fences', () => {
      const response = {
        sectionScores: {
          skills: {
            score: 90,
            explanation: 'Excellent skills.',
            strengths: ['Comprehensive'],
            weaknesses: [],
          },
        },
      }

      const markdownString = `\`\`\`json\n${JSON.stringify(response)}\n\`\`\``
      const result = parseSectionScoresResponse(markdownString)

      expect(result.sectionScores.skills).toBeDefined()
      expect(result.sectionScores.skills?.score).toBe(90)
    })
  })

  describe('Score Boundaries', () => {
    it('should accept score of 0', () => {
      const response = {
        sectionScores: {
          experience: {
            score: 0,
            explanation: 'No relevant experience.',
            strengths: [],
            weaknesses: ['Everything'],
          },
        },
      }

      const result = parseSectionScoresResponse(JSON.stringify(response))
      expect(result.sectionScores.experience?.score).toBe(0)
    })

    it('should accept score of 100', () => {
      const response = {
        sectionScores: {
          skills: {
            score: 100,
            explanation: 'Perfect match.',
            strengths: ['Everything'],
            weaknesses: [],
          },
        },
      }

      const result = parseSectionScoresResponse(JSON.stringify(response))
      expect(result.sectionScores.skills?.score).toBe(100)
    })

    it('should clamp score above 100', () => {
      const response = {
        sectionScores: {
          education: {
            score: 150,
            explanation: 'Over the top.',
            strengths: ['Great'],
            weaknesses: [],
          },
        },
      }

      const result = parseSectionScoresResponse(JSON.stringify(response))
      expect(result.sectionScores.education?.score).toBe(100)
    })

    it('should clamp score below 0', () => {
      const response = {
        sectionScores: {
          projects: {
            score: -10,
            explanation: 'Negative score.',
            strengths: [],
            weaknesses: ['Bad'],
          },
        },
      }

      const result = parseSectionScoresResponse(JSON.stringify(response))
      expect(result.sectionScores.projects?.score).toBe(0)
    })

    it('should round decimal scores', () => {
      const response = {
        sectionScores: {
          summary: {
            score: 75.7,
            explanation: 'Good summary.',
            strengths: ['Clear'],
            weaknesses: [],
          },
        },
      }

      const result = parseSectionScoresResponse(JSON.stringify(response))
      expect(result.sectionScores.summary?.score).toBe(76)
    })
  })

  describe('Malformed Response Handling', () => {
    it('should return empty object for invalid JSON', () => {
      const result = parseSectionScoresResponse('This is not JSON')
      expect(result.sectionScores).toEqual({})
    })

    it('should return empty object for missing sectionScores key', () => {
      const response = {
        overallScore: 75,
        // Missing sectionScores
      }

      const result = parseSectionScoresResponse(JSON.stringify(response))
      expect(result.sectionScores).toEqual({})
    })

    it('should skip sections with missing score', () => {
      const response = {
        sectionScores: {
          experience: {
            // Missing score
            explanation: 'Good',
            strengths: [],
            weaknesses: [],
          },
          skills: {
            score: 80,
            explanation: 'Good',
            strengths: [],
            weaknesses: [],
          },
        },
      }

      const result = parseSectionScoresResponse(JSON.stringify(response))
      expect(result.sectionScores.experience).toBeUndefined()
      expect(result.sectionScores.skills).toBeDefined()
    })

    it('should skip sections with missing explanation', () => {
      const response = {
        sectionScores: {
          education: {
            score: 70,
            // Missing explanation
            strengths: [],
            weaknesses: [],
          },
        },
      }

      const result = parseSectionScoresResponse(JSON.stringify(response))
      expect(result.sectionScores.education).toBeUndefined()
    })

    it('should filter non-string values from strengths array', () => {
      const response = {
        sectionScores: {
          skills: {
            score: 85,
            explanation: 'Good skills.',
            strengths: ['Valid', 123, null, 'Also valid'],
            weaknesses: [],
          },
        },
      }

      const result = parseSectionScoresResponse(JSON.stringify(response))
      expect(result.sectionScores.skills?.strengths).toEqual(['Valid', 'Also valid'])
    })

    it('should filter non-string values from weaknesses array', () => {
      const response = {
        sectionScores: {
          projects: {
            score: 60,
            explanation: 'Fair projects.',
            strengths: [],
            weaknesses: ['Valid weakness', false, 'Another weakness'],
          },
        },
      }

      const result = parseSectionScoresResponse(JSON.stringify(response))
      expect(result.sectionScores.projects?.weaknesses).toEqual([
        'Valid weakness',
        'Another weakness',
      ])
    })
  })

  describe('All Section Types', () => {
    it('should parse all five section types', () => {
      const response = {
        sectionScores: {
          experience: {
            score: 70,
            explanation: 'Exp',
            strengths: [],
            weaknesses: [],
          },
          education: {
            score: 75,
            explanation: 'Edu',
            strengths: [],
            weaknesses: [],
          },
          skills: {
            score: 80,
            explanation: 'Skills',
            strengths: [],
            weaknesses: [],
          },
          projects: {
            score: 85,
            explanation: 'Proj',
            strengths: [],
            weaknesses: [],
          },
          summary: {
            score: 90,
            explanation: 'Sum',
            strengths: [],
            weaknesses: [],
          },
        },
      }

      const result = parseSectionScoresResponse(JSON.stringify(response))

      expect(result.sectionScores.experience).toBeDefined()
      expect(result.sectionScores.education).toBeDefined()
      expect(result.sectionScores.skills).toBeDefined()
      expect(result.sectionScores.projects).toBeDefined()
      expect(result.sectionScores.summary).toBeDefined()
    })
  })
})

describe('isValidSectionScoresResult', () => {
  it('should return true for empty section scores', () => {
    const result = { sectionScores: {} }
    expect(isValidSectionScoresResult(result)).toBe(true)
  })

  it('should return true for valid section scores', () => {
    const result = {
      sectionScores: {
        experience: {
          score: 75,
          explanation: 'Good experience.',
          strengths: ['Relevant'],
          weaknesses: ['Missing metrics'],
        },
      },
    }

    expect(isValidSectionScoresResult(result)).toBe(true)
  })

  it('should return false for invalid score (out of range)', () => {
    const result = {
      sectionScores: {
        skills: {
          score: 150, // Invalid
          explanation: 'Good',
          strengths: [],
          weaknesses: [],
        },
      },
    }

    expect(isValidSectionScoresResult(result)).toBe(false)
  })

  it('should return false for missing explanation', () => {
    const result = {
      sectionScores: {
        education: {
          score: 80,
          explanation: '', // Invalid (empty)
          strengths: [],
          weaknesses: [],
        },
      },
    }

    expect(isValidSectionScoresResult(result)).toBe(false)
  })

  it('should return false for non-array strengths', () => {
    const result = {
      sectionScores: {
        projects: {
          score: 70,
          explanation: 'Fair',
          strengths: 'Not an array', // Invalid
          weaknesses: [],
        },
      },
    }

    expect(isValidSectionScoresResult(result)).toBe(false)
  })
})
