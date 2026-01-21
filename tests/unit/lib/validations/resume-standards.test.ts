import {
  getMaxPagesRecommendation,
  isProhibitedField,
  isSensitiveField,
  getFormatGuidance,
  classifyExperienceRelevance,
  analyzeResumeLength,
  NORTH_AMERICAN_RESUME_STANDARDS,
} from '@/lib/validations/resume-standards'

describe('Resume Standards Validation', () => {
  describe('getMaxPagesRecommendation', () => {
    it('should recommend 1 page for entry-level (< 2 years)', () => {
      const result = getMaxPagesRecommendation(1)
      expect(result.maxPages).toBe(1)
      expect(result.level).toBe('entry-level')
    })

    it('should recommend 2 pages for mid-level (2-5 years)', () => {
      const result = getMaxPagesRecommendation(3)
      expect(result.maxPages).toBe(2)
      expect(result.level).toBe('mid-level')
    })

    it('should recommend 2 pages for senior (5-10 years)', () => {
      const result = getMaxPagesRecommendation(7)
      expect(result.maxPages).toBe(2)
      expect(result.level).toBe('senior')
    })

    it('should recommend 2 pages for executive (> 10 years)', () => {
      const result = getMaxPagesRecommendation(15)
      expect(result.maxPages).toBe(2)
      expect(result.level).toBe('executive')
    })

    it('should include reasoning in response', () => {
      const result = getMaxPagesRecommendation(1)
      expect(result.reasoning).toBeTruthy()
      expect(result.reasoning.length).toBeGreaterThan(0)
    })
  })

  describe('isProhibitedField', () => {
    it('should identify photo as prohibited', () => {
      expect(isProhibitedField('photo')).toBe(true)
      expect(isProhibitedField('Photo')).toBe(true)
      expect(isProhibitedField('PHOTO')).toBe(true)
    })

    it('should identify date_of_birth as prohibited', () => {
      expect(isProhibitedField('date_of_birth')).toBe(true)
      expect(isProhibitedField('age')).toBe(true)
      expect(isProhibitedField('marital_status')).toBe(true)
    })

    it('should be case-insensitive', () => {
      expect(isProhibitedField('Date_Of_Birth')).toBe(true)
      expect(isProhibitedField('AGE')).toBe(true)
    })

    it('should not flag non-prohibited fields', () => {
      expect(isProhibitedField('email')).toBe(false)
      expect(isProhibitedField('phone')).toBe(false)
      expect(isProhibitedField('experience')).toBe(false)
    })

    it('should identify all prohibited fields in standards', () => {
      for (const field of NORTH_AMERICAN_RESUME_STANDARDS.prohibitedFields) {
        expect(isProhibitedField(field)).toBe(true)
      }
    })
  })

  describe('isSensitiveField', () => {
    it('should identify visa_status as sensitive', () => {
      expect(isSensitiveField('visa_status')).toBe(true)
      expect(isSensitiveField('work_authorization')).toBe(true)
    })

    it('should be case-insensitive', () => {
      expect(isSensitiveField('Visa_Status')).toBe(true)
      expect(isSensitiveField('WORK_AUTHORIZATION')).toBe(true)
    })

    it('should not flag non-sensitive fields', () => {
      expect(isSensitiveField('experience')).toBe(false)
      expect(isSensitiveField('email')).toBe(false)
    })

    it('should not confuse sensitive with prohibited', () => {
      expect(isSensitiveField('photo')).toBe(false)
      expect(isProhibitedField('visa_status')).toBe(false)
    })
  })

  describe('getFormatGuidance', () => {
    it('should provide date format guidance', () => {
      const guidance = getFormatGuidance('date')
      expect(guidance).not.toBeNull()
      expect(guidance?.guidance).toContain('consistent')
      expect(guidance?.examples).toContain('Jan 2023 (recommended)')
    })

    it('should provide phone format guidance', () => {
      const guidance = getFormatGuidance('phone')
      expect(guidance).not.toBeNull()
      expect(guidance?.examples).toContain('(123) 456-7890')
    })

    it('should provide email format guidance', () => {
      const guidance = getFormatGuidance('email')
      expect(guidance).not.toBeNull()
      expect(guidance?.examples.some((ex) => ex.includes('professional'))).toBe(true)
    })

    it('should return null for unknown fields', () => {
      const guidance = getFormatGuidance('unknown_field')
      expect(guidance).toBeNull()
    })

    it('should be case-insensitive', () => {
      const guidance1 = getFormatGuidance('DATE')
      const guidance2 = getFormatGuidance('date')
      expect(guidance1?.guidance).toBe(guidance2?.guidance)
    })
  })

  describe('classifyExperienceRelevance', () => {
    it('should mark experience < 5 years as relevant', () => {
      const result = classifyExperienceRelevance(3, 'Software Engineer', 0)
      expect(result.isRelevant).toBe(true)
    })

    it('should mark experience 5-10 years as relevant if same industry', () => {
      const result = classifyExperienceRelevance(7, 'Software Engineer', 0)
      expect(result.isRelevant).toBe(true)
    })

    it('should mark experience 5-10 years as not relevant if industry change', () => {
      const result = classifyExperienceRelevance(7, 'Software Engineer', 1)
      expect(result.isRelevant).toBe(false)
    })

    it('should mark experience > 10 years as not relevant', () => {
      const result = classifyExperienceRelevance(12, 'Software Engineer', 0)
      expect(result.isRelevant).toBe(false)
    })

    it('should include reasoning in response', () => {
      const result = classifyExperienceRelevance(3, 'Software Engineer', 0)
      expect(result.reasoning).toBeTruthy()
      expect(result.reasoning.length).toBeGreaterThan(0)
    })
  })

  describe('analyzeResumeLength', () => {
    it('should flag resume as too-long if exceeds max pages', () => {
      const result = analyzeResumeLength(1500, 3, 1) // 3 pages for entry-level
      expect(result.status).toBe('too-long')
      expect(result.suggestion).not.toBeNull()
      expect(result.suggestion).toContain('1 page')
    })

    it('should flag resume as too-short if sparse', () => {
      // For entry-level (1 year), max pages is 1. If we have 0.5 pages (less than max) and < 200 words, it's too-short
      const result = analyzeResumeLength(100, 0, 1)
      expect(result.status).toBe('too-short')
      expect(result.suggestion).not.toBeNull()
    })

    it('should mark resume as acceptable if within range', () => {
      const result = analyzeResumeLength(400, 1, 1)
      expect(result.status).toBe('acceptable')
      expect(result.suggestion).toBeNull()
    })

    it('should adjust max pages based on experience level', () => {
      const entryLevelResult = analyzeResumeLength(1500, 2, 1) // 2 pages for entry level
      expect(entryLevelResult.status).toBe('too-long')

      const seniorResult = analyzeResumeLength(1500, 2, 7) // 2 pages for senior is acceptable
      expect(seniorResult.status).toBe('acceptable')
    })
  })

  describe('NORTH_AMERICAN_RESUME_STANDARDS', () => {
    it('should have all required sections', () => {
      expect(NORTH_AMERICAN_RESUME_STANDARDS.maxPagesByLevel).toBeDefined()
      expect(NORTH_AMERICAN_RESUME_STANDARDS.prohibitedFields).toBeDefined()
      expect(NORTH_AMERICAN_RESUME_STANDARDS.sensitiveFields).toBeDefined()
      expect(NORTH_AMERICAN_RESUME_STANDARDS.recommendedDateFormats).toBeDefined()
      expect(NORTH_AMERICAN_RESUME_STANDARDS.commonFormatIssues).toBeDefined()
    })

    it('should have experience levels in maxPagesByLevel', () => {
      expect(NORTH_AMERICAN_RESUME_STANDARDS.maxPagesByLevel['entry-level']).toBe(1)
      expect(NORTH_AMERICAN_RESUME_STANDARDS.maxPagesByLevel['mid-level']).toBe(2)
      expect(NORTH_AMERICAN_RESUME_STANDARDS.maxPagesByLevel.senior).toBe(2)
      expect(NORTH_AMERICAN_RESUME_STANDARDS.maxPagesByLevel.executive).toBe(2)
    })

    it('should have populated prohibited fields list', () => {
      expect(NORTH_AMERICAN_RESUME_STANDARDS.prohibitedFields.length).toBeGreaterThan(0)
      expect(NORTH_AMERICAN_RESUME_STANDARDS.prohibitedFields).toContain('photo')
      expect(NORTH_AMERICAN_RESUME_STANDARDS.prohibitedFields).toContain('date_of_birth')
    })

    it('should have populated sensitive fields list', () => {
      expect(NORTH_AMERICAN_RESUME_STANDARDS.sensitiveFields.length).toBeGreaterThan(0)
      expect(NORTH_AMERICAN_RESUME_STANDARDS.sensitiveFields).toContain('visa_status')
      expect(NORTH_AMERICAN_RESUME_STANDARDS.sensitiveFields).toContain('work_authorization')
    })

    it('should have recommended date formats', () => {
      expect(NORTH_AMERICAN_RESUME_STANDARDS.recommendedDateFormats.length).toBeGreaterThan(0)
      expect(NORTH_AMERICAN_RESUME_STANDARDS.recommendedDateFormats).toContain('MMM YYYY')
    })

    it('should have common format issues', () => {
      expect(NORTH_AMERICAN_RESUME_STANDARDS.commonFormatIssues.length).toBeGreaterThan(0)
    })
  })

  describe('Integration Tests', () => {
    it('should handle international student scenario', () => {
      // International student with visa status
      const visaSensitive = isSensitiveField('visa_status')
      expect(visaSensitive).toBe(true)

      // Should be flagged as sensitive but not prohibited
      const visaProhibited = isProhibitedField('visa_status')
      expect(visaProhibited).toBe(false)
    })

    it('should handle entry-level with photo', () => {
      const photoProhibited = isProhibitedField('photo')
      const pages = getMaxPagesRecommendation(0.5)

      expect(photoProhibited).toBe(true)
      expect(pages.maxPages).toBe(1)
    })

    it('should handle senior with old experience', () => {
      const oldExp = classifyExperienceRelevance(15, 'CTO', 0)
      expect(oldExp.isRelevant).toBe(false)

      const recentExp = classifyExperienceRelevance(1, 'CTO', 0)
      expect(recentExp.isRelevant).toBe(true)
    })
  })
})
