/**
 * Unit Tests: Resume Section Detector
 * Story: 4.4 - Section-Level Score Breakdown
 */

import { detectSections } from '@/lib/utils/resumeSectionDetector'
import { ParsedResume } from '@/lib/parsers/types'

describe('detectSections', () => {
  describe('Section Detection', () => {
    it('should detect experience section when entries exist', () => {
      const resume: ParsedResume = {
        contact: '',
        summary: '',
        experience: [
          {
            company: 'TechCorp',
            title: 'Software Engineer',
            dates: '2020-2023',
            bulletPoints: ['Built APIs'],
          },
        ],
        education: [],
        skills: [],
        projects: '',
        other: '',
      }

      const sections = detectSections(resume)
      expect(sections).toContain('experience')
    })

    it('should detect education section when entries exist', () => {
      const resume: ParsedResume = {
        contact: '',
        summary: '',
        experience: [],
        education: [
          {
            institution: 'University',
            degree: 'BS Computer Science',
            dates: '2016-2020',
          },
        ],
        skills: [],
        projects: '',
        other: '',
      }

      const sections = detectSections(resume)
      expect(sections).toContain('education')
    })

    it('should detect skills section when entries exist', () => {
      const resume: ParsedResume = {
        contact: '',
        summary: '',
        experience: [],
        education: [],
        skills: [{ name: 'JavaScript', category: 'technical' }],
        projects: '',
        other: '',
      }

      const sections = detectSections(resume)
      expect(sections).toContain('skills')
    })

    it('should detect projects section when text exists', () => {
      const resume: ParsedResume = {
        contact: '',
        summary: '',
        experience: [],
        education: [],
        skills: [],
        projects: 'Built a weather app using React',
        other: '',
      }

      const sections = detectSections(resume)
      expect(sections).toContain('projects')
    })

    it('should detect summary section when text exists', () => {
      const resume: ParsedResume = {
        contact: '',
        summary: 'Experienced software engineer',
        experience: [],
        education: [],
        skills: [],
        projects: '',
        other: '',
      }

      const sections = detectSections(resume)
      expect(sections).toContain('summary')
    })
  })

  describe('Multiple Sections', () => {
    it('should detect all sections when all exist', () => {
      const resume: ParsedResume = {
        contact: 'john@example.com',
        summary: 'Software engineer',
        experience: [
          {
            company: 'TechCorp',
            title: 'Engineer',
            dates: '2020-2023',
            bulletPoints: ['Work'],
          },
        ],
        education: [
          {
            institution: 'University',
            degree: 'BS CS',
            dates: '2016-2020',
          },
        ],
        skills: [{ name: 'JavaScript', category: 'technical' }],
        projects: 'Built apps',
        other: '',
      }

      const sections = detectSections(resume)
      expect(sections).toHaveLength(5)
      expect(sections).toContain('experience')
      expect(sections).toContain('education')
      expect(sections).toContain('skills')
      expect(sections).toContain('projects')
      expect(sections).toContain('summary')
    })

    it('should only return sections that exist', () => {
      const resume: ParsedResume = {
        contact: '',
        summary: '',
        experience: [
          {
            company: 'TechCorp',
            title: 'Engineer',
            dates: '2020-2023',
            bulletPoints: ['Work'],
          },
        ],
        education: [],
        skills: [{ name: 'React', category: 'technical' }],
        projects: '',
        other: '',
      }

      const sections = detectSections(resume)
      expect(sections).toHaveLength(2)
      expect(sections).toContain('experience')
      expect(sections).toContain('skills')
      expect(sections).not.toContain('education')
      expect(sections).not.toContain('projects')
      expect(sections).not.toContain('summary')
    })
  })

  describe('Edge Cases', () => {
    it('should not detect projects section when text is only whitespace', () => {
      const resume: ParsedResume = {
        contact: '',
        summary: '',
        experience: [],
        education: [],
        skills: [],
        projects: '   \n\t  ',
        other: '',
      }

      const sections = detectSections(resume)
      expect(sections).not.toContain('projects')
    })

    it('should not detect summary section when text is empty', () => {
      const resume: ParsedResume = {
        contact: '',
        summary: '',
        experience: [],
        education: [],
        skills: [],
        projects: '',
        other: '',
      }

      const sections = detectSections(resume)
      expect(sections).not.toContain('summary')
    })

    it('should return empty array when no sections exist', () => {
      const resume: ParsedResume = {
        contact: '',
        summary: '',
        experience: [],
        education: [],
        skills: [],
        projects: '',
        other: '',
      }

      const sections = detectSections(resume)
      expect(sections).toEqual([])
    })

    it('should not detect experience when array is empty', () => {
      const resume: ParsedResume = {
        contact: '',
        summary: '',
        experience: [],
        education: [],
        skills: [],
        projects: '',
        other: '',
      }

      const sections = detectSections(resume)
      expect(sections).not.toContain('experience')
    })
  })

  describe('Section Name Consistency', () => {
    it('should return lowercase section names', () => {
      const resume: ParsedResume = {
        contact: '',
        summary: 'Test',
        experience: [
          {
            company: 'TechCorp',
            title: 'Engineer',
            dates: '2020-2023',
            bulletPoints: ['Work'],
          },
        ],
        education: [],
        skills: [],
        projects: '',
        other: '',
      }

      const sections = detectSections(resume)
      sections.forEach((section) => {
        expect(section).toEqual(section.toLowerCase())
      })
    })
  })
})
