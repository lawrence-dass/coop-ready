/**
 * Integration Tests for Export Actions
 * Story 6.1: Resume Content Merging
 */

import { generateMergedResume } from '@/actions/export'
import { mergeResumeContent, type DatabaseSuggestion } from '@/lib/generators/merge'
import type { ParsedResume } from '@/lib/parsers/types'

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

describe('generateMergedResume', () => {
  const mockScanId = '123e4567-e89b-12d3-a456-426614174000'
  const mockResumeId = '123e4567-e89b-12d3-a456-426614174001'

  const mockResumeData: ParsedResume = {
    contact: 'Jane Smith\njane@example.com',
    summary: 'Software engineer with 5 years experience',
    experience: [
      {
        company: 'Tech Company',
        title: 'Senior Engineer',
        dates: '2020-2024',
        bulletPoints: [
          'Developed microservices using Node.js',
          'Mentored junior developers',
        ],
      },
    ],
    education: [
      {
        institution: 'State University',
        degree: 'BS Computer Science',
        dates: '2015-2019',
      },
    ],
    skills: [
      { name: 'JavaScript', category: 'technical' },
      { name: 'Python', category: 'technical' },
    ],
    projects: 'Open source contributor',
    other: '',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('validates input with invalid scan ID', async () => {
    const result = await generateMergedResume({ scanId: 'invalid-id' })

    expect(result.error).not.toBeNull()
    expect(result.error?.code).toBe('VALIDATION_ERROR')
    expect(result.data).toBeNull()
  })

  it('returns error when scan not found', async () => {
    const { createClient } = require('@/lib/supabase/server')
    const mockSupabase = {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
    }
    createClient.mockResolvedValue(mockSupabase)

    const result = await generateMergedResume({ scanId: mockScanId })

    expect(result.error).not.toBeNull()
    expect(result.error?.code).toBe('NOT_FOUND')
    expect(result.error?.message).toBe('Scan not found')
    expect(result.data).toBeNull()
  })

  it('returns error when resume not found', async () => {
    const { createClient } = require('@/lib/supabase/server')
    const mockFrom = jest.fn((table: string) => {
      if (table === 'scans') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: mockScanId, user_id: 'user-1', resume_id: mockResumeId },
            error: null,
          }),
        }
      } else if (table === 'resumes') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({ data: null, error: { message: 'Not found' } }),
        }
      }
      return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn() }
    })
    const mockSupabase = {
      from: mockFrom,
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
    }
    createClient.mockResolvedValue(mockSupabase)

    const result = await generateMergedResume({ scanId: mockScanId })

    expect(result.error).not.toBeNull()
    expect(result.error?.code).toBe('NOT_FOUND')
    expect(result.error?.message).toBe('Resume not found')
  })

  it('returns error when resume not parsed yet', async () => {
    const { createClient } = require('@/lib/supabase/server')
    const mockFrom = jest.fn((table: string) => {
      if (table === 'scans') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: mockScanId, user_id: 'user-1', resume_id: mockResumeId },
            error: null,
          }),
        }
      } else if (table === 'resumes') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: mockResumeId, parsed_sections: null },
            error: null,
          }),
        }
      }
      return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn() }
    })
    const mockSupabase = {
      from: mockFrom,
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
    }
    createClient.mockResolvedValue(mockSupabase)

    const result = await generateMergedResume({ scanId: mockScanId })

    expect(result.error).not.toBeNull()
    expect(result.error?.code).toBe('INVALID_STATE')
    expect(result.error?.message).toContain('not been parsed')
  })

  it('returns error when suggestions fetch fails', async () => {
    const { createClient } = require('@/lib/supabase/server')
    const mockFrom = jest.fn((table: string) => {
      if (table === 'scans') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: mockScanId, user_id: 'user-1', resume_id: mockResumeId },
            error: null,
          }),
        }
      } else if (table === 'resumes') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: mockResumeId, parsed_sections: mockResumeData },
            error: null,
          }),
        }
      } else if (table === 'suggestions') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: null, error: { message: 'Database error' } }),
        }
      }
      return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn() }
    })
    const mockSupabase = {
      from: mockFrom,
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
    }
    createClient.mockResolvedValue(mockSupabase)

    const result = await generateMergedResume({ scanId: mockScanId })

    expect(result.error).not.toBeNull()
    expect(result.error?.code).toBe('DATABASE_ERROR')
    expect(result.error?.message).toContain('fetch suggestions')
  })

  it('successfully merges accepted suggestions (happy path)', async () => {
    const { createClient } = require('@/lib/supabase/server')
    const mockSuggestions = [
      {
        id: 'sug-1',
        scan_id: mockScanId,
        section: 'experience',
        item_index: 0,
        suggestion_type: 'bullet_rewrite',
        original_text: 'Developed microservices using Node.js',
        suggested_text: 'Architected and deployed microservices using Node.js',
        reasoning: 'Stronger action verb',
        status: 'accepted',
        created_at: '2024-01-01T00:00:00Z',
      },
    ]

    const mockFrom = jest.fn((table: string) => {
      if (table === 'scans') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: mockScanId, user_id: 'user-1', resume_id: mockResumeId },
            error: null,
          }),
        }
      } else if (table === 'resumes') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: mockResumeId, parsed_sections: mockResumeData },
            error: null,
          }),
        }
      } else if (table === 'suggestions') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({ data: mockSuggestions, error: null }),
        }
      }
      return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn() }
    })
    const mockSupabase = {
      from: mockFrom,
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
    }
    createClient.mockResolvedValue(mockSupabase)

    const result = await generateMergedResume({ scanId: mockScanId })

    expect(result.error).toBeNull()
    expect(result.data).not.toBeNull()
    expect(result.data?.appliedCount).toBe(1)
    expect(result.data?.mergedContent.experience[0].bulletPoints[0]).toBe(
      'Architected and deployed microservices using Node.js'
    )
  })

  it('returns unauthorized when user not authenticated', async () => {
    const { createClient } = require('@/lib/supabase/server')
    const mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: null }, error: { message: 'Not authenticated' } }),
      },
    }
    createClient.mockResolvedValue(mockSupabase)

    const result = await generateMergedResume({ scanId: mockScanId })

    expect(result.error).not.toBeNull()
    expect(result.error?.code).toBe('UNAUTHORIZED')
  })

  it('returns not found when user does not own scan', async () => {
    const { createClient } = require('@/lib/supabase/server')
    const mockFrom = jest.fn((table: string) => {
      if (table === 'scans') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: { id: mockScanId, user_id: 'different-user', resume_id: mockResumeId },
            error: null,
          }),
        }
      }
      return { select: jest.fn().mockReturnThis(), eq: jest.fn().mockReturnThis(), single: jest.fn() }
    })
    const mockSupabase = {
      from: mockFrom,
      auth: {
        getUser: jest.fn().mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null }),
      },
    }
    createClient.mockResolvedValue(mockSupabase)

    const result = await generateMergedResume({ scanId: mockScanId })

    expect(result.error).not.toBeNull()
    expect(result.error?.code).toBe('NOT_FOUND')
  })
})

describe('mergeResumeContent - Integration', () => {
  const sampleResume: ParsedResume = {
    contact: 'Test User\ntest@example.com',
    summary: 'Experienced developer',
    experience: [
      {
        company: 'Company A',
        title: 'Engineer',
        dates: '2020-2023',
        bulletPoints: [
          'Built features with React',
          'Worked on backend APIs',
          'Deployed to production',
        ],
      },
    ],
    education: [],
    skills: [
      { name: 'React', category: 'technical' },
      { name: 'Node.js', category: 'technical' },
    ],
    projects: '',
    other: '',
  }

  it('merges all accepted suggestions into output', async () => {
    const suggestions: DatabaseSuggestion[] = [
      {
        id: 'sug-1',
        scan_id: 'scan-1',
        section: 'experience',
        item_index: 0,
        suggestion_type: 'bullet_rewrite',
        original_text: 'Built features with React',
        suggested_text: 'Architected scalable features using React and TypeScript',
        reasoning: 'Stronger action verb',
        status: 'accepted',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'sug-2',
        scan_id: 'scan-1',
        section: 'skills',
        item_index: null,
        suggestion_type: 'skill_expansion',
        original_text: 'Node.js',
        suggested_text: 'Node.js (Express, NestJS, TypeORM)',
        reasoning: 'Expand with frameworks',
        status: 'accepted',
        created_at: '2024-01-01T00:01:00Z',
      },
    ]

    const result = await mergeResumeContent(sampleResume, suggestions)

    expect(result.appliedCount).toBe(2)
    expect(result.skippedCount).toBe(0)
    expect(result.mergedContent.experience[0].bulletPoints[0]).toBe(
      'Architected scalable features using React and TypeScript'
    )
    expect(result.mergedContent.skills[1].name).toBe('Node.js (Express, NestJS, TypeORM)')
  })

  it('ignores rejected suggestions', async () => {
    const suggestions: DatabaseSuggestion[] = [
      {
        id: 'sug-1',
        scan_id: 'scan-1',
        section: 'experience',
        item_index: 0,
        suggestion_type: 'bullet_rewrite',
        original_text: 'Built features with React',
        suggested_text: 'Different text',
        reasoning: 'Test',
        status: 'rejected',
        created_at: '2024-01-01T00:00:00Z',
      },
    ]

    const result = await mergeResumeContent(sampleResume, suggestions)

    expect(result.appliedCount).toBe(0)
    expect(result.skippedCount).toBe(0)
    // Original text should remain
    expect(result.mergedContent.experience[0].bulletPoints[0]).toBe('Built features with React')
  })

  it('returns original data when no accepted suggestions', async () => {
    const suggestions: DatabaseSuggestion[] = []

    const result = await mergeResumeContent(sampleResume, suggestions)

    expect(result.appliedCount).toBe(0)
    expect(result.skippedCount).toBe(0)
    expect(result.mergedContent).toEqual(sampleResume)
  })

  it('handles mixed accepted and rejected suggestions', async () => {
    const suggestions: DatabaseSuggestion[] = [
      {
        id: 'sug-1',
        scan_id: 'scan-1',
        section: 'experience',
        item_index: 0,
        suggestion_type: 'bullet_rewrite',
        original_text: 'Built features with React',
        suggested_text: 'Created enterprise applications with React',
        reasoning: 'Stronger',
        status: 'accepted',
        created_at: '2024-01-01T00:00:00Z',
      },
      {
        id: 'sug-2',
        scan_id: 'scan-1',
        section: 'experience',
        item_index: 0,
        suggestion_type: 'bullet_rewrite',
        original_text: 'Worked on backend APIs',
        suggested_text: 'Should not appear',
        reasoning: 'Test',
        status: 'rejected',
        created_at: '2024-01-01T00:01:00Z',
      },
      {
        id: 'sug-3',
        scan_id: 'scan-1',
        section: 'skills',
        item_index: null,
        suggestion_type: 'skill_expansion',
        original_text: 'React',
        suggested_text: 'React (Hooks, Context, Redux)',
        reasoning: 'Expand',
        status: 'accepted',
        created_at: '2024-01-01T00:02:00Z',
      },
    ]

    const result = await mergeResumeContent(sampleResume, suggestions)

    expect(result.appliedCount).toBe(2)
    expect(result.skippedCount).toBe(0)
    expect(result.mergedContent.experience[0].bulletPoints[0]).toBe(
      'Created enterprise applications with React'
    )
    expect(result.mergedContent.experience[0].bulletPoints[1]).toBe('Worked on backend APIs')
    expect(result.mergedContent.skills[0].name).toBe('React (Hooks, Context, Redux)')
  })

  it('handles suggestions with missing targets', async () => {
    const suggestions: DatabaseSuggestion[] = [
      {
        id: 'sug-1',
        scan_id: 'scan-1',
        section: 'experience',
        item_index: 0,
        suggestion_type: 'bullet_rewrite',
        original_text: 'This bullet does not exist',
        suggested_text: 'New text',
        reasoning: 'Test',
        status: 'accepted',
        created_at: '2024-01-01T00:00:00Z',
      },
    ]

    const result = await mergeResumeContent(sampleResume, suggestions)

    expect(result.appliedCount).toBe(0)
    expect(result.skippedCount).toBe(1)
    expect(result.warnings).toHaveLength(1)
    expect(result.warnings[0].suggestionId).toBe('sug-1')
    expect(result.warnings[0].reason).toContain('not found')
  })

  it('applies suggestions in chronological order', async () => {
    const suggestions: DatabaseSuggestion[] = [
      {
        id: 'sug-2',
        scan_id: 'scan-1',
        section: 'experience',
        item_index: 0,
        suggestion_type: 'bullet_rewrite',
        original_text: 'Built features with React',
        suggested_text: 'Second change',
        reasoning: 'Test',
        status: 'accepted',
        created_at: '2024-01-01T00:02:00Z', // Later
      },
      {
        id: 'sug-1',
        scan_id: 'scan-1',
        section: 'experience',
        item_index: 0,
        suggestion_type: 'bullet_rewrite',
        original_text: 'Built features with React',
        suggested_text: 'First change',
        reasoning: 'Test',
        status: 'accepted',
        created_at: '2024-01-01T00:01:00Z', // Earlier
      },
    ]

    const result = await mergeResumeContent(sampleResume, suggestions)

    // First change should be applied, then second
    // Since both target same text, second will fail to find it
    expect(result.appliedCount).toBe(1)
    expect(result.mergedContent.experience[0].bulletPoints[0]).toBe('First change')
  })
})
