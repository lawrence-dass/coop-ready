/**
 * Integration Tests: DOCX Export
 * Story 6.3: DOCX Resume Generation
 */

import { generateResumeDOCX } from '@/actions/export'
import { createClient } from '@/lib/supabase/server'
import type { ParsedResume } from '@/lib/parsers/types'

// Mock Supabase
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

// Mock @react-pdf/renderer (ESM module)
jest.mock('@react-pdf/renderer', () => ({
  renderToBuffer: jest.fn((document) => {
    const mockPDFContent = '%PDF-1.4\nMock PDF content for testing'
    return Promise.resolve(Buffer.from(mockPDFContent))
  }),
  Document: jest.fn(({ children }) => ({ type: 'Document', children })),
  Page: jest.fn(({ children }) => ({ type: 'Page', children })),
  View: jest.fn(({ children }) => ({ type: 'View', children })),
  Text: jest.fn(({ children }) => ({ type: 'Text', children })),
  StyleSheet: { create: jest.fn((styles) => styles) },
}))

// Mock docx library
jest.mock('docx', () => {
  const actual = jest.requireActual('docx')
  return {
    ...actual,
    Packer: {
      toBuffer: jest.fn((document) => {
        const mockDOCXContent = 'PK\x03\x04' + 'Mock DOCX content for testing'
        return Promise.resolve(Buffer.from(mockDOCXContent))
      }),
    },
  }
})

describe('DOCX Export Integration', () => {
  const mockUserId = 'user-123'
  const mockScanId = '550e8400-e29b-41d4-a716-446655440000'
  const mockResumeId = 'resume-456'

  const mockParsedResume: ParsedResume = {
    contact: 'John Doe\njohn@example.com | (555) 123-4567',
    summary: 'Experienced software engineer',
    experience: [
      {
        company: 'Tech Corp',
        title: 'Senior Engineer',
        dates: 'Jan 2020 - Present',
        bulletPoints: ['Led team', 'Improved performance'],
      },
    ],
    education: [
      {
        institution: 'University',
        degree: 'BS Computer Science',
        dates: 'May 2018',
        gpa: '3.8',
      },
    ],
    skills: [
      { name: 'JavaScript', category: 'technical' },
      { name: 'Leadership', category: 'soft' },
    ],
    projects: 'Built CLI tool',
    other: '',
  }

  const mockSupabaseClient = {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(createClient as jest.Mock).mockResolvedValue(mockSupabaseClient)
  })

  it('generates DOCX from merged resume data', async () => {
    // Mock user auth
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    })

    // Mock database queries
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'scans') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: mockScanId,
              user_id: mockUserId,
              resume_id: mockResumeId,
            },
            error: null,
          }),
        }
      }
      if (table === 'resumes') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: mockResumeId,
              parsed_sections: mockParsedResume,
            },
            error: null,
          }),
        }
      }
      if (table === 'suggestions') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }
      }
      return {}
    })

    const result = await generateResumeDOCX({
      scanId: mockScanId,
      format: 'docx',
    })

    expect(result.error).toBeNull()
    expect(result.data).toBeDefined()
    expect(result.data?.fileBlob).toBeInstanceOf(Buffer)
    expect(result.data?.fileName).toContain('.docx')
    expect(result.data?.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
  })

  it('DOCX content is valid and has expected structure', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    })

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'scans') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: mockScanId,
              user_id: mockUserId,
              resume_id: mockResumeId,
            },
            error: null,
          }),
        }
      }
      if (table === 'resumes') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: mockResumeId,
              parsed_sections: mockParsedResume,
            },
            error: null,
          }),
        }
      }
      if (table === 'suggestions') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }
      }
      return {}
    })

    const result = await generateResumeDOCX({
      scanId: mockScanId,
      format: 'docx',
    })

    expect(result.data?.fileBlob).toBeInstanceOf(Buffer)
    // DOCX files start with PK signature (ZIP format)
    const buffer = result.data?.fileBlob
    expect(buffer?.toString('utf8', 0, 2)).toBe('PK')
  })

  it('returns proper filename and MIME type', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    })

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'scans') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: mockScanId,
              user_id: mockUserId,
              resume_id: mockResumeId,
            },
            error: null,
          }),
        }
      }
      if (table === 'resumes') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: mockResumeId,
              parsed_sections: mockParsedResume,
            },
            error: null,
          }),
        }
      }
      if (table === 'suggestions') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }
      }
      return {}
    })

    const result = await generateResumeDOCX({
      scanId: mockScanId,
      format: 'docx',
    })

    expect(result.data?.fileName).toBe('John_Doe_Resume_Optimized.docx')
    expect(result.data?.mimeType).toBe(
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    )
  })

  it('validates user ownership of scan', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    })

    // Mock scan belonging to different user
    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'scans') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: mockScanId,
              user_id: 'different-user-id',
              resume_id: mockResumeId,
            },
            error: null,
          }),
        }
      }
      return {}
    })

    const result = await generateResumeDOCX({
      scanId: mockScanId,
      format: 'docx',
    })

    expect(result.data).toBeNull()
    expect(result.error).toBeDefined()
    expect(result.error?.code).toBe('NOT_FOUND')
  })

  it('returns error for invalid scanId', async () => {
    const result = await generateResumeDOCX({
      scanId: 'invalid-uuid',
      format: 'docx',
    })

    expect(result.data).toBeNull()
    expect(result.error).toBeDefined()
    expect(result.error?.code).toBe('VALIDATION_ERROR')
  })

  it('returns error when user is not authenticated', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: null },
      error: { message: 'Not authenticated' },
    })

    const result = await generateResumeDOCX({
      scanId: mockScanId,
      format: 'docx',
    })

    expect(result.data).toBeNull()
    expect(result.error).toBeDefined()
    expect(result.error?.code).toBe('UNAUTHORIZED')
  })

  it('handles resume with no suggestions', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    })

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'scans') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: mockScanId,
              user_id: mockUserId,
              resume_id: mockResumeId,
            },
            error: null,
          }),
        }
      }
      if (table === 'resumes') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: {
              id: mockResumeId,
              parsed_sections: mockParsedResume,
            },
            error: null,
          }),
        }
      }
      if (table === 'suggestions') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: [],
            error: null,
          }),
        }
      }
      return {}
    })

    const result = await generateResumeDOCX({
      scanId: mockScanId,
      format: 'docx',
    })

    expect(result.error).toBeNull()
    expect(result.data?.fileBlob).toBeInstanceOf(Buffer)
  })

  it('handles database errors gracefully', async () => {
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: { id: mockUserId } },
      error: null,
    })

    mockSupabaseClient.from.mockImplementation((table: string) => {
      if (table === 'scans') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }
      }
      return {}
    })

    const result = await generateResumeDOCX({
      scanId: mockScanId,
      format: 'docx',
    })

    expect(result.data).toBeNull()
    expect(result.error).toBeDefined()
  })
})
