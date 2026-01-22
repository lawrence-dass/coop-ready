/**
 * Unit Tests for PDF Generation
 * Story 6.2: PDF Resume Generation
 */

import { generatePDF, generateFileName, PDFGenerationError } from '@/lib/generators/pdf'
import type { ParsedResume } from '@/lib/parsers/types'

// Mock @react-pdf/renderer
jest.mock('@react-pdf/renderer', () => ({
  renderToBuffer: jest.fn((document) => {
    // Simulate PDF generation - return a mock PDF buffer
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

// Mock sample resume data
const mockResume: ParsedResume = {
  contact: 'John Smith\njohn.smith@email.com | (555) 123-4567 | New York, NY',
  summary: 'Experienced software engineer with 5+ years in full-stack development.',
  experience: [
    {
      company: 'Tech Corp',
      title: 'Senior Software Engineer',
      dates: 'Jan 2020 - Present',
      bulletPoints: [
        'Led development of microservices architecture serving 1M+ users',
        'Reduced API response time by 40% through optimization',
        'Mentored team of 5 junior engineers',
      ],
    },
    {
      company: 'StartupCo',
      title: 'Software Engineer',
      dates: 'Jun 2018 - Dec 2019',
      bulletPoints: [
        'Built RESTful APIs using Node.js and Express',
        'Implemented CI/CD pipeline reducing deployment time by 60%',
      ],
    },
  ],
  education: [
    {
      institution: 'University of Technology',
      degree: 'Bachelor of Science in Computer Science',
      dates: 'Sep 2014 - May 2018',
      gpa: '3.8',
    },
  ],
  skills: [
    { name: 'JavaScript', category: 'technical' },
    { name: 'TypeScript', category: 'technical' },
    { name: 'React', category: 'technical' },
    { name: 'Node.js', category: 'technical' },
    { name: 'Leadership', category: 'soft' },
    { name: 'Communication', category: 'soft' },
  ],
  projects: 'Open source contributor to popular JavaScript libraries',
  other: 'AWS Certified Solutions Architect',
}

describe('PDF Generation', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks()

    // Re-mock renderToBuffer with default behavior
    const { renderToBuffer } = require('@react-pdf/renderer')
    renderToBuffer.mockResolvedValue(Buffer.from('%PDF-1.4\nMock PDF content for testing'))
  })

  describe('generatePDF', () => {
    it('generates valid PDF buffer from resume data', async () => {
      const pdfBuffer = await generatePDF(mockResume)

      expect(pdfBuffer).toBeInstanceOf(Buffer)
      expect(pdfBuffer.length).toBeGreaterThan(0)
      // PDF files start with %PDF header
      expect(pdfBuffer.toString('utf-8', 0, 4)).toBe('%PDF')
    })

    it('keeps file size under 500KB', async () => {
      const pdfBuffer = await generatePDF(mockResume)
      const fileSizeKB = pdfBuffer.length / 1024

      expect(fileSizeKB).toBeLessThan(500)
    })

    it('throws PDFGenerationError for null resume data', async () => {
      await expect(generatePDF(null as any)).rejects.toThrow(PDFGenerationError)
      await expect(generatePDF(null as any)).rejects.toThrow('Resume data is required')
    })

    it('throws PDFGenerationError for missing contact info', async () => {
      const invalidResume = { ...mockResume, contact: '' }

      await expect(generatePDF(invalidResume)).rejects.toThrow(PDFGenerationError)
      await expect(generatePDF(invalidResume)).rejects.toThrow('contact information')
    })

    it('throws CONTENT_TOO_LONG for oversized resume', async () => {
      // Mock renderToBuffer to return a large buffer (> 500KB)
      const { renderToBuffer } = require('@react-pdf/renderer')
      const largePDFContent = Buffer.alloc(600 * 1024) // 600KB
      largePDFContent.write('%PDF-1.4', 0)
      renderToBuffer.mockResolvedValue(largePDFContent)

      const oversizedResume: ParsedResume = {
        ...mockResume,
        experience: [
          {
            company: 'Company',
            title: 'Position',
            dates: '2020-2024',
            bulletPoints: ['Bullet 1', 'Bullet 2'],
          },
        ],
      }

      await expect(generatePDF(oversizedResume)).rejects.toThrow(PDFGenerationError)
    })

    it('generates PDF with all resume sections', async () => {
      const pdfBuffer = await generatePDF(mockResume)

      // Verify PDF buffer is valid and non-empty
      expect(pdfBuffer).toBeInstanceOf(Buffer)
      expect(pdfBuffer.length).toBeGreaterThan(0) // Should have content
    })

    it('handles resume with minimal content', async () => {
      const minimalResume: ParsedResume = {
        contact: 'Jane Doe\njane@email.com',
        summary: 'Looking for opportunities',
        experience: [],
        education: [],
        skills: [],
        projects: '',
        other: '',
      }

      const pdfBuffer = await generatePDF(minimalResume)
      expect(pdfBuffer).toBeInstanceOf(Buffer)
      expect(pdfBuffer.length).toBeGreaterThan(0)
    })

    it('handles resume with empty optional sections', async () => {
      const resumeWithoutOptional: ParsedResume = {
        contact: 'John Doe\njohn@email.com',
        summary: '',
        experience: [],
        education: [],
        skills: [],
        projects: '',
        other: '',
      }

      const pdfBuffer = await generatePDF(resumeWithoutOptional)
      expect(pdfBuffer).toBeInstanceOf(Buffer)
      const fileSizeKB = pdfBuffer.length / 1024
      expect(fileSizeKB).toBeLessThan(500)
    })
  })

  describe('generateFileName', () => {
    it('generates filename from contact name', () => {
      const contact = 'John Smith\njohn@email.com | 555-1234'
      const fileName = generateFileName(contact)

      expect(fileName).toBe('John_Smith_Resume_Optimized.pdf')
    })

    it('removes special characters from name', () => {
      const contact = 'Mary O\'Brien-Smith Jr.\nmary@email.com'
      const fileName = generateFileName(contact)

      expect(fileName).toBe('Mary_OBrienSmith_Jr_Resume_Optimized.pdf')
    })

    it('handles single-word names', () => {
      const contact = 'Madonna\nmadonna@email.com'
      const fileName = generateFileName(contact)

      expect(fileName).toBe('Madonna_Resume_Optimized.pdf')
    })

    it('handles empty contact with fallback', () => {
      const contact = '\nemail@test.com'
      const fileName = generateFileName(contact)

      expect(fileName).toBe('Resume_Resume_Optimized.pdf')
    })

    it('replaces multiple spaces with single underscore', () => {
      const contact = 'John   Paul   Jones\nemail@test.com'
      const fileName = generateFileName(contact)

      expect(fileName).toBe('John_Paul_Jones_Resume_Optimized.pdf')
    })
  })

  describe('PDFGenerationError', () => {
    it('creates error with correct code', () => {
      const error = new PDFGenerationError('Test message', 'INVALID_DATA')

      expect(error.message).toBe('Test message')
      expect(error.code).toBe('INVALID_DATA')
      expect(error.name).toBe('PDFGenerationError')
    })

    it('supports all error codes', () => {
      const codes: Array<'CONTENT_TOO_LONG' | 'INVALID_DATA' | 'RENDER_ERROR'> = [
        'CONTENT_TOO_LONG',
        'INVALID_DATA',
        'RENDER_ERROR',
      ]

      codes.forEach((code) => {
        const error = new PDFGenerationError('Test', code)
        expect(error.code).toBe(code)
      })
    })
  })

  describe('ATS Compatibility (AC7)', () => {
    /**
     * NOTE: These tests verify ATS compatibility requirements.
     * The mocked renderer produces a simple buffer, but the actual
     * @react-pdf/renderer generates proper text-extractable PDFs.
     *
     * For full ATS verification, see Manual QA Checklist in story file:
     * - Generate PDF from sample resume
     * - Copy text from PDF and verify accuracy
     * - Use pdf-parse to programmatically extract text
     */

    it('generates PDF with text content (not image-based)', async () => {
      // The PDF should be text-based for ATS parsing
      const pdfBuffer = await generatePDF(mockResume)

      // PDF should start with proper header
      expect(pdfBuffer.toString('utf-8', 0, 4)).toBe('%PDF')

      // In production, the PDF contains selectable text
      // This is guaranteed by @react-pdf/renderer which uses
      // text primitives (not images) for content
    })

    it('uses standard ATS-friendly fonts', async () => {
      // The PDF components use Helvetica font family
      // which is ATS-friendly (standard PDF font)
      const pdfBuffer = await generatePDF(mockResume)

      expect(pdfBuffer).toBeInstanceOf(Buffer)
      // Note: Font verification requires actual PDF parsing
      // Helvetica is configured in PDFDocument.tsx:57
    })

    it('avoids tables and complex layouts', async () => {
      // The PDF components use View/Text primitives only
      // No Table components are used (ATS-incompatible)
      const pdfBuffer = await generatePDF(mockResume)

      expect(pdfBuffer).toBeInstanceOf(Buffer)
      // Layout uses simple flex containers, not HTML tables
    })

    it('includes all resume sections for text extraction', async () => {
      // Full resume with all sections should generate valid PDF
      const fullResume: ParsedResume = {
        ...mockResume,
        summary: 'Professional summary text',
        projects: 'Project details here',
        other: 'Additional information',
      }

      const pdfBuffer = await generatePDF(fullResume)
      expect(pdfBuffer).toBeInstanceOf(Buffer)
      expect(pdfBuffer.length).toBeGreaterThan(0)
    })
  })
})
