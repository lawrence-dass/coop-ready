/**
 * Tests for generateFormatAndRemovalSuggestions server action
 *
 * @see Story 5.5: Format & Content Removal Suggestions
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals'

// Mock dependencies before importing
jest.mock('@/lib/supabase/server')
jest.mock('@/lib/openai', () => ({
  getOpenAIClient: jest.fn(),
  parseOpenAIResponse: jest.fn(),
}))
jest.mock('@/lib/openai/retry', () => ({
  withRetry: jest.fn(),
}))

import {
  generateFormatAndRemovalSuggestions,
  transformFormatAndRemovalSuggestions,
} from '@/actions/suggestions'

// Helper to mock successful OpenAI response
function mockSuccessfulOpenAIResponse(aiAnalysis: {
  removal_suggestions?: Array<{
    type: string
    field: string
    reasoning: string
    urgency?: string
  }>
  format_suggestions?: Array<{
    issue: string
    current: string
    recommended: string
    reasoning: string
  }>
  content_relevance?: Array<{
    content: string
    years_ago: number
    recommendation: string
    reasoning: string
  }>
}) {
  const mockContent = JSON.stringify(aiAnalysis)

  return {
    mockContent,
    setupMocks: async () => {
      const { getOpenAIClient, parseOpenAIResponse } = await import('@/lib/openai')
      const { withRetry } = await import('@/lib/openai/retry')

      const mockCreate = jest.fn().mockResolvedValue({
        id: 'test-id',
        model: 'gpt-4o-mini',
        choices: [{ message: { content: mockContent } }],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      })

      ;(getOpenAIClient as jest.Mock).mockReturnValue({
        chat: { completions: { create: mockCreate } },
      })
      ;(withRetry as jest.Mock).mockImplementation(async (fn) => fn())
      ;(parseOpenAIResponse as jest.Mock).mockReturnValue({
        content: mockContent,
        usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
        costEstimate: 0.0001,
      })

      return mockCreate
    },
  }
}

describe('Format and Removal Suggestions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('generateFormatAndRemovalSuggestions', () => {
    describe('Input Validation', () => {
      it('rejects invalid scanId', async () => {
        const result = await generateFormatAndRemovalSuggestions({
          scanId: 'invalid-uuid',
          resumeContent: 'Some resume content',
          detectedFields: ['photo'],
          experienceYears: 2,
          targetRole: 'Software Engineer',
        })

        expect(result.data).toBeNull()
        expect(result.error).not.toBeNull()
        expect(result.error?.code).toBe('VALIDATION_ERROR')
      })

      it('rejects negative experience years', async () => {
        const result = await generateFormatAndRemovalSuggestions({
          scanId: '550e8400-e29b-41d4-a716-446655440000',
          resumeContent: 'Some resume content',
          detectedFields: [],
          experienceYears: -1,
          targetRole: 'Software Engineer',
        })

        expect(result.data).toBeNull()
        expect(result.error).not.toBeNull()
        expect(result.error?.code).toBe('VALIDATION_ERROR')
      })

      it('rejects invalid resume pages', async () => {
        const result = await generateFormatAndRemovalSuggestions({
          scanId: '550e8400-e29b-41d4-a716-446655440000',
          resumeContent: 'Some resume content',
          detectedFields: [],
          experienceYears: 2,
          targetRole: 'Software Engineer',
          resumePages: 0,
        })

        expect(result.data).toBeNull()
        expect(result.error).not.toBeNull()
        expect(result.error?.code).toBe('VALIDATION_ERROR')
      })
    })

    describe('Prohibited Content Detection (AC2, AC3)', () => {
      it('detects photo as prohibited and suggests removal with high urgency', async () => {
        const { setupMocks } = mockSuccessfulOpenAIResponse({
          removal_suggestions: [],
          format_suggestions: [],
        })
        await setupMocks()

        const result = await generateFormatAndRemovalSuggestions({
          scanId: '550e8400-e29b-41d4-a716-446655440000',
          resumeContent: 'Resume with photo attached',
          detectedFields: ['photo'],
          experienceYears: 2,
          targetRole: 'Software Engineer',
        })

        expect(result.error).toBeNull()
        expect(result.data?.suggestions).toBeDefined()

        const photoSuggestion = result.data?.suggestions.find((s) => s.original === 'photo')
        expect(photoSuggestion).toBeDefined()
        expect(photoSuggestion?.type).toBe('removal')
        expect(photoSuggestion?.urgency).toBe('high')
      })

      it('detects date_of_birth as prohibited', async () => {
        const { setupMocks } = mockSuccessfulOpenAIResponse({
          removal_suggestions: [],
          format_suggestions: [],
        })
        await setupMocks()

        const result = await generateFormatAndRemovalSuggestions({
          scanId: '550e8400-e29b-41d4-a716-446655440000',
          resumeContent: 'Resume content',
          detectedFields: ['date_of_birth', 'marital_status', 'age'],
          experienceYears: 2,
          targetRole: 'Software Engineer',
        })

        expect(result.error).toBeNull()
        expect(result.data?.suggestions.length).toBeGreaterThanOrEqual(3)

        const dobSuggestion = result.data?.suggestions.find((s) => s.original === 'date_of_birth')
        expect(dobSuggestion?.type).toBe('removal')
        expect(dobSuggestion?.urgency).toBe('high')
      })
    })

    describe('International Student Context (AC7)', () => {
      it('flags visa_status with high urgency for international students', async () => {
        const { setupMocks } = mockSuccessfulOpenAIResponse({
          removal_suggestions: [],
          format_suggestions: [],
        })
        await setupMocks()

        const result = await generateFormatAndRemovalSuggestions({
          scanId: '550e8400-e29b-41d4-a716-446655440000',
          resumeContent: 'Resume content',
          detectedFields: ['visa_status'],
          experienceYears: 1,
          targetRole: 'Software Engineer',
          isInternationalStudent: true,
        })

        expect(result.error).toBeNull()

        const visaSuggestion = result.data?.suggestions.find((s) => s.original === 'visa_status')
        expect(visaSuggestion).toBeDefined()
        expect(visaSuggestion?.type).toBe('removal')
        expect(visaSuggestion?.urgency).toBe('high') // High for international students
      })

      it('flags visa_status with medium urgency for non-international students', async () => {
        const { setupMocks } = mockSuccessfulOpenAIResponse({
          removal_suggestions: [],
          format_suggestions: [],
        })
        await setupMocks()

        const result = await generateFormatAndRemovalSuggestions({
          scanId: '550e8400-e29b-41d4-a716-446655440000',
          resumeContent: 'Resume content',
          detectedFields: ['visa_status'],
          experienceYears: 1,
          targetRole: 'Software Engineer',
          isInternationalStudent: false,
        })

        expect(result.error).toBeNull()

        const visaSuggestion = result.data?.suggestions.find((s) => s.original === 'visa_status')
        expect(visaSuggestion).toBeDefined()
        expect(visaSuggestion?.urgency).toBe('medium') // Medium for non-international
      })
    })

    describe('Length Recommendations (AC1)', () => {
      it('suggests condensing to 1 page for entry-level with 2+ pages', async () => {
        const { setupMocks } = mockSuccessfulOpenAIResponse({
          removal_suggestions: [],
          format_suggestions: [],
        })
        await setupMocks()

        const result = await generateFormatAndRemovalSuggestions({
          scanId: '550e8400-e29b-41d4-a716-446655440000',
          resumeContent: 'Resume content',
          detectedFields: [],
          experienceYears: 1, // Entry-level
          targetRole: 'Software Engineer',
          resumePages: 2, // Too many pages
        })

        expect(result.error).toBeNull()

        const lengthSuggestion = result.data?.suggestions.find(
          (s) => s.type === 'format' && s.original.includes('pages')
        )
        expect(lengthSuggestion).toBeDefined()
        expect(lengthSuggestion?.suggested).toContain('1 page')
        expect(lengthSuggestion?.urgency).toBe('medium')
      })

      it('does not suggest condensing when pages are appropriate', async () => {
        const { setupMocks } = mockSuccessfulOpenAIResponse({
          removal_suggestions: [],
          format_suggestions: [],
        })
        await setupMocks()

        const result = await generateFormatAndRemovalSuggestions({
          scanId: '550e8400-e29b-41d4-a716-446655440000',
          resumeContent: 'Resume content',
          detectedFields: [],
          experienceYears: 7, // Senior level - 2 pages OK
          targetRole: 'Software Engineer',
          resumePages: 2,
        })

        expect(result.error).toBeNull()

        const lengthSuggestion = result.data?.suggestions.find(
          (s) => s.type === 'format' && s.original.includes('pages')
        )
        expect(lengthSuggestion).toBeUndefined()
      })
    })

    describe('AI Integration', () => {
      it('combines local and AI suggestions without duplicates', async () => {
        const { setupMocks } = mockSuccessfulOpenAIResponse({
          removal_suggestions: [
            {
              type: 'prohibited',
              field: 'photo', // Duplicate - should be ignored
              reasoning: 'AI detected photo',
              urgency: 'high',
            },
            {
              type: 'sensitive',
              field: 'social_security_number', // New field from AI
              reasoning: 'Should not be included',
              urgency: 'high',
            },
          ],
          format_suggestions: [
            {
              issue: 'Inconsistent date format',
              current: '01/15/2023',
              recommended: 'Jan 2023',
              reasoning: 'Professional consistency',
            },
          ],
        })
        await setupMocks()

        const result = await generateFormatAndRemovalSuggestions({
          scanId: '550e8400-e29b-41d4-a716-446655440000',
          resumeContent: 'Resume content',
          detectedFields: ['photo'],
          experienceYears: 2,
          targetRole: 'Software Engineer',
        })

        expect(result.error).toBeNull()

        // Should have photo once (local), SSN from AI, and format suggestion
        const photoSuggestions = result.data?.suggestions.filter((s) => s.original === 'photo')
        expect(photoSuggestions?.length).toBe(1) // No duplicates

        const ssnSuggestion = result.data?.suggestions.find(
          (s) => s.original === 'social_security_number'
        )
        expect(ssnSuggestion).toBeDefined()

        const formatSuggestion = result.data?.suggestions.find((s) => s.type === 'format')
        expect(formatSuggestion).toBeDefined()
      })

      it('handles AI parse errors gracefully by returning local suggestions', async () => {
        const { parseOpenAIResponse } = await import('@/lib/openai')
        const { withRetry } = await import('@/lib/openai/retry')
        const { getOpenAIClient } = await import('@/lib/openai')

        ;(getOpenAIClient as jest.Mock).mockReturnValue({
          chat: { completions: { create: jest.fn().mockResolvedValue({}) } },
        })
        ;(withRetry as jest.Mock).mockImplementation(async (fn) => fn())
        ;(parseOpenAIResponse as jest.Mock).mockReturnValue({
          content: 'invalid json {{{',
          usage: { promptTokens: 100, completionTokens: 50, totalTokens: 150 },
          costEstimate: 0.0001,
        })

        const result = await generateFormatAndRemovalSuggestions({
          scanId: '550e8400-e29b-41d4-a716-446655440000',
          resumeContent: 'Resume content',
          detectedFields: ['photo'],
          experienceYears: 2,
          targetRole: 'Software Engineer',
        })

        // Should still return local suggestions even if AI fails
        expect(result.error).toBeNull()
        expect(result.data?.suggestions).toBeDefined()

        const photoSuggestion = result.data?.suggestions.find((s) => s.original === 'photo')
        expect(photoSuggestion).toBeDefined()
      })
    })

    describe('Content Relevance (AC4)', () => {
      it('adds removal suggestion for outdated experience', async () => {
        const { setupMocks } = mockSuccessfulOpenAIResponse({
          removal_suggestions: [],
          format_suggestions: [],
          content_relevance: [
            {
              content: 'Internship at Old Company',
              years_ago: 15,
              recommendation: 'remove',
              reasoning: 'Too old to be relevant',
            },
          ],
        })
        await setupMocks()

        const result = await generateFormatAndRemovalSuggestions({
          scanId: '550e8400-e29b-41d4-a716-446655440000',
          resumeContent: 'Resume content',
          detectedFields: [],
          experienceYears: 2,
          targetRole: 'Software Engineer',
        })

        expect(result.error).toBeNull()

        const outdatedSuggestion = result.data?.suggestions.find(
          (s) => s.original === 'Internship at Old Company'
        )
        expect(outdatedSuggestion).toBeDefined()
        expect(outdatedSuggestion?.type).toBe('removal')
        expect(outdatedSuggestion?.reasoning).toContain('15 years ago')
      })

      it('adds format suggestion for condensable experience', async () => {
        const { setupMocks } = mockSuccessfulOpenAIResponse({
          removal_suggestions: [],
          format_suggestions: [],
          content_relevance: [
            {
              content: 'Freelance work 2018-2019',
              years_ago: 7,
              recommendation: 'condense',
              reasoning: 'Keep but shorten',
            },
          ],
        })
        await setupMocks()

        const result = await generateFormatAndRemovalSuggestions({
          scanId: '550e8400-e29b-41d4-a716-446655440000',
          resumeContent: 'Resume content',
          detectedFields: [],
          experienceYears: 5,
          targetRole: 'Software Engineer',
        })

        expect(result.error).toBeNull()

        const condenseSuggestion = result.data?.suggestions.find(
          (s) => s.original === 'Freelance work 2018-2019'
        )
        expect(condenseSuggestion).toBeDefined()
        expect(condenseSuggestion?.type).toBe('format')
        expect(condenseSuggestion?.suggested?.toLowerCase()).toContain('condensing')
      })
    })

    describe('Suggestion Type Classification (AC6)', () => {
      it('classifies format suggestions correctly', async () => {
        const { setupMocks } = mockSuccessfulOpenAIResponse({
          removal_suggestions: [],
          format_suggestions: [
            {
              issue: 'Mixed bullet points',
              current: '• - *',
              recommended: 'Use • consistently',
              reasoning: 'Professional appearance',
            },
          ],
        })
        await setupMocks()

        const result = await generateFormatAndRemovalSuggestions({
          scanId: '550e8400-e29b-41d4-a716-446655440000',
          resumeContent: 'Resume content',
          detectedFields: [],
          experienceYears: 2,
          targetRole: 'Software Engineer',
        })

        expect(result.error).toBeNull()

        const formatSuggestion = result.data?.suggestions.find(
          (s) => s.original === 'Mixed bullet points'
        )
        expect(formatSuggestion?.type).toBe('format')
      })

      it('classifies removal suggestions correctly', async () => {
        const { setupMocks } = mockSuccessfulOpenAIResponse({
          removal_suggestions: [],
          format_suggestions: [],
        })
        await setupMocks()

        const result = await generateFormatAndRemovalSuggestions({
          scanId: '550e8400-e29b-41d4-a716-446655440000',
          resumeContent: 'Resume content',
          detectedFields: ['nationality'],
          experienceYears: 2,
          targetRole: 'Software Engineer',
        })

        expect(result.error).toBeNull()

        const removalSuggestion = result.data?.suggestions.find((s) => s.original === 'nationality')
        expect(removalSuggestion?.type).toBe('removal')
      })
    })

    describe('No Suggestions Scenario (Test 7)', () => {
      it('returns empty suggestions for clean resume', async () => {
        const { setupMocks } = mockSuccessfulOpenAIResponse({
          removal_suggestions: [],
          format_suggestions: [],
          content_relevance: [],
        })
        await setupMocks()

        const result = await generateFormatAndRemovalSuggestions({
          scanId: '550e8400-e29b-41d4-a716-446655440000',
          resumeContent: 'Clean professional resume',
          detectedFields: [], // No prohibited/sensitive fields
          experienceYears: 5,
          targetRole: 'Software Engineer',
          resumePages: 2, // Appropriate for experience level
        })

        expect(result.error).toBeNull()
        expect(result.data?.suggestions).toEqual([])
      })
    })
  })

  describe('transformFormatAndRemovalSuggestions', () => {
    it('should transform format suggestions to database format', () => {
      const suggestions = [
        {
          type: 'format' as const,
          original: 'Inconsistent date format',
          suggested: 'Use MMM YYYY format',
          reasoning: 'Consistency improves readability',
          urgency: 'low' as const,
        },
      ]

      const transformed = transformFormatAndRemovalSuggestions(suggestions)

      expect(transformed).toHaveLength(1)
      expect(transformed[0].section).toBe('format')
      expect(transformed[0].suggestionType).toBe('format')
      expect(transformed[0].originalText).toBe('Inconsistent date format')
      expect(transformed[0].suggestedText).toBe('Use MMM YYYY format')
    })

    it('should transform removal suggestions to database format', () => {
      const suggestions = [
        {
          type: 'removal' as const,
          original: 'photo',
          suggested: null,
          reasoning: 'Not expected in North American resumes',
          urgency: 'high' as const,
        },
      ]

      const transformed = transformFormatAndRemovalSuggestions(suggestions)

      expect(transformed).toHaveLength(1)
      expect(transformed[0].section).toBe('format')
      expect(transformed[0].suggestionType).toBe('removal')
      expect(transformed[0].suggestedText).toBe('Remove')
    })

    it('should include urgency in reasoning', () => {
      const suggestions = [
        {
          type: 'removal' as const,
          original: 'photo',
          suggested: null,
          reasoning: 'Test reason',
          urgency: 'high' as const,
        },
      ]

      const transformed = transformFormatAndRemovalSuggestions(suggestions)

      expect(transformed[0].reasoning).toContain('[HIGH]')
      expect(transformed[0].reasoning).toContain('Test reason')
    })

    it('should handle multiple suggestions with item index', () => {
      const suggestions = [
        {
          type: 'format' as const,
          original: 'Issue 1',
          suggested: 'Fix 1',
          reasoning: 'Reason 1',
          urgency: 'low' as const,
        },
        {
          type: 'removal' as const,
          original: 'photo',
          suggested: null,
          reasoning: 'Remove photo',
          urgency: 'high' as const,
        },
      ]

      const transformed = transformFormatAndRemovalSuggestions(suggestions)

      expect(transformed).toHaveLength(2)
      expect(transformed[0].itemIndex).toBe(0)
      expect(transformed[1].itemIndex).toBe(1)
    })

    it('should handle null suggested text by using "Remove"', () => {
      const suggestions = [
        {
          type: 'removal' as const,
          original: 'visa_status',
          suggested: null,
          reasoning: 'Legal concern',
          urgency: 'high' as const,
        },
      ]

      const transformed = transformFormatAndRemovalSuggestions(suggestions)

      expect(transformed[0].suggestedText).toBe('Remove')
    })

    it('should handle mixed format and removal suggestions', () => {
      const suggestions = [
        {
          type: 'format' as const,
          original: 'Date format',
          suggested: 'Jan 2023',
          reasoning: 'Consistency',
          urgency: 'low' as const,
        },
        {
          type: 'removal' as const,
          original: 'photo',
          suggested: null,
          reasoning: 'Not expected',
          urgency: 'high' as const,
        },
        {
          type: 'format' as const,
          original: 'Bullet points',
          suggested: 'Use • consistently',
          reasoning: 'Professional',
          urgency: 'medium' as const,
        },
      ]

      const transformed = transformFormatAndRemovalSuggestions(suggestions)

      expect(transformed).toHaveLength(3)
      expect(transformed.filter((t) => t.suggestionType === 'format')).toHaveLength(2)
      expect(transformed.filter((t) => t.suggestionType === 'removal')).toHaveLength(1)
    })

    it('should preserve all urgency levels in transformed suggestions', () => {
      const suggestions = [
        {
          type: 'removal' as const,
          original: 'photo',
          suggested: null,
          reasoning: 'High urgency item',
          urgency: 'high' as const,
        },
        {
          type: 'format' as const,
          original: 'Some format issue',
          suggested: 'Fix it',
          reasoning: 'Medium urgency item',
          urgency: 'medium' as const,
        },
        {
          type: 'format' as const,
          original: 'Another format',
          suggested: 'Better',
          reasoning: 'Low urgency item',
          urgency: 'low' as const,
        },
      ]

      const transformed = transformFormatAndRemovalSuggestions(suggestions)

      expect(transformed[0].reasoning).toContain('[HIGH]')
      expect(transformed[1].reasoning).toContain('[MEDIUM]')
      expect(transformed[2].reasoning).toContain('[LOW]')
    })

    it('should maintain suggested text when provided', () => {
      const suggestions = [
        {
          type: 'format' as const,
          original: 'Inconsistent dates',
          suggested: 'Use format: Jan 2023, Feb 2022, etc.',
          reasoning: 'Professional standards',
          urgency: 'low' as const,
        },
      ]

      const transformed = transformFormatAndRemovalSuggestions(suggestions)

      expect(transformed[0].suggestedText).toBe('Use format: Jan 2023, Feb 2022, etc.')
    })

    it('should handle empty suggestions array', () => {
      const suggestions: Array<{
        type: 'format' | 'removal'
        original: string
        suggested: string | null
        reasoning: string
        urgency: 'high' | 'medium' | 'low'
      }> = []

      const transformed = transformFormatAndRemovalSuggestions(suggestions)

      expect(transformed).toEqual([])
    })

    it('should set section to "format" for all suggestions', () => {
      const suggestions = [
        {
          type: 'format' as const,
          original: 'Format issue',
          suggested: 'Fix',
          reasoning: 'Test',
          urgency: 'low' as const,
        },
        {
          type: 'removal' as const,
          original: 'photo',
          suggested: null,
          reasoning: 'Test',
          urgency: 'high' as const,
        },
      ]

      const transformed = transformFormatAndRemovalSuggestions(suggestions)

      expect(transformed.every((t) => t.section === 'format')).toBe(true)
    })

    it('should maintain suggestion_type matching original type', () => {
      const suggestions = [
        {
          type: 'format' as const,
          original: 'Issue',
          suggested: 'Fix',
          reasoning: 'Test',
          urgency: 'low' as const,
        },
        {
          type: 'removal' as const,
          original: 'photo',
          suggested: null,
          reasoning: 'Test',
          urgency: 'high' as const,
        },
      ]

      const transformed = transformFormatAndRemovalSuggestions(suggestions)

      expect(transformed[0].suggestionType).toBe('format')
      expect(transformed[1].suggestionType).toBe('removal')
    })
  })

  describe('Suggestion Structure Validation', () => {
    it('should ensure all transformed suggestions have required fields', () => {
      const suggestions = [
        {
          type: 'removal' as const,
          original: 'photo',
          suggested: null,
          reasoning: 'Not expected in North American resumes',
          urgency: 'high' as const,
        },
      ]

      const transformed = transformFormatAndRemovalSuggestions(suggestions)

      transformed.forEach((suggestion) => {
        expect(suggestion).toHaveProperty('section')
        expect(suggestion).toHaveProperty('itemIndex')
        expect(suggestion).toHaveProperty('originalText')
        expect(suggestion).toHaveProperty('suggestedText')
        expect(suggestion).toHaveProperty('suggestionType')
        expect(suggestion).toHaveProperty('reasoning')
      })
    })

    it('should validate types of transformed suggestion fields', () => {
      const suggestions = [
        {
          type: 'format' as const,
          original: 'Test',
          suggested: 'Fix',
          reasoning: 'Reason',
          urgency: 'low' as const,
        },
      ]

      const transformed = transformFormatAndRemovalSuggestions(suggestions)
      const sugg = transformed[0]

      expect(typeof sugg.section).toBe('string')
      expect(typeof sugg.itemIndex).toBe('number')
      expect(typeof sugg.originalText).toBe('string')
      expect(typeof sugg.suggestedText).toBe('string')
      expect(typeof sugg.suggestionType).toBe('string')
      expect(typeof sugg.reasoning).toBe('string')
    })
  })
})
