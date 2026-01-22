/**
 * Unit Tests for Merge Operations
 * Story 6.1: Resume Content Merging
 */

import {
  applyBulletRewrite,
  applySkillExpansion,
  applyActionVerbChange,
  applyRemoval,
} from '@/lib/generators/merge-operations'
import type { ParsedResume } from '@/lib/parsers/types'

describe('Merge Operations', () => {
  // Sample resume data for testing
  const sampleResume: ParsedResume = {
    contact: 'John Doe\njohn@example.com\n555-1234',
    summary: 'Experienced software engineer',
    experience: [
      {
        company: 'Tech Corp',
        title: 'Software Engineer',
        dates: '2020-2023',
        bulletPoints: [
          'Developed web applications using React',
          'Collaborated with team members on features',
          'Improved performance by 30%',
        ],
      },
      {
        company: 'Startup Inc',
        title: 'Junior Developer',
        dates: '2018-2020',
        bulletPoints: [
          'Built features for mobile app',
          'Worked with JavaScript and Node.js',
        ],
      },
    ],
    education: [
      {
        institution: 'University of Example',
        degree: 'BS Computer Science',
        dates: '2014-2018',
        gpa: '3.8',
      },
    ],
    skills: [
      { name: 'Python', category: 'technical' },
      { name: 'React', category: 'technical' },
      { name: 'Communication', category: 'soft' },
    ],
    projects: 'Personal Website: Built with Next.js',
    other: '',
  }

  describe('applyBulletRewrite', () => {
    it('replaces bullet text at correct position', () => {
      const result = applyBulletRewrite(
        sampleResume,
        'experience',
        0,
        'Developed web applications using React',
        'Architected and deployed scalable web applications using React and TypeScript'
      )

      expect(result.experience[0].bulletPoints[0]).toBe(
        'Architected and deployed scalable web applications using React and TypeScript'
      )
    })

    it('preserves surrounding bullets', () => {
      const result = applyBulletRewrite(
        sampleResume,
        'experience',
        0,
        'Collaborated with team members on features',
        'Led cross-functional team of 5 engineers to deliver features ahead of schedule'
      )

      expect(result.experience[0].bulletPoints[0]).toBe('Developed web applications using React')
      expect(result.experience[0].bulletPoints[1]).toBe(
        'Led cross-functional team of 5 engineers to deliver features ahead of schedule'
      )
      expect(result.experience[0].bulletPoints[2]).toBe('Improved performance by 30%')
    })

    it('preserves other job entries', () => {
      const result = applyBulletRewrite(
        sampleResume,
        'experience',
        0,
        'Developed web applications using React',
        'New bullet'
      )

      expect(result.experience[1].company).toBe('Startup Inc')
      expect(result.experience[1].bulletPoints).toHaveLength(2)
    })

    it('throws when target bullet not found', () => {
      expect(() =>
        applyBulletRewrite(
          sampleResume,
          'experience',
          0,
          'This bullet does not exist',
          'New text'
        )
      ).toThrow('Bullet not found')
    })

    it('throws when item index is out of bounds', () => {
      expect(() =>
        applyBulletRewrite(
          sampleResume,
          'experience',
          99,
          'Some text',
          'New text'
        )
      ).toThrow('not found')
    })

    it('handles partial text matching', () => {
      const result = applyBulletRewrite(
        sampleResume,
        'experience',
        0,
        'Developed web applications',
        'Created enterprise-level applications'
      )

      expect(result.experience[0].bulletPoints[0]).toBe(
        'Created enterprise-level applications'
      )
    })

    it('maintains immutability - does not modify original', () => {
      const original = JSON.parse(JSON.stringify(sampleResume))

      applyBulletRewrite(
        sampleResume,
        'experience',
        0,
        'Developed web applications using React',
        'New text'
      )

      // Original should be unchanged
      expect(sampleResume.experience[0].bulletPoints[0]).toBe(original.experience[0].bulletPoints[0])
    })
  })

  describe('applySkillExpansion', () => {
    it('expands skill while preserving others', () => {
      const result = applySkillExpansion(
        sampleResume,
        'Python',
        'Python (Django, Flask, FastAPI)'
      )

      expect(result.skills[0].name).toBe('Python (Django, Flask, FastAPI)')
      expect(result.skills[0].category).toBe('technical')
      expect(result.skills[1].name).toBe('React')
      expect(result.skills[2].name).toBe('Communication')
    })

    it('maintains skill list order', () => {
      const result = applySkillExpansion(
        sampleResume,
        'React',
        'React (Hooks, Context, Redux)'
      )

      expect(result.skills[0].name).toBe('Python')
      expect(result.skills[1].name).toBe('React (Hooks, Context, Redux)')
      expect(result.skills[2].name).toBe('Communication')
    })

    it('throws when skill not found', () => {
      expect(() =>
        applySkillExpansion(
          sampleResume,
          'Java',
          'Java (Spring Boot, Maven)'
        )
      ).toThrow('Skill not found')
    })

    it('maintains immutability', () => {
      const original = JSON.parse(JSON.stringify(sampleResume))

      applySkillExpansion(sampleResume, 'Python', 'Python (Django)')

      expect(sampleResume.skills[0].name).toBe(original.skills[0].name)
    })
  })

  describe('applyActionVerbChange', () => {
    it('changes action verb in bullet point', () => {
      const result = applyActionVerbChange(
        sampleResume,
        'experience',
        0,
        'Developed web applications using React',
        'Architected web applications using React'
      )

      expect(result.experience[0].bulletPoints[0]).toBe(
        'Architected web applications using React'
      )
    })

    it('works the same as bullet rewrite', () => {
      const verbResult = applyActionVerbChange(
        sampleResume,
        'experience',
        0,
        'Collaborated with team members',
        'Led team members'
      )

      const rewriteResult = applyBulletRewrite(
        sampleResume,
        'experience',
        0,
        'Collaborated with team members',
        'Led team members'
      )

      expect(verbResult.experience[0].bulletPoints[1]).toBe(
        rewriteResult.experience[0].bulletPoints[1]
      )
    })
  })

  describe('applyRemoval', () => {
    it('removes specified bullet point', () => {
      const result = applyRemoval(
        sampleResume,
        'experience',
        0,
        'Improved performance by 30%'
      )

      expect(result.experience[0].bulletPoints).toHaveLength(2)
      expect(result.experience[0].bulletPoints).not.toContain('Improved performance by 30%')
    })

    it('removes entire job entry when all bullets removed', () => {
      let result = sampleResume

      // Remove all bullets one by one
      result = applyRemoval(result, 'experience', 1, 'Built features for mobile app')
      result = applyRemoval(result, 'experience', 1, 'Worked with JavaScript and Node.js')

      expect(result.experience).toHaveLength(1)
      expect(result.experience[0].company).toBe('Tech Corp')
    })

    it('removes skill from skills list', () => {
      const result = applyRemoval(
        sampleResume,
        'skills',
        null,
        'Communication'
      )

      expect(result.skills).toHaveLength(2)
      expect(result.skills.find((s) => s.name === 'Communication')).toBeUndefined()
    })

    it('removes text from projects string', () => {
      const result = applyRemoval(
        sampleResume,
        'projects',
        null,
        'Personal Website: '
      )

      expect(result.projects).toBe('Built with Next.js')
    })

    it('maintains immutability', () => {
      const original = JSON.parse(JSON.stringify(sampleResume))

      applyRemoval(sampleResume, 'experience', 0, 'Improved performance by 30%')

      expect(sampleResume.experience[0].bulletPoints).toHaveLength(
        original.experience[0].bulletPoints.length
      )
    })

    it('handles missing target gracefully - throws error', () => {
      expect(() =>
        applyRemoval(
          sampleResume,
          'experience',
          99,
          'Non-existent text'
        )
      ).toThrow('not found')
    })
  })

  describe('Edge Cases', () => {
    it('handles empty bullet points array', () => {
      const emptyResume: ParsedResume = {
        ...sampleResume,
        experience: [
          {
            company: 'Test Corp',
            title: 'Engineer',
            dates: '2020-2023',
            bulletPoints: [],
          },
        ],
      }

      expect(() =>
        applyBulletRewrite(
          emptyResume,
          'experience',
          0,
          'Some text',
          'New text'
        )
      ).toThrow('Bullet not found')
    })

    it('handles empty skills array', () => {
      const emptyResume: ParsedResume = {
        ...sampleResume,
        skills: [],
      }

      expect(() =>
        applySkillExpansion(emptyResume, 'Python', 'Python (Django)')
      ).toThrow('Skill not found')
    })
  })
})
