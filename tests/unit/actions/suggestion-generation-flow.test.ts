/**
 * Unit Tests for Suggestion Generation Flow
 *
 * @see Story 10.1: Fix Suggestion Generation Flow
 *
 * Tests the actual exported helper functions from actions/analysis.ts
 * Note: Functions are async because they're exported from a 'use server' file
 */

import { describe, it, expect } from '@jest/globals'
import {
  extractSkillsFromParsedSections,
  extractDetectedFields,
  mapExperienceLevelToYears,
  extractSuggestionContext,
} from '@/actions/analysis'

/**
 * Test: extractSkillsFromParsedSections
 * Story 10.1: Task 2.2
 */
describe('extractSkillsFromParsedSections', () => {
  it('should extract skills array from parsed sections with name property', async () => {
    const parsedSections = {
      skills: [
        { name: 'JavaScript', category: 'technical' },
        { name: 'React', category: 'technical' },
        { name: 'TypeScript', category: 'technical' },
      ],
    }

    const result = await extractSkillsFromParsedSections(parsedSections)
    expect(result).toEqual(['JavaScript', 'React', 'TypeScript'])
  })

  it('should handle skills with text property (legacy format)', async () => {
    const parsedSections = {
      skills: [
        { text: 'Python' },
        { text: 'Django' },
      ],
    }

    const result = await extractSkillsFromParsedSections(parsedSections)
    expect(result).toEqual(['Python', 'Django'])
  })

  it('should return empty array when no skills section exists', async () => {
    const parsedSections = {}

    const result = await extractSkillsFromParsedSections(parsedSections)
    expect(result).toEqual([])
  })

  it('should return empty array when skills is not an array', async () => {
    const parsedSections = {
      skills: 'not an array',
    }

    const result = await extractSkillsFromParsedSections(parsedSections)
    expect(result).toEqual([])
  })

  it('should handle null parsed sections gracefully', async () => {
    const result = await extractSkillsFromParsedSections(null)
    expect(result).toEqual([])
  })

  it('should handle undefined parsed sections gracefully', async () => {
    const result = await extractSkillsFromParsedSections(undefined)
    expect(result).toEqual([])
  })

  it('should filter out empty/null skill names', async () => {
    const parsedSections = {
      skills: [
        { name: 'JavaScript' },
        { name: '' },
        { name: null },
        { name: 'React' },
      ],
    }

    const result = await extractSkillsFromParsedSections(parsedSections)
    expect(result).toEqual(['JavaScript', 'React'])
  })
})

/**
 * Test: extractDetectedFields
 * Story 10.1: Task 2.3
 */
describe('extractDetectedFields', () => {
  it('should extract detected fields from parsed sections', async () => {
    const parsedSections = {
      contact: {
        address: '123 Main St',
        photo: 'photo.jpg',
      },
      personalInfo: {
        dateOfBirth: '1990-01-01',
        age: 33,
      },
    }

    const result = await extractDetectedFields(parsedSections)
    expect(result).toContain('address')
    expect(result).toContain('photo')
    expect(result).toContain('date_of_birth')
    expect(result).toContain('age')
    expect(result.length).toBe(4)
  })

  it('should detect marital status and nationality', async () => {
    const parsedSections = {
      personalInfo: {
        maritalStatus: 'Single',
        nationality: 'Canadian',
      },
    }

    const result = await extractDetectedFields(parsedSections)
    expect(result).toContain('marital_status')
    expect(result).toContain('nationality')
  })

  it('should detect objective and references sections', async () => {
    const parsedSections = {
      summary: {
        objective: 'To obtain a position...',
      },
      references: ['Reference 1', 'Reference 2'],
    }

    const result = await extractDetectedFields(parsedSections)
    expect(result).toContain('objective')
    expect(result).toContain('references')
  })

  it('should return empty array when no problematic fields exist', async () => {
    const parsedSections = {
      experience: [{ title: 'Software Engineer' }],
      education: [{ degree: 'BS Computer Science' }],
    }

    const result = await extractDetectedFields(parsedSections)
    expect(result).toEqual([])
  })

  it('should handle null parsed sections gracefully', async () => {
    const result = await extractDetectedFields(null)
    expect(result).toEqual([])
  })

  it('should handle undefined parsed sections gracefully', async () => {
    const result = await extractDetectedFields(undefined)
    expect(result).toEqual([])
  })
})

/**
 * Test: mapExperienceLevelToYears
 * Story 10.1: Task 2.4
 */
describe('mapExperienceLevelToYears', () => {
  it('should map student to 0 years', async () => {
    expect(await mapExperienceLevelToYears('student')).toBe(0)
  })

  it('should map entry to 1 year', async () => {
    expect(await mapExperienceLevelToYears('entry')).toBe(1)
  })

  it('should map career_changer to 3 years', async () => {
    expect(await mapExperienceLevelToYears('career_changer')).toBe(3)
  })

  it('should map mid to 5 years', async () => {
    expect(await mapExperienceLevelToYears('mid')).toBe(5)
  })

  it('should map senior to 8 years', async () => {
    expect(await mapExperienceLevelToYears('senior')).toBe(8)
  })

  it('should map experienced to 8 years', async () => {
    expect(await mapExperienceLevelToYears('experienced')).toBe(8)
  })

  it('should default to 0 years for unknown levels', async () => {
    expect(await mapExperienceLevelToYears('unknown')).toBe(0)
    expect(await mapExperienceLevelToYears('')).toBe(0)
  })
})

/**
 * Test: extractSuggestionContext
 * Story 10.1: Task 2
 */
describe('extractSuggestionContext', () => {
  const createMockData = (overrides = {}) => ({
    scanId: '123e4567-e89b-12d3-a456-426614174000',
    resumeText: 'Software Engineer with 5 years of experience...',
    bullets: ['Led team of 5 engineers', 'Improved performance by 30%'],
    parsedSections: {
      skills: [
        { name: 'JavaScript', category: 'technical' },
        { name: 'React', category: 'technical' },
      ],
      contact: {
        photo: 'photo.jpg',
      },
    },
    profile: {
      experienceLevel: 'mid',
      targetRole: 'Software Engineer',
    },
    scan: {
      job_description: 'Looking for a Senior Software Engineer...',
    },
    keywordAnalysis: {
      keywordsFound: [{ keyword: 'JavaScript' }, { keyword: 'React' }],
      keywordsMissing: [{ keyword: 'TypeScript' }, { keyword: 'Node.js' }],
    },
    ...overrides,
  })

  it('should build complete suggestion context from analysis data', async () => {
    const mockData = createMockData()
    const result = await extractSuggestionContext(mockData)

    expect(result.scanId).toBe(mockData.scanId)
    expect(result.resumeText).toBe(mockData.resumeText)
    expect(result.bulletPoints).toEqual(mockData.bullets)
    expect(result.experienceLevel).toBe('mid')
    expect(result.targetRole).toBe('Software Engineer')
    expect(result.isStudent).toBe(false)
    expect(result.jdContent).toBe(mockData.scan.job_description)
  })

  it('should extract JD keywords from both found and missing', async () => {
    const mockData = createMockData()
    const result = await extractSuggestionContext(mockData)

    expect(result.jdKeywords).toContain('JavaScript')
    expect(result.jdKeywords).toContain('React')
    expect(result.jdKeywords).toContain('TypeScript')
    expect(result.jdKeywords).toContain('Node.js')
  })

  it('should handle string keywords (not just objects)', async () => {
    const mockData = createMockData({
      keywordAnalysis: {
        keywordsFound: ['JavaScript', 'React'],
        keywordsMissing: ['TypeScript'],
      },
    })
    const result = await extractSuggestionContext(mockData)

    expect(result.jdKeywords).toContain('JavaScript')
    expect(result.jdKeywords).toContain('TypeScript')
  })

  it('should map career_changer to mid experience level', async () => {
    const mockData = createMockData({
      profile: {
        experienceLevel: 'career_changer',
        targetRole: 'Developer',
      },
    })
    const result = await extractSuggestionContext(mockData)

    expect(result.experienceLevel).toBe('mid')
  })

  it('should map experienced to senior experience level', async () => {
    const mockData = createMockData({
      profile: {
        experienceLevel: 'experienced',
        targetRole: 'Developer',
      },
    })
    const result = await extractSuggestionContext(mockData)

    expect(result.experienceLevel).toBe('senior')
  })

  it('should identify student experience level correctly', async () => {
    const mockData = createMockData({
      profile: {
        experienceLevel: 'student',
        targetRole: 'Junior Developer',
      },
    })
    const result = await extractSuggestionContext(mockData)

    expect(result.isStudent).toBe(true)
    expect(result.experienceLevel).toBe('student')
  })

  it('should use default target role when null', async () => {
    const mockData = createMockData({
      profile: {
        experienceLevel: 'mid',
        targetRole: null,
      },
    })
    const result = await extractSuggestionContext(mockData)

    expect(result.targetRole).toBe('Software Engineer')
  })

  it('should extract skills from parsed sections', async () => {
    const mockData = createMockData()
    const result = await extractSuggestionContext(mockData)

    expect(result.skills).toContain('JavaScript')
    expect(result.skills).toContain('React')
  })

  it('should extract detected fields for format suggestions', async () => {
    const mockData = createMockData()
    const result = await extractSuggestionContext(mockData)

    expect(result.detectedFields).toContain('photo')
  })

  it('should calculate experience years from level', async () => {
    const mockData = createMockData({
      profile: {
        experienceLevel: 'senior',
        targetRole: 'Staff Engineer',
      },
    })
    const result = await extractSuggestionContext(mockData)

    expect(result.experienceYears).toBe(8)
  })
})
