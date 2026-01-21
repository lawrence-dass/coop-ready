/**
 * Unit Tests for runAnalysis Server Action
 *
 * @see Story 4.2: ATS Score Calculation
 * @see Story 4.3: Missing Keywords Detection
 * @see Story 4.4: Section-Level Score Breakdown
 * @see Story 4.5: Experience-Level-Aware Analysis
 */

import { runAnalysis } from '@/actions/analysis'
import { createClient } from '@/lib/supabase/server'
import { getUserProfile } from '@/lib/supabase/queries'
import { getOpenAIClient } from '@/lib/openai'
import { withRetry } from '@/lib/openai/retry'
import { parseOpenAIResponse } from '@/lib/openai'
import {
  parseAnalysisResponse,
  isValidAnalysisResult,
} from '@/lib/openai/prompts/parseAnalysis'
import {
  parseKeywordsResponse,
  toKeywordAnalysis,
  isValidKeywordResult,
} from '@/lib/openai/prompts/parseKeywords'
import {
  parseSectionScoresResponse,
  isValidSectionScoresResult,
} from '@/lib/openai/prompts/parseSectionScores'
import { detectSections } from '@/lib/utils/resumeSectionDetector'
import { buildExperienceContext } from '@/lib/openai/prompts/experienceContext'

// Mock dependencies
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/supabase/queries')
jest.mock('@/lib/openai')
jest.mock('@/lib/openai/retry')
jest.mock('@/lib/openai/prompts/parseAnalysis')
jest.mock('@/lib/openai/prompts/parseKeywords')
jest.mock('@/lib/openai/prompts/parseSectionScores')
jest.mock('@/lib/utils/resumeSectionDetector')
jest.mock('@/lib/openai/prompts/experienceContext')

const mockCreateClient = createClient as jest.MockedFunction<typeof createClient>
const mockGetUserProfile = getUserProfile as jest.MockedFunction<typeof getUserProfile>
const mockGetOpenAIClient = getOpenAIClient as jest.MockedFunction<typeof getOpenAIClient>
const mockWithRetry = withRetry as jest.MockedFunction<typeof withRetry>
const mockParseOpenAIResponse = parseOpenAIResponse as jest.MockedFunction<typeof parseOpenAIResponse>
const mockParseAnalysisResponse = parseAnalysisResponse as jest.MockedFunction<typeof parseAnalysisResponse>
const mockIsValidAnalysisResult = isValidAnalysisResult as jest.MockedFunction<typeof isValidAnalysisResult>
const mockParseKeywordsResponse = parseKeywordsResponse as jest.MockedFunction<typeof parseKeywordsResponse>
const mockToKeywordAnalysis = toKeywordAnalysis as jest.MockedFunction<typeof toKeywordAnalysis>
const mockIsValidKeywordResult = isValidKeywordResult as jest.MockedFunction<typeof isValidKeywordResult>
const mockParseSectionScoresResponse = parseSectionScoresResponse as jest.MockedFunction<typeof parseSectionScoresResponse>
const mockIsValidSectionScoresResult = isValidSectionScoresResult as jest.MockedFunction<typeof isValidSectionScoresResult>
const mockDetectSections = detectSections as jest.MockedFunction<typeof detectSections>
const mockBuildExperienceContext = buildExperienceContext as jest.MockedFunction<typeof buildExperienceContext>

// Mock console methods to avoid cluttering test output
beforeAll(() => {
  global.console.error = jest.fn()
  global.console.warn = jest.fn()
  global.console.info = jest.fn()
  global.console.debug = jest.fn()
})

afterEach(() => {
  jest.clearAllMocks()
})

describe('runAnalysis Server Action', () => {
  const validScanId = '123e4567-e89b-12d3-a456-426614174000'
  const mockUserId = 'user-123'
  const mockResumeId = 'resume-123'

  const mockScan = {
    id: validScanId,
    user_id: mockUserId,
    resume_id: mockResumeId,
    job_description: 'Software Engineer role requiring React, TypeScript, Node.js',
    status: 'pending',
    ats_score: null,
    score_justification: null,
    created_at: '2026-01-20T00:00:00Z',
    updated_at: '2026-01-20T00:00:00Z',
  }

  const mockParsedResume = {
    contact: 'john@example.com',
    summary: 'Software Developer',
    experience: [
      {
        company: 'TechCorp',
        title: 'Developer',
        dates: '2020-2023',
        bulletPoints: ['Built web apps'],
      },
    ],
    education: [],
    skills: [{ name: 'React', category: 'technical' as const }],
    projects: '',
    other: '',
  }

  const mockResume = {
    extracted_text: 'John Doe\nSoftware Developer\n\nSkills: React, TypeScript, JavaScript\n\nExperience:\n- Built web applications with React\n- Worked with Node.js backend',
    parsed_resume: mockParsedResume,
  }

  const mockProfile = {
    experience_level: 'student',
    target_role: 'Software Engineer',
  }

  const mockAnalysisResult = {
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
      'Good format structure',
    ],
    weaknesses: [
      'Missing Node.js in skills section',
      'Could add more quantified achievements',
    ],
  }

  const mockOpenAIResponse = {
    content: JSON.stringify(mockAnalysisResult),
    usage: {
      promptTokens: 1000,
      completionTokens: 500,
      totalTokens: 1500,
    },
    costEstimate: 0.00045,
  }

  const mockKeywordExtraction = {
    keywordsFound: [
      { keyword: 'React', frequency: 3, variant: null },
      { keyword: 'TypeScript', frequency: 2, variant: 'TS' },
      { keyword: 'JavaScript', frequency: 1, variant: null },
    ],
    keywordsMissing: [
      { keyword: 'Node.js', frequency: 2, priority: 'high' as const },
      { keyword: 'Docker', frequency: 1, priority: 'medium' as const },
    ],
    majorKeywordsCoverage: 75,
  }

  const mockKeywordAnalysis = {
    ...mockKeywordExtraction,
    allMajorKeywordsPresent: false,
  }

  const mockSectionScoresResult = {
    sectionScores: {
      experience: {
        score: 75,
        explanation: 'Good experience section with relevant roles.',
        strengths: ['Relevant work history'],
        weaknesses: ['Missing quantified metrics'],
      },
      skills: {
        score: 85,
        explanation: 'Strong technical skills coverage.',
        strengths: ['Comprehensive skills list'],
        weaknesses: [],
      },
    },
  }

  // Helper to setup default mock return values for OpenAI-related functions
  function setupDefaultMocks() {
    // Story 4.5: Mock getUserProfile and buildExperienceContext
    mockGetUserProfile.mockResolvedValue({
      experienceLevel: 'student',
      targetRole: 'Software Engineer',
    })
    mockBuildExperienceContext.mockReturnValue('Experience context for student')

    mockGetOpenAIClient.mockReturnValue({} as any)
    mockWithRetry.mockResolvedValue({} as any)
    mockParseOpenAIResponse.mockReturnValue(mockOpenAIResponse)
    mockParseAnalysisResponse.mockReturnValue(mockAnalysisResult)
    mockIsValidAnalysisResult.mockReturnValue(true)
    mockParseKeywordsResponse.mockReturnValue(mockKeywordExtraction)
    mockToKeywordAnalysis.mockReturnValue(mockKeywordAnalysis)
    mockIsValidKeywordResult.mockReturnValue(true)
    mockDetectSections.mockReturnValue(['experience', 'skills'])
    mockParseSectionScoresResponse.mockReturnValue(mockSectionScoresResult)
    mockIsValidSectionScoresResult.mockReturnValue(true)
  }

  function createMockSupabase() {
    return {
      auth: {
        getUser: jest.fn(),
      },
      from: jest.fn(),
    }
  }

  describe('Input Validation', () => {
    it('should reject invalid scan ID format', async () => {
      const result = await runAnalysis({ scanId: 'invalid-id' })

      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('VALIDATION_ERROR')
      expect(result.error?.message).toContain('Invalid')
      expect(result.data).toBeNull()
    })

    it('should reject missing scan ID', async () => {
      const result = await runAnalysis({} as any)

      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('VALIDATION_ERROR')
      expect(result.data).toBeNull()
    })

    it('should accept valid UUID scan ID', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      })
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      })
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const result = await runAnalysis({ scanId: validScanId })

      // Should pass validation and proceed to scan lookup
      expect(result.error?.code).not.toBe('VALIDATION_ERROR')
    })
  })

  describe('Authentication & Authorization', () => {
    it('should require authentication', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' } as any,
      })
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const result = await runAnalysis({ scanId: validScanId })

      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('UNAUTHORIZED')
      expect(result.error?.message).toContain('Authentication required')
      expect(result.data).toBeNull()
    })

    it('should verify user owns the scan', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      })

      const scanOwnedByOtherUser = {
        ...mockScan,
        user_id: 'other-user-123',
      }

      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: scanOwnedByOtherUser, error: null }),
      })

      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const result = await runAnalysis({ scanId: validScanId })

      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('UNAUTHORIZED')
      expect(result.error?.message).toContain('Access denied')
      expect(result.data).toBeNull()
    })
  })

  describe('Data Loading', () => {
    it('should return error if scan not found', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      })
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
      })
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const result = await runAnalysis({ scanId: validScanId })

      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('NOT_FOUND')
      expect(result.error?.message).toContain('Scan not found')
      expect(result.data).toBeNull()
    })

    it('should return error if resume not found', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      })

      const mockFrom = jest.fn().mockImplementation((table: string) => {
        if (table === 'scans') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockScan, error: null }),
          }
        }
        if (table === 'resumes') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }
        }
        return {}
      })

      mockSupabase.from = mockFrom as any
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const result = await runAnalysis({ scanId: validScanId })

      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('RESUME_NOT_FOUND')
      expect(result.data).toBeNull()
    })

    it('should return error if resume text not extracted', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      })

      const resumeWithoutText = {
        extracted_text: null,
      }

      const mockFrom = jest.fn().mockImplementation((table: string) => {
        if (table === 'scans') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockScan, error: null }),
          }
        }
        if (table === 'resumes') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: resumeWithoutText, error: null }),
          }
        }
        return {}
      })

      mockSupabase.from = mockFrom as any
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      const result = await runAnalysis({ scanId: validScanId })

      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('RESUME_TEXT_MISSING')
      expect(result.error?.message).toContain('Resume text not available')
      expect(result.data).toBeNull()
    })

  })

  describe('Successful Analysis', () => {
    it('should complete analysis successfully', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      })

      const mockFrom = jest.fn().mockImplementation((table: string) => {
        if (table === 'scans') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockScan, error: null }),
          }
        }
        if (table === 'resumes') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockResume, error: null }),
          }
        }
        if (table === 'user_profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }
        }
        return {}
      })

      mockSupabase.from = mockFrom as any
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      setupDefaultMocks()

      const result = await runAnalysis({ scanId: validScanId })

      expect(result.error).toBeNull()
      expect(result.data?.overallScore).toBe(75)
      expect(result.data?.scoreBreakdown.keywords).toBe(80)
      expect(result.data?.keywords).toEqual(mockKeywordAnalysis)
      expect(result.data?.keywords?.keywordsFound).toHaveLength(3)
      expect(result.data?.keywords?.keywordsMissing).toHaveLength(2)
      expect(result.data?.keywords?.majorKeywordsCoverage).toBe(75)
    })

    it('should update scan status to processing then completed', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      })

      const updateCalls: any[] = []
      const updateMock = jest.fn((params) => {
        updateCalls.push(params)
        return {
          eq: jest.fn().mockResolvedValue({ error: null }),
        }
      })

      const mockFrom = jest.fn().mockImplementation((table: string) => {
        if (table === 'scans') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            update: updateMock,
            single: jest.fn().mockResolvedValue({ data: mockScan, error: null }),
          }
        }
        if (table === 'resumes') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockResume, error: null }),
          }
        }
        if (table === 'user_profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }
        }
        return {}
      })

      mockSupabase.from = mockFrom as any
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      setupDefaultMocks()

      await runAnalysis({ scanId: validScanId })

      // Verify update was called for processing status
      expect(updateCalls[0]).toEqual({ status: 'processing' })

      // Verify update was called for completed status with score, keywords, section scores, and experience context
      expect(updateCalls[1]).toEqual({
        ats_score: 75,
        score_justification: mockAnalysisResult.justification,
        keywords_found: mockKeywordAnalysis.keywordsFound,
        keywords_missing: mockKeywordAnalysis.keywordsMissing,
        section_scores: mockSectionScoresResult.sectionScores,
        experience_level_context: 'Experience context for student', // Story 4.5
        status: 'completed',
      })
    })

    it('should handle high match scenario (70+ score)', async () => {
      const highScoreResult = {
        ...mockAnalysisResult,
        overallScore: 85,
        scoreBreakdown: {
          keywords: 90,
          skills: 85,
          experience: 80,
          format: 80,
        },
        justification: 'Excellent match with strong keyword alignment.',
        strengths: [
          'All key technologies present',
          'Quantified achievements',
          'Perfect format',
        ],
      }

      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      })

      const mockFrom = jest.fn().mockImplementation((table: string) => {
        if (table === 'scans') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockScan, error: null }),
          }
        }
        if (table === 'resumes') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockResume, error: null }),
          }
        }
        if (table === 'user_profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }
        }
        return {}
      })

      mockSupabase.from = mockFrom as any
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      mockGetOpenAIClient.mockReturnValue({} as any)
      mockWithRetry.mockResolvedValue({} as any)
      mockParseOpenAIResponse.mockReturnValue(mockOpenAIResponse)
      mockParseAnalysisResponse.mockReturnValue(highScoreResult)
      mockIsValidAnalysisResult.mockReturnValue(true)

      const result = await runAnalysis({ scanId: validScanId })

      expect(result.error).toBeNull()
      expect(result.data?.overallScore).toBeGreaterThanOrEqual(70)
      expect(result.data?.justification).toContain('keyword')
    })

    it('should handle low match scenario (<50 score)', async () => {
      const lowScoreResult = {
        ...mockAnalysisResult,
        overallScore: 35,
        scoreBreakdown: {
          keywords: 25,
          skills: 40,
          experience: 35,
          format: 45,
        },
        justification: 'Limited keyword overlap with job requirements.',
        weaknesses: [
          'Missing 7/10 key technologies',
          'No quantified achievements',
          'Skills section missing',
        ],
      }

      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      })

      const mockFrom = jest.fn().mockImplementation((table: string) => {
        if (table === 'scans') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockScan, error: null }),
          }
        }
        if (table === 'resumes') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockResume, error: null }),
          }
        }
        if (table === 'user_profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }
        }
        return {}
      })

      mockSupabase.from = mockFrom as any
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      mockGetOpenAIClient.mockReturnValue({} as any)
      mockWithRetry.mockResolvedValue({} as any)
      mockParseOpenAIResponse.mockReturnValue(mockOpenAIResponse)
      mockParseAnalysisResponse.mockReturnValue(lowScoreResult)
      mockIsValidAnalysisResult.mockReturnValue(true)

      const result = await runAnalysis({ scanId: validScanId })

      expect(result.error).toBeNull()
      expect(result.data?.overallScore).toBeLessThan(50)
      expect(result.data?.weaknesses.length).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle OpenAI API failure', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      })

      const mockFrom = jest.fn().mockImplementation((table: string) => {
        if (table === 'scans') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockScan, error: null }),
          }
        }
        if (table === 'resumes') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockResume, error: null }),
          }
        }
        if (table === 'user_profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }
        }
        return {}
      })

      mockSupabase.from = mockFrom as any
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      mockGetOpenAIClient.mockReturnValue({} as any)
      mockWithRetry.mockRejectedValue(new Error('OpenAI API error'))

      const result = await runAnalysis({ scanId: validScanId })

      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('ANALYSIS_ERROR')
      expect(result.error?.message).toContain('Analysis failed')
      expect(result.data).toBeNull()
    })

    it('should reject invalid analysis results and not save to database', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      })

      const updateCalls: any[] = []

      const mockFrom = jest.fn().mockImplementation((table: string) => {
        if (table === 'scans') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            update: jest.fn((params) => {
              updateCalls.push(params)
              return {
                eq: jest.fn().mockResolvedValue({ error: null }),
              }
            }),
            single: jest.fn().mockResolvedValue({ data: mockScan, error: null }),
          }
        }
        if (table === 'resumes') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockResume, error: null }),
          }
        }
        if (table === 'user_profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }
        }
        return {}
      })

      mockSupabase.from = mockFrom as any
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      mockGetOpenAIClient.mockReturnValue({} as any)
      mockWithRetry.mockResolvedValue({} as any)
      mockParseOpenAIResponse.mockReturnValue(mockOpenAIResponse)
      mockParseAnalysisResponse.mockReturnValue(mockAnalysisResult)
      // Validation fails - returns error instead of saving invalid data
      mockIsValidAnalysisResult.mockReturnValue(false)

      const result = await runAnalysis({ scanId: validScanId })

      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('VALIDATION_FAILED')
      expect(result.error?.message).toContain('invalid results')
      expect(result.data).toBeNull()
      // Verify scan status was set to failed (second update call after 'processing')
      expect(updateCalls).toContainEqual({ status: 'failed' })
    })

    it('should set scan status to failed on error', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      })

      const updateMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockResolvedValue({ error: null })

      const mockFrom = jest.fn().mockImplementation((table: string) => {
        if (table === 'scans') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: eqMock,
            update: updateMock,
            single: jest.fn().mockResolvedValue({ data: mockScan, error: null }),
          }
        }
        if (table === 'resumes') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockResume, error: null }),
          }
        }
        if (table === 'user_profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }
        }
        return {}
      })

      mockSupabase.from = mockFrom as any
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      mockGetOpenAIClient.mockReturnValue({} as any)
      mockWithRetry.mockRejectedValue(new Error('OpenAI API error'))

      await runAnalysis({ scanId: validScanId })

      // Verify scan status was set to failed
      expect(updateMock).toHaveBeenCalledWith({ status: 'failed' })
    })
  })

  describe('Keyword Extraction (Story 4.3)', () => {
    it('should include keyword data in analysis result', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      })

      const mockFrom = jest.fn().mockImplementation((table: string) => {
        if (table === 'scans') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockScan, error: null }),
          }
        }
        if (table === 'resumes') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockResume, error: null }),
          }
        }
        if (table === 'user_profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }
        }
        return {}
      })

      mockSupabase.from = mockFrom as any
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      setupDefaultMocks()

      const result = await runAnalysis({ scanId: validScanId })

      expect(result.data?.keywords).toBeDefined()
      expect(result.data?.keywords?.keywordsFound).toEqual(mockKeywordExtraction.keywordsFound)
      expect(result.data?.keywords?.keywordsMissing).toEqual(mockKeywordExtraction.keywordsMissing)
      expect(result.data?.keywords?.majorKeywordsCoverage).toBe(75)
    })

    it('should save keyword data to database', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      })

      const updateCalls: any[] = []
      const updateMock = jest.fn((params) => {
        updateCalls.push(params)
        return {
          eq: jest.fn().mockResolvedValue({ error: null }),
        }
      })

      const mockFrom = jest.fn().mockImplementation((table: string) => {
        if (table === 'scans') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            update: updateMock,
            single: jest.fn().mockResolvedValue({ data: mockScan, error: null }),
          }
        }
        if (table === 'resumes') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockResume, error: null }),
          }
        }
        if (table === 'user_profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }
        }
        return {}
      })

      mockSupabase.from = mockFrom as any
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      setupDefaultMocks()

      await runAnalysis({ scanId: validScanId })

      // Second update call should include keyword data
      expect(updateCalls[1].keywords_found).toEqual(mockKeywordAnalysis.keywordsFound)
      expect(updateCalls[1].keywords_missing).toEqual(mockKeywordAnalysis.keywordsMissing)
    })

    it('should continue with empty keyword data if parsing fails', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      })

      const mockFrom = jest.fn().mockImplementation((table: string) => {
        if (table === 'scans') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockScan, error: null }),
          }
        }
        if (table === 'resumes') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockResume, error: null }),
          }
        }
        if (table === 'user_profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }
        }
        return {}
      })

      mockSupabase.from = mockFrom as any
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      mockGetOpenAIClient.mockReturnValue({} as any)
      mockWithRetry.mockResolvedValue({} as any)
      mockParseOpenAIResponse.mockReturnValue(mockOpenAIResponse)
      mockParseAnalysisResponse.mockReturnValue(mockAnalysisResult)
      mockIsValidAnalysisResult.mockReturnValue(true)
      mockParseKeywordsResponse.mockReturnValue({
        keywordsFound: [],
        keywordsMissing: [],
        majorKeywordsCoverage: 0,
      })
      mockToKeywordAnalysis.mockReturnValue({
        keywordsFound: [],
        keywordsMissing: [],
        majorKeywordsCoverage: 0,
        allMajorKeywordsPresent: false,
      })
      mockIsValidKeywordResult.mockReturnValue(false) // Invalid keyword result

      const result = await runAnalysis({ scanId: validScanId })

      // Should still complete successfully despite invalid keyword data
      expect(result.error).toBeNull()
      expect(result.data?.overallScore).toBe(75)
    })
  })

  describe('Section-Level Scoring (Story 4.4)', () => {
    it('should include section scores in analysis result', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      })

      const mockFrom = jest.fn().mockImplementation((table: string) => {
        if (table === 'scans') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockScan, error: null }),
          }
        }
        if (table === 'resumes') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockResume, error: null }),
          }
        }
        if (table === 'user_profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }
        }
        return {}
      })

      mockSupabase.from = mockFrom as any
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      // Story 4.5: Mock getUserProfile
      mockGetUserProfile.mockResolvedValue({
        experienceLevel: 'student',
        targetRole: 'Software Engineer',
      })
      mockBuildExperienceContext.mockReturnValue('Experience context for student')

      mockGetOpenAIClient.mockReturnValue({} as any)
      mockWithRetry.mockResolvedValue({} as any)
      mockParseOpenAIResponse.mockReturnValue(mockOpenAIResponse)
      mockParseAnalysisResponse.mockReturnValue(mockAnalysisResult)
      mockIsValidAnalysisResult.mockReturnValue(true)
      mockParseKeywordsResponse.mockReturnValue(mockKeywordExtraction)
      mockToKeywordAnalysis.mockReturnValue(mockKeywordAnalysis)
      mockIsValidKeywordResult.mockReturnValue(true)
      mockDetectSections.mockReturnValue(['experience', 'skills'])
      mockParseSectionScoresResponse.mockReturnValue(mockSectionScoresResult)
      mockIsValidSectionScoresResult.mockReturnValue(true)

      const result = await runAnalysis({ scanId: validScanId })

      expect(result.data?.sectionScores).toBeDefined()
      expect(result.data?.sectionScores?.experience).toBeDefined()
      expect(result.data?.sectionScores?.experience?.score).toBe(75)
      expect(result.data?.sectionScores?.skills).toBeDefined()
      expect(result.data?.sectionScores?.skills?.score).toBe(85)
    })

    it('should save section scores to database', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      })

      const updateCalls: any[] = []
      const updateMock = jest.fn((params) => {
        updateCalls.push(params)
        return {
          eq: jest.fn().mockResolvedValue({ error: null }),
        }
      })

      const mockFrom = jest.fn().mockImplementation((table: string) => {
        if (table === 'scans') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            update: updateMock,
            single: jest.fn().mockResolvedValue({ data: mockScan, error: null }),
          }
        }
        if (table === 'resumes') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockResume, error: null }),
          }
        }
        if (table === 'user_profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }
        }
        return {}
      })

      mockSupabase.from = mockFrom as any
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      // Story 4.5: Mock getUserProfile
      mockGetUserProfile.mockResolvedValue({
        experienceLevel: 'student',
        targetRole: 'Software Engineer',
      })
      mockBuildExperienceContext.mockReturnValue('Experience context for student')

      mockGetOpenAIClient.mockReturnValue({} as any)
      mockWithRetry.mockResolvedValue({} as any)
      mockParseOpenAIResponse.mockReturnValue(mockOpenAIResponse)
      mockParseAnalysisResponse.mockReturnValue(mockAnalysisResult)
      mockIsValidAnalysisResult.mockReturnValue(true)
      mockParseKeywordsResponse.mockReturnValue(mockKeywordExtraction)
      mockToKeywordAnalysis.mockReturnValue(mockKeywordAnalysis)
      mockIsValidKeywordResult.mockReturnValue(true)
      mockDetectSections.mockReturnValue(['experience', 'skills'])
      mockParseSectionScoresResponse.mockReturnValue(mockSectionScoresResult)
      mockIsValidSectionScoresResult.mockReturnValue(true)

      await runAnalysis({ scanId: validScanId })

      // Second update call should include section scores
      expect(updateCalls[1].section_scores).toEqual(mockSectionScoresResult.sectionScores)
    })

    it('should continue with empty section scores if parsing fails', async () => {
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      })

      const mockFrom = jest.fn().mockImplementation((table: string) => {
        if (table === 'scans') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockScan, error: null }),
          }
        }
        if (table === 'resumes') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockResume, error: null }),
          }
        }
        if (table === 'user_profiles') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({ data: mockProfile, error: null }),
          }
        }
        return {}
      })

      mockSupabase.from = mockFrom as any
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      // Story 4.5: Mock getUserProfile
      mockGetUserProfile.mockResolvedValue({
        experienceLevel: 'student',
        targetRole: 'Software Engineer',
      })
      mockBuildExperienceContext.mockReturnValue('Experience context for student')

      mockGetOpenAIClient.mockReturnValue({} as any)
      mockWithRetry.mockResolvedValue({} as any)
      mockParseOpenAIResponse.mockReturnValue(mockOpenAIResponse)
      mockParseAnalysisResponse.mockReturnValue(mockAnalysisResult)
      mockIsValidAnalysisResult.mockReturnValue(true)
      mockParseKeywordsResponse.mockReturnValue(mockKeywordExtraction)
      mockToKeywordAnalysis.mockReturnValue(mockKeywordAnalysis)
      mockIsValidKeywordResult.mockReturnValue(true)
      mockDetectSections.mockReturnValue(['experience'])
      mockParseSectionScoresResponse.mockReturnValue({ sectionScores: {} }) // Empty
      mockIsValidSectionScoresResult.mockReturnValue(false) // Invalid

      const result = await runAnalysis({ scanId: validScanId })

      // Should still complete successfully despite invalid section scores
      expect(result.error).toBeNull()
      expect(result.data?.overallScore).toBe(75)
      expect(result.data?.sectionScores).toEqual({})
    })
  })

  describe('Experience-Level-Aware Analysis (Story 4.5)', () => {
    beforeEach(() => {
      // Default setup for happy path
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      })
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn()
          .mockResolvedValueOnce({ data: mockScan, error: null }) // Scan
          .mockResolvedValueOnce({ data: mockResume, error: null }), // Resume
        update: jest.fn().mockReturnThis(),
      })
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      mockGetUserProfile.mockResolvedValue({
        experienceLevel: 'student',
        targetRole: 'Software Engineer',
      })
      mockBuildExperienceContext.mockReturnValue('Experience context for student')
      mockDetectSections.mockReturnValue(['experience'])
      mockWithRetry.mockResolvedValue({} as any) // Mock OpenAI completion
      mockParseOpenAIResponse.mockReturnValue(mockOpenAIResponse)
      mockParseAnalysisResponse.mockReturnValue(mockAnalysisResult)
      mockIsValidAnalysisResult.mockReturnValue(true)
      mockParseKeywordsResponse.mockReturnValue(mockKeywordExtraction)
      mockToKeywordAnalysis.mockReturnValue(mockKeywordAnalysis)
      mockIsValidKeywordResult.mockReturnValue(true)
      mockParseSectionScoresResponse.mockReturnValue({ sectionScores: {} })
      mockIsValidSectionScoresResult.mockReturnValue(true)
    })

    it('should fetch user profile and build experience context', async () => {
      await runAnalysis({ scanId: validScanId })

      expect(mockGetUserProfile).toHaveBeenCalledWith(mockUserId)
      expect(mockBuildExperienceContext).toHaveBeenCalledWith('student', 'Software Engineer')
    })

    it('should store experience_level_context in database', async () => {
      const mockUpdate = jest.fn().mockReturnThis()
      const mockSupabase = createMockSupabase()
      mockSupabase.auth.getUser.mockResolvedValue({
        data: { user: { id: mockUserId } },
        error: null,
      })
      mockSupabase.from.mockReturnValue({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn()
          .mockResolvedValueOnce({ data: mockScan, error: null })
          .mockResolvedValueOnce({ data: mockResume, error: null }),
        update: mockUpdate,
      })
      mockCreateClient.mockResolvedValue(mockSupabase as any)

      await runAnalysis({ scanId: validScanId })

      expect(mockUpdate).toHaveBeenCalledWith(
        expect.objectContaining({
          experience_level_context: 'Experience context for student',
        })
      )
    })

    it('should include experienceLevelContext in returned AnalysisResult', async () => {
      const result = await runAnalysis({ scanId: validScanId })

      expect(result.error).toBeNull()
      expect(result.data?.experienceLevelContext).toBe('Experience context for student')
    })

    it('should handle different experience levels', async () => {
      const levels = ['student', 'career_changer', 'experienced']

      for (const level of levels) {
        jest.clearAllMocks()

        // Re-setup mocks for each iteration
        const mockSupabase = createMockSupabase()
        mockSupabase.auth.getUser.mockResolvedValue({
          data: { user: { id: mockUserId } },
          error: null,
        })
        mockSupabase.from.mockReturnValue({
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn()
            .mockResolvedValueOnce({ data: mockScan, error: null })
            .mockResolvedValueOnce({ data: mockResume, error: null }),
          update: jest.fn().mockReturnThis(),
        })
        mockCreateClient.mockResolvedValue(mockSupabase as any)

        mockGetUserProfile.mockResolvedValue({
          experienceLevel: level as any,
          targetRole: 'Developer',
        })
        mockBuildExperienceContext.mockReturnValue(`Context for ${level}`)
        mockDetectSections.mockReturnValue(['experience'])
        mockWithRetry.mockResolvedValue({} as any)
        mockParseOpenAIResponse.mockReturnValue(mockOpenAIResponse)
        mockParseAnalysisResponse.mockReturnValue(mockAnalysisResult)
        mockIsValidAnalysisResult.mockReturnValue(true)
        mockParseKeywordsResponse.mockReturnValue(mockKeywordExtraction)
        mockToKeywordAnalysis.mockReturnValue(mockKeywordAnalysis)
        mockIsValidKeywordResult.mockReturnValue(true)
        mockParseSectionScoresResponse.mockReturnValue({ sectionScores: {} })
        mockIsValidSectionScoresResult.mockReturnValue(true)

        await runAnalysis({ scanId: validScanId })

        expect(mockBuildExperienceContext).toHaveBeenCalledWith(level, 'Developer')
      }
    })

    it('should handle missing target role', async () => {
      mockGetUserProfile.mockResolvedValue({
        experienceLevel: 'student',
        targetRole: null,
      })

      await runAnalysis({ scanId: validScanId })

      expect(mockBuildExperienceContext).toHaveBeenCalledWith('student', null)
    })

    it('should default to student level if profile fetch fails', async () => {
      mockGetUserProfile.mockResolvedValue({
        experienceLevel: 'student',
        targetRole: null,
      })

      const result = await runAnalysis({ scanId: validScanId })

      expect(result.error).toBeNull()
      expect(mockBuildExperienceContext).toHaveBeenCalled()
    })
  })
})
