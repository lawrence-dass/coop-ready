/**
 * Unit Tests: Supabase Query Functions
 *
 * Tests database query functions including getUserProfile
 * Story 4.5: Experience-Level-Aware Analysis
 */

import { describe, it, expect, jest, beforeEach, beforeAll } from '@jest/globals'
import { getUserProfile } from '@/lib/supabase/queries'

// Suppress console output during tests
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
})

// Mock Supabase client
const mockSelect = jest.fn()
const mockEq = jest.fn()
const mockSingle = jest.fn()

const mockSupabase = {
  from: jest.fn(() => ({
    select: mockSelect,
  })),
}

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(() => mockSupabase),
}))

describe('getUserProfile', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSelect.mockReturnValue({ eq: mockEq })
    mockEq.mockReturnValue({ single: mockSingle })
  })

  it('should fetch user profile with experience_level and target_role', async () => {
    const mockProfile = {
      id: 'profile-123',
      user_id: 'user-123',
      experience_level: 'student',
      target_role: 'Software Engineer',
      custom_role: null,
      onboarding_completed: true,
      created_at: '2026-01-20T00:00:00Z',
      updated_at: '2026-01-20T00:00:00Z',
    }

    mockSingle.mockResolvedValue({ data: mockProfile, error: null })

    const result = await getUserProfile('user-123')

    expect(mockSupabase.from).toHaveBeenCalledWith('user_profiles')
    expect(mockSelect).toHaveBeenCalledWith('*')
    expect(mockEq).toHaveBeenCalledWith('user_id', 'user-123')
    expect(result).toEqual({
      id: 'profile-123',
      userId: 'user-123',
      experienceLevel: 'student',
      targetRole: 'Software Engineer',
      customRole: null,
      onboardingCompleted: true,
      createdAt: '2026-01-20T00:00:00Z',
      updatedAt: '2026-01-20T00:00:00Z',
    })
  })

  it('should return default profile when profile not found', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'PGRST116' } })

    const result = await getUserProfile('user-123')

    expect(result).toEqual({
      experienceLevel: 'student',
      targetRole: null,
    })
  })

  it('should return default profile on database error', async () => {
    mockSingle.mockResolvedValue({ data: null, error: { code: 'DB_ERROR', message: 'Connection failed' } })

    const result = await getUserProfile('user-123')

    expect(result).toEqual({
      experienceLevel: 'student',
      targetRole: null,
    })
  })

  it('should return profile with all three experience levels', async () => {
    const levels = ['student', 'career_changer', 'experienced']

    for (const level of levels) {
      const mockProfile = {
        id: 'profile-123',
        user_id: 'user-123',
        experience_level: level,
        target_role: 'Developer',
        custom_role: null,
        onboarding_completed: true,
        created_at: '2026-01-20T00:00:00Z',
        updated_at: '2026-01-20T00:00:00Z',
      }

      mockSingle.mockResolvedValue({ data: mockProfile, error: null })

      const result = await getUserProfile('user-123')

      expect(result.experienceLevel).toBe(level)
    }
  })
})
