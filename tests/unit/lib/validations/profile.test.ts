/**
 * Unit Tests: Profile Validation Schemas
 *
 * Tests validation logic for user profile data including the three experience levels.
 * Story 4.5: Experience-Level-Aware Analysis
 */

import { describe, it, expect } from '@jest/globals'
import { experienceLevelSchema, onboardingInputSchema } from '@/lib/validations/profile'

describe('experienceLevelSchema', () => {
  it('should accept "student" as valid experience level', () => {
    const result = experienceLevelSchema.safeParse('student')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('student')
    }
  })

  it('should accept "career_changer" as valid experience level', () => {
    const result = experienceLevelSchema.safeParse('career_changer')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('career_changer')
    }
  })

  it('should accept "experienced" as valid experience level', () => {
    const result = experienceLevelSchema.safeParse('experienced')
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toBe('experienced')
    }
  })

  it('should reject invalid experience level', () => {
    const result = experienceLevelSchema.safeParse('invalid')
    expect(result.success).toBe(false)
  })

  it('should reject empty string', () => {
    const result = experienceLevelSchema.safeParse('')
    expect(result.success).toBe(false)
  })
})

describe('onboardingInputSchema', () => {
  it('should accept all three experience levels in onboarding input', () => {
    const inputs = [
      { experienceLevel: 'student', targetRole: 'Software Engineer' },
      { experienceLevel: 'career_changer', targetRole: 'Web Developer' },
      { experienceLevel: 'experienced', targetRole: 'Senior Engineer' },
    ]

    inputs.forEach((input) => {
      const result = onboardingInputSchema.safeParse(input)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.experienceLevel).toBe(input.experienceLevel)
      }
    })
  })
})
