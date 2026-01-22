/**
 * Integration Tests for PDF Export
 * Story 6.2: PDF Resume Generation
 */

import { generateResumePDF } from '@/actions/export'
import { createClient } from '@/lib/supabase/server'
import type { ParsedResume } from '@/lib/parsers/types'

// Mock @react-pdf/renderer
jest.mock('@react-pdf/renderer', () => ({
  renderToBuffer: jest.fn((document) => {
    const mockPDFContent = '%PDF-1.4\nMock PDF content for testing'
    return Promise.resolve(Buffer.from(mockPDFContent))
  }),
  Document: jest.fn(({ children }) => ({ type: 'Document', children })),
  Page: jest.fn(({ children }) => ({ type: 'Page', children })),
  View: jest.fn(({ children }) => ({ type: 'View', children })),
  Text: jest.fn(({ children }) => ({ type: 'Text', children })),
  StyleSheet: {
    create: jest.fn((styles) => styles),
  },
}))

// Mock PDF components
jest.mock('@/components/pdf/PDFDocument', () => ({
  PDFDocument: jest.fn(({ resume }) => ({ type: 'PDFDocument', resume })),
}))

// Mock Supabase client
jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}))

// Mock data
const mockParsedResume: ParsedResume = {
  contact: 'Alice Johnson\nalice@email.com | (555) 987-6543 | San Francisco, CA',
  summary: 'Product manager with 8+ years of experience in SaaS companies.',
  experience: [
    {
      company: 'SaaS Company',
      title: 'Senior Product Manager',
      dates: 'Mar 2019 - Present',
      bulletPoints: [
        'Led product strategy for enterprise platform with $50M ARR',
        'Increased user engagement by 35% through feature optimization',
        'Managed cross-functional team of 12 engineers and designers',
      ],
    },
  ],
  education: [
    {
      institution: 'Business School',
      degree: 'MBA in Product Management',
      dates: 'Sep 2015 - May 2017',
    },
  ],
  skills: [
    { name: 'Product Strategy', category: 'technical' },
    { name: 'Agile', category: 'technical' },
    { name: 'Stakeholder Management', category: 'soft' },
  ],
  projects: '',
  other: 'Certified Scrum Product Owner (CSPO)',
}

const mockUserId = '123e4567-e89b-12d3-a456-426614174000'
const mockScanId = '987fcdeb-51d2-43f8-b123-987654321000'
const mockResumeId = '456e7890-a12b-34c5-d678-543210987000'

describe('PDF Export Integration', () => {
  let mockSupabase: any

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()

    // Setup mock Supabase client
    mockSupabase = {
      auth: {
        getUser: jest.fn().mockResolvedValue({
          data: { user: { id: mockUserId } },
          error: null,
        }),
      },
      from: jest.fn((table: string) => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => {
          if (table === 'scans') {
            return Promise.resolve({
              data: {
                id: mockScanId,
                user_id: mockUserId,
                resume_id: mockResumeId,
              },
              error: null,
            })
          }
          if (table === 'resumes') {
            return Promise.resolve({
              data: {
                id: mockResumeId,
                parsed_sections: mockParsedResume,
              },
              error: null,
            })
          }
          return Promise.resolve({ data: null, error: null })
        }),
      })),
    }

    // Override select for suggestions table
    mockSupabase.from = jest.fn((table: string) => {
      if (table === 'suggestions') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockResolvedValue({
            data: [
              {
                id: 'sugg1',
                scan_id: mockScanId,
                section: 'experience',
                item_index: 0,
                suggestion_type: 'bullet_rewrite',
                original_text: 'Led product strategy',
                suggested_text: 'Spearheaded product strategy',
                reasoning: 'Stronger action verb',
                status: 'accepted',
                created_at: new Date().toISOString(),
              },
            ],
            error: null,
          }),
        }
      }

      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        single: jest.fn().mockImplementation(() => {
          if (table === 'scans') {
            return Promise.resolve({
              data: {
                id: mockScanId,
                user_id: mockUserId,
                resume_id: mockResumeId,
              },
              error: null,
            })
          }
          if (table === 'resumes') {
            return Promise.resolve({
              data: {
                id: mockResumeId,
                parsed_sections: mockParsedResume,
              },
              error: null,
            })
          }
          return Promise.resolve({ data: null, error: null })
        }),
      }
    })

    ;(createClient as jest.Mock).mockResolvedValue(mockSupabase)
  })

  describe('generateResumePDF', () => {
    it('generates PDF from merged resume data', async () => {
      const result = await generateResumePDF({
        scanId: mockScanId,
        format: 'pdf',
      })

      expect(result.error).toBeNull()
      expect(result.data).toBeDefined()
      expect(result.data?.fileBlob).toBeInstanceOf(Buffer)
      expect(result.data?.fileName).toContain('.pdf')
      expect(result.data?.mimeType).toBe('application/pdf')
    })

    it('PDF contains resume content', async () => {
      const result = await generateResumePDF({
        scanId: mockScanId,
        format: 'pdf',
      })

      expect(result.error).toBeNull()
      expect(result.data).toBeDefined()

      const pdfBuffer = result.data!.fileBlob
      expect(pdfBuffer.length).toBeGreaterThan(0)

      // Verify PDF header
      expect(pdfBuffer.toString('utf-8', 0, 4)).toBe('%PDF')
    })

    it('PDF is properly formatted and readable', async () => {
      const result = await generateResumePDF({
        scanId: mockScanId,
        format: 'pdf',
      })

      expect(result.error).toBeNull()
      const pdfBuffer = result.data!.fileBlob

      // Verify it's a valid PDF
      expect(pdfBuffer.toString('utf-8', 0, 4)).toBe('%PDF')

      // Check file size is reasonable (< 500KB)
      const fileSizeKB = pdfBuffer.length / 1024
      expect(fileSizeKB).toBeLessThan(500)
    })

    it('returns proper filename and MIME type', async () => {
      const result = await generateResumePDF({
        scanId: mockScanId,
        format: 'pdf',
      })

      expect(result.error).toBeNull()
      expect(result.data?.fileName).toBe('Alice_Johnson_Resume_Optimized.pdf')
      expect(result.data?.mimeType).toBe('application/pdf')
    })

    it('validates user ownership of scan', async () => {
      // Mock scan belonging to different user
      mockSupabase.from = jest.fn((table: string) => ({
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
      }))

      const result = await generateResumePDF({
        scanId: mockScanId,
        format: 'pdf',
      })

      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('NOT_FOUND')
      expect(result.data).toBeNull()
    })

    it('handles invalid scan ID', async () => {
      const result = await generateResumePDF({
        scanId: 'invalid-uuid',
        format: 'pdf',
      })

      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('VALIDATION_ERROR')
      expect(result.data).toBeNull()
    })

    it('handles missing resume data', async () => {
      mockSupabase.from = jest.fn((table: string) => {
        if (table === 'resumes') {
          return {
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' },
            }),
          }
        }
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
      })

      const result = await generateResumePDF({
        scanId: mockScanId,
        format: 'pdf',
      })

      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('NOT_FOUND')
      expect(result.data).toBeNull()
    })

    it('handles unauthorized user', async () => {
      mockSupabase.auth.getUser = jest.fn().mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const result = await generateResumePDF({
        scanId: mockScanId,
        format: 'pdf',
      })

      expect(result.error).toBeDefined()
      expect(result.error?.code).toBe('UNAUTHORIZED')
      expect(result.data).toBeNull()
    })
  })
})
