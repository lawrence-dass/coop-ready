/**
 * Unit Tests for Format Analyzer
 * Story: 4.6 - Resume Format Issues Detection
 */

import { describe, it, expect, beforeAll, jest } from '@jest/globals'

// Suppress console output during tests
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {})
  jest.spyOn(console, 'warn').mockImplementation(() => {})
  jest.spyOn(console, 'error').mockImplementation(() => {})
})
import { analyzeResumeFormat } from '@/lib/utils/formatAnalyzer'
import type { ParsedResume } from '@/lib/parsers/types'
import type { FormatIssue } from '@/lib/types/analysis'

describe('Format Analyzer (Story 4.6)', () => {
  describe('Section Header Detection', () => {
    it('should detect no issues when all standard sections present', () => {
      const resume: ParsedResume = {
        contact: 'john@example.com | (555) 123-4567',
        summary: 'Experienced developer',
        experience: [
          {
            company: 'Tech Corp',
            title: 'Software Engineer',
            dates: '2022-2024',
            bulletPoints: ['Built features'],
          },
        ],
        education: [
          {
            institution: 'University',
            degree: 'BS Computer Science',
            dates: '2018-2022',
          },
        ],
        skills: [{ name: 'JavaScript', category: 'technical' }],
        projects: 'Project details',
        other: '',
      }

      const issues = analyzeResumeFormat(resume)
      const headerIssue = issues.find((i) => i.message.includes('section headers'))
      expect(headerIssue).toBeUndefined()
    })

    it('should flag critical issue when no standard sections present', () => {
      const resume: ParsedResume = {
        contact: '',
        summary: '',
        experience: [],
        education: [],
        skills: [],
        projects: '',
        other: 'Some content but no structure',
      }

      const issues = analyzeResumeFormat(resume)
      const headerIssue = issues.find((i) => i.message.includes('section headers'))

      expect(headerIssue).toBeDefined()
      expect(headerIssue?.type).toBe('critical')
      expect(headerIssue?.source).toBe('rule-based')
      expect(headerIssue?.detail).toContain('ATS')
    })
  })

  describe('Resume Length Calculation', () => {
    it('should not flag warning for 1-page student resume', () => {
      const resume: ParsedResume = {
        contact: 'student@example.com',
        summary: 'CS student seeking internship',
        experience: [
          {
            company: 'Internship Co',
            title: 'Intern',
            dates: 'Summer 2023',
            bulletPoints: ['Developed feature', 'Fixed bugs'],
          },
        ],
        education: [
          {
            institution: 'University',
            degree: 'BS Computer Science',
            dates: '2020-2024',
            gpa: '3.8',
          },
        ],
        skills: [
          { name: 'JavaScript', category: 'technical' },
          { name: 'Python', category: 'technical' },
        ],
        projects: 'Personal project',
        other: '',
      }

      const issues = analyzeResumeFormat(resume, 'student')
      const lengthIssue = issues.find((i) => i.message.includes('page'))
      expect(lengthIssue).toBeUndefined()
    })

    it('should flag warning for 2+ page student resume', () => {
      const longResume: ParsedResume = {
        contact: 'student@example.com',
        summary: 'Very long summary paragraph that goes on and on about many things and includes lots of details that could be condensed',
        experience: [
          {
            company: 'Company A',
            title: 'Intern',
            dates: '2023',
            bulletPoints: [
              'Very long bullet point with excessive details about a minor task',
              'Another lengthy description of routine work',
              'Third bullet with way too much information',
              'Fourth bullet point adding even more content',
              'Fifth bullet continuing to add length',
            ],
          },
          {
            company: 'Company B',
            title: 'Intern',
            dates: '2022',
            bulletPoints: [
              'More long descriptions here',
              'Additional lengthy content',
              'Even more text to make resume longer',
            ],
          },
          {
            company: 'Company C',
            title: 'Intern',
            dates: '2021',
            bulletPoints: [
              'More experience details',
              'Additional information',
            ],
          },
        ],
        education: [
          {
            institution: 'University of Long Name That Goes On Forever',
            degree: 'Bachelor of Science in Computer Science with Minor in Mathematics and Business',
            dates: '2020-2024',
            gpa: '3.8',
          },
        ],
        skills: [
          { name: 'JavaScript', category: 'technical' },
          { name: 'Python', category: 'technical' },
          { name: 'Java', category: 'technical' },
          { name: 'C++', category: 'technical' },
          { name: 'React', category: 'technical' },
          { name: 'Node.js', category: 'technical' },
          { name: 'Communication', category: 'soft' },
          { name: 'Leadership', category: 'soft' },
        ],
        projects: 'Many detailed project descriptions that go on for paragraphs and paragraphs explaining every aspect of the work completed including technologies used, challenges overcome, and outcomes achieved. Additional projects with similar lengthy descriptions continue to add content to make the resume exceed normal length guidelines for entry-level candidates.',
        other: 'Additional information sections with awards, certifications, volunteer work, and other details that further extend the document length beyond recommended limits for student resumes.',
      }

      const issues = analyzeResumeFormat(longResume, 'student')
      const lengthIssue = issues.find((i) => i.message.toLowerCase().includes('page'))

      expect(lengthIssue).toBeDefined()
      expect(lengthIssue?.type).toBe('warning')
      expect(lengthIssue?.source).toBe('rule-based')
      expect(lengthIssue?.detail.toLowerCase()).toContain('entry-level')
    })

    it('should not flag length issue for experienced professionals with 2 pages', () => {
      const experiencedResume: ParsedResume = {
        contact: 'senior@example.com',
        summary: 'Senior engineer with 10 years experience',
        experience: [
          {
            company: 'Tech Giant',
            title: 'Senior Engineer',
            dates: '2018-2024',
            bulletPoints: [
              'Led team of 8 engineers',
              'Architected microservices platform',
              'Reduced latency by 60%',
            ],
          },
          {
            company: 'Startup',
            title: 'Engineer',
            dates: '2014-2018',
            bulletPoints: ['Built initial product', 'Scaled to 1M users'],
          },
        ],
        education: [
          {
            institution: 'University',
            degree: 'BS Computer Science',
            dates: '2010-2014',
          },
        ],
        skills: [
          { name: 'JavaScript', category: 'technical' },
          { name: 'Python', category: 'technical' },
          { name: 'Leadership', category: 'soft' },
        ],
        projects: 'Open source contributions',
        other: 'Awards and certifications',
      }

      const issues = analyzeResumeFormat(experiencedResume, 'experienced')
      const lengthIssue = issues.find((i) => i.message.includes('page'))
      // Experienced professionals can have 2 pages without warning
      expect(lengthIssue).toBeUndefined()
    })
  })

  describe('Contact Information Validation', () => {
    it('should not flag issue when contact info is present', () => {
      const resume: ParsedResume = {
        contact: 'john.doe@example.com | (555) 123-4567 | New York, NY',
        summary: '',
        experience: [],
        education: [],
        skills: [],
        projects: '',
        other: '',
      }

      const issues = analyzeResumeFormat(resume)
      const contactIssue = issues.find((i) => i.message.includes('contact'))
      expect(contactIssue).toBeUndefined()
    })

    it('should flag warning when contact info is completely missing', () => {
      const resume: ParsedResume = {
        contact: '',
        summary: 'Developer',
        experience: [],
        education: [],
        skills: [],
        projects: '',
        other: '',
      }

      const issues = analyzeResumeFormat(resume)
      const contactIssue = issues.find((i) => i.message.toLowerCase().includes('contact'))

      expect(contactIssue).toBeDefined()
      expect(contactIssue?.type).toBe('warning')
      expect(contactIssue?.source).toBe('rule-based')
    })

    it('should accept contact info with only email', () => {
      const resume: ParsedResume = {
        contact: 'developer@example.com',
        summary: '',
        experience: [],
        education: [],
        skills: [],
        projects: '',
        other: '',
      }

      const issues = analyzeResumeFormat(resume)
      const contactIssue = issues.find((i) => i.message.includes('contact'))
      expect(contactIssue).toBeUndefined()
    })

    it('should accept contact info with only phone', () => {
      const resume: ParsedResume = {
        contact: '555-123-4567',
        summary: '',
        experience: [],
        education: [],
        skills: [],
        projects: '',
        other: '',
      }

      const issues = analyzeResumeFormat(resume)
      const contactIssue = issues.find((i) => i.message.includes('contact'))
      expect(contactIssue).toBeUndefined()
    })
  })

  describe('Date Format Consistency', () => {
    it('should not flag issue when dates are consistent', () => {
      const resume: ParsedResume = {
        contact: 'dev@example.com',
        summary: '',
        experience: [
          {
            company: 'Company A',
            title: 'Engineer',
            dates: '01/2022 - 03/2024',
            bulletPoints: [],
          },
          {
            company: 'Company B',
            title: 'Developer',
            dates: '06/2020 - 12/2021',
            bulletPoints: [],
          },
        ],
        education: [
          {
            institution: 'University',
            degree: 'BS CS',
            dates: '09/2016 - 05/2020',
          },
        ],
        skills: [],
        projects: '',
        other: '',
      }

      const issues = analyzeResumeFormat(resume)
      const dateIssue = issues.find((i) => i.message.includes('date'))
      expect(dateIssue).toBeUndefined()
    })

    it('should flag suggestion when date formats are inconsistent', () => {
      const resume: ParsedResume = {
        contact: 'dev@example.com',
        summary: '',
        experience: [
          {
            company: 'Company A',
            title: 'Engineer',
            dates: 'January 2022 - March 2024',
            bulletPoints: [],
          },
          {
            company: 'Company B',
            title: 'Developer',
            dates: '06/2020 - 12/2021',
            bulletPoints: [],
          },
        ],
        education: [
          {
            institution: 'University',
            degree: 'BS CS',
            dates: '2016-2020',
          },
        ],
        skills: [],
        projects: '',
        other: '',
      }

      const issues = analyzeResumeFormat(resume)
      const dateIssue = issues.find((i) => i.message.toLowerCase().includes('date'))

      expect(dateIssue).toBeDefined()
      expect(dateIssue?.type).toBe('suggestion')
      expect(dateIssue?.source).toBe('rule-based')
    })
  })

  describe('Multiple Issues and Sorting', () => {
    it('should return multiple issues sorted by severity (critical > warning > suggestion)', () => {
      const problematicResume: ParsedResume = {
        contact: '', // Missing contact (warning)
        summary: '',
        experience: [], // No sections (critical)
        education: [],
        skills: [],
        projects: '',
        other: '',
      }

      const issues = analyzeResumeFormat(problematicResume)

      expect(issues.length).toBeGreaterThan(1)

      // Verify sorting: critical issues first
      let lastSeverity = 0
      const severityMap = { critical: 3, warning: 2, suggestion: 1 }

      for (const issue of issues) {
        const currentSeverity = severityMap[issue.type]
        expect(currentSeverity).toBeLessThanOrEqual(lastSeverity === 0 ? 3 : lastSeverity)
        lastSeverity = currentSeverity
      }
    })

    it('should return empty array when no issues detected', () => {
      const perfectResume: ParsedResume = {
        contact: 'perfect@example.com | (555) 123-4567',
        summary: 'Experienced software engineer',
        experience: [
          {
            company: 'Tech Corp',
            title: 'Senior Engineer',
            dates: '01/2020 - 03/2024',
            bulletPoints: ['Built scalable systems'],
          },
        ],
        education: [
          {
            institution: 'University',
            degree: 'BS Computer Science',
            dates: '09/2016 - 05/2020',
          },
        ],
        skills: [
          { name: 'JavaScript', category: 'technical' },
          { name: 'Python', category: 'technical' },
        ],
        projects: 'Open source contributor',
        other: '',
      }

      const issues = analyzeResumeFormat(perfectResume, 'experienced')
      expect(issues).toEqual([])
    })
  })
})
