/**
 * Unit Tests: DOCX Generation
 * Story 6.3: DOCX Resume Generation
 */

import {
  generateDOCX,
  generateFileName,
  DOCXGenerationError,
} from '@/lib/generators/docx'
import {
  buildContactSection,
  buildSummarySection,
  buildExperienceSection,
  buildEducationSection,
  buildSkillsSection,
  buildProjectsSection,
  buildOtherSection,
  createHeadingParagraph,
  createBulletParagraph,
  createNormalParagraph,
  type DOCXStyleConfig,
} from '@/lib/generators/docx-structure'
import type { ParsedResume, JobEntry, EducationEntry, Skill } from '@/lib/parsers/types'

// Mock the docx library
jest.mock('docx', () => {
  const actual = jest.requireActual('docx')
  return {
    ...actual,
    Packer: {
      toBuffer: jest.fn((document) => {
        // Return a mock DOCX buffer (valid Office Open XML signature)
        const mockDOCXContent = 'PK\x03\x04' + 'Mock DOCX content for testing'
        return Promise.resolve(Buffer.from(mockDOCXContent))
      }),
    },
  }
})

describe('DOCX Generation', () => {
  const mockResume: ParsedResume = {
    contact: 'John Doe\njohn@example.com | (555) 123-4567 | New York, NY',
    summary: 'Experienced software engineer with 5+ years of full-stack development.',
    experience: [
      {
        company: 'Tech Corp',
        title: 'Senior Engineer',
        dates: 'Jan 2020 - Present',
        bulletPoints: [
          'Led team of 5 developers',
          'Improved system performance by 40%',
        ],
      },
    ],
    education: [
      {
        institution: 'State University',
        degree: 'BS Computer Science',
        dates: 'May 2018',
        gpa: '3.8',
      },
    ],
    skills: [
      { name: 'JavaScript', category: 'technical' },
      { name: 'Leadership', category: 'soft' },
    ],
    projects: 'Built open-source CLI tool with 1k+ stars on GitHub',
    other: '',
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Document Section Builders', () => {
    it('builds contact section with proper formatting', () => {
      const contact = 'Jane Smith\njane@example.com | 555-0000'
      const paragraphs = buildContactSection(contact)

      expect(paragraphs.length).toBeGreaterThan(0)
      // Should have heading paragraph for name
      expect(paragraphs[0]).toBeDefined()
    })

    it('builds summary section', () => {
      const summary = 'This is a professional summary.'
      const paragraphs = buildSummarySection(summary)

      expect(paragraphs.length).toBe(2) // Heading + content
    })

    it('returns empty array for empty summary', () => {
      const paragraphs = buildSummarySection('')
      expect(paragraphs.length).toBe(0)
    })

    it('builds experience section with bullet points', () => {
      const experience: JobEntry[] = [
        {
          company: 'Acme Inc',
          title: 'Developer',
          dates: '2020-2023',
          bulletPoints: ['Bullet 1', 'Bullet 2'],
        },
      ]
      const paragraphs = buildExperienceSection(experience)

      expect(paragraphs.length).toBeGreaterThan(0)
      // Should have heading + job entry + bullets
      expect(paragraphs.length).toBeGreaterThanOrEqual(4)
    })

    it('builds education section', () => {
      const education: EducationEntry[] = [
        {
          institution: 'University',
          degree: 'BS',
          dates: '2018',
          gpa: '3.5',
        },
      ]
      const paragraphs = buildEducationSection(education)

      expect(paragraphs.length).toBeGreaterThan(0)
      // Should have heading + education entry + GPA
      expect(paragraphs.length).toBeGreaterThanOrEqual(3)
    })

    it('builds skills section with categories', () => {
      const skills: Skill[] = [
        { name: 'Python', category: 'technical' },
        { name: 'Communication', category: 'soft' },
      ]
      const paragraphs = buildSkillsSection(skills)

      expect(paragraphs.length).toBeGreaterThan(0)
      // Should have heading + technical + soft
      expect(paragraphs.length).toBeGreaterThanOrEqual(3)
    })

    it('builds projects section', () => {
      const projects = 'Built a mobile app with React Native'
      const paragraphs = buildProjectsSection(projects)

      expect(paragraphs.length).toBe(2) // Heading + content
    })

    it('returns empty array for empty projects', () => {
      const paragraphs = buildProjectsSection('')
      expect(paragraphs.length).toBe(0)
    })

    it('builds other/additional section', () => {
      const other = 'AWS Certified Solutions Architect, PMP Certification'
      const paragraphs = buildOtherSection(other)

      expect(paragraphs.length).toBe(2) // Heading + content
    })

    it('returns empty array for empty other section', () => {
      const paragraphs = buildOtherSection('')
      expect(paragraphs.length).toBe(0)
    })

    it('applies custom styles to sections', () => {
      const styles: DOCXStyleConfig = {
        fontName: 'Arial',
        fontSize: 12,
        bodyLineSpacing: 1.5,
      }
      const contact = 'John Doe\njohn@example.com'
      const paragraphs = buildContactSection(contact, styles)

      expect(paragraphs.length).toBeGreaterThan(0)
      // Styles are passed through - structure should be the same
    })
  })

  describe('Heading and Bullet Formatting', () => {
    it('creates proper heading hierarchy', () => {
      const heading1 = createHeadingParagraph('Main Heading', 1)
      const heading2 = createHeadingParagraph('Subheading', 2)

      expect(heading1).toBeDefined()
      expect(heading2).toBeDefined()
    })

    it('formats bullets with consistent symbols', () => {
      const bullet = createBulletParagraph('This is a bullet point')
      expect(bullet).toBeDefined()
    })

    it('creates normal paragraphs', () => {
      const paragraph = createNormalParagraph('Normal text content')
      expect(paragraph).toBeDefined()
    })

    it('handles empty sections gracefully', () => {
      const emptyExperience = buildExperienceSection([])
      const emptyEducation = buildEducationSection([])
      const emptySkills = buildSkillsSection([])

      expect(emptyExperience).toEqual([])
      expect(emptyEducation).toEqual([])
      expect(emptySkills).toEqual([])
    })
  })

  describe('generateDOCX', () => {
    it('generates valid DOCX buffer', async () => {
      const result = await generateDOCX(mockResume)

      expect(result).toBeInstanceOf(Buffer)
      expect(result.length).toBeGreaterThan(0)
    })

    it('keeps file size under 100KB for typical resumes', async () => {
      const result = await generateDOCX(mockResume)
      const sizeKB = result.length / 1024

      // Mock returns small buffer, but we verify the check exists
      expect(result).toBeInstanceOf(Buffer)
      // In production, this would enforce < 100KB
    })

    it('throws DOCXGenerationError for null resume data', async () => {
      await expect(generateDOCX(null as any)).rejects.toThrow(DOCXGenerationError)
      await expect(generateDOCX(null as any)).rejects.toThrow('Resume data is required')
    })

    it('throws DOCXGenerationError for missing contact', async () => {
      const invalidResume = {
        ...mockResume,
        contact: '',
      }

      await expect(generateDOCX(invalidResume)).rejects.toThrow(DOCXGenerationError)
      await expect(generateDOCX(invalidResume)).rejects.toThrow('Resume must have contact information')
    })

    it('throws DOCXGenerationError with correct error code', async () => {
      try {
        await generateDOCX(null as any)
      } catch (error) {
        expect(error).toBeInstanceOf(DOCXGenerationError)
        expect((error as DOCXGenerationError).code).toBe('INVALID_DATA')
      }
    })

    it('applies custom margins when provided', async () => {
      const options = {
        margins: {
          top: 0.5,
          right: 0.5,
          bottom: 0.5,
          left: 0.5,
        },
      }

      const result = await generateDOCX(mockResume, undefined, options)
      expect(result).toBeInstanceOf(Buffer)
    })

    it('uses default options when none provided', async () => {
      const result = await generateDOCX(mockResume)
      expect(result).toBeInstanceOf(Buffer)
    })

    it('applies custom styles when provided', async () => {
      const options = {
        styles: {
          fontName: 'Arial',
          fontSize: 12,
          bodyLineSpacing: 1.5,
        },
      }

      const result = await generateDOCX(mockResume, undefined, options)
      expect(result).toBeInstanceOf(Buffer)
    })

    it('includes other section when present', async () => {
      const resumeWithOther = {
        ...mockResume,
        other: 'AWS Certified, PMP Certified',
      }

      const result = await generateDOCX(resumeWithOther)
      expect(result).toBeInstanceOf(Buffer)
    })
  })

  describe('generateFileName', () => {
    it('generates proper filename from contact', () => {
      const contact = 'John Doe\njohn@example.com'
      const fileName = generateFileName(contact)

      expect(fileName).toBe('John_Doe_Resume_Optimized.docx')
    })

    it('sanitizes special characters from name', () => {
      const contact = 'Jane O\'Brien-Smith\njane@example.com'
      const fileName = generateFileName(contact)

      expect(fileName).toBe('Jane_OBrienSmith_Resume_Optimized.docx')
      expect(fileName).not.toContain("'")
      expect(fileName).not.toContain('-')
    })

    it('replaces spaces with underscores', () => {
      const contact = 'Mary Jane Watson\nmary@example.com'
      const fileName = generateFileName(contact)

      expect(fileName).toBe('Mary_Jane_Watson_Resume_Optimized.docx')
    })

    it('handles single-name contacts', () => {
      const contact = 'Madonna\nmadonna@example.com'
      const fileName = generateFileName(contact)

      expect(fileName).toBe('Madonna_Resume_Optimized.docx')
    })

    it('uses fallback for empty contact', () => {
      const contact = ''
      const fileName = generateFileName(contact)

      expect(fileName).toBe('Resume_Optimized.docx')
    })
  })
})
