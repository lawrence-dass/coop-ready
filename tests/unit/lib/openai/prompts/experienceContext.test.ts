/**
 * Unit Tests: Experience Context Builder
 *
 * Tests the buildExperienceContext function that creates narrative context
 * for experience-level-aware analysis.
 *
 * Story 4.5: Experience-Level-Aware Analysis
 */

import { describe, it, expect } from '@jest/globals'
import { buildExperienceContext } from '@/lib/openai/prompts/experienceContext'

describe('buildExperienceContext', () => {
  describe('Student level', () => {
    it('should build context emphasizing academic work and internships', () => {
      const context = buildExperienceContext('student')

      expect(context).toContain('student')
      expect(context).toContain('academic')
      expect(context).toContain('internship')
      expect(context).toContain('coursework')
    })

    it('should include guidance not to penalize limited experience', () => {
      const context = buildExperienceContext('student')

      expect(context.toLowerCase()).toContain('not penalize')
      expect(context.toLowerCase()).toContain('experience')
    })

    it('should be narrative format suitable for prompt injection', () => {
      const context = buildExperienceContext('student')

      // Should be prose, not bullet points
      expect(context).not.toMatch(/^[-*•]/)
      expect(context.length).toBeGreaterThan(100)
    })
  })

  describe('Career Changer level', () => {
    it('should build context emphasizing transferable skills', () => {
      const context = buildExperienceContext('career_changer')

      expect(context).toContain('career')
      expect(context).toContain('transferable')
      expect(context).toContain('skills')
    })

    it('should mention bootcamp and certifications', () => {
      const context = buildExperienceContext('career_changer')

      expect(context.toLowerCase()).toContain('bootcamp')
      expect(context.toLowerCase()).toContain('certif')
    })

    it('should focus on mapping existing experience to tech', () => {
      const context = buildExperienceContext('career_changer')

      expect(context.toLowerCase()).toContain('experience')
      expect(context.toLowerCase()).toContain('tech')
    })
  })

  describe('Experienced level', () => {
    it('should build context emphasizing impact and leadership', () => {
      const context = buildExperienceContext('experienced')

      expect(context.toLowerCase()).toContain('impact')
      expect(context.toLowerCase()).toContain('leadership')
    })

    it('should mention quantified metrics and scale', () => {
      const context = buildExperienceContext('experienced')

      expect(context.toLowerCase()).toMatch(/quantif|metric/)
      expect(context.toLowerCase()).toContain('scale')
    })

    it('should reference 2+ years of experience', () => {
      const context = buildExperienceContext('experienced')

      expect(context).toContain('2+')
    })
  })

  describe('Role-specific guidance', () => {
    it('should include target role when provided', () => {
      const context = buildExperienceContext('student', 'Software Engineer')

      expect(context).toContain('Software Engineer')
    })

    it('should work without target role', () => {
      const context = buildExperienceContext('student')

      expect(context.length).toBeGreaterThan(100)
      // Should still be valid context
      expect(context).toContain('candidate')
    })

    it('should include role-specific guidance for career changer', () => {
      const context = buildExperienceContext('career_changer', 'Frontend Developer')

      expect(context).toContain('Frontend Developer')
    })
  })

  describe('Context quality', () => {
    it('should return narrative prose for all levels', () => {
      const levels = ['student', 'career_changer', 'experienced']

      levels.forEach((level) => {
        const context = buildExperienceContext(level)

        // Should be substantial
        expect(context.length).toBeGreaterThan(100)
        // Should be narrative (contains sentences)
        expect(context).toMatch(/\.\s/)
        // Should not be bullet points
        expect(context).not.toMatch(/^[-*•]/)
      })
    })

    it('should produce unique context for each level', () => {
      const student = buildExperienceContext('student')
      const careerChanger = buildExperienceContext('career_changer')
      const experienced = buildExperienceContext('experienced')

      expect(student).not.toBe(careerChanger)
      expect(careerChanger).not.toBe(experienced)
      expect(experienced).not.toBe(student)
    })
  })
})
